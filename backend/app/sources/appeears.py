"""NASA AppEEARS (https://appeears.earthdatacloud.nasa.gov) — needs a NASA Earthdata Login.

For every plot we submit one *point* request with the centre of each tile, asking for:
  * SMAP L4 root-zone soil moisture (SPL4SMGP.008, 9 km, 3-hourly)
  * MODIS NDVI (MOD13Q1.061, 250 m, 16-day)
  * ECOSTRESS land surface temperature (ECO_L2T_LSTE.002, 70 m, irregular overpasses)
AppEEARS processes requests asynchronously (minutes to hours). A background poller in
app.worker checks status and stores the results on the plot and its tiles.
"""
from __future__ import annotations

import csv
import datetime as dt
import io
import logging
import time

import httpx

from ..config import settings
from ..http import UpstreamError, request

API = "https://appeears.earthdatacloud.nasa.gov/api"
SRC = "NASA AppEEARS"
log = logging.getLogger("farmstudio.appeears")

LAYERS = [
    {"product": "SPL4SMGP.008", "layer": "Geophysical_Data_sm_rootzone", "key": "smap_rootzone"},
    {"product": "MOD13Q1.061", "layer": "_250m_16_days_NDVI", "key": "ndvi"},
    {"product": "ECO_L2T_LSTE.002", "layer": "LST", "key": "lst"},
]
LOOKBACK_DAYS = {"smap_rootzone": 21, "ndvi": 120, "lst": 120}

_token: tuple[str, float] | None = None


async def token() -> str:
    global _token
    if not settings.earthdata_enabled:
        raise UpstreamError(SRC, "EARTHDATA_USERNAME / EARTHDATA_PASSWORD are not set")
    if _token and _token[1] > time.time() + 600:
        return _token[0]
    r = await request(SRC, "POST", f"{API}/login",
                      auth=httpx.BasicAuth(settings.earthdata_username, settings.earthdata_password))
    if r.status_code != 200:
        raise UpstreamError(SRC, f"Earthdata login failed (HTTP {r.status_code}). Check the username/password "
                                 "and that the account has approved the AppEEARS application.")
    tok = r.json()["token"]
    _token = (tok, time.time() + 40 * 3600)  # tokens last 48 h
    return tok


async def _auth() -> dict:
    return {"Authorization": f"Bearer {await token()}"}


async def submit(plot_id: int, points: list[dict], today: dt.date | None = None) -> str:
    """points: [{"id": "t12", "lat": .., "lon": ..}]. Returns the task id."""
    today = today or dt.date.today()
    start = today - dt.timedelta(days=max(LOOKBACK_DAYS.values()))
    body = {
        "task_type": "point",
        "task_name": f"farmstudio-plot-{plot_id}-{today.isoformat()}",
        "params": {
            "dates": [{"startDate": start.strftime("%m-%d-%Y"), "endDate": today.strftime("%m-%d-%Y")}],
            "layers": [{"product": l["product"], "layer": l["layer"]} for l in LAYERS],
            "coordinates": [{"id": p["id"], "latitude": round(p["lat"], 6), "longitude": round(p["lon"], 6),
                             "category": f"plot{plot_id}"} for p in points],
        },
    }
    r = await request(SRC, "POST", f"{API}/task", json=body, headers=await _auth())
    if r.status_code not in (200, 202):
        raise UpstreamError(SRC, f"task submit failed (HTTP {r.status_code}): {r.text[:300]}")
    return r.json()["task_id"]


async def status(task_id: str) -> str:
    """Returns 'queued' | 'pending' | 'processing' | 'done' | 'error' | 'deleted'."""
    r = await request(SRC, "GET", f"{API}/task/{task_id}", headers=await _auth())
    if r.status_code == 404:
        return "deleted"
    if r.status_code >= 400:
        raise UpstreamError(SRC, f"status HTTP {r.status_code}")
    return r.json().get("status", "pending")


def _to_float(v: str | None) -> float | None:
    try:
        f = float(v)  # type: ignore[arg-type]
    except (TypeError, ValueError):
        return None
    return None if f <= -999 or f != f else f


