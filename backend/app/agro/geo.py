"""Plot geometry: polygon area and the tile grid shown in the game view."""
from __future__ import annotations

import math

M_PER_DEG_LAT = 110540.0


def _xy(lat: float, lon: float, lat0: float) -> tuple[float, float]:
    return lon * 111320.0 * math.cos(math.radians(lat0)), lat * M_PER_DEG_LAT


def polygon_area_m2(poly: list[list[float]]) -> float:
    """Area of a small lat/lon polygon (local equirectangular projection, < 0.5 % error for farm sizes)."""
    if len(poly) < 3:
        return 0.0
    lat0 = sum(p[0] for p in poly) / len(poly)
    pts = [_xy(p[0], p[1], lat0) for p in poly]
    s = 0.0
    for i in range(len(pts)):
        x1, y1 = pts[i]
        x2, y2 = pts[(i + 1) % len(pts)]
        s += x1 * y2 - x2 * y1
    return abs(s) / 2


def centroid(poly: list[list[float]]) -> tuple[float, float]:
    return sum(p[0] for p in poly) / len(poly), sum(p[1] for p in poly) / len(poly)


def point_in_polygon(lat: float, lon: float, poly: list[list[float]]) -> bool:
    inside = False
    j = len(poly) - 1
    for i in range(len(poly)):
        yi, xi = poly[i]
        yj, xj = poly[j]
        if (yi > lat) != (yj > lat) and lon < (xj - xi) * (lat - yi) / ((yj - yi) or 1e-12) + xi:
            inside = not inside
        j = i
    return inside


def square_around(lat: float, lon: float, area_m2: float) -> list[list[float]]:
    half = math.sqrt(area_m2) / 2
    dlat = half / M_PER_DEG_LAT
    dlon = half / (111320.0 * math.cos(math.radians(lat)))
    return [[lat + dlat, lon - dlon], [lat + dlat, lon + dlon], [lat - dlat, lon + dlon], [lat - dlat, lon - dlon]]


def grid(poly: list[list[float]], n: int = 6) -> list[dict]:
    """n×n cells over the polygon's bounding box. c runs west→east, r runs north→south."""
    lats = [p[0] for p in poly]
    lons = [p[1] for p in poly]
    s, nlat, w, e = min(lats), max(lats), min(lons), max(lons)
    cells = []
    for r in range(n):
        for c in range(n):
            la = nlat - (r + 0.5) * (nlat - s) / n
            lo = w + (c + 0.5) * (e - w) / n
            cells.append({"c": c, "r": r, "lat": la, "lon": lo, "inside": point_in_polygon(la, lo, poly)})
    if not any(x["inside"] for x in cells):  # very thin polygons: keep the cell nearest the centroid
        cl = centroid(poly)
        best = min(cells, key=lambda x: (x["lat"] - cl[0]) ** 2 + (x["lon"] - cl[1]) ** 2)
        best["inside"] = True
    return cells


def bbox(poly: list[list[float]]) -> tuple[float, float, float, float]:
    lats = [p[0] for p in poly]
    lons = [p[1] for p in poly]
    return min(lats), max(lats), min(lons), max(lons)


DUNUM_M2 = 1000.0
