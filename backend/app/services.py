"""Orchestration: fetch data sources, run the agronomy models, assemble API responses."""
from __future__ import annotations

import asyncio
import datetime as dt
import logging
import statistics

from sqlalchemy import select
from sqlalchemy.orm import Session

from .agro import alerts as alertmod
from .agro import climate, game, geo, matching, phenology, spray, water
from .agro import soil as soilmod
from .agro.crops import CROPS
from .db import Event, Planting, Plot, Tile, jdump, jload
from .http import InputNeeded, UpstreamError
from .sources import elevation, geocode, openmeteo, power, soilgrids

log = logging.getLogger("farmstudio.services")


def _src(name: str, ok: bool, fetched: dt.datetime | None = None, detail: str = "", error: str = "") -> dict:
    return {"name": name, "ok": ok, "fetched_at": fetched.isoformat() + "Z" if fetched else None,
            "detail": detail, "error": error}


async def _try(coro):
    try:
        return await coro, None
    except UpstreamError as e:
        log.warning("source failed: %s", e)
        return None, e
    except soilgrids.NoSoilData:
        return None, UpstreamError("NoSoilData", "no soil data nearby")
    except Exception as e:  # network or parsing problems should not take the whole response down
        log.exception("source failed")
        return None, UpstreamError("unknown", str(e))


async def _none():
    return None


