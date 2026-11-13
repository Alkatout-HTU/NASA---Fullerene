"""Plot geometry: polygon area, the grid of squares shown in the game view, and square sizes."""
from __future__ import annotations

import math

M_PER_DEG_LAT = 110540.0
DUNUM_M2 = 1000.0
TARGET_SQUARES = 40   # about this many squares inside the field
MAX_SIDE = 12         # never more than 12 squares along one side


def m_per_deg_lon(lat: float) -> float:
    return 111320.0 * math.cos(math.radians(lat))


def _xy(lat: float, lon: float, lat0: float) -> tuple[float, float]:
    return lon * m_per_deg_lon(lat0), lat * M_PER_DEG_LAT


def _shoelace(pts: list[tuple[float, float]]) -> float:
    s = 0.0
    for i in range(len(pts)):
        x1, y1 = pts[i]
        x2, y2 = pts[(i + 1) % len(pts)]
        s += x1 * y2 - x2 * y1
    return s / 2


def polygon_area_m2(poly: list[list[float]]) -> float:
    """Area of a small lat/lon polygon (local equirectangular projection, < 0.5 % error at farm sizes)."""
    if len(poly) < 3:
        return 0.0
    lat0 = sum(p[0] for p in poly) / len(poly)
    return abs(_shoelace([_xy(p[0], p[1], lat0) for p in poly]))


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
    dlon = half / m_per_deg_lon(lat)
    return [[lat + dlat, lon - dlon], [lat + dlat, lon + dlon], [lat - dlat, lon + dlon], [lat - dlat, lon - dlon]]


def bbox(poly: list[list[float]]) -> tuple[float, float, float, float]:
    lats = [p[0] for p in poly]
    lons = [p[1] for p in poly]
    return min(lats), max(lats), min(lons), max(lons)


def _clip(poly: list[tuple[float, float]], x0: float, y0: float, x1: float, y1: float) -> list[tuple[float, float]]:
    """Sutherland–Hodgman clip of a polygon to the rectangle [x0,x1]×[y0,y1]."""
    def clip_edge(pts, inside, inter):
        out = []
        for i in range(len(pts)):
            cur, prev = pts[i], pts[i - 1]
            if inside(cur):
                if not inside(prev):
                    out.append(inter(prev, cur))
                out.append(cur)
            elif inside(prev):
                out.append(inter(prev, cur))
        return out

    def ix(x):
        return lambda a, b: (x, a[1] + (b[1] - a[1]) * (x - a[0]) / ((b[0] - a[0]) or 1e-12))

    def iy(y):
        return lambda a, b: (a[0] + (b[0] - a[0]) * (y - a[1]) / ((b[1] - a[1]) or 1e-12), y)

    pts = poly
    for inside, inter in ((lambda p: p[0] >= x0, ix(x0)), (lambda p: p[0] <= x1, ix(x1)),
                          (lambda p: p[1] >= y0, iy(y0)), (lambda p: p[1] <= y1, iy(y1))):
        if not pts:
            break
        pts = clip_edge(pts, inside, inter)
    return pts


def grid_size(poly: list[list[float]]) -> tuple[int, int, float, float]:
    """(cols, rows, square width m, square height m): squares close to square in real metres."""
    s, n, w, e = bbox(poly)
    lat0 = (s + n) / 2
    width = max(1.0, (e - w) * m_per_deg_lon(lat0))
    height = max(1.0, (n - s) * M_PER_DEG_LAT)
    area = max(1.0, polygon_area_m2(poly))
    side = math.sqrt(area / TARGET_SQUARES)
    side = max(side, width / MAX_SIDE, height / MAX_SIDE)
    cols = max(1, min(MAX_SIDE, round(width / side)))
    rows = max(1, min(MAX_SIDE, round(height / side)))
    return cols, rows, width / cols, height / rows


def grid(poly: list[list[float]], n: int | None = None) -> list[dict]:
    """Squares over the field. c runs west→east, r runs north→south.

    A square counts as part of the field when at least 25 % of it lies inside the boundary;
    its area is the part inside. Its lat/lon is the centre of that inside part.
    """
    s, nlat, w, e = bbox(poly)
    lat0 = (s + nlat) / 2
    if n:
        cols = rows = n
    else:
        cols, rows, _, _ = grid_size(poly)
    kx, ky = m_per_deg_lon(lat0), M_PER_DEG_LAT
    pm = [((p[1] - w) * kx, (nlat - p[0]) * ky) for p in poly]  # metres, x east, y south
    cw, ch = (e - w) * kx / cols, (nlat - s) * ky / rows
    cells = []
    for r in range(rows):
        for c in range(cols):
            x0, y0 = c * cw, r * ch
            part = _clip(pm, x0, y0, x0 + cw, y0 + ch)
            a = abs(_shoelace(part)) if len(part) >= 3 else 0.0
            if a > 0:
                cx = sum(p[0] for p in part) / len(part)
                cy = sum(p[1] for p in part) / len(part)
            else:
                cx, cy = x0 + cw / 2, y0 + ch / 2
            cells.append({"c": c, "r": r, "lat": nlat - cy / ky, "lon": w + cx / kx,
                          "inside": a >= 0.25 * cw * ch, "area_m2": a if a >= 0.25 * cw * ch else 0.0})
    if not any(x["inside"] for x in cells):  # very small or thin fields: keep the square holding the most
        best = max(cells, key=lambda x: x["area_m2"] or 0)
        best["inside"] = True
        best["area_m2"] = polygon_area_m2(poly)
    return cells


def outline_in_grid(poly: list[list[float]], cols: int, rows: int) -> list[list[float]]:
    """Field corners in grid units (x = column, y = row), for drawing the real shape."""
    s, n, w, e = bbox(poly)
    return [[round((p[1] - w) / ((e - w) or 1e-12) * cols, 4), round((n - p[0]) / ((n - s) or 1e-12) * rows, 4)]
            for p in poly]


def edge_lengths_m(poly: list[list[float]]) -> list[float]:
    lat0 = sum(p[0] for p in poly) / len(poly)
    pts = [_xy(p[0], p[1], lat0) for p in poly]
    return [round(math.dist(pts[i], pts[(i + 1) % len(pts)]), 1) for i in range(len(pts))]
