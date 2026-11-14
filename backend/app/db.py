"""Database models (SQLAlchemy 2.0). SQLite by default; any SQLAlchemy URL works."""
from __future__ import annotations

import datetime as dt
import json
from typing import Any

from sqlalchemy import (Boolean, Date, DateTime, Float, ForeignKey, Integer, String, Text,
                        create_engine, event)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship, sessionmaker

from .config import settings

connect_args = {"check_same_thread": False} if settings.database_url.startswith("sqlite") else {}
engine = create_engine(settings.database_url, connect_args=connect_args, pool_pre_ping=True)

if settings.database_url.startswith("sqlite"):
    @event.listens_for(engine, "connect")
    def _sqlite_pragmas(conn, _):  # pragma: no cover
        cur = conn.cursor()
        cur.execute("PRAGMA foreign_keys=ON")
        cur.execute("PRAGMA journal_mode=WAL")
        cur.close()

SessionLocal = sessionmaker(bind=engine, expire_on_commit=False)


def utcnow() -> dt.datetime:
    return dt.datetime.now(dt.timezone.utc).replace(tzinfo=None)


class Base(DeclarativeBase):
    pass


def jdump(v: Any) -> str:
    return json.dumps(v, ensure_ascii=False, separators=(",", ":"))


def jload(s: str | None, default: Any = None) -> Any:
    if not s:
        return default
    try:
        return json.loads(s)
    except ValueError:
        return default


class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(120), default="")
    password_hash: Mapped[str] = mapped_column(String(255))
    lang: Mapped[str] = mapped_column(String(5), default="en")
    device_key: Mapped[str | None] = mapped_column(String(64), unique=True, index=True, nullable=True)  # sha256 of the device key
    prefs: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON: reminder settings
    rp: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[dt.datetime] = mapped_column(DateTime, default=utcnow)
    plots: Mapped[list["Plot"]] = relationship(back_populates="user", cascade="all, delete-orphan")