# ---------------------------------------------------------------- analysis (onboarding step 3)
async def analyze(lat: float, lon: float, polygon: list[list[float]] | None, area_m2: float, soil_choice: str,
                  farm_type: str, water_m3_week: float, priority: str, prev_crops: list[str],
                  keep_crops: list[str], lang: str, wanted_text: str = "") -> dict:
    year = dt.date.today().year
    today = dt.date.today()
    clim_t = power.climatology(lat, lon)
    mon_t = power.monthly(lat, lon, 2001, year - 1)
    day_t = power.daily(lat, lon, today - dt.timedelta(days=45), today)
    soil_t = soilgrids.texture_near(lat, lon) if soil_choice == "auto" else _none()
    poly = polygon or geo.square_around(lat, lon, area_m2)
    (clim, ce), (mon, me), (daily, de), (soil, se), (elevs, slopes, elev_src) = await asyncio.gather(
        _try(clim_t), _try(mon_t), _try(day_t), _try(soil_t), _try_elev(poly))
    if clim is None:
        raise UpstreamError("NASA POWER", ce.message if ce else "climatology unavailable")
    clim_v, clim_at = clim
    sources = [_src("NASA POWER climatology", True, clim_at, f"T2M, T2M_MIN/MAX, PRECTOTCORR, FROST_DAYS · {clim_v.get('_period', '')}")]
    tr = None
    if mon:
        tr = climate.trend(mon[0], list(range(2001, year)))
        sources.append(_src("NASA POWER monthly", True, mon[1], f"rain and temperature trend {tr['years']}"))
    else:
        sources.append(_src("NASA POWER monthly", False, error=me.message if me else ""))
    anom = None
    if daily:
        anom = climate.anomaly(daily[0], clim_v)
        sources.append(_src("NASA POWER daily", True, daily[1], f"latest {anom['to'] if anom else ''}"))
    else:
        sources.append(_src("NASA POWER daily", False, error=de.message if de else ""))
    texture_src = "user"
    if soil_choice and soil_choice != "auto":
        texture = soilmod.USER_CHOICES.get(soil_choice, "loam")
        sources.append(_src("Soil type", True, None, "entered by farmer"))
        soil_v = soil[0] if soil else None
    elif soil:
        soil_v = soil[0]
        texture = soilmod.classify(soil_v["sand"], soil_v["clay"], soil_v.get("silt"))
        texture_src = "SoilGrids"
        near = f" · nearest data {soil_v['distance_m']} m away" if soil_v.get("distance_m") else ""
        sources.append(_src("ISRIC SoilGrids", True, soil[1], f"clay {soil_v['clay']:.0f}%, sand {soil_v['sand']:.0f}%{near}"))
    elif se is not None and se.source == "NoSoilData":
        raise InputNeeded("soil", "SoilGrids has no soil map for this spot (it leaves towns and roads blank). "
                                  "Go back one step and choose your soil type.")
    else:
        raise InputNeeded("soil", "The soil map service (SoilGrids) is not answering right now. "
                                  "Go back one step and choose your soil type.")
    ctx = {"soil_texture": texture, "farm_type": farm_type, "water_m3_week": water_m3_week, "area_m2": area_m2,
           "priority": priority, "prev_crops": prev_crops, "trend": tr}
    wanted = evaluate_wanted(wanted_text, clim_v, lat, ctx, keep_crops)
    region = await geocode.place_name(lat, lon, lang)
    valid_e = [e for e in (elevs or []) if e is not None]
    profile = {
        "region": region, "lat": lat, "lon": lon, "area_m2": round(area_m2),
        "elevation_m": round(statistics.mean(valid_e)) if valid_e else clim_v.get("_elev_m"),
        "elevation_range_m": round(max(valid_e) - min(valid_e), 1) if valid_e else None,
        "elevation_source": elev_src,
        "mean_temp_c": clim_v["T2M"]["ANN"], "rain_mm_year": round((clim_v["PRECTOTCORR"]["ANN"] or 0) * 365.25),
        "frost_days_year": clim_v["FROST_DAYS"]["ANN"],
        "hottest_extreme_c": max(clim_v["T2M_MAX"][m] for m in climate.MONTHS),
        "coldest_extreme_c": min(clim_v["T2M_MIN"][m] for m in climate.MONTHS),
        "climatology_period": clim_v.get("_period"),
        "soil_texture": texture, "soil_texture_name": soilmod.NAMES[texture], "soil_source": texture_src,
        "soil": soil_v, "awc_mm_per_m": round(soilmod.awc_mm_per_m(texture)),
        "trend": tr, "anomaly": anom,
    }
    sources.append(_src("Elevation", elevs is not None, None, elev_src))
    cells = geo.grid(poly)
    cols, rows, cw, ch = grid_meta(poly, cells)
    inside = [c for c in cells if c["inside"]]
    grid = {"cols": cols, "rows": rows, "square_w_m": round(cw, 1), "square_h_m": round(ch, 1),
            "squares": len(inside), "square_area_m2": round(cw * ch), "edges_m": geo.edge_lengths_m(poly)}
    return {"profile": profile, "wanted": wanted, "grid": grid, "sources": sources, "polygon": poly,
            "_cells": cells, "_elev": (elevs, slopes, elev_src)}


def grid_meta(poly: list[list[float]], cells: list[dict]) -> tuple[int, int, float, float]:
    cols = max(c["c"] for c in cells) + 1
    rows = max(c["r"] for c in cells) + 1
    s, n, w, e = geo.bbox(poly)
    lat0 = (s + n) / 2
    return cols, rows, (e - w) * geo.m_per_deg_lon(lat0) / cols, (n - s) * geo.M_PER_DEG_LAT / rows


def evaluate_wanted(text: str, clim: dict, lat: float, ctx: dict, extra: list[str] | None = None) -> list[dict]:
    """What the farmer typed, matched to crops and judged for this field."""
    items = matching.parse(text or "")
    known = {i["crop"] for i in items if i["crop"]}
    for c in extra or []:
        if c not in known:
            items.append({"text": CROPS[c].en, "crop": c})
            known.add(c)
    out = []
    for it in items:
        if not it["crop"]:
            out.append({"text": it["text"], "crop": None, "verdict": "unknown",
                        "summary": {"en": f"“{it['text']}” is not in our crop list yet, so we cannot judge it.",
                                    "ar": f"«{it['text']}» غير موجود في قائمة المحاصيل بعد، لذلك لا نستطيع تقييمه."}})
            continue
        out.append({"text": it["text"], **climate.score_crop(CROPS[it["crop"]], clim, lat, ctx)})
    return out


