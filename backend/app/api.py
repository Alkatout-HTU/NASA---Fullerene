"""HTTP API routes (all under /api)."""
from __future__ import annotations

import datetime as dt

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from . import services
from .agro import geo, matching
from .agro import soil as soilmod
from .agro.crops import CROPS
from .auth import current_user, hash_password, make_token, verify_password
from .config import settings
from .db import Event, Planting, Plot, Tile, User, get_db, jdump, jload
from .schemas import (AlertAction, Evaluate, FarmInputs, Irrigate, Login, Plant, PlotCreate, PlotUpdate, Prefs,
                      Register, SprayBook, TileAction)
from .sources import geocode
from .worker import refresh_satellite

router = APIRouter(prefix="/api")


def msg(en: str, ar: str) -> dict:
    return {"en": en, "ar": ar}


# ------------------------------------------------------------------ meta
@router.get("/health")
def health():
    return {"ok": True, "integrations": settings.status()}


@router.get("/crops")
def crops():
    out = []
    for c in CROPS.values():
        d = c.public()
        d["synonyms"] = list(matching.SYNONYMS.get(c.id, ()))
        out.append(d)
    return out


@router.get("/soils")
def soils():
    return [{"id": k, "en": v[0], "ar": v[1], "awc_mm_per_m": round(soilmod.awc_mm_per_m(k))}
            for k, v in soilmod.NAMES.items()]


@router.get("/crops/match")
def match_crops(text: str = Query("", max_length=500)):
    return matching.parse(text)


# ------------------------------------------------------------------ places (Jordan)
@router.get("/geo/search")
async def geo_search(q: str = Query(min_length=2, max_length=120), lang: str = "en",
                     user: User = Depends(current_user)):
    return await geocode.search(q, lang)


@router.get("/geo/reverse")
async def geo_reverse(lat: float, lon: float, lang: str = "en", user: User = Depends(current_user)):
    return {"name": await geocode.place_name(lat, lon, lang)}


# ------------------------------------------------------------------ auth
def _user_out(u: User) -> dict:
    return {"id": u.id, "email": u.email, "name": u.name, "lang": u.lang}


@router.post("/auth/register")
def register(body: Register, db: Session = Depends(get_db)):
    if db.scalar(select(User).where(User.email == body.email)):
        raise HTTPException(409, "An account with this e-mail already exists. Sign in instead.")
    u = User(email=body.email, name=body.name.strip(), lang=body.lang, password_hash=hash_password(body.password))
    db.add(u)
    db.commit()
    return {"token": make_token(u.id), "user": _user_out(u)}


@router.post("/auth/login")
def login(body: Login, db: Session = Depends(get_db)):
    u = db.scalar(select(User).where(User.email == body.email.strip().lower()))
    if not u or not verify_password(body.password, u.password_hash):
        raise HTTPException(401, "E-mail or password is wrong.")
    return {"token": make_token(u.id), "user": _user_out(u)}


@router.get("/me")
def me(user: User = Depends(current_user)):
    return _user_out(user)


@router.patch("/me")
def update_me(body: Prefs, user: User = Depends(current_user), db: Session = Depends(get_db)):
    if body.lang:
        user.lang = body.lang
    if body.name is not None:
        user.name = body.name.strip()
    db.commit()
    return _user_out(user)


# ------------------------------------------------------------------ analysis
def _public(analysis: dict) -> dict:
    return {k: v for k, v in analysis.items() if not k.startswith("_")}


@router.post("/analyze")
async def analyze(body: FarmInputs, user: User = Depends(current_user)):
    lat, lon = geo.centroid(body.polygon)
    area = geo.polygon_area_m2(body.polygon)
    res = await services.analyze(lat, lon, body.polygon, area, body.soil, body.farm_type, body.water_m3_week,
                                 body.priority, body.prev_crops, body.keep_crops, body.lang, body.wanted)
    return _public(res)


# ------------------------------------------------------------------ plots
def _plot(db: Session, user: User, plot_id: int) -> Plot:
    p = db.get(Plot, plot_id)
    if not p or p.user_id != user.id:
        raise HTTPException(404, "Plot not found.")
    return p


def _tiles(plot: Plot, ids: list[int]) -> list[Tile]:
    tiles = [t for t in plot.tiles if t.id in set(ids)]
    if len(tiles) != len(set(ids)):
        raise HTTPException(404, "Some of those squares are not part of this field.")
    return tiles