class Plot(Base):
    __tablename__ = "plots"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    name: Mapped[str] = mapped_column(String(120))
    region: Mapped[str] = mapped_column(String(255), default="")
    lat: Mapped[float] = mapped_column(Float)
    lon: Mapped[float] = mapped_column(Float)
    polygon: Mapped[str] = mapped_column(Text)  # JSON [[lat, lon], ...]
    area_m2: Mapped[float] = mapped_column(Float)
    grid_n: Mapped[int] = mapped_column(Integer, default=6)
    square_w_m: Mapped[float | None] = mapped_column(Float, nullable=True)   # square size along the field's main axis
    square_h_m: Mapped[float | None] = mapped_column(Float, nullable=True)   # square size across it
    grid_angle: Mapped[float | None] = mapped_column(Float, nullable=True)   # grid rotation, degrees from east
    soil_class: Mapped[str] = mapped_column(String(40))
    soil_source: Mapped[str] = mapped_column(String(40))  # "user" or "SoilGrids"
    soil: Mapped[str] = mapped_column(Text, default="{}")  # JSON texture %
    farm_type: Mapped[str] = mapped_column(String(10), default="irr")  # rain | irr | both
    water_m3_week: Mapped[float] = mapped_column(Float, default=0)
    budget_jod: Mapped[float] = mapped_column(Float, default=0)
    priority: Mapped[str] = mapped_column(String(10), default="water")
    prev_crops: Mapped[str] = mapped_column(Text, default="[]")
    keep_crops: Mapped[str] = mapped_column(Text, default="[]")
    crops: Mapped[str] = mapped_column(Text, default="[]")
    elevation_source: Mapped[str] = mapped_column(String(60), default="")
    profile: Mapped[str] = mapped_column(Text, default="{}")  # land profile snapshot from /analyze
    appeears_task_id: Mapped[str | None] = mapped_column(String(80), nullable=True)
    appeears_status: Mapped[str] = mapped_column(String(30), default="not_started")
    appeears_error: Mapped[str | None] = mapped_column(Text, nullable=True)
    appeears_submitted_at: Mapped[dt.datetime | None] = mapped_column(DateTime, nullable=True)
    satellite: Mapped[str] = mapped_column(Text, default="{}")
    satellite_updated_at: Mapped[dt.datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[dt.datetime] = mapped_column(DateTime, default=utcnow)
    user: Mapped[User] = relationship(back_populates="plots")
    tiles: Mapped[list["Tile"]] = relationship(back_populates="plot", cascade="all, delete-orphan",
                                               order_by="Tile.r, Tile.c")


class Tile(Base):
    __tablename__ = "tiles"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    plot_id: Mapped[int] = mapped_column(ForeignKey("plots.id", ondelete="CASCADE"), index=True)
    c: Mapped[int] = mapped_column(Integer)
    r: Mapped[int] = mapped_column(Integer)
    lat: Mapped[float] = mapped_column(Float)
    lon: Mapped[float] = mapped_column(Float)
    inside: Mapped[bool] = mapped_column(Boolean, default=True)
    area_m2: Mapped[float] = mapped_column(Float, default=0)
    elev: Mapped[float | None] = mapped_column(Float, nullable=True)
    slope_pct: Mapped[float | None] = mapped_column(Float, nullable=True)
    low: Mapped[bool] = mapped_column(Boolean, default=False)
    ndvi: Mapped[float | None] = mapped_column(Float, nullable=True)
    ndvi_date: Mapped[str | None] = mapped_column(String(20), nullable=True)
    lst_night_c: Mapped[float | None] = mapped_column(Float, nullable=True)
    plot: Mapped[Plot] = relationship(back_populates="tiles")
    plantings: Mapped[list["Planting"]] = relationship(back_populates="tile", cascade="all, delete-orphan")


class Planting(Base):
    __tablename__ = "plantings"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    plot_id: Mapped[int] = mapped_column(ForeignKey("plots.id", ondelete="CASCADE"), index=True)
    tile_id: Mapped[int] = mapped_column(ForeignKey("tiles.id", ondelete="CASCADE"), index=True)
    crop: Mapped[str] = mapped_column(String(30))
    planted_on: Mapped[dt.date] = mapped_column(Date)
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    harvested_on: Mapped[dt.date | None] = mapped_column(Date, nullable=True)
    created_at: Mapped[dt.datetime] = mapped_column(DateTime, default=utcnow)
    tile: Mapped[Tile] = relationship(back_populates="plantings")


class Event(Base):
    """Every farmer action: plant, irrigate, wait_rain, spray, harvest, alert_action."""
    __tablename__ = "events"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    plot_id: Mapped[int] = mapped_column(ForeignKey("plots.id", ondelete="CASCADE"), index=True)
    tile_id: Mapped[int | None] = mapped_column(ForeignKey("tiles.id", ondelete="CASCADE"), nullable=True)
    kind: Mapped[str] = mapped_column(String(30), index=True)
    on_date: Mapped[dt.date] = mapped_column(Date)
    at: Mapped[dt.datetime] = mapped_column(DateTime, default=utcnow)
    data: Mapped[str] = mapped_column(Text, default="{}")
    rp: Mapped[int] = mapped_column(Integer, default=0)


class PushSub(Base):
    """A browser/phone that agreed to receive notifications for this farmer."""
    __tablename__ = "push_subs"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    endpoint: Mapped[str] = mapped_column(String(1000), unique=True)
    p256dh: Mapped[str] = mapped_column(String(200))
    auth: Mapped[str] = mapped_column(String(100))
    created_at: Mapped[dt.datetime] = mapped_column(DateTime, default=utcnow)


class Notice(Base):
    """A reminder shown in the app's notification list (and pushed to phones)."""
    __tablename__ = "notices"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    key: Mapped[str] = mapped_column(String(120), index=True)  # e.g. "today:2026-11-14" so each is sent once
    kind: Mapped[str] = mapped_column(String(20))
    title: Mapped[str] = mapped_column(Text)
    body: Mapped[str] = mapped_column(Text)
    created_at: Mapped[dt.datetime] = mapped_column(DateTime, default=utcnow)
    read: Mapped[bool] = mapped_column(Boolean, default=False)


class AppSetting(Base):
    __tablename__ = "app_settings"
    key: Mapped[str] = mapped_column(String(60), primary_key=True)
    value: Mapped[str] = mapped_column(Text)


class Cache(Base):
    __tablename__ = "cache"
    key: Mapped[str] = mapped_column(String(400), primary_key=True)
    value: Mapped[str] = mapped_column(Text)
    fetched_at: Mapped[dt.datetime] = mapped_column(DateTime, default=utcnow)
    expires_at: Mapped[dt.datetime] = mapped_column(DateTime)


def init_db() -> None:
    Base.metadata.create_all(engine)
    _add_missing_columns()


def _add_missing_columns() -> None:
    """Tiny forward-only migration: add columns that newer versions of the models define.

    Lets an existing farmstudio.db keep working after `git pull` (no data is changed or removed).
    """
    from sqlalchemy import inspect, text
    insp = inspect(engine)
    with engine.begin() as conn:
        for table in Base.metadata.sorted_tables:
            if not insp.has_table(table.name):
                continue
            have = {c["name"] for c in insp.get_columns(table.name)}
            for col in table.columns:
                if col.name in have:
                    continue
                ddl = col.type.compile(dialect=engine.dialect)
                conn.execute(text(f'ALTER TABLE {table.name} ADD COLUMN {col.name} {ddl}'))
                if col.unique or col.index:
                    conn.execute(text(f'CREATE INDEX IF NOT EXISTS ix_{table.name}_{col.name} ON {table.name} ({col.name})'))


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
