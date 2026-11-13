"""Place names and place search with OpenStreetMap Nominatim, limited to Jordan.

Nominatim's usage policy asks for an identifying User-Agent (set in app.http) and allows about
one request per second; NOMINATIM_EMAIL adds a contact address. Answers are cached.
"""
from __future__ import annotations

import asyncio
import datetime as dt
import time

from ..config import settings
from ..http import UpstreamError, cached, get_json, rkey

BASE = "https://nominatim.openstreetmap.org"
_lock = asyncio.Lock()
_last = 0.0


async def _get(path: str, params: dict) -> object:
    global _last
    if settings.nominatim_email:
        params = {**params, "email": settings.nominatim_email}
    async with _lock:  # at most one request per second
        wait = 1.0 - (time.monotonic() - _last)
        if wait > 0:
            await asyncio.sleep(wait)
        try:
            return await get_json("Nominatim", f"{BASE}{path}", params=params, retries=2)
        finally:
            _last = time.monotonic()


async def place_name(lat: float, lon: float, lang: str = "en") -> str:
    fallback = f"{lat:.3f}°N, {lon:.3f}°E"

    async def fetch():
        res = await _get("/reverse", {"lat": lat, "lon": lon, "format": "jsonv2", "zoom": 12, "accept-language": lang})
        a = res.get("address", {}) if isinstance(res, dict) else {}
        parts = [a.get(k) for k in ("village", "town", "city", "suburb", "county", "state_district", "state") if a.get(k)]
        return ", ".join(dict.fromkeys(parts[:2])) or (res.get("display_name") if isinstance(res, dict) else None) or fallback

    try:
        name, _ = await cached(f"geo:{lang}:{rkey(lat, lon, 3)}", dt.timedelta(days=90), fetch)
        return name
    except UpstreamError:
        return fallback


async def search(q: str, lang: str = "en") -> list[dict]:
    """Towns, villages and areas in Jordan matching q: [{name, detail, lat, lon, bbox}]."""
    q = q.strip()

    async def fetch():
        res = await _get("/search", {"q": q, "format": "jsonv2", "countrycodes": "jo", "limit": 8,
                                     "addressdetails": 1, "accept-language": lang})
        out = []
        for r in res if isinstance(res, list) else []:
            bb = r.get("boundingbox") or []
            out.append({"name": r.get("name") or r.get("display_name", "").split(",")[0],
                        "detail": ", ".join(r.get("display_name", "").split(", ")[1:4]),
                        "lat": float(r["lat"]), "lon": float(r["lon"]),
                        "bbox": [float(x) for x in bb] if len(bb) == 4 else None,
                        "type": r.get("type")})
        return out

    res, _ = await cached(f"geosearch:{lang}:{q.lower()}", dt.timedelta(days=30), fetch)
    return res