@router.get("/plots")
def list_plots(user: User = Depends(current_user), db: Session = Depends(get_db)):
    return [services.plot_summary(p) for p in user.plots]


@router.post("/plots")
async def create_plot(body: PlotCreate, user: User = Depends(current_user), db: Session = Depends(get_db)):
    plot = await services.create_plot(db, user.id, body.model_dump())
    await refresh_satellite(plot.id)
    db.refresh(plot)
    return await services.plot_state(db, plot)


@router.get("/plots/{plot_id}")
async def get_plot(plot_id: int, user: User = Depends(current_user), db: Session = Depends(get_db)):
    return await services.plot_state(db, _plot(db, user, plot_id))


@router.patch("/plots/{plot_id}")
def update_plot(plot_id: int, body: PlotUpdate, user: User = Depends(current_user), db: Session = Depends(get_db)):
    p = _plot(db, user, plot_id)
    for k, v in body.model_dump(exclude_none=True).items():
        setattr(p, k, jdump(v) if k == "crops" else v)
    db.commit()
    return services.plot_summary(p)


@router.delete("/plots/{plot_id}")
def delete_plot(plot_id: int, user: User = Depends(current_user), db: Session = Depends(get_db)):
    db.delete(_plot(db, user, plot_id))
    db.commit()
    return {"ok": True}


@router.post("/plots/{plot_id}/evaluate")
async def evaluate(plot_id: int, body: Evaluate, user: User = Depends(current_user), db: Session = Depends(get_db)):
    """Judge crops the farmer types for an existing field."""
    p = _plot(db, user, plot_id)
    clim, _ = await services.power.climatology(p.lat, p.lon)
    prof = jload(p.profile, {})
    ctx = {"soil_texture": p.soil_class, "farm_type": p.farm_type, "water_m3_week": p.water_m3_week,
           "area_m2": p.area_m2, "priority": p.priority, "prev_crops": jload(p.prev_crops, []),
           "trend": prof.get("trend")}
    return services.evaluate_wanted(body.text, clim, p.lat, ctx)


async def _after(db: Session, plot: Plot, message: dict, extra: dict | None = None) -> dict:
    db.commit()
    db.refresh(plot)
    return {"message": message, "state": await services.plot_state(db, plot), **(extra or {})}


@router.post("/plots/{plot_id}/plant")
async def plant(plot_id: int, body: Plant, user: User = Depends(current_user), db: Session = Depends(get_db)):
    p = _plot(db, user, plot_id)
    tiles = _tiles(p, body.tile_ids)
    try:
        planted_on = dt.date.fromisoformat(body.planted_on) if body.planted_on else dt.date.today()
    except ValueError:
        raise HTTPException(422, "planted_on must be a date like 2026-03-01")
    if planted_on > dt.date.today():
        raise HTTPException(422, "The planting date cannot be in the future.")
    if planted_on < dt.date.today() - dt.timedelta(days=365 * 80):
        raise HTTPException(422, "The planting date is too far in the past.")
    for t in tiles:
        if not t.inside:
            raise HTTPException(409, "That square is outside your field boundary.")
        if any(x.active for x in t.plantings):
            raise HTTPException(409, "That square already has a crop. Harvest it first.")
    for t in tiles:
        db.add(Planting(plot_id=p.id, tile_id=t.id, crop=body.crop, planted_on=planted_on))
        db.add(Event(plot_id=p.id, tile_id=t.id, kind="plant", on_date=dt.date.today(),
                     data=jdump({"crop": body.crop, "planted_on": planted_on.isoformat()})))
    crops = jload(p.crops, [])
    if body.crop not in crops:
        p.crops = jdump(crops + [body.crop])
    c = CROPS[body.crop]
    return await _after(db, p, msg(f"{c.en} planted on {len(tiles)} square(s)", f"تمت زراعة {c.ar} في {len(tiles)} مربع"))


