"""Safe-spray windows from the hourly forecast.

Rules follow common pesticide label and extension guidance: spray when wind is 3–15 km/h
(below 3 km/h drift can travel far under temperature inversions), no rain for about 4 hours
after application, air temperature below 30 °C and relative humidity above 40 %.
"""
from __future__ import annotations

import datetime as dt

RANK = {"g": 0, "y": 1, "r": 2}


def hour_zone(h: dict, nxt: list[dict]) -> tuple[str, dict | None]:
    wind, gust, temp, rh = h["wind"] or 0, h["gust"] or 0, h["temp"], h["rh"]
    prob = h["rain_prob"] or 0
    rain_after = sum(x["rain"] for x in nxt)
    prob_after = max([x["rain_prob"] or 0 for x in nxt] or [0])
    if h["rain"] > 0.1 or prob >= 60:
        return "r", {"en": f"rain likely ({prob}%)", "ar": f"مطر محتمل ({prob}%)"}
    if rain_after >= 0.5 or prob_after >= 60:
        return "r", {"en": "rain within 4 h would wash it off", "ar": "مطر خلال 4 ساعات سيغسل الرش"}
    if wind > 15 or gust > 25:
        return "r", {"en": f"wind {wind:.0f} km/h, gusts {gust:.0f}", "ar": f"رياح {wind:.0f} كم/س، هبات {gust:.0f}"}
    if temp is not None and temp >= 35:
        return "r", {"en": f"too hot ({temp:.0f} °C)", "ar": f"حار جدًا ({temp:.0f} °م)"}
    hour = int(h["time"][11:13])
    if (hour >= 19 or hour < 6) and wind < 6:
        return "y", {"en": f"calm night ({wind:.0f} km/h): inversion drift risk", "ar": f"ليل هادئ ({wind:.0f} كم/س): خطر انجراف"}
    if wind < 3:
        return "y", {"en": f"almost no wind ({wind:.0f} km/h): inversion drift risk", "ar": f"رياح شبه معدومة ({wind:.0f} كم/س): خطر انجراف"}
    if wind >= 10:
        return "y", {"en": f"wind {wind:.0f} km/h", "ar": f"رياح {wind:.0f} كم/س"}
    if temp is not None and temp >= 30:
        return "y", {"en": f"hot ({temp:.0f} °C): spray evaporates", "ar": f"حار ({temp:.0f} °م): يتبخر الرش"}
    if rh is not None and rh < 40:
        return "y", {"en": f"dry air ({rh:.0f}% RH)", "ar": f"هواء جاف (رطوبة {rh:.0f}%)"}
    return "g", None


def windows(hours: list[dict], now_local: dt.datetime, days: int = 3, block: int = 3) -> list[dict]:
    idx = {h["time"]: i for i, h in enumerate(hours)}
    today = now_local.date()
    out = []
    for d in range(days):
        day = today + dt.timedelta(days=d)
        for b in range(0, 24, block):
            start = dt.datetime.combine(day, dt.time(b))
            hs = []
            for k in range(block):
                t = (start + dt.timedelta(hours=k)).strftime("%Y-%m-%dT%H:%M")
                i = idx.get(t)
                if i is not None:
                    hs.append((hours[i], hours[i + 1:i + 5]))
            if not hs:
                continue
            past = start + dt.timedelta(hours=block) <= now_local
            zone, why = "g", None
            for h, nxt in hs:
                z, w = hour_zone(h, nxt)
                if RANK[z] > RANK[zone]:
                    zone, why = z, w
            out.append({"start": start.strftime("%Y-%m-%dT%H:%M"), "day": d, "hour": b, "past": past,
                        "zone": zone, "why": why,
                        "wind_kmh": round(sum(h["wind"] or 0 for h, _ in hs) / len(hs)),
                        "rain_prob": max(h["rain_prob"] or 0 for h, _ in hs),
                        "temp_c": round(max(h["temp"] for h, _ in hs)),
                        "rh": round(min(h["rh"] for h, _ in hs))})
    return out
