"""ISRIC SoilGrids 2.0 (https://rest.isric.org) — no key. Topsoil texture (0–30 cm) at 250 m."""
from __future__ import annotations

import asyncio
import datetime as dt
import math

from ..http import UpstreamError, cached, get_json, rkey

SRC = "SoilGrids"
DEPTHS = {"0-5cm": 5, "5-15cm": 10, "15-30cm": 15}


async def texture(lat: float, lon: float) -> tuple[dict, dt.datetime]:
    """{"clay": %, "sand": %, "silt": %, "soc": g/kg, "ph": pH} as 0–30 cm depth-weighted means."""

    async def fetch():
        params = [("lon", lon), ("lat", lat), ("value", "mean")]
        params += [("property", p) for p in ("clay", "sand", "silt", "soc", "phh2o")]
        params += [("depth", d) for d in DEPTHS]
        res = await get_json(SRC, "https://rest.isric.org/soilgrids/v2.0/properties/query", params=params,
                             retries=1, timeout=45)
        out: dict[str, float | None] = {}
        for layer in res.get("properties", {}).get("layers", []):
            factor = layer.get("unit_measure", {}).get("d_factor", 1) or 1
            tot = wsum = 0.0
            for d in layer.get("depths", []):
                v = d.get("values", {}).get("mean")
                w = DEPTHS.get(d.get("label"), 0)
                if v is not None and w:
                    tot += v / factor * w
                    wsum += w
            out[{"phh2o": "ph"}.get(layer["name"], layer["name"])] = round(tot / wsum, 2) if wsum else None
        if out.get("clay") is None or out.get("sand") is None:
            return {"_none": True}  # SoilGrids leaves towns, roads and water blank
        return out

    return await cached(f"sg:{rkey(lat, lon, 3)}", dt.timedelta(days=365), fetch)


class NoSoilData(Exception):
    pass


async def texture_near(lat: float, lon: float) -> tuple[dict, dt.datetime]:
    """Soil at the point, or at the nearest of four points 500 m away (N, E, S, W).

    SoilGrids has no data for built-up land, so fields at the edge of a town often need this.
    Its fair-use limit is a few calls per minute, so at most five points are tried (answers are cached).
    Adds "distance_m" to the result. Raises NoSoilData when none of the points has data.
    """
    d = 500.0
    dlat, dlon = d / 110540, d / (111320 * math.cos(math.radians(lat)))
    pts = [(lat, lon), (lat + dlat, lon), (lat, lon + dlon), (lat - dlat, lon), (lat, lon - dlon)]

    async def one(la, lo):
        try:
            return await texture(la, lo)
        except UpstreamError:
            return None

    # all five at once (within SoilGrids' fair-use limit of about 5 calls a minute), so the wait is one call
    found = await asyncio.gather(*(one(la, lo) for la, lo in pts))
    for k, hit in enumerate(found):  # prefer the field itself, then the neighbours
        if hit and not hit[0].get("_none"):
            return {**hit[0], "distance_m": 0 if k == 0 else round(d)}, hit[1]
    if all(h is None for h in found):
        raise UpstreamError(SRC, "no answer")
    raise NoSoilData()
