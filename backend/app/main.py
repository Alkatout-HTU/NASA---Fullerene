"""Farm Studio API + web app.  Run:  uvicorn app.main:app --host 0.0.0.0 --port 8000"""
from __future__ import annotations

import asyncio
import contextlib
import logging
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from . import worker
from .api import router
from .config import settings
from .db import init_db
from .http import InputNeeded, UpstreamError, close_client

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
# httpx logs full request URLs, which include API keys (e.g. OpenTopography). Keep them out of the log.
logging.getLogger("httpx").setLevel(logging.WARNING)
logging.getLogger("httpcore").setLevel(logging.WARNING)
FRONTEND = Path(__file__).resolve().parents[2] / "frontend"


@contextlib.asynccontextmanager
async def lifespan(_app: FastAPI):
    init_db()
    task = asyncio.create_task(worker.loop())
    yield
    task.cancel()
    await close_client()


app = FastAPI(title="Farm Studio API", version="1.0.0", lifespan=lifespan)
if settings.cors_origins:
    app.add_middleware(CORSMiddleware, allow_origins=settings.cors_origins, allow_methods=["*"],
                       allow_headers=["*"])


@app.exception_handler(UpstreamError)
async def upstream_error(_req: Request, exc: UpstreamError):
    return JSONResponse(status_code=502, content={
        "detail": f"{exc.source} did not answer correctly: {exc.message}. Try again in a minute.",
        "source": exc.source})


@app.exception_handler(InputNeeded)
async def input_needed(_req: Request, exc: InputNeeded):
    return JSONResponse(status_code=422, content={"detail": exc.message, "field": exc.field})


app.include_router(router)

if FRONTEND.exists():
    app.mount("/static", StaticFiles(directory=FRONTEND), name="static")

    @app.get("/", include_in_schema=False)
    def index():
        return FileResponse(FRONTEND / "index.html")
