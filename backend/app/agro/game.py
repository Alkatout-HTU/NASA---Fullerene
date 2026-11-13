"""Resilience Points (RP) and the farm's resilience grade."""
from __future__ import annotations

from .crops import CROPS

RP = {
    "plant_good": 10,       # planted where suitability >= 75
    "plant_ok": 5,          # suitability 55–74
    "plant_poor": 2,
    "irrigate_needed": 5,   # watered a plot the water balance says needed it
    "wait_rain": 15,        # skipped watering because rain is forecast
    "spray_green": 20,
    "spray_yellow": 5,
    "alert_action": 20,
    "harvest_on_time": 8,
}


def plant_points(score: int) -> int:
    return RP["plant_good"] if score >= 75 else RP["plant_ok"] if score >= 55 else RP["plant_poor"]


def grade(active_crops: list[str]) -> dict:
    kinds = set(active_crops)
    n = len(kinds)
    drought = sum(1 for c in kinds if CROPS[c].drought_tolerant)
    perennial = sum(1 for c in kinds if CROPS[c].perennial)
    score = n + (1 if drought >= 2 else 0) + (1 if perennial and n - perennial else 0)
    g = "A" if score >= 6 else "B" if score >= 4 else "C" if score >= 3 else "D" if score >= 2 else "F"
    if n == 0:
        g = "–"
    return {"grade": g, "crop_types": n, "drought_tolerant": drought, "perennial": perennial}
