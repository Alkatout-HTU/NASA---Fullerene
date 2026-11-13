"""Growth stage and harvest timing for each planting."""
from __future__ import annotations

import datetime as dt

from .climate import MONTHS
from .crops import Crop


def _window(crop: Crop, year: int) -> tuple[dt.date, dt.date]:
    a, b = crop.harvest_window  # type: ignore[misc]
    start = dt.date(year, int(a[:2]), int(a[3:]))
    end = dt.date(year, int(b[:2]), int(b[3:]))
    if end < start:
        end = dt.date(year + 1, end.month, end.day)
    return start, end


def gdd_harvest_date(crop: Crop, today: dt.date, obs_daily: dict[str, float], clim: dict) -> dt.date | None:
    """Growing-degree-day model. obs_daily: {"YYYY-MM-DD": mean °C} (POWER + forecast).
    Days with no observation/forecast use the POWER climatological monthly mean."""
    start = dt.date(today.year, crop.season_start_month, 1)
    if today < start:
        start = dt.date(today.year - 1, crop.season_start_month, 1)
    acc = 0.0
    d = start
    while (d - start).days < 330:
        t = obs_daily.get(d.isoformat())
        if t is None:
            t = clim["T2M"][MONTHS[d.month - 1]]
        acc += max(0.0, t - crop.gdd_base)  # type: ignore[operator]
        if acc >= crop.gdd_harvest:  # type: ignore[operator]
            return d
        d += dt.timedelta(days=1)
    return None


def status(crop: Crop, planted_on: dt.date, today: dt.date, obs_daily: dict[str, float], clim: dict | None,
           last_harvest: dt.date | None = None) -> dict:
    """{"stage": 0-4, "ready": bool, "harvest_from": iso, "harvest_to": iso, "method": str}"""
    if not crop.perennial:
        age = (today - planted_on).days
        hdate = planted_on + dt.timedelta(days=crop.days)
        ready = age >= crop.days - 5
        stage = 4 if ready else max(0, min(3, int(4 * age / crop.days)))
        return {"stage": stage, "ready": ready, "age_days": age, "harvest_from": hdate.isoformat(),
                "harvest_to": (hdate + dt.timedelta(days=21)).isoformat(), "method": "FAO-56 season length"}
    season_start = dt.date(today.year, crop.season_start_month, 1)
    if today < season_start:
        season_start = dt.date(today.year - 1, crop.season_start_month, 1)
    if crop.gdd_harvest and clim:
        h = gdd_harvest_date(crop, today, obs_daily, clim)
        if h is None:
            return {"stage": 2, "ready": False, "age_days": (today - planted_on).days, "harvest_from": None,
                    "harvest_to": None, "method": "growing degree days"}
        h_from, h_to, method = h, h + dt.timedelta(days=45), "growing degree days (NASA POWER + forecast)"
        if today > h_to:  # this season is over: predict next season from climatology
            nxt = dt.date(season_start.year + 1, crop.season_start_month, 1)
            h2 = gdd_harvest_date(crop, nxt, {}, clim)
            if h2:
                h_from, h_to = h2, h2 + dt.timedelta(days=45)
                season_start = nxt
    else:
        h_from, h_to = _window(crop, season_start.year)
        if today > h_to:
            h_from, h_to = _window(crop, season_start.year + 1)
        method = "regional harvest window"
    ready = h_from <= today <= h_to
    harvested = bool(last_harvest and h_from <= last_harvest <= h_to)
    if harvested:  # already picked this season: wait for the next one
        ready = False
    span = max(1, (h_from - season_start).days)
    stage = 4 if ready else max(0, min(3, int(4 * (today - season_start).days / span)))
    if harvested:
        stage = 1
    return {"stage": stage, "ready": ready, "harvested_this_season": harvested, "age_days": (today - planted_on).days, "harvest_from": h_from.isoformat(),
            "harvest_to": h_to.isoformat(), "method": method}
