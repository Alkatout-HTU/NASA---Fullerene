"""Open-Meteo weather forecast (https://open-meteo.com).

NASA products are observations with a lag; farm decisions for the next days need a forecast.
Free without a key for non-commercial use; set OPEN_METEO_API_KEY to use the commercial host.
"""
from __future__ import annotations

import datetime as dt

from ..config import settings
from ..http import UpstreamError, cached, get_json, rkey

SRC = "Open-Meteo"

HOURLY = ("temperature_2m,relative_humidity_2m,precipitation,precipitation_probability,"
          "wind_speed_10m,wind_gusts_10m")
DAILY = ("temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,"
         "et0_fao_evapotranspiration,wind_gusts_10m_max")


def _base() -> tuple[str, dict]:
    if settings.open_meteo_api_key:
        return "https://customer-api.open-meteo.com/v1", {"apikey": settings.open_meteo_api_key}
    return "https://api.open-meteo.com/v1", {}


async def forecast(lat: float, lon: float) -> tuple[dict, dt.datetime]:
    """92 past days + 10 forecast days (daily), 4 days hourly. Times are local to the farm."""

    async def fetch():
        base, extra = _base()
        res = await get_json(SRC, f"{base}/forecast", params={
            "latitude": lat, "longitude": lon, "hourly": HOURLY + ",soil_moisture_27_to_81cm",
            "daily": DAILY, "past_days": 92, "forecast_days": 10, "timezone": "auto",
            "wind_speed_unit": "kmh", **extra})
        if "daily" not in res or "hourly" not in res:
            raise UpstreamError(SRC, res.get("reason", "missing daily/hourly data"))
        d, h = res["daily"], res["hourly"]
        days = [{"date": t, "tmax": d["temperature_2m_max"][i], "tmin": d["temperature_2m_min"][i],
                 "rain": d["precipitation_sum"][i] or 0.0, "rain_prob": d["precipitation_probability_max"][i],
                 "et0": d["et0_fao_evapotranspiration"][i], "gust": d["wind_gusts_10m_max"][i]}
                for i, t in enumerate(d["time"])]
        hours = [{"time": t, "temp": h["temperature_2m"][i], "rh": h["relative_humidity_2m"][i],
                  "rain": h["precipitation"][i] or 0.0, "rain_prob": h["precipitation_probability"][i],
                  "wind": h["wind_speed_10m"][i], "gust": h["wind_gusts_10m"][i],
                  "sm_deep": h["soil_moisture_27_to_81cm"][i]}
                 for i, t in enumerate(h["time"])]
        return {"timezone": res.get("timezone"), "utc_offset_seconds": res.get("utc_offset_seconds", 0),
                "model_elevation": res.get("elevation"), "days": days, "hours": hours}

    return await cached(f"om:fc:{rkey(lat, lon, 2)}", dt.timedelta(hours=1), fetch)


def local_now(fc: dict) -> dt.datetime:
    return dt.datetime.utcnow() + dt.timedelta(seconds=fc.get("utc_offset_seconds") or 0)


async def elevation(points: list[tuple[float, float]]) -> list[float]:
    """Copernicus DEM GLO-90 elevations (fallback when no OpenTopography key is set)."""
    base, extra = _base()
    out: list[float] = []
    for i in range(0, len(points), 100):
        chunk = points[i:i + 100]
        res = await get_json(SRC, f"{base}/elevation", params={
            "latitude": ",".join(f"{p[0]:.6f}" for p in chunk),
            "longitude": ",".join(f"{p[1]:.6f}" for p in chunk), **extra})
        out.extend(res.get("elevation", []))
    if len(out) != len(points):
        raise UpstreamError(SRC, "elevation count mismatch")
    return out
