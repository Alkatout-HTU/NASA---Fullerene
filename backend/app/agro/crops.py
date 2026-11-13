"""Crop reference table.

Sources (values should be reviewed by an agronomist for local varieties):
  * Kc values, stage lengths, rooting depth and depletion fraction p: FAO Irrigation & Drainage
    Paper 56 (Allen et al., 1998), Tables 11, 12 and 22 (Mediterranean / arid region rows).
  * Temperature ranges: FAO ECOCROP database (optimal and absolute mean-temperature limits).
  * Frost damage thresholds: FAO "Frost protection: fundamentals, practice and economics" (2005),
    typical critical temperatures for the sensitive stage.
  * Perennial harvest windows: typical Jordan Valley / highland harvest periods (Jordan Ministry of
    Agriculture crop calendars). Grapes use a growing-degree-day target instead.
"""
from __future__ import annotations

from dataclasses import asdict, dataclass, field


@dataclass(frozen=True)
class Crop:
    id: str
    en: str
    ar: str
    perennial: bool
    kc: tuple[float, float, float]          # Kc ini, mid, end
    stages: tuple[int, int, int, int]       # FAO-56 L_ini, L_dev, L_mid, L_late (days)
    root_m: float                           # effective rooting depth at maturity
    p: float                                # soil water depletion fraction before stress
    t_opt: tuple[float, float]              # optimal mean air temperature during season (°C)
    t_abs: tuple[float, float]              # absolute limits for mean temperature (°C)
    frost_c: float                          # air temperature that damages the sensitive stage
    drought_tolerant: bool
    rain_min_mm: float                      # seasonal rain needed if grown rain-fed (0 = not viable)
    soils_poor: tuple[str, ...] = ()        # texture groups that perform poorly
    season_start_month: int = 0             # perennials: month the growing season (Kc curve) starts
    harvest_window: tuple[str, str] | None = None  # perennials: ("MM-DD", "MM-DD")
    winter_kill_c: float = -30.0            # perennials: winter minimum that damages wood / trees
    deciduous: bool = False                 # loses leaves after the season: no irrigation while dormant
    gdd_base: float | None = None           # growing degree day model (base °C)
    gdd_harvest: float | None = None        # GDD from season start to harvest
    shape: str = "bush"                     # sprite family for the game view
    color: str = "#4E8E2E"                  # fruit / ripe colour for the sprite
    frost_actions: tuple[tuple[str, str], ...] = field(default=())

    @property
    def days(self) -> int:
        return sum(self.stages)

    def public(self) -> dict:
        d = asdict(self)
        d["days"] = self.days
        d.pop("frost_actions", None)
        return d


_FROST_ANNUAL = (("Cover rows with frost fleece or low tunnels before sunset", "غطِّ الخطوط بغطاء الصقيع أو الأنفاق المنخفضة قبل الغروب"),
                 ("Irrigate the day before: moist soil holds more heat overnight", "اسقِ في اليوم السابق: التربة الرطبة تحفظ الحرارة ليلًا"))
_FROST_TREE = (("Run frost sprinklers from 2 °C until the ice melts after sunrise", "شغّل رشاشات الصقيع من 2 °م حتى يذوب الجليد بعد الشروق"),
               ("Delay pruning until the frost has passed", "أجّل التقليم حتى يمر الصقيع"))

