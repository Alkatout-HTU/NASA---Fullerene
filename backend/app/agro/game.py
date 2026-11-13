"""The farm's resilience grade (crop diversity and drought tolerance)."""
from __future__ import annotations

from .crops import CROPS


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
