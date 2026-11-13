"""Background job: submit and collect NASA AppEEARS requests (SMAP, MODIS NDVI, ECOSTRESS)."""
from __future__ import annotations

import asyncio
import datetime as dt
import logging

from sqlalchemy import select

from .config import settings
from .db import Plot, SessionLocal, jdump, utcnow
from .http import UpstreamError
from .sources import appeears

log = logging.getLogger("farmstudio.worker")
PENDING = ("queued", "pending", "processing", "submitted")


async def refresh_satellite(plot_id: int, force: bool = False) -> None:
    """Submit a new AppEEARS request for the plot if none is running and data is stale."""
    if not settings.earthdata_enabled:
        with SessionLocal() as db:
            p = db.get(Plot, plot_id)
            if p and p.appeears_status == "not_started":
                p.appeears_status = "not_configured"
                db.commit()
        return
    with SessionLocal() as db:
        p = db.get(Plot, plot_id)
        if not p:
            return
        if p.appeears_status in PENDING and not force:
            return
        fresh = p.satellite_updated_at and utcnow() - p.satellite_updated_at < dt.timedelta(days=settings.appeears_refresh_days)
        if fresh and not force:
            return
        pts = [{"id": f"t{t.id}", "lat": t.lat, "lon": t.lon} for t in p.tiles if t.inside]
        try:
            task = await appeears.submit(p.id, pts)
            p.appeears_task_id, p.appeears_status, p.appeears_error = task, "submitted", None
            p.appeears_submitted_at = utcnow()
        except UpstreamError as e:
            p.appeears_status, p.appeears_error = "error", e.message
        db.commit()


async def collect(plot_id: int) -> None:
    with SessionLocal() as db:
        p = db.get(Plot, plot_id)
        if not p or not p.appeears_task_id:
            return
        try:
            st = await appeears.status(p.appeears_task_id)
        except UpstreamError as e:
            p.appeears_error = e.message
            db.commit()
            return
        if st != "done":
            p.appeears_status = st if st in PENDING or st in ("error", "deleted") else "processing"
            if st == "error":
                p.appeears_error = "AppEEARS could not process the request; it will be retried."
            db.commit()
            return
        try:
            raw = await appeears.results(p.appeears_task_id)
        except UpstreamError as e:
            p.appeears_error = e.message
            db.commit()
            return
        utc_off = round(p.lon / 15)
        tile_ids = [f"t{t.id}" for t in p.tiles]
        summary = appeears.summarise(raw, tile_ids, utc_off)
        for t in p.tiles:
            n = summary["ndvi"].get(f"t{t.id}")
            if n:
                t.ndvi, t.ndvi_date = n["v"], n["date"]
            lst = summary["lst_night"].get(f"t{t.id}")
            t.lst_night_c = lst
        p.satellite = jdump(summary)
        p.satellite_updated_at = utcnow()
        p.appeears_status, p.appeears_error = "done", None
        db.commit()
        log.info("AppEEARS results stored for plot %s", plot_id)


async def tick() -> None:
    with SessionLocal() as db:
        rows = db.execute(select(Plot.id, Plot.appeears_status)).all()
    for pid, status in rows:
        try:
            if status in PENDING:
                await collect(pid)
            elif status in ("done", "error", "deleted", "not_started", "not_configured"):
                await refresh_satellite(pid)
        except Exception:  # keep the loop alive
            log.exception("satellite job failed for plot %s", pid)


async def loop() -> None:
    while True:
        try:
            await tick()
        except Exception:
            log.exception("worker tick failed")
        await asyncio.sleep(settings.appeears_poll_seconds)
