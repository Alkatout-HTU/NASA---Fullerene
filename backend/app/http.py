"""Shared HTTP client with retries, plus a database-backed cache for upstream responses."""
from __future__ import annotations

import asyncio
import datetime as dt
import logging
from typing import Any, Awaitable, Callable

import httpx

from .config import settings
from .db import Cache, SessionLocal, jdump, jload, utcnow

log = logging.getLogger("farmstudio.http")
_client: httpx.AsyncClient | None = None


class UpstreamError(Exception):
    """An external data source failed. `source` names it so the UI can say which one."""

    def __init__(self, source: str, message: str):
        super().__init__(f"{source}: {message}")
        self.source = source
        self.message = message


class InputNeeded(Exception):
    """The farmer has to supply something we could not look up (shown as HTTP 422)."""

    def __init__(self, field: str, message: str):
        super().__init__(message)
        self.field = field
        self.message = message


def client() -> httpx.AsyncClient:
    global _client
    if _client is None:
        _client = httpx.AsyncClient(
            timeout=httpx.Timeout(settings.http_timeout, connect=20),
            follow_redirects=True,
            headers={"User-Agent": "FarmStudio/1.0 (+https://github.com/Alkatout-HTU/NASA---Fullerene)"},
        )
    return _client


async def close_client() -> None:
    global _client
    if _client is not None:
        await _client.aclose()
        _client = None


async def request(source: str, method: str, url: str, *, retries: int = 3, **kw) -> httpx.Response:
    last: Exception | None = None
    for attempt in range(retries):
        try:
            r = await client().request(method, url, **kw)
            # 429 (rate limit) is not retried: retrying only makes the limit worse
            if r.status_code in (500, 502, 503, 504) and attempt < retries - 1:
                await asyncio.sleep(2 ** attempt * 2)
                continue
            return r
        except (httpx.TimeoutException, httpx.TransportError) as e:
            last = e
            if attempt < retries - 1:
                await asyncio.sleep(2 ** attempt * 2)
    raise UpstreamError(source, f"no response ({type(last).__name__})")


async def get_json(source: str, url: str, **kw) -> Any:
    r = await request(source, "GET", url, **kw)
    if r.status_code >= 400:
        raise UpstreamError(source, f"HTTP {r.status_code}: {r.text[:200]}")
    try:
        return r.json()
    except ValueError as e:
        raise UpstreamError(source, "response was not JSON") from e


def cache_get(key: str) -> tuple[Any, dt.datetime] | None:
    with SessionLocal() as db:
        row = db.get(Cache, key)
        if row and row.expires_at > utcnow():
            return jload(row.value), row.fetched_at
    return None


def cache_put(key: str, value: Any, ttl: dt.timedelta) -> dt.datetime:
    now = utcnow()
    with SessionLocal() as db:
        row = db.get(Cache, key)
        if row is None:
            row = Cache(key=key, value=jdump(value), fetched_at=now, expires_at=now + ttl)
            db.add(row)
        else:
            row.value, row.fetched_at, row.expires_at = jdump(value), now, now + ttl
        db.commit()
    return now


async def cached(key: str, ttl: dt.timedelta, fetch: Callable[[], Awaitable[Any]]) -> tuple[Any, dt.datetime]:
    """Return (value, fetched_at). Fetches and stores on a miss."""
    hit = cache_get(key)
    if hit is not None:
        return hit
    value = await fetch()
    fetched = cache_put(key, value, ttl)
    return value, fetched


def rkey(lat: float, lon: float, nd: int = 3) -> str:
    return f"{round(lat, nd)},{round(lon, nd)}"