async def _try_elev(poly):
    cells = geo.grid(poly)
    pts = [(c["lat"], c["lon"]) for c in cells]
    try:
        e, s, label = await elevation.tile_elevations(pts, geo.bbox(poly))
        return e, s, label
    except UpstreamError as err:
        log.warning("elevation failed: %s", err)
        return None, None, f"unavailable ({err.message[:80]})"


# ---------------------------------------------------------------- plot creation
async def create_plot(db: Session, user_id: int, data: dict) -> Plot:
    poly = data["polygon"]
    lat, lon = geo.centroid(poly)
    area = geo.polygon_area_m2(poly)
    analysis = await analyze(lat, lon, poly, area, data["soil"], data["farm_type"], data["water_m3_week"],
                             data["priority"], data["prev_crops"], data["keep_crops"], data.get("lang", "en"))
    prof = analysis["profile"]
    cells = analysis["_cells"]
    elevs, slopes, elev_src = analysis["_elev"]
    if elevs is None:  # try once more; elevation services sometimes drop a request
        elevs, slopes, elev_src = await _try_elev(poly)
    plot = Plot(user_id=user_id, name=data["name"], region=prof["region"], lat=lat, lon=lon, polygon=jdump(poly),
                area_m2=area, soil_class=prof["soil_texture"], soil_source=prof["soil_source"],
                soil=jdump(prof["soil"] or {}), farm_type=data["farm_type"], water_m3_week=data["water_m3_week"],
                budget_jod=data["budget_jod"], priority=data["priority"], prev_crops=jdump(data["prev_crops"]),
                keep_crops=jdump(data["keep_crops"]), crops=jdump(data["crops"]), elevation_source=elev_src,
                profile=jdump({k: v for k, v in prof.items()}))
    db.add(plot)
    db.flush()
    in_elev = [e for e, c in zip(elevs or [], cells) if c["inside"] and e is not None]
    lo_cut = None
    if len(in_elev) >= 4 and max(in_elev) - min(in_elev) >= 2.0:
        lo_cut = min(in_elev) + 0.25 * (max(in_elev) - min(in_elev))
    for i, c in enumerate(cells):
        e = elevs[i] if elevs else None
        db.add(Tile(plot_id=plot.id, c=c["c"], r=c["r"], lat=c["lat"], lon=c["lon"], inside=c["inside"],
                    area_m2=c["area_m2"], elev=e, slope_pct=slopes[i] if slopes else None,
                    low=bool(c["inside"] and lo_cut is not None and e is not None and e <= lo_cut)))
    db.commit()
    db.refresh(plot)
    return plot


# ---------------------------------------------------------------- plot state
def _irrigation_by_tile(db: Session, plot_id: int) -> dict[int, dict[str, float]]:
    out: dict[int, dict[str, float]] = {}
    for ev in db.scalars(select(Event).where(Event.plot_id == plot_id, Event.kind == "irrigate")):
        mm = jload(ev.data, {}).get("mm", 0.0)
        d = out.setdefault(ev.tile_id or 0, {})
        d[ev.on_date.isoformat()] = d.get(ev.on_date.isoformat(), 0.0) + mm
    return out


def _waiting_tiles(db: Session, plot_id: int, today: dt.date) -> set[int]:
    q = select(Event).where(Event.plot_id == plot_id, Event.kind == "wait_rain",
                            Event.on_date >= today - dt.timedelta(days=2))
    return {e.tile_id for e in db.scalars(q) if e.tile_id}