CROPS: dict[str, Crop] = {c.id: c for c in [
    Crop("tomato", "Tomatoes", "بندورة", False, (0.6, 1.15, 0.8), (30, 40, 45, 30), 1.0, 0.40, (18, 27), (7, 35), 1.0,
         False, 0, ("clay",), shape="tomato", color="#D9412B", frost_actions=_FROST_ANNUAL),
    Crop("cucumber", "Cucumbers", "خيار", False, (0.6, 1.0, 0.75), (20, 30, 40, 15), 0.9, 0.50, (20, 30), (12, 35), 2.0,
         False, 0, ("clay",), shape="vine", color="#2F6B2A", frost_actions=_FROST_ANNUAL),
    Crop("pepper", "Peppers", "فلفل", False, (0.6, 1.05, 0.9), (25, 35, 40, 20), 0.7, 0.30, (20, 28), (10, 35), 2.0,
         False, 0, ("clay",), shape="tomato", color="#3F9A2E", frost_actions=_FROST_ANNUAL),
    Crop("eggplant", "Eggplant", "باذنجان", False, (0.6, 1.05, 0.9), (30, 40, 40, 20), 0.9, 0.45, (22, 30), (12, 35), 2.0,
         False, 0, ("clay",), shape="tomato", color="#4B2A6B", frost_actions=_FROST_ANNUAL),
    Crop("watermelon", "Watermelon", "بطيخ", False, (0.4, 1.0, 0.75), (20, 30, 30, 30), 1.0, 0.40, (22, 30), (12, 35), 2.0,
         False, 0, ("clay",), shape="vine", color="#3B7A2A", frost_actions=_FROST_ANNUAL),
    Crop("potato", "Potatoes", "بطاطا", False, (0.5, 1.15, 0.75), (25, 30, 45, 30), 0.5, 0.35, (15, 22), (5, 30), -1.0,
         False, 0, ("clay",), shape="bush", color="#B88A4A", frost_actions=_FROST_ANNUAL),
    Crop("onion", "Onions", "بصل", False, (0.7, 1.05, 0.75), (15, 25, 70, 40), 0.4, 0.30, (13, 24), (4, 30), -3.0,
         False, 0, ("clay",), shape="stalk", color="#C9A0D8", frost_actions=_FROST_ANNUAL),
    Crop("wheat", "Wheat", "قمح", False, (0.7, 1.15, 0.3), (30, 50, 60, 30), 1.5, 0.55, (12, 22), (2, 30), -8.0,
         False, 300, ("sand",), shape="grain", color="#E2B64A"),
    Crop("barley", "Barley", "شعير", False, (0.3, 1.15, 0.25), (15, 25, 50, 30), 1.2, 0.55, (10, 22), (2, 30), -8.0,
         True, 250, (), shape="grain", color="#D8C27A"),
    Crop("sorghum", "Sorghum", "ذرة رفيعة", False, (0.7, 1.05, 0.55), (20, 35, 40, 30), 1.5, 0.55, (24, 32), (12, 40), 1.0,
         True, 400, (), shape="grain", color="#9C3B1E", frost_actions=_FROST_ANNUAL),
    Crop("maize", "Maize", "ذرة صفراء", False, (0.3, 1.2, 0.35), (30, 40, 50, 30), 1.2, 0.55, (20, 30), (10, 38), 0.0,
         False, 0, (), shape="grain", color="#E8C33A", frost_actions=_FROST_ANNUAL),
    Crop("chickpea", "Chickpeas", "حمص", False, (0.4, 1.0, 0.35), (25, 35, 40, 20), 0.8, 0.50, (15, 25), (5, 32), -3.0,
         True, 300, ("clay",), shape="bush", color="#C8B27A"),
    Crop("lentil", "Lentils", "عدس", False, (0.4, 1.1, 0.3), (20, 30, 60, 40), 0.7, 0.50, (12, 24), (3, 30), -5.0,
         True, 250, (), shape="bush", color="#A67C52"),
    Crop("grape", "Grapes", "عنب", True, (0.3, 0.85, 0.45), (20, 40, 120, 60), 1.5, 0.35, (15, 25), (10, 30), -1.0,
         False, 0, (), season_start_month=3, winter_kill_c=-15.0, deciduous=True, gdd_base=10.0, gdd_harvest=1600.0, shape="vine_trellis", color="#7B3F8C",
         frost_actions=_FROST_TREE + (("Cover young vines with frost fleece", "غطِّ الكروم الصغيرة بغطاء الصقيع"),)),
    Crop("olive", "Olives", "زيتون", True, (0.65, 0.70, 0.70), (30, 90, 60, 90), 1.5, 0.65, (13, 24), (9, 28), -7.0,
         True, 250, (), season_start_month=3, winter_kill_c=-9.0, harvest_window=("10-15", "12-15"), shape="tree", color="#2E2A3A",
         frost_actions=_FROST_TREE),
    Crop("date", "Date palm", "نخيل", True, (0.9, 0.95, 0.95), (60, 90, 120, 95), 2.0, 0.50, (21, 32), (16, 38), -4.0,
         True, 0, ("clay",), season_start_month=2, winter_kill_c=-7.0, harvest_window=("08-10", "10-31"), shape="palm", color="#B5772A",
         frost_actions=_FROST_TREE),
    Crop("citrus", "Citrus", "حمضيات", True, (0.7, 0.65, 0.7), (60, 90, 120, 95), 1.2, 0.50, (18, 28), (13, 35), -2.0,
         False, 0, ("clay",), season_start_month=2, winter_kill_c=-3.0, harvest_window=("11-15", "03-15"), shape="tree", color="#F08A1C",
         frost_actions=_FROST_TREE),
]}

ACTIVE_CROPS = list(CROPS)


def get(crop_id: str) -> Crop:
    if crop_id not in CROPS:
        raise KeyError(crop_id)
    return CROPS[crop_id]
