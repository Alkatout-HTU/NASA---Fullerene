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


class GridError(ValueError):
    pass


MAX_SQUARES = 400      # squares inside the field
MAX_CELLS = 1600       # squares in the whole grid rectangle
MIN_SIDE_M = 3.0
MIN_INSIDE_FRAC = 0.10  # keep an edge square when at least 10 % of it is inside the field


def _local(poly: list[list[float]]) -> tuple[list[tuple[float, float]], float, float, float]:
    """Polygon in metres around its centroid (x east, y north) plus the origin."""
    lat0, lon0 = centroid(poly)
    kx = m_per_deg_lon(lat0)
    return [((p[1] - lon0) * kx, (p[0] - lat0) * M_PER_DEG_LAT) for p in poly], lat0, lon0, kx


def _hull(pts: list[tuple[float, float]]) -> list[tuple[float, float]]:
    pts = sorted(set(pts))
    if len(pts) <= 2:
        return pts

    def cross(o, a, b):
        return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])
    lower, upper = [], []
    for p in pts:
        while len(lower) >= 2 and cross(lower[-2], lower[-1], p) <= 0:
            lower.pop()
        lower.append(p)
    for p in reversed(pts):
        while len(upper) >= 2 and cross(upper[-2], upper[-1], p) <= 0:
            upper.pop()
        upper.append(p)
    return lower[:-1] + upper[:-1]


def main_angle_deg(poly: list[list[float]]) -> float:
    """Direction of the field's smallest enclosing rectangle, in degrees from east, within (-45, 45]."""
    pts, *_ = _local(poly)
    hull = _hull(pts)
    best, best_area = 0.0, float("inf")
    for i in range(len(hull)):
        (x1, y1), (x2, y2) = hull[i], hull[(i + 1) % len(hull)]
        th = math.atan2(y2 - y1, x2 - x1)
        c, s = math.cos(th), math.sin(th)
        us = [x * c + y * s for x, y in hull]
        vs = [-x * s + y * c for x, y in hull]
        a = (max(us) - min(us)) * (max(vs) - min(vs))
        if a < best_area - 1e-6:
            best_area, best = a, th
    deg = math.degrees(best)
    while deg > 45:
        deg -= 90
    while deg <= -45:
        deg += 90
    return round(deg, 2)


def _uv(poly, angle_deg):
    pts, lat0, lon0, kx = _local(poly)
    th = math.radians(angle_deg)
    c, s = math.cos(th), math.sin(th)
    uv = [(x * c + y * s, -x * s + y * c) for x, y in pts]
    return uv, (lat0, lon0, kx, c, s)


def _to_latlon(u, v, frame):
    lat0, lon0, kx, c, s = frame
    x, y = u * c - v * s, u * s + v * c
    return [round(lat0 + y / M_PER_DEG_LAT, 7), round(lon0 + x / kx, 7)]


def nice_size(m: float) -> float:
    step = 1 if m < 10 else 5 if m < 50 else 10
    return max(MIN_SIDE_M, round(m / step) * step)


def default_square(poly: list[list[float]]) -> float:
    return nice_size(math.sqrt(max(1.0, polygon_area_m2(poly)) / TARGET_SQUARES))


def grid(poly: list[list[float]], square_w: float | None = None, square_h: float | None = None,
         angle_deg: float | None = None) -> dict:
    """Squares laid over the field, turned to the field's main direction so they follow its edges.

    c counts along the main direction, r counts across it. Edge squares are cut at the boundary:
    `area_m2` is the part inside the field and `shape` its outline (lat/lon) for drawing.
    """
    if angle_deg is None:
        angle_deg = main_angle_deg(poly)
    if not square_w:
        square_w = default_square(poly)
    if not square_h:
        square_h = square_w
    if square_w < MIN_SIDE_M or square_h < MIN_SIDE_M:
        raise GridError(f"Squares must be at least {MIN_SIDE_M:g} m on each side.")
    uv, frame = _uv(poly, angle_deg)
    umin, umax = min(p[0] for p in uv), max(p[0] for p in uv)
    vmin, vmax = min(p[1] for p in uv), max(p[1] for p in uv)
    cols = max(1, math.ceil((umax - umin) / square_w - 0.02))  # a sliver under 2 % of a square does not get its own column
    rows = max(1, math.ceil((vmax - vmin) / square_h - 0.02))
    if cols * rows > MAX_CELLS:
        raise GridError("Those squares are too small for this field. Make them bigger.")
    # grid space: x to the right (along u), y downwards (against v); clip in that space
    gp = [((u - umin), (vmax - v)) for u, v in uv]
    cells = []
    for r in range(rows):
        for c in range(cols):
            x0, y0 = c * square_w, r * square_h
            part = _clip(gp, x0, y0, x0 + square_w, y0 + square_h)
            a = abs(_shoelace(part)) if len(part) >= 3 else 0.0
            inside = a >= MIN_INSIDE_FRAC * square_w * square_h
            if a > 0:
                cx = sum(p[0] for p in part) / len(part)
                cy = sum(p[1] for p in part) / len(part)
            else:
                cx, cy = x0 + square_w / 2, y0 + square_h / 2
            lat, lon = _to_latlon(umin + cx, vmax - cy, frame)
            cells.append({"c": c, "r": r, "lat": lat, "lon": lon, "inside": inside,
                          "area_m2": round(a, 1) if inside else 0.0,
                          "shape": [_to_latlon(umin + px, vmax - py, frame) for px, py in part] if inside else []})
    n_in = sum(1 for x in cells if x["inside"])
    if n_in == 0:
        best = max(cells, key=lambda x: x["area_m2"])
        best["inside"], best["area_m2"] = True, polygon_area_m2(poly)
        n_in = 1
    if n_in > MAX_SQUARES:
        raise GridError(f"That makes {n_in} squares; the most is {MAX_SQUARES}. Make the squares bigger.")
    outline = [[round((u - umin) / square_w, 4), round((vmax - v) / square_h, 4)] for u, v in uv]
    return {"cols": cols, "rows": rows, "square_w_m": round(square_w, 2), "square_h_m": round(square_h, 2),
            "angle_deg": angle_deg, "squares": n_in, "cells": cells, "outline": outline,
            "default_square_m": default_square(poly)}


def outline_cells(poly: list[list[float]], angle_deg: float, square_w: float, square_h: float) -> list[list[float]]:
    """Field corners in square units for a grid with this angle and size (x along, y across)."""
    uv, _ = _uv(poly, angle_deg)
    umin = min(p[0] for p in uv)
    vmax = max(p[1] for p in uv)
    return [[round((u - umin) / square_w, 4), round((vmax - v) / square_h, 4)] for u, v in uv]


def legacy_frame(poly: list[list[float]], cols: int, rows: int) -> tuple[float, float]:
    """Square size of plots made before oriented grids (north-up grid over the bounding box)."""
    s, n, w, e = bbox(poly)
    lat0 = (s + n) / 2
    return (e - w) * m_per_deg_lon(lat0) / cols, (n - s) * M_PER_DEG_LAT / rows


def edge_lengths_m(poly: list[list[float]]) -> list[float]:
    lat0 = sum(p[0] for p in poly) / len(poly)
    pts = [_xy(p[0], p[1], lat0) for p in poly]
    return [round(math.dist(pts[i], pts[(i + 1) % len(pts)]), 1) for i in range(len(pts))]