def parse_csv(text: str, layer_key: str, layer_name: str) -> list[dict]:
    """Rows -> [{"id", "date", "value"}]; the value column is the one ending in the layer name."""
    reader = csv.DictReader(io.StringIO(text))
    cols = reader.fieldnames or []
    vcol = next((c for c in cols if c.endswith(layer_name) and "QC" not in c and "Quality" not in c), None)
    if not vcol:
        return []
    out = []
    for row in reader:
        v = _to_float(row.get(vcol))
        if v is None:
            continue
        out.append({"id": row.get("ID"), "date": row.get("Date"), "value": v})
    return out


async def results(task_id: str) -> dict:
    """Download the bundle CSVs. Returns {key: [{"id","date","value"}]}."""
    headers = await _auth()
    r = await request(SRC, "GET", f"{API}/bundle/{task_id}", headers=headers)
    if r.status_code >= 400:
        raise UpstreamError(SRC, f"bundle HTTP {r.status_code}")
    files = [f for f in r.json().get("files", []) if f.get("file_type") == "csv"]
    out: dict[str, list] = {l["key"]: [] for l in LAYERS}
    for f in files:
        name = f.get("file_name", "")
        norm = "".join(ch for ch in name.upper() if ch.isalnum())
        layer = next((l for l in LAYERS if "".join(ch for ch in l["product"].upper() if ch.isalnum()) in norm), None)
        if not layer:
            continue
        fr = await request(SRC, "GET", f"{API}/bundle/{task_id}/{f['file_id']}", headers=headers)
        if fr.status_code >= 400:
            raise UpstreamError(SRC, f"file {name} HTTP {fr.status_code}")
        out[layer["key"]].extend(parse_csv(fr.text, layer["key"], layer["layer"]))
    return out


def summarise(raw: dict, tile_ids: list[str], utc_offset_h: float) -> dict:
    """Reduce raw rows to what the app shows: latest SMAP, per-tile latest NDVI, per-tile mean night LST."""
    out: dict = {"smap": None, "ndvi": {}, "ndvi_series": [], "lst_night": {}}
    sm = sorted(raw.get("smap_rootzone", []), key=lambda r: r["date"] or "")
    if sm:
        last_day = (sm[-1]["date"] or "")[:10]
        vals = [r["value"] for r in sm if (r["date"] or "").startswith(last_day)]
        out["smap"] = {"date": last_day, "rootzone_m3m3": round(sum(vals) / len(vals), 3)}
        # daily plot-mean series for the last 21 days
        by_day: dict[str, list[float]] = {}
        for r in sm:
            by_day.setdefault((r["date"] or "")[:10], []).append(r["value"])
        out["smap_series"] = [{"date": d, "v": round(sum(v) / len(v), 3)} for d, v in sorted(by_day.items())][-21:]
    nd = sorted(raw.get("ndvi", []), key=lambda r: r["date"] or "")
    for r in nd:
        out["ndvi"][r["id"]] = {"date": (r["date"] or "")[:10], "v": round(r["value"], 3)}
    by_date: dict[str, list[float]] = {}
    for r in nd:
        by_date.setdefault((r["date"] or "")[:10], []).append(r["value"])
    out["ndvi_series"] = [{"date": d, "v": round(sum(v) / len(v), 3)} for d, v in sorted(by_date.items())]
    lst: dict[str, list[float]] = {}
    for r in raw.get("lst", []):
        d = r["date"] or ""
        night = True
        if "T" in d or " " in d:
            try:
                hh = int(d.replace(" ", "T").split("T")[1][:2])
                local = (hh + utc_offset_h) % 24
                night = local >= 19 or local < 7
            except (ValueError, IndexError):
                night = True
        if night and r["value"] > 200:  # Kelvin sanity
            lst.setdefault(r["id"], []).append(r["value"] - 273.15)
    out["lst_night"] = {k: round(sum(v) / len(v), 2) for k, v in lst.items() if k in tile_ids}
    out["lst_obs"] = sum(len(v) for v in lst.values())
    return out
