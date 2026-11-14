"""Request bodies with validation."""
from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field, field_validator, model_validator

from .agro.crops import CROPS
from .agro.geo import polygon_area_m2

Lang = Literal["en", "ar"]


def _crop_list(v: list[str]) -> list[str]:
    bad = [c for c in v if c not in CROPS]
    if bad:
        raise ValueError(f"unknown crops: {', '.join(bad)}")
    return list(dict.fromkeys(v))


class Polygon(BaseModel):
    polygon: list[list[float]] = Field(min_length=3, max_length=200)

    @field_validator("polygon")
    @classmethod
    def _poly(cls, v: list[list[float]]) -> list[list[float]]:
        for p in v:
            if len(p) != 2 or not (-90 <= p[0] <= 90 and -180 <= p[1] <= 180):
                raise ValueError("each corner must be [lat, lon]")
        a = polygon_area_m2(v)
        if a < 100:
            raise ValueError("the boundary is smaller than 100 m² (0.1 dunum)")
        if a > 50_000_000:
            raise ValueError("the boundary is larger than 50 km²; split it into several plots")
        return v


class FarmInputs(Polygon):
    soil: Literal["loam", "clay", "sandy", "calc", "auto"]
    farm_type: Literal["rain", "irr", "both"] = "irr"
    water_m3_week: float = Field(ge=0, le=1_000_000, default=0)
    priority: Literal["water", "soil", "cost"] = "water"
    prev_crops: list[str] = []
    keep_crops: list[str] = []
    wanted: str = Field(default="", max_length=500)  # crops the farmer typed, any language
    square_w_m: float | None = Field(default=None, ge=3, le=1000)  # square size along the field; None = automatic
    square_h_m: float | None = Field(default=None, ge=3, le=1000)  # square size across the field
    lang: Lang = "en"

    @field_validator("prev_crops", "keep_crops")
    @classmethod
    def _crops_ok(cls, v: list[str]) -> list[str]:
        return _crop_list(v)


class PlotCreate(FarmInputs):
    name: str = Field(min_length=1, max_length=120)
    budget_jod: float = Field(gt=0, le=100_000_000)
    crops: list[str] = Field(min_length=1)

    @field_validator("crops")
    @classmethod
    def _plot_crops_ok(cls, v: list[str]) -> list[str]:
        return _crop_list(v)

    @model_validator(mode="after")
    def _irrigated_needs_water(self):
        if self.farm_type != "rain" and self.water_m3_week <= 0:
            raise ValueError("irrigated farms need the weekly water available (m³)")
        return self


class PlotUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=120)
    water_m3_week: float | None = Field(default=None, ge=0)
    budget_jod: float | None = Field(default=None, gt=0)
    priority: Literal["water", "soil", "cost"] | None = None
    crops: list[str] | None = None

    @field_validator("crops")
    @classmethod
    def _crops_ok(cls, v: list[str] | None) -> list[str] | None:
        return _crop_list(v) if v is not None else v


class GridPreview(Polygon):
    square_w_m: float | None = Field(default=None, ge=3, le=1000)
    square_h_m: float | None = Field(default=None, ge=3, le=1000)


class Regrid(BaseModel):
    square_w_m: float = Field(ge=3, le=1000)
    square_h_m: float = Field(ge=3, le=1000)


class Evaluate(BaseModel):
    text: str = Field(min_length=1, max_length=500)


class TileAction(BaseModel):
    tile_ids: list[int] = Field(min_length=1, max_length=400)


class Plant(TileAction):
    crop: str
    planted_on: str | None = None  # ISO date; defaults to today (use a past date for existing orchards)

    @field_validator("crop")
    @classmethod
    def _crop(cls, v: str) -> str:
        if v not in CROPS:
            raise ValueError("unknown crop")
        return v


class SprayBook(BaseModel):
    start: str  # "YYYY-MM-DDTHH:MM" local, a block start from /spray-window
    tool: Literal["drone", "tractor", "backpack"] = "tractor"


class AlertAction(BaseModel):
    key: str
    idx: int = Field(ge=0, le=20)


class Prefs(BaseModel):
    lang: Lang | None = None
    name: str | None = Field(default=None, max_length=120)
