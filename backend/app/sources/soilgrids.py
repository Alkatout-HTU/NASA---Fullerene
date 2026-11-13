"""ISRIC SoilGrids 2.0 (https://rest.isric.org) — no key. Topsoil texture (0–30 cm) at 250 m."""
from __future__ import annotations

import datetime as dt

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
                             retries=2, timeout=60)
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
            raise UpstreamError(SRC, "no soil data at this point (water, urban area or outside coverage)")
        return out

    return await cached(f"sg:{rkey(lat, lon, 3)}", dt.timedelta(days=365), fetch)
