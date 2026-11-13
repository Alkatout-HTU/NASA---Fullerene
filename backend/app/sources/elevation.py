"""Elevation for each farm tile.

Primary: NASA SRTM GL1 (30 m) via the OpenTopography global DEM API (needs OPENTOPOGRAPHY_API_KEY).
Fallback: Copernicus GLO-90 via Open-Meteo, so plots can still be created without the key.
"""
from __future__ import annotations

import math

from ..config import settings
from ..http import UpstreamError, request
from . import openmeteo

SRC = "SRTM GL1 (OpenTopography)"


def parse_aaigrid(text: str) -> dict:
    lines = text.strip().splitlines()
    hdr: dict[str, float] = {}
    i = 0
    while i < len(lines) and lines[i].split() and lines[i].split()[0].replace("_", "").isalpha():
        k, v = lines[i].split()[:2]
        hdr[k.lower()] = float(v)
        i += 1
    rows = [[float(x) for x in ln.split()] for ln in lines[i:] if ln.strip()]
    if not rows or "ncols" not in hdr:
        raise UpstreamError(SRC, "could not read the elevation grid")
    xll = hdr.get("xllcorner", hdr.get("xllcenter", 0))
    yll = hdr.get("yllcorner", hdr.get("yllcenter", 0))
    return {"ncols": int(hdr["ncols"]), "nrows": int(hdr["nrows"]), "xll": xll, "yll": yll,
            "cell": hdr["cellsize"], "nodata": hdr.get("nodata_value", -9999), "rows": rows}


def sample(grid: dict, lat: float, lon: float) -> float | None:
    col = int((lon - grid["xll"]) / grid["cell"])
    row = grid["nrows"] - 1 - int((lat - grid["yll"]) / grid["cell"])
    if 0 <= row < grid["nrows"] and 0 <= col < grid["ncols"]:
        v = grid["rows"][row][col]
        return None if v == grid["nodata"] else v
    return None


def slope_pct(grid: dict, lat: float, lon: float) -> float | None:
    c = grid["cell"]
    e, w = sample(grid, lat, lon + c), sample(grid, lat, lon - c)
    n, s = sample(grid, lat + c, lon), sample(grid, lat - c, lon)
    if None in (e, w, n, s):
        return None
    dx = 2 * c * 111320 * math.cos(math.radians(lat))
    dy = 2 * c * 110540
    return round(math.hypot((e - w) / dx, (n - s) / dy) * 100, 1)


async def tile_elevations(points: list[tuple[float, float]], bbox: tuple[float, float, float, float]
                          ) -> tuple[list[float | None], list[float | None], str]:
    """Returns (elevations m, slopes %, source label). bbox = (south, north, west, east)."""
    if settings.opentopography_api_key:
        s, n, w, e = bbox
        pad = 0.002
        r = await request(SRC, "GET", "https://portal.opentopography.org/API/globaldem", params={
            "demtype": "SRTMGL1", "south": s - pad, "north": n + pad, "west": w - pad, "east": e + pad,
            "outputFormat": "AAIGrid", "API_Key": settings.opentopography_api_key})
        if r.status_code >= 400 or r.text.lstrip().startswith(("<", "{", "Error")):
            raise UpstreamError(SRC, f"HTTP {r.status_code}: {r.text[:200]}")
        grid = parse_aaigrid(r.text)
        return ([sample(grid, la, lo) for la, lo in points], [slope_pct(grid, la, lo) for la, lo in points],
                "NASA SRTM GL1 30 m (OpenTopography)")
    elev = await openmeteo.elevation(points)
    return elev, [None] * len(points), "Copernicus DEM 90 m (Open-Meteo) — add an OpenTopography key for SRTM"
