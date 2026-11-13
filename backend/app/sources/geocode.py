"""Reverse geocoding with OpenStreetMap Nominatim (needs NOMINATIM_EMAIL as a contact address)."""
from __future__ import annotations

import datetime as dt

from ..config import settings
from ..http import UpstreamError, cached, get_json, rkey


async def place_name(lat: float, lon: float, lang: str = "en") -> str:
    fallback = f"{lat:.3f}°N, {lon:.3f}°E"
    if not settings.nominatim_email:
        return fallback

    async def fetch():
        res = await get_json("Nominatim", "https://nominatim.openstreetmap.org/reverse", params={
            "lat": lat, "lon": lon, "format": "jsonv2", "zoom": 12, "accept-language": lang,
            "email": settings.nominatim_email})
        a = res.get("address", {})
        parts = [a.get(k) for k in ("village", "town", "city", "county", "state_district", "state") if a.get(k)]
        return ", ".join(dict.fromkeys(parts[:2])) or res.get("display_name", fallback)

    try:
        name, _ = await cached(f"geo:{lang}:{rkey(lat, lon, 3)}", dt.timedelta(days=90), fetch)
        return name
    except UpstreamError:
        return fallback