async def context(plot: Plot) -> dict:
    """Fetch everything a plot view needs, in parallel. Missing sources come back as None."""
    today = dt.date.today()
    (fc, fe), (clim, ce), (daily, de) = await asyncio.gather(
        _try(openmeteo.forecast(plot.lat, plot.lon)), _try(power.climatology(plot.lat, plot.lon)),
        _try(power.daily(plot.lat, plot.lon, dt.date(today.year - 1, 1, 1), today)))
    return {"fc": fc, "fc_err": fe, "clim": clim, "clim_err": ce, "daily": daily, "daily_err": de}


def _theta_at(fc: dict, date: str) -> float | None:
    vals = [h["sm_deep"] for h in fc["hours"] if h["time"].startswith(date) and h["sm_deep"] is not None]
    return sum(vals) / len(vals) if vals else None


def tile_suitability(plot: Plot, tile: Tile, crop_id: str, base: int, sat: dict) -> int:
    crop = CROPS[crop_id]
    s = base
    prof = jload(plot.profile, {})
    frost_climate = (prof.get("frost_days_year") or 0) >= 0.5 or (prof.get("coldest_extreme_c") or 99) < 0
    if tile.low and climate.frost_weight(crop) > 0 and frost_climate:
        s -= 25
    lst = sat.get("lst_night") or {}
    if lst and tile.lst_night_c is not None and climate.frost_weight(crop) > 0:
        mean = sum(lst.values()) / len(lst)
        if tile.lst_night_c - mean <= -1.5:
            s -= 15
    if tile.slope_pct is not None and not crop.perennial:
        if tile.slope_pct > 15:
            s -= 15
        elif tile.slope_pct > 8:
            s -= 5
    return max(0, min(100, round(s)))


def base_scores(plot: Plot, clim: dict | None) -> dict[str, int]:
    if not clim:
        return {c: 50 for c in CROPS}
    prof = jload(plot.profile, {})
    ctx = {"soil_texture": plot.soil_class, "farm_type": plot.farm_type, "water_m3_week": plot.water_m3_week,
           "area_m2": plot.area_m2, "priority": plot.priority, "prev_crops": jload(plot.prev_crops, []),
           "trend": prof.get("trend")}
    return {r["crop"]: r["score"] for r in climate.rank(clim[0], plot.lat, ctx)}


def _obs_temps(ctx: dict) -> dict[str, float]:
    out: dict[str, float] = {}
    if ctx["daily"]:
        out.update({d: v["t2m"] for d, v in ctx["daily"][0].items() if v.get("t2m") is not None})
    if ctx["fc"]:
        for d in ctx["fc"][0]["days"]:
            if d["date"] not in out and d["tmax"] is not None and d["tmin"] is not None:
                out[d["date"]] = (d["tmax"] + d["tmin"]) / 2
    return out


