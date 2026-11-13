"""Runtime settings, read from backend/.env (see .env.example)."""
from __future__ import annotations

import logging
import os
import secrets
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parents[1]
load_dotenv(BASE_DIR / ".env")
log = logging.getLogger("farmstudio")


def _env(name: str, default: str | None = None) -> str | None:
    v = os.getenv(name)
    return v.strip() if v and v.strip() else default


class Settings:
    def __init__(self) -> None:
        self.database_url = _env("DATABASE_URL", f"sqlite:///{BASE_DIR / 'farmstudio.db'}")
        secret = _env("SECRET_KEY")
        if not secret:
            secret = secrets.token_urlsafe(48)
            log.warning("SECRET_KEY is not set: using a random key, so sign-ins reset on every restart.")
        self.secret_key = secret
        self.token_days = int(_env("TOKEN_DAYS", "30"))

        # NASA Earthdata Login (used for AppEEARS: SMAP, ECOSTRESS, MODIS)
        self.earthdata_username = _env("EARTHDATA_USERNAME")
        self.earthdata_password = _env("EARTHDATA_PASSWORD")
        # OpenTopography API key (SRTM GL1 30 m elevation)
        self.opentopography_api_key = _env("OPENTOPOGRAPHY_API_KEY")
        # Open-Meteo: free without a key for non-commercial use; a key switches to the commercial host
        self.open_meteo_api_key = _env("OPEN_METEO_API_KEY")
        # Contact e-mail sent to OpenStreetMap Nominatim, as its usage policy requires
        self.nominatim_email = _env("NOMINATIM_EMAIL")

        self.cors_origins = [o.strip() for o in (_env("CORS_ORIGINS", "") or "").split(",") if o.strip()]
        self.appeears_poll_seconds = int(_env("APPEEARS_POLL_SECONDS", "120"))
        self.appeears_refresh_days = int(_env("APPEEARS_REFRESH_DAYS", "8"))
        self.http_timeout = float(_env("HTTP_TIMEOUT", "90"))

    @property
    def earthdata_enabled(self) -> bool:
        return bool(self.earthdata_username and self.earthdata_password)

    def status(self) -> dict:
        return {
            "nasa_power": True,
            "open_meteo": True,
            "soilgrids": True,
            "earthdata_appeears": self.earthdata_enabled,
            "opentopography_srtm": bool(self.opentopography_api_key),
            "nominatim": True,
            "nominatim_contact_email": bool(self.nominatim_email),
            "secret_key_set": bool(_env("SECRET_KEY")),
        }


settings = Settings()