@router.post("/plots/{plot_id}/clear")
async def clear(plot_id: int, body: TileAction, user: User = Depends(current_user), db: Session = Depends(get_db)):
    """Remove a crop that was planted by mistake or failed (no harvest logged)."""
    p = _plot(db, user, plot_id)
    n = 0
    for t in _tiles(p, body.tile_ids):
        for pl in t.plantings:
            if pl.active:
                pl.active = False
                n += 1
                db.add(Event(plot_id=p.id, tile_id=t.id, kind="clear", on_date=dt.date.today(),
                             data=jdump({"crop": pl.crop})))
    if not n:
        raise HTTPException(409, "Nothing is planted there.")
    return await _after(db, p, msg(f"Cleared {n} square(s)", f"تم تفريغ {n} مربع"))


@router.post("/plots/{plot_id}/irrigate")
async def irrigate(plot_id: int, body: Irrigate, user: User = Depends(current_user), db: Session = Depends(get_db)):
    p = _plot(db, user, plot_id)
    tiles = _tiles(p, body.tile_ids)
    state = await services.plot_state(db, p)
    by_id = {t["id"]: t for t in state["tiles"]}
    total_m3 = 0.0
    today = dt.date.fromisoformat(state["today"])
    for t in tiles:
        info = by_id[t.id]
        if not info.get("planting"):
            raise HTTPException(409, "Nothing is planted there yet.")
        w = info["planting"].get("water")
        mm = body.mm or (w["refill_mm"] if w and w["needs_water"] else None)
        if mm is None:
            pct = w["available_pct"] if w else "?"
            raise HTTPException(409, f"This square does not need water today ({pct}% of soil water still available). "
                                     "Enter an amount in mm to water anyway.")
        m3 = mm * t.area_m2 / 1000
        total_m3 += m3
        db.add(Event(plot_id=p.id, tile_id=t.id, kind="irrigate", on_date=today,
                     data=jdump({"mm": round(mm, 1), "m3": round(m3, 2)})))
    return await _after(db, p, msg(f"Logged {total_m3:,.1f} m³ of irrigation", f"تم تسجيل {total_m3:,.1f} م³ من الري"))


@router.post("/plots/{plot_id}/wait-rain")
async def wait_rain(plot_id: int, body: TileAction, user: User = Depends(current_user), db: Session = Depends(get_db)):
    p = _plot(db, user, plot_id)
    tiles = _tiles(p, body.tile_ids)
    state = await services.plot_state(db, p)
    by_id = {t["id"]: t for t in state["tiles"]}
    today = dt.date.fromisoformat(state["today"])
    saved = 0.0
    for t in tiles:
        w = ((by_id[t.id].get("planting") or {}).get("water")) or {}
        if not w.get("wait_for_rain"):
            raise HTTPException(409, "Not enough rain is forecast in the next 48 hours to skip watering this square.")
        saved += w.get("refill_m3", 0)
        db.add(Event(plot_id=p.id, tile_id=t.id, kind="wait_rain", on_date=today,
                     data=jdump({"saved_m3": w.get("refill_m3", 0), "rain48": w.get("rain_eff_next48_mm")})))
    return await _after(db, p, msg(f"Waiting for rain saves about {saved:,.1f} m³", f"انتظار المطر يوفر حوالي {saved:,.1f} م³"))


@router.post("/plots/{plot_id}/harvest")
async def harvest(plot_id: int, body: TileAction, user: User = Depends(current_user), db: Session = Depends(get_db)):
    """Harvest the squares that are ready. Squares that are not ready are reported, not harvested."""
    p = _plot(db, user, plot_id)
    tiles = _tiles(p, body.tile_ids)
    state = await services.plot_state(db, p)
    by_id = {t["id"]: t for t in state["tiles"]}
    today = dt.date.fromisoformat(state["today"])
    done, not_ready = [], []
    for t in tiles:
        planting = next((x for x in t.plantings if x.active), None)
        info = (by_id[t.id].get("planting") or {})
        if not planting or not info.get("ready"):
            if planting:
                not_ready.append({"tile_id": t.id, "harvest_from": info.get("harvest_from")})
            continue
        if not CROPS[planting.crop].perennial:  # trees and vines stay; annual crops leave the field
            planting.active = False
            planting.harvested_on = today
        done.append(t.id)
        db.add(Event(plot_id=p.id, tile_id=t.id, kind="harvest", on_date=today, data=jdump({"crop": planting.crop})))
    if not done:
        raise HTTPException(409, "None of those squares is ready to harvest yet.")
    return await _after(db, p, msg(f"Harvested {len(done)} square(s)", f"تم حصاد {len(done)} مربع"),
                        {"harvested": done, "not_ready": not_ready})


