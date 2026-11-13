"""Weather risk alerts for the next 7 days, adjusted to each tile's terrain.

Frost uses the forecast minimum air temperature, lowered for tiles that sit low in the plot
(cold air drains downhill and pools: -1.5 °C, a conservative textbook value) and for tiles that
ECOSTRESS shows to be colder at night than the plot average.
"""
from __future__ import annotations

import datetime as dt

from .crops import CROPS

LOW_TILE_ADJ_C = -1.5

GENERIC_FROST = (("Cover sensitive crops before sunset", "غطِّ المحاصيل الحساسة قبل الغروب"),
                 ("Irrigate the day before the frost night", "اسقِ في اليوم السابق لليلة الصقيع"))
HEAT = (("Irrigate at dawn, not at midday", "اسقِ فجرًا وليس وقت الظهيرة"),
        ("Put up shade nets over fruit close to harvest", "ركّب شبك التظليل فوق الثمار القريبة من الحصاد"),
        ("Do not spray or fertilise during the heat", "لا ترش ولا تسمّد أثناء موجة الحر"))
RAIN = (("Clear drainage channels, starting with low plots", "نظّف قنوات التصريف، وابدأ بالقطع المنخفضة"),
        ("Postpone fertiliser and pesticide until after the rain", "أجّل التسميد والرش إلى ما بعد المطر"),
        ("Skip irrigation on the days before", "أوقف الري في الأيام السابقة"))
WIND = (("Check and tie down plastic houses and trellises", "افحص البيوت البلاستيكية والأسلاك واربطها جيدًا"),
        ("Do not spray", "لا ترش"))


def _acts(pairs) -> list[dict]:
    return [{"en": a, "ar": b} for a, b in pairs]


def build(days: list[dict], today: dt.date, tiles: list[dict], plantings: list[dict]) -> list[dict]:
    """days: Open-Meteo daily rows; tiles: [{id, low, lst_offset_c}]; plantings: [{tile_id, crop}]"""
    out: list[dict] = []
    tile_by_id = {t["id"]: t for t in tiles}
    future = [d for d in days if today <= dt.date.fromisoformat(d["date"]) <= today + dt.timedelta(days=7)]
    for d in future:
        date = d["date"]
        lead = (dt.date.fromisoformat(date) - today).days
        tmin, tmax, rain, gust = d["tmin"], d["tmax"], d["rain"] or 0, d["gust"] or 0
        # Frost: per planting, using the coldest tile adjustment
        if tmin is not None:
            hits: dict[str, list[int]] = {}
            worst = None
            for p in plantings:
                crop = CROPS[p["crop"]]
                t = tile_by_id.get(p["tile_id"], {})
                adj = (LOW_TILE_ADJ_C if t.get("low") else 0.0) + min(0.0, t.get("lst_offset_c") or 0.0)
                local_min = tmin + adj
                if local_min <= crop.frost_c + 2:
                    hits.setdefault(crop.id, []).append(p["tile_id"])
                    worst = local_min if worst is None else min(worst, local_min)
            if hits or tmin <= 0:
                worst = tmin if worst is None else worst
                severe = any(worst <= CROPS[c].frost_c for c in hits) or (not hits and tmin <= -2)
                acts = []
                for c in hits:
                    acts.extend(CROPS[c].frost_actions or GENERIC_FROST)
                acts = list(dict.fromkeys(acts or GENERIC_FROST))
                names_en = ", ".join(CROPS[c].en for c in hits) or "open fields"
                names_ar = "، ".join(CROPS[c].ar for c in hits) or "الحقول المكشوفة"
                tiles_hit = sorted({t for v in hits.values() for t in v})
                out.append({"key": f"frost:{date}", "type": "frost", "date": date, "lead_days": lead,
                            "severity": "high" if severe else "medium", "tiles": tiles_hit,
                            "value": round(worst, 1),
                            "title": {"en": "Frost risk", "ar": "خطر صقيع"},
                            "body": {"en": f"Forecast low {tmin:.1f} °C; down to {worst:.1f} °C in your coldest plots. At risk: {names_en}.",
                                     "ar": f"الصغرى المتوقعة {tmin:.1f} °م؛ حتى {worst:.1f} °م في أبرد القطع. المعرّض للخطر: {names_ar}."},
                            "actions": _acts(acts[:4]), "source": "Open-Meteo forecast · SRTM terrain · ECOSTRESS"})
        if tmax is not None and tmax >= 38:
            out.append({"key": f"heat:{date}", "type": "heat", "date": date, "lead_days": lead,
                        "severity": "high" if tmax >= 42 else "medium", "tiles": [], "value": round(tmax, 1),
                        "title": {"en": "Heatwave", "ar": "موجة حر"},
                        "body": {"en": f"Forecast high {tmax:.0f} °C. Crops lose water fast and fruit can sunburn.",
                                 "ar": f"العظمى المتوقعة {tmax:.0f} °م. تفقد المحاصيل الماء بسرعة وقد تحترق الثمار."},
                        "actions": _acts(HEAT), "source": "Open-Meteo forecast"})
        if rain >= 20:
            prob = d.get("rain_prob")
            out.append({"key": f"rain:{date}", "type": "rain", "date": date, "lead_days": lead,
                        "severity": "high" if rain >= 40 else "medium", "tiles": [t["id"] for t in tiles if t.get("low")],
                        "value": round(rain, 1),
                        "title": {"en": "Heavy rain", "ar": "أمطار غزيرة"},
                        "body": {"en": f"{rain:.0f} mm forecast" + (f" ({prob}% chance)" if prob is not None else "") + ". Low plots may flood.",
                                 "ar": f"متوقع {rain:.0f} ملم" + (f" (احتمال {prob}%)" if prob is not None else "") + ". قد تغمر المياه القطع المنخفضة."},
                        "actions": _acts(RAIN), "source": "Open-Meteo forecast · SRTM terrain"})
        if gust >= 60:
            out.append({"key": f"wind:{date}", "type": "wind", "date": date, "lead_days": lead,
                        "severity": "high" if gust >= 80 else "medium", "tiles": [], "value": round(gust),
                        "title": {"en": "Strong wind", "ar": "رياح قوية"},
                        "body": {"en": f"Gusts up to {gust:.0f} km/h.", "ar": f"هبات تصل إلى {gust:.0f} كم/س."},
                        "actions": _acts(WIND), "source": "Open-Meteo forecast"})
    return out
