"""NASA POWER (https://power.larc.nasa.gov) — no key required.

Used for: 20+ year climatology (crop suitability, planting calendar), monthly series (climate
trends), and recent daily weather (temperature anomaly, growing degree days).
"""
from __future__ import annotations

import datetime as dt
import re

from ..http import UpstreamError, cached, get_json, rkey

BASE = "https://power.larc.nasa.gov/api/temporal"
SRC = "NASA POWER"
FILL = -999.0
MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"]


def _params(res: dict) -> dict:
    try:
        return res["properties"]["parameter"]
    except (KeyError, TypeError) as e:
        raise UpstreamError(SRC, "unexpected response shape") from e


def _clean(v):
    return None if v is None or v <= FILL + 1 else v


async def climatology(lat: float, lon: float) -> tuple[dict, dt.datetime]:
    """Monthly long-term means: {param: {"JAN": v, ..., "ANN": v}} plus header period.

    Note: T2M_MIN / T2M_MAX here are the monthly *extremes*; T2M_RANGE is the mean daily range.
    """
    params = "T2M,T2M_MIN,T2M_MAX,T2M_RANGE,PRECTOTCORR,FROST_DAYS,RH2M,WS2M,ALLSKY_SFC_SW_DWN"

    async def fetch():
        res = await get_json(SRC, f"{BASE}/climatology/point", params={
            "parameters": params, "community": "AG", "latitude": lat, "longitude": lon, "format": "JSON"})
        p = _params(res)
        out = {k: {m: _clean(v) for m, v in vals.items()} for k, vals in p.items()}
        yrs = re.findall(r"(19|20)(\d\d)", res.get("header", {}).get("range", ""))
        out["_period"] = f"{yrs[0][0]}{yrs[0][1]}–{yrs[-1][0]}{yrs[-1][1]}" if len(yrs) >= 2 else ""
        out["_elev_m"] = res.get("geometry", {}).get("coordinates", [None, None, None])[2]
        return out

    return await cached(f"power:clim:{rkey(lat, lon, 2)}", dt.timedelta(days=180), fetch)


async def monthly(lat: float, lon: float, start_year: int, end_year: int) -> tuple[dict, dt.datetime]:
    """Monthly series {param: {"YYYYMM": v}} — key YYYY13 holds the annual mean."""

    async def fetch():
        res = await get_json(SRC, f"{BASE}/monthly/point", params={
            "parameters": "T2M,PRECTOTCORR", "community": "AG", "latitude": lat, "longitude": lon,
            "start": start_year, "end": end_year, "format": "JSON"})
        return {k: {m: _clean(v) for m, v in vals.items()} for k, vals in _params(res).items()}

    return await cached(f"power:mon:{rkey(lat, lon, 2)}:{start_year}-{end_year}", dt.timedelta(days=30), fetch)


async def daily(lat: float, lon: float, start: dt.date, end: dt.date) -> tuple[dict, dt.datetime]:
    """Daily observations {"YYYY-MM-DD": {"t2m":..,"tmin":..,"tmax":..,"rain":..}}; missing days omitted.

    POWER near-real-time data usually lags 1–3 days, so the newest days may be absent.
    """

    async def fetch():
        res = await get_json(SRC, f"{BASE}/daily/point", params={
            "parameters": "T2M,T2M_MIN,T2M_MAX,PRECTOTCORR", "community": "AG", "latitude": lat,
            "longitude": lon, "start": start.strftime("%Y%m%d"), "end": end.strftime("%Y%m%d"), "format": "JSON"})
        p = _params(res)
        out: dict[str, dict] = {}
        for d in p.get("T2M", {}):
            row = {"t2m": _clean(p["T2M"].get(d)), "tmin": _clean(p.get("T2M_MIN", {}).get(d)),
                   "tmax": _clean(p.get("T2M_MAX", {}).get(d)), "rain": _clean(p.get("PRECTOTCORR", {}).get(d))}
            if row["t2m"] is not None:
                out[f"{d[:4]}-{d[4:6]}-{d[6:]}"] = row
        return out

    return await cached(f"power:day:{rkey(lat, lon, 2)}:{start}:{end}", dt.timedelta(hours=12), fetch)