@router.get("/plots/{plot_id}/spray-window")
async def spray_window(plot_id: int, user: User = Depends(current_user), db: Session = Depends(get_db)):
    p = _plot(db, user, plot_id)
    out = await services.spray_windows(p)
    out["bookings"] = [jload(e.data, {}) for e in db.scalars(select(Event).where(
        Event.plot_id == p.id, Event.kind == "spray", Event.on_date >= dt.date.today() - dt.timedelta(days=1)))]
    return out


@router.post("/plots/{plot_id}/spray")
async def book_spray(plot_id: int, body: SprayBook, user: User = Depends(current_user), db: Session = Depends(get_db)):
    p = _plot(db, user, plot_id)
    win = await services.spray_windows(p)
    block = next((b for b in win["blocks"] if b["start"] == body.start), None)
    if not block:
        raise HTTPException(404, "That time is outside the 3-day forecast.")
    if block["past"]:
        raise HTTPException(409, "That time has already passed.")
    if block["zone"] == "r":
        why = (block["why"] or {}).get("en", "unsafe conditions")
        raise HTTPException(409, f"Spraying is locked for this slot: {why}.")
    if any(jload(e.data, {}).get("start") == body.start
           for e in db.scalars(select(Event).where(Event.plot_id == p.id, Event.kind == "spray"))):
        raise HTTPException(409, "You already booked this slot.")
    db.add(Event(plot_id=p.id, kind="spray", on_date=dt.date.fromisoformat(body.start[:10]),
                 data=jdump({"start": body.start, "tool": body.tool, "zone": block["zone"], "wind": block["wind_kmh"]})))
    return await _after(db, p, msg(f"Spraying booked for {body.start.replace('T', ' ')}",
                                   f"تم حجز الرش في {body.start.replace('T', ' ')}"))


@router.get("/plots/{plot_id}/alerts")
async def alerts(plot_id: int, user: User = Depends(current_user), db: Session = Depends(get_db)):
    p = _plot(db, user, plot_id)
    ctx = await services.context(p)
    state = await services.plot_state(db, p)
    return await services.alerts_for(db, p, ctx, state["tiles"], dt.date.fromisoformat(state["today"]))


@router.post("/plots/{plot_id}/alerts/act")
async def alert_act(plot_id: int, body: AlertAction, user: User = Depends(current_user), db: Session = Depends(get_db)):
    p = _plot(db, user, plot_id)
    ctx = await services.context(p)
    state = await services.plot_state(db, p)
    al = await services.alerts_for(db, p, ctx, state["tiles"], dt.date.fromisoformat(state["today"]))
    a = next((x for x in al if x["key"] == body.key), None)
    if not a or body.idx >= len(a["actions"]):
        raise HTTPException(404, "That warning is no longer in the forecast.")
    if body.idx in a["done"]:
        raise HTTPException(409, "Already marked as done.")
    db.add(Event(plot_id=p.id, kind="alert_action", on_date=dt.date.today(), data=jdump({"key": body.key, "idx": body.idx})))
    return await _after(db, p, msg("Marked as done", "تم التنفيذ"))


@router.get("/plots/{plot_id}/plan")
async def plan(plot_id: int, user: User = Depends(current_user), db: Session = Depends(get_db)):
    return await services.plan(db, _plot(db, user, plot_id))


@router.get("/plots/{plot_id}/events")
def events(plot_id: int, user: User = Depends(current_user), db: Session = Depends(get_db)):
    p = _plot(db, user, plot_id)
    rows = db.scalars(select(Event).where(Event.plot_id == p.id).order_by(Event.at.desc()).limit(200))
    return [{"id": e.id, "kind": e.kind, "tile_id": e.tile_id, "date": e.on_date.isoformat(), "at": e.at.isoformat() + "Z",
             "data": jload(e.data, {})} for e in rows]


@router.post("/plots/{plot_id}/satellite/refresh")
async def satellite_refresh(plot_id: int, user: User = Depends(current_user), db: Session = Depends(get_db)):
    p = _plot(db, user, plot_id)
    if not settings.earthdata_enabled:
        raise HTTPException(503, "NASA Earthdata credentials are not configured on the server.")
    await refresh_satellite(p.id, force=True)
    db.refresh(p)
    return {"status": p.appeears_status, "error": p.appeears_error}
