"""Root-zone soil water balance per planting (FAO-56 chapter 8, single crop coefficient).

Daily: Dr_i = Dr_{i-1} - Pe_i - I_i + Ks·Kc·ET0_i, clipped to [0, TAW].
ET0 and rain come from Open-Meteo (92 past days + 10 forecast days). Irrigation comes from the
farmer's logged watering events. The start state comes from modelled deep soil moisture (or field
capacity right after an irrigated planting).
"""
from __future__ import annotations

import datetime as dt

from . import soil as soilmod
from .climate import kc_at
from .crops import Crop


MAX_APPLICATION_MM = 60.0


def season_day(crop: Crop, planted_on: dt.date, day: dt.date) -> int:
    if not crop.perennial:
        return (day - planted_on).days
    start = dt.date(day.year, crop.season_start_month, 1)
    if day < start:
        start = dt.date(day.year - 1, crop.season_start_month, 1)
    return (day - start).days


def root_depth(crop: Crop, sday: int) -> float:
    if crop.perennial:
        return crop.root_m
    li, ld = crop.stages[0], crop.stages[1]
    if sday <= 0:
        return 0.15
    if sday >= li + ld:
        return crop.root_m
    return 0.15 + (crop.root_m - 0.15) * sday / (li + ld)


def effective_rain(rain: float, et0: float) -> float:
    return rain if rain > 0.2 * et0 else 0.0


def schedule(crop: Crop, planted_on: dt.date, texture: str, days: list[dict], today: dt.date,
             start_theta: float | None, irrigated_farm: bool, horizon: int = 7,
             irrigation: dict[str, float] | None = None) -> dict:
    """Watering plan for one square for the next `horizon` days.

    Waterings the farmer logs (`irrigation`: {"YYYY-MM-DD": mm}) are applied as they happened. Before
    the first logged watering (and for squares never logged) we assume the plan was followed:
    whenever root-zone depletion reaches the readily available water (RAW), the square is refilled.
    Past days (Open-Meteo analysis) bring the soil to today's state; forecast days give the dates
    and amounts. A watering is postponed when the next 2 days' effective rain covers at least half of it.
    """
    awc = soilmod.awc_mm_per_m(texture)
    fc, _wp = soilmod.fc_wp(texture)
    rows = [d for d in days if d.get("et0") is not None and dt.date.fromisoformat(d["date"]) >= planted_on]
    if not rows:
        rows = [d for d in days if d.get("et0") is not None]
    first = dt.date.fromisoformat(rows[0]["date"])
    zr = root_depth(crop, season_day(crop, planted_on, first))
    taw = awc * zr
    if first <= planted_on and irrigated_farm and not crop.perennial:
        dr = 0.0
    elif start_theta is not None:
        dr = max(0.0, min(taw, (fc - start_theta) * 1000 * zr))
    else:
        dr = 0.5 * taw
    end = today + dt.timedelta(days=horizon - 1)
    events: list[dict] = []
    etc_week = rain_week = 0.0
    today_state = None
    postponed = False
    by_date = {d["date"]: d for d in rows}
    irrigation = irrigation or {}
    logged_from = dt.date.fromisoformat(min(irrigation)) if irrigation else None
    watered_today = irrigation.get(today.isoformat(), 0.0) > 0
    for d in rows:
        day = dt.date.fromisoformat(d["date"])
        if day > end:
            break
        sday = season_day(crop, planted_on, day)
        taw = awc * root_depth(crop, sday)
        raw = crop.p * taw
        dormant = crop.deciduous and sday >= crop.days
        kc = 0.2 if dormant else kc_at(crop, sday) if (crop.perennial or sday < crop.days) else crop.kc[2]
        ks = 1.0 if dr <= raw else max(0.0, (taw - dr) / ((1 - crop.p) * taw)) if taw else 1.0
        etc = ks * kc * d["et0"]
        pe = effective_rain(d.get("rain") or 0.0, d["et0"])
        dr = max(0.0, min(taw, dr - pe + etc))
        logged = irrigation.get(d["date"], 0.0)
        if logged:
            dr = max(0.0, dr - logged)
        if day >= today:
            etc_week += kc * d["et0"]
            rain_week += pe
        if day == today:
            today_state = {"dr": dr, "taw": taw, "raw": raw, "kc": kc, "dormant": dormant}
        farmer_logs = logged_from is not None and logged_from <= day <= today
        if farmer_logs and (day < today or watered_today):
            continue  # the farmer's own log decides these days
        if irrigated_farm and not dormant and taw > 0 and dr >= raw:
            ahead = sum(effective_rain((by_date.get((day + dt.timedelta(days=k)).isoformat()) or {}).get("rain") or 0.0,
                                       (by_date.get((day + dt.timedelta(days=k)).isoformat()) or {}).get("et0") or 0.0)
                        for k in (1, 2))
            if ahead >= 0.5 * dr and dr < taw * 0.9:
                if day >= today:
                    postponed = True
                continue  # rain will do it
            mm = min(dr, MAX_APPLICATION_MM)
            if day >= today:
                events.append({"date": day.isoformat(), "mm": round(mm, 1)})
            dr -= mm
    st = today_state or {"dr": dr, "taw": taw, "raw": crop.p * taw, "kc": 0.0, "dormant": False}
    need = sum(e["mm"] for e in events)
    return {
        "available_pct": round(100 * (1 - st["dr"] / st["taw"])) if st["taw"] else 0,
        "depletion_mm": round(st["dr"], 1), "taw_mm": round(st["taw"], 1), "raw_mm": round(st["raw"], 1),
        "kc": round(st["kc"], 2), "dormant": bool(st["dormant"]),
        "events": events, "need_mm_week": round(need, 1),
        "etc_week_mm": round(etc_week, 1), "rain_eff_week_mm": round(rain_week, 1),
        "water_today": bool(events and events[0]["date"] == today.isoformat()),
        "next_date": events[0]["date"] if events else None,
        "rain_postponed": postponed, "watered_today": watered_today,
        "last_watered": max(irrigation) if irrigation else None,
    }