async def plot_state(db: Session, plot: Plot) -> dict:
    ctx = await context(plot)
    fc = ctx["fc"][0] if ctx["fc"] else None
    clim = ctx["clim"][0] if ctx["clim"] else None
    today = openmeteo.local_now(fc).date() if fc else dt.date.today()
    sat = jload(plot.satellite, {})
    irrigation = _irrigation_by_tile(db, plot.id)
    waiting = _waiting_tiles(db, plot.id, today)
    obs = _obs_temps(ctx)
    last_harvest: dict[int, dt.date] = {}
    for ev in db.scalars(select(Event).where(Event.plot_id == plot.id, Event.kind == "harvest")):
        if ev.tile_id and (ev.tile_id not in last_harvest or ev.on_date > last_harvest[ev.tile_id]):
            last_harvest[ev.tile_id] = ev.on_date
    scores = base_scores(plot, ctx["clim"])
    theta_cache: dict[str, float | None] = {}
    tiles_out = []
    active_crops = []
    for t in plot.tiles:
        planting = next((p for p in t.plantings if p.active), None)
        item = {"id": t.id, "c": t.c, "r": t.r, "inside": t.inside, "elev": t.elev, "slope_pct": t.slope_pct,
                "low": t.low, "ndvi": t.ndvi, "ndvi_date": t.ndvi_date, "lst_night_c": t.lst_night_c,
                "area_m2": round(t.area_m2), "planting": None}
        if planting:
            crop = CROPS[planting.crop]
            active_crops.append(crop.id)
            ph = phenology.status(crop, planting.planted_on, today, obs, clim, last_harvest.get(t.id))
            wb = None
            if fc:
                start = max(planting.planted_on, dt.date.fromisoformat(fc["days"][0]["date"]))
                key = start.isoformat()
                if key not in theta_cache:
                    theta_cache[key] = _theta_at(fc, key)
                wb = water.simulate(crop, planting.planted_on, plot.soil_class, fc["days"], today,
                                    irrigation.get(t.id, {}), theta_cache[key], plot.farm_type != "rain")
                wb["refill_m3"] = round(wb["refill_mm"] * t.area_m2 / 1000, 1)
                wb["waiting_for_rain"] = t.id in waiting and wb["needs_water"]
            item["planting"] = {"id": planting.id, "crop": crop.id, "planted_on": planting.planted_on.isoformat(),
                                **ph, "water": wb}
        if t.inside:
            item["suitability"] = {c: tile_suitability(plot, t, c, scores.get(c, 50), sat) for c in jload(plot.crops, [])}
        tiles_out.append(item)
    weather = None
    if fc:
        now = openmeteo.local_now(fc)
        hour = now.strftime("%Y-%m-%dT%H:00")
        cur = next((h for h in fc["hours"] if h["time"] == hour), fc["hours"][0])
        nxt48 = [h for h in fc["hours"] if hour <= h["time"] <= (now + dt.timedelta(hours=48)).strftime("%Y-%m-%dT%H:00")]
        rain48 = sum(h["rain"] for h in nxt48)
        first_rain = next((h["time"] for h in nxt48 if h["rain"] >= 0.5), None)
        weather = {"temp_c": cur["temp"], "rh": cur["rh"], "wind_kmh": cur["wind"], "rain_next48_mm": round(rain48, 1),
                   "rain_prob_max48": max([h["rain_prob"] or 0 for h in nxt48] or [0]),
                   "first_rain": first_rain, "timezone": fc["timezone"], "local_time": now.isoformat(timespec="minutes")}
    alert_list = await alerts_for(db, plot, ctx, tiles_out, today)
    open_alerts = [a for a in alert_list if not a["resolved"]]
    srcs = _sources(ctx, plot, sat)
    return {
        "plot": plot_summary(plot), "today": today.isoformat(), "tiles": tiles_out, "weather": weather,
        "grade": game.grade(active_crops), "alerts_open": len(open_alerts),
        "top_alert": open_alerts[0] if open_alerts else None, "sources": srcs,
        "satellite": {"status": plot.appeears_status, "error": plot.appeears_error,
                      "updated_at": plot.satellite_updated_at.isoformat() + "Z" if plot.satellite_updated_at else None,
                      "smap": sat.get("smap"), "lst_obs": sat.get("lst_obs", 0)},
        "warnings": [s["name"] + ": " + s["error"] for s in srcs if not s["ok"] and s["error"]],
    }


