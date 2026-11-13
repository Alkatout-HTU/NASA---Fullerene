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


def simulate(crop: Crop, planted_on: dt.date, texture: str, days: list[dict], today: dt.date,
             irrigation: dict[str, float], start_theta: float | None, irrigated_farm: bool) -> dict:
    awc = soilmod.awc_mm_per_m(texture)
    fc, _wp = soilmod.fc_wp(texture)
    rows = [d for d in days if d.get("et0") is not None and dt.date.fromisoformat(d["date"]) >= planted_on]
    if not rows:
        rows = [d for d in days if d.get("et0") is not None]
    first = dt.date.fromisoformat(rows[0]["date"])
    zr = root_depth(crop, season_day(crop, planted_on, first))
    taw = awc * zr
    if first <= planted_on and irrigated_farm and not crop.perennial:
        dr = 0.0  # pre-plant irrigation to field capacity
    elif start_theta is not None:
        dr = max(0.0, min(taw, (fc - start_theta) * 1000 * zr))
    else:
        dr = 0.5 * taw
    today_state = None
    next_need = None
    etc_next7 = 0.0
    rain_next48 = 0.0
    for d in rows:
        day = dt.date.fromisoformat(d["date"])
        sday = season_day(crop, planted_on, day)
        zr = root_depth(crop, sday)
        taw = awc * zr  # deeper roots reach soil assumed at field capacity, so depletion (mm) is unchanged
        raw = crop.p * taw
        dormant = crop.deciduous and sday >= crop.days
        kc = 0.2 if dormant else kc_at(crop, sday) if (crop.perennial or sday < crop.days) else crop.kc[2]
        ks = 1.0 if dr <= raw else max(0.0, (taw - dr) / ((1 - crop.p) * taw)) if taw else 1.0
        etc = ks * kc * d["et0"]
        pe = effective_rain(d.get("rain") or 0.0, d["et0"])
        irr = irrigation.get(d["date"], 0.0)
        dr = max(0.0, min(taw, dr - pe - irr + etc))
        if day == today:
            today_state = {"dr": dr, "taw": taw, "raw": raw, "kc": kc, "etc": etc, "dormant": dormant}
        if day > today:
            if (day - today).days <= 7:
                etc_next7 += kc * d["et0"]
            if (day - today).days <= 2:
                rain_next48 += pe
            if next_need is None and dr >= raw and not dormant:
                next_need = day
    if today_state is None:
        today_state = {"dr": dr, "taw": taw, "raw": crop.p * taw, "kc": 0.0, "etc": 0.0}
    st = today_state
    needs = st["dr"] >= st["raw"] and st["taw"] > 0 and not st.get("dormant")
    return {
        "available_pct": round(100 * (1 - st["dr"] / st["taw"])) if st["taw"] else 0,
        "depletion_mm": round(st["dr"], 1), "taw_mm": round(st["taw"], 1), "raw_mm": round(st["raw"], 1),
        "kc": round(st["kc"], 2), "etc_today_mm": round(st["etc"], 2),
        "needs_water": needs, "dormant": bool(st.get("dormant")),
        # one irrigation should not exceed what drip/furrow systems apply in a session; refill in steps
        "refill_mm": round(min(st["dr"], MAX_APPLICATION_MM), 1) if needs else 0.0,
        "next_need_date": None if needs else (next_need.isoformat() if next_need else None),
        "etc_next7_mm": round(etc_next7, 1), "rain_eff_next48_mm": round(rain_next48, 1),
        "wait_for_rain": bool(needs and rain_next48 >= max(5.0, 0.5 * st["dr"])),
    }