def _sources(ctx: dict, plot: Plot, sat: dict) -> list[dict]:
    s = []
    s.append(_src("Open-Meteo forecast", bool(ctx["fc"]), ctx["fc"][1] if ctx["fc"] else None,
                  "ET0, rain, temperature, wind (92 past + 10 forecast days)",
                  ctx["fc_err"].message if ctx["fc_err"] else ""))
    s.append(_src("NASA POWER climatology", bool(ctx["clim"]), ctx["clim"][1] if ctx["clim"] else None,
                  ctx["clim"][0].get("_period", "") if ctx["clim"] else "", ctx["clim_err"].message if ctx["clim_err"] else ""))
    last = max(ctx["daily"][0]) if ctx["daily"] and ctx["daily"][0] else ""
    s.append(_src("NASA POWER daily", bool(ctx["daily"]), ctx["daily"][1] if ctx["daily"] else None,
                  f"observed to {last}", ctx["daily_err"].message if ctx["daily_err"] else ""))
    s.append(_src("Elevation", plot.elevation_source.startswith(("NASA", "Copernicus")), None, plot.elevation_source))
    s.append(_src("Soil", True, None, f"{soilmod.NAMES[plot.soil_class][0]} ({plot.soil_source})"))
    sat_ok = plot.appeears_status == "done"
    s.append(_src("NASA AppEEARS (SMAP, MODIS NDVI, ECOSTRESS)", sat_ok,
                  plot.satellite_updated_at, f"status: {plot.appeears_status}",
                  plot.appeears_error or ""))
    return s


def plot_summary(plot: Plot) -> dict:
    poly = jload(plot.polygon, [])
    tiles = plot.tiles
    cols = max((t.c for t in tiles), default=5) + 1
    rows = max((t.r for t in tiles), default=5) + 1
    s, n, w, e = geo.bbox(poly)
    lat0 = (s + n) / 2
    cw = (e - w) * geo.m_per_deg_lon(lat0) / cols
    ch = (n - s) * geo.M_PER_DEG_LAT / rows
    grid = {"cols": cols, "rows": rows, "square_w_m": round(cw, 1), "square_h_m": round(ch, 1),
            "square_area_m2": round(cw * ch), "squares": sum(1 for t in tiles if t.inside),
            "outline": geo.outline_in_grid(poly, cols, rows), "edges_m": geo.edge_lengths_m(poly)}
    return {"grid": grid, "id": plot.id, "name": plot.name, "region": plot.region, "lat": plot.lat, "lon": plot.lon,
            "polygon": jload(plot.polygon, []), "area_m2": round(plot.area_m2), "soil_class": plot.soil_class,
            "soil_name": soilmod.NAMES[plot.soil_class], "soil_source": plot.soil_source, "farm_type": plot.farm_type,
            "water_m3_week": plot.water_m3_week, "budget_jod": plot.budget_jod, "priority": plot.priority,
            "prev_crops": jload(plot.prev_crops, []), "keep_crops": jload(plot.keep_crops, []),
            "crops": jload(plot.crops, []), "elevation_source": plot.elevation_source,
            "profile": jload(plot.profile, {}), "created_at": plot.created_at.isoformat() + "Z"}


# ---------------------------------------------------------------- alerts
async def alerts_for(db: Session, plot: Plot, ctx: dict, tiles_out: list[dict], today: dt.date) -> list[dict]:
    if not ctx["fc"]:
        return []
    sat = jload(plot.satellite, {})
    lst = sat.get("lst_night") or {}
    mean = sum(lst.values()) / len(lst) if lst else None
    tiles = [{"id": t["id"], "low": t["low"],
              "lst_offset_c": (t["lst_night_c"] - mean) if (mean is not None and t["lst_night_c"] is not None) else 0.0}
             for t in tiles_out if t["inside"]]
    plantings = [{"tile_id": t["id"], "crop": t["planting"]["crop"]} for t in tiles_out if t["planting"]]
    al = alertmod.build(ctx["fc"][0]["days"], today, tiles, plantings)
    done: dict[str, set[int]] = {}
    for ev in db.scalars(select(Event).where(Event.plot_id == plot.id, Event.kind == "alert_action")):
        d = jload(ev.data, {})
        done.setdefault(d.get("key", ""), set()).add(int(d.get("idx", -1)))
    for a in al:
        a["done"] = sorted(done.get(a["key"], set()))
        a["resolved"] = len(a["done"]) >= len(a["actions"])
    return sorted(al, key=lambda a: (a["resolved"], a["lead_days"], a["severity"] != "high"))


# ---------------------------------------------------------------- plan
async def plan(db: Session, plot: Plot) -> dict:
    ctx = await context(plot)
    if not ctx["clim"]:
        raise UpstreamError("NASA POWER", ctx["clim_err"].message if ctx["clim_err"] else "unavailable")
    clim = ctx["clim"][0]
    crops = jload(plot.crops, [])
    rows = [{"crop": c, **climate.calendar_rows(CROPS[c], clim)} for c in crops]
    prof = jload(plot.profile, {})
    daily = ctx["daily"][0] if ctx["daily"] else {}
    anom = climate.anomaly(daily, clim)
    advice = []
    if anom and anom["anomaly_c"] <= -1.5:
        delay = round(abs(anom["anomaly_c"]) * 5)
        warm = [CROPS[c] for c in crops if not CROPS[c].perennial and CROPS[c].t_opt[0] >= 18]
        names = ", ".join(c.en for c in warm) or "warm-season crops"
        names_ar = "، ".join(c.ar for c in warm) or "محاصيل الموسم الدافئ"
        advice.append({"type": "cold", "en": f"The last 30 days were {abs(anom['anomaly_c'])} °C colder than normal (NASA POWER). Delay planting {names} by about {delay} days.",
                       "ar": f"كانت آخر 30 يومًا أبرد من المعتاد بـ {abs(anom['anomaly_c'])} °م (NASA POWER). أخّر زراعة {names_ar} حوالي {delay} يومًا."})
    elif anom and anom["anomaly_c"] >= 1.5:
        advice.append({"type": "warm", "en": f"The last 30 days were {anom['anomaly_c']} °C warmer than normal (NASA POWER). Expect higher water use and earlier harvests.",
                       "ar": f"كانت آخر 30 يومًا أدفأ من المعتاد بـ {anom['anomaly_c']} °م (NASA POWER). توقّع استهلاكًا أعلى للمياه وحصادًا أبكر."})
    # weekly water: next 7 days ETc - effective rain over planted tiles
    state = await plot_state(db, plot)
    need_m3 = 0.0
    for t in state["tiles"]:
        w = (t["planting"] or {}).get("water")
        if w:
            net = max(0.0, w["etc_next7_mm"] - w["rain_eff_next48_mm"])
            need_m3 += net * t["area_m2"] / 1000
    tr = prof.get("trend") or {}
    suggest = []
    if tr and (tr.get("rain_pct_per_decade", 0) <= -5 or tr.get("temp_c_per_decade", 0) >= 0.3):
        for c in ("sorghum", "barley", "olive", "chickpea", "date"):
            if c not in crops:
                suggest.append(c)
    ranked = {r["crop"]: r for r in climate.rank(clim, plot.lat, {
        "soil_texture": plot.soil_class, "farm_type": plot.farm_type, "water_m3_week": plot.water_m3_week,
        "area_m2": plot.area_m2, "priority": plot.priority, "prev_crops": jload(plot.prev_crops, []), "trend": tr})}
    suggest = sorted(suggest, key=lambda c: -ranked[c]["score"])[:3]
    return {"calendar": rows, "anomaly": anom, "advice": advice,
            "water": {"need_next7_m3": round(need_m3, 1), "available_m3_week": plot.water_m3_week},
            "grade": state["grade"], "trend": tr, "suggestions": [ranked[c] for c in suggest],
            "ndvi_series": jload(plot.satellite, {}).get("ndvi_series", []),
            "smap_series": jload(plot.satellite, {}).get("smap_series", []),
            "climatology_period": clim.get("_period")}


# ---------------------------------------------------------------- spray
async def spray_windows(plot: Plot) -> dict:
    fc, at = await openmeteo.forecast(plot.lat, plot.lon)
    now = openmeteo.local_now(fc)
    return {"timezone": fc["timezone"], "now": now.isoformat(timespec="minutes"),
            "blocks": spray.windows(fc["hours"], now), "fetched_at": at.isoformat() + "Z"}
