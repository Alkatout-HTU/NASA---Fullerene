"""Climate-driven crop suitability, planting calendar and trends, from NASA POWER data."""
from __future__ import annotations

import datetime as dt
import math

from . import soil as soilmod
from .crops import CROPS, Crop

MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"]
MDAYS = [31, 28.25, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
MID_DOY = [15, 46, 75, 105, 135, 162, 198, 228, 258, 288, 318, 344]


def ra_mj(lat: float, doy: int) -> float:
    """Extraterrestrial radiation (FAO-56 eq. 21), MJ m-2 day-1."""
    phi = math.radians(lat)
    dr = 1 + 0.033 * math.cos(2 * math.pi * doy / 365)
    dec = 0.409 * math.sin(2 * math.pi * doy / 365 - 1.39)
    ws = math.acos(max(-1.0, min(1.0, -math.tan(phi) * math.tan(dec))))
    return 24 * 60 / math.pi * 0.0820 * dr * (ws * math.sin(phi) * math.sin(dec) + math.cos(phi) * math.cos(dec) * math.sin(ws))


def et0_hargreaves(tmean: float, tmax: float, tmin: float, lat: float, doy: int) -> float:
    """Reference evapotranspiration, mm/day (FAO-56 eq. 52)."""
    return max(0.0, 0.0023 * (tmean + 17.8) * math.sqrt(max(0.0, tmax - tmin)) * 0.408 * ra_mj(lat, doy))


def monthly_et0(clim: dict, lat: float) -> list[float]:
    """Mean daily max/min = T2M ± T2M_RANGE/2 (POWER T2M_MAX/T2M_MIN are monthly extremes)."""
    out = []
    for i, m in enumerate(MONTHS):
        t, rng = clim["T2M"][m], clim["T2M_RANGE"][m] or 10.0
        out.append(et0_hargreaves(t, t + rng / 2, t - rng / 2, lat, MID_DOY[i]))
    return out


def kc_at(crop: Crop, day: int) -> float:
    """FAO-56 piece-wise linear Kc curve; `day` counted from planting / season start."""
    li, ld, lm, ll = crop.stages
    ki, km, ke = crop.kc
    if day < li:
        return ki
    if day < li + ld:
        return ki + (km - ki) * (day - li) / ld
    if day < li + ld + lm:
        return km
    if day < li + ld + lm + ll:
        return km + (ke - km) * (day - li - ld - lm) / ll
    return ke


def _season_months(start_month: int, days: int) -> list[int]:
    n = max(1, math.ceil(days / 30.4))
    return [(start_month + k) % 12 for k in range(n)]


def _temp_score(t: float, crop: Crop) -> float:
    lo, hi = crop.t_opt
    alo, ahi = crop.t_abs
    if lo <= t <= hi:
        return 100.0
    if t < lo:
        return max(0.0, 100 * (t - alo) / (lo - alo)) if lo > alo else 0.0
    return max(0.0, 100 * (ahi - t) / (ahi - hi)) if ahi > hi else 0.0


def frost_weight(crop: Crop) -> float:
    if crop.frost_c >= -1:
        return 15.0
    if crop.frost_c >= -4:
        return 6.0
    return 0.0


def evaluate_start(crop: Crop, clim: dict, start_month: int) -> dict:
    months = _season_months(start_month, crop.days)
    temps = [clim["T2M"][MONTHS[m]] for m in months]
    mean_t = sum(temps) / len(temps)
    score = _temp_score(mean_t, crop)
    out_of_range = sum(1 for t in temps if t < crop.t_abs[0] or t > crop.t_abs[1])
    score -= 25 * out_of_range
    frost_days = sum(clim["FROST_DAYS"][MONTHS[m]] or 0 for m in months)
    score -= frost_weight(crop) * frost_days
    rain = sum((clim["PRECTOTCORR"][MONTHS[m]] or 0) * MDAYS[m] for m in months)
    return {"start": start_month, "months": months, "mean_t": round(mean_t, 1), "frost_days": round(frost_days, 1),
            "rain_mm": round(rain), "score": max(0.0, min(100.0, score))}


def perennial_score(crop: Crop, clim: dict) -> dict:
    ann = clim["T2M"]["ANN"]
    score = _temp_score(ann, crop)
    s = crop.season_start_month - 1
    spring = [MONTHS[(s + k) % 12] for k in (-1, 0, 1)]
    spring_frost = sum(clim["FROST_DAYS"][m] or 0 for m in spring)
    coldest_min = min(clim["T2M_MIN"][m] for m in MONTHS)  # extreme minimum of the coldest month
    score -= frost_weight(crop) * spring_frost
    if coldest_min < crop.winter_kill_c:
        score -= min(40, 10 * (crop.winter_kill_c - coldest_min))
    coldest_mean = min(clim["T2M"][m] for m in MONTHS)
    if crop.chill_month_max_c is not None and coldest_mean > crop.chill_month_max_c:
        score -= min(60, 25 + 15 * (coldest_mean - crop.chill_month_max_c))
    rain = (clim["PRECTOTCORR"]["ANN"] or 0) * 365.25
    return {"mean_t": round(ann, 1), "frost_days": round(spring_frost, 1), "coldest_min": round(coldest_min, 1),
            "coldest_mean": round(coldest_mean, 1),
            "rain_mm": round(rain), "score": max(0.0, min(100.0, score))}


def season_need_mm(crop: Crop, clim: dict, lat: float, start_month: int) -> tuple[float, float]:
    """(seasonal irrigation need mm, peak weekly ETc mm) from monthly ET0, Kc curve and effective rain."""
    et0 = monthly_et0(clim, lat)
    total = peak = 0.0
    days = crop.days if not crop.perennial else 365
    for d in range(0, days, 7):
        m = (start_month + int(d / 30.4)) % 12
        kc = kc_at(crop, d) if d < crop.days else crop.kc[2]
        etc = kc * et0[m] * 7
        rain = (clim["PRECTOTCORR"][MONTHS[m]] or 0) * 7
        peff = rain * 0.8 if rain > 0.2 * et0[m] * 7 else 0.0
        total += max(0.0, etc - peff)
        peak = max(peak, etc)
    return total, peak


def calendar_rows(crop: Crop, clim: dict) -> dict:
    """12-month row of '' / 'p' (plant) / 'g' (grow) / 'h' (harvest) and best start months."""
    row = [""] * 12
    if crop.perennial:
        s = crop.season_start_month - 1
        for k in range(10):
            row[(s + k) % 12] = "g"
        if crop.gdd_harvest and crop.gdd_base is not None:
            acc, m = 0.0, s
            for k in range(12):
                m = (s + k) % 12
                acc += max(0.0, clim["T2M"][MONTHS[m]] - crop.gdd_base) * MDAYS[m]
                if acc >= crop.gdd_harvest:
                    break
            row[m] = "h"
            row[(m + 1) % 12] = "h"
            for k in range(2, 12):  # dormant after harvest until the next season
                mm = (m + k) % 12
                if mm == s:
                    break
                row[mm] = ""
        if crop.harvest_window:
            a = int(crop.harvest_window[0][:2]) - 1
            b = int(crop.harvest_window[1][:2]) - 1
            m = a
            while True:
                row[m] = "h"
                if m == b:
                    break
                m = (m + 1) % 12
        return {"row": row, "starts": []}
    evals = sorted((evaluate_start(crop, clim, m) for m in range(12)), key=lambda e: -e["score"])
    chosen: list[dict] = []
    for e in evals:
        if e["score"] < 60:
            break
        if all(not set(e["months"]) & set(c["months"]) for c in chosen):
            chosen.append(e)
        if len(chosen) == 2:
            break
    for e in chosen:
        for m in e["months"]:
            row[m] = "g"
        row[e["months"][0]] = "p"
        row[e["months"][-1]] = "h"
    return {"row": row, "starts": [{"month": e["start"] + 1, "score": round(e["score"])} for e in chosen]}


def trend(monthly: dict, years: list[int]) -> dict:
    """Linear trends per decade of annual rain (mm, %) and mean temperature (°C)."""
    def series(param: str, scale: float) -> list[tuple[int, float]]:
        vals = monthly.get(param, {})
        return [(y, vals[f"{y}13"] * scale) for y in years if vals.get(f"{y}13") is not None]

    def slope(pts: list[tuple[int, float]]) -> float:
        n = len(pts)
        if n < 5:
            return 0.0
        mx = sum(p[0] for p in pts) / n
        my = sum(p[1] for p in pts) / n
        den = sum((p[0] - mx) ** 2 for p in pts)
        return sum((p[0] - mx) * (p[1] - my) for p in pts) / den if den else 0.0

    rain = series("PRECTOTCORR", 365.25)
    temp = series("T2M", 1.0)
    rmean = sum(v for _, v in rain) / len(rain) if rain else 0
    rs = slope(rain) * 10
    return {"years": f"{rain[0][0]}–{rain[-1][0]}" if rain else "",
            "rain_mean_mm": round(rmean), "rain_mm_per_decade": round(rs),
            "rain_pct_per_decade": round(100 * rs / rmean, 1) if rmean else 0.0,
            "temp_c_per_decade": round(slope(temp) * 10, 2),
            "rain_series": [{"year": y, "mm": round(v)} for y, v in rain],
            "temp_series": [{"year": y, "t": round(v, 2)} for y, v in temp]}


def anomaly(daily: dict, clim: dict) -> dict | None:
    """Mean temperature of the latest 30 POWER days minus the climatological mean for those days."""
    if not daily:
        return None
    days = sorted(daily)[-30:]
    obs = [daily[d]["t2m"] for d in days]
    normal = [clim["T2M"][MONTHS[int(d[5:7]) - 1]] for d in days]
    return {"from": days[0], "to": days[-1], "obs_c": round(sum(obs) / len(obs), 1),
            "normal_c": round(sum(normal) / len(normal), 1),
            "anomaly_c": round(sum(obs) / len(obs) - sum(normal) / len(normal), 1)}


AR_MONTHS = ["كانون الثاني", "شباط", "آذار", "نيسان", "أيار", "حزيران", "تموز", "آب", "أيلول", "تشرين الأول",
             "تشرين الثاني", "كانون الأول"]


def _r(kind: str, en: str, ar: str) -> dict:
    """A reason: kind '+' helps, '-' hurts, 'i' is information."""
    return {"kind": kind, "en": en, "ar": ar}


def score_crop(crop: Crop, clim: dict, lat: float, ctx: dict) -> dict:
    """Field-level suitability 0–100 with bilingual reasons and a verdict.

    ctx: soil_texture, farm_type, water_m3_week, area_m2, priority, prev_crops, trend
    """
    reasons: list[dict] = []
    if crop.perennial:
        ev = perennial_score(crop, clim)
        start = crop.season_start_month - 1
        lo, hi = crop.t_opt
        if ev["mean_t"] < lo or ev["mean_t"] > hi:
            word = ("too warm", "حار جدًا") if ev["mean_t"] > hi else ("too cold", "بارد جدًا")
            reasons.append(_r("-", f"Climate is {word[0]} for it: yearly mean {ev['mean_t']} °C (best {lo:g}–{hi:g} °C)",
                              f"المناخ {word[1]} له: المتوسط السنوي {ev['mean_t']} °م (الأفضل {lo:g}–{hi:g} °م)"))
        else:
            reasons.append(_r("+", f"Yearly mean {ev['mean_t']} °C is in its best range ({lo:g}–{hi:g} °C)",
                              f"المتوسط السنوي {ev['mean_t']} °م ضمن مداه الأفضل ({lo:g}–{hi:g} °م)"))
        if crop.chill_month_max_c is not None and ev["coldest_mean"] > crop.chill_month_max_c:
            reasons.append(_r("-", f"Winters are too warm for it to rest and fruit (coldest month {ev['coldest_mean']} °C; it needs {crop.chill_month_max_c:g} °C or colder)",
                              f"الشتاء دافئ جدًا ليرتاح ويثمر (أبرد شهر {ev['coldest_mean']} °م؛ يحتاج {crop.chill_month_max_c:g} °م أو أبرد)"))
        if ev["coldest_min"] < crop.winter_kill_c:
            reasons.append(_r("-", f"Winter lows reach {ev['coldest_min']} °C; it is damaged below {crop.winter_kill_c:g} °C",
                              f"تصل الصغرى شتاءً إلى {ev['coldest_min']} °م؛ يتضرر تحت {crop.winter_kill_c:g} °م"))
    else:
        evs = [evaluate_start(crop, clim, m) for m in range(12)]
        ev = max(evs, key=lambda e: e["score"])
        start = ev["start"]
        lo, hi = crop.t_opt
        if ev["score"] >= 60:
            reasons.append(_r("+", f"Best planting month here: {MONTHS[start].title()} (season mean {ev['mean_t']} °C)",
                              f"أفضل شهر للزراعة هنا: {AR_MONTHS[start]} (متوسط الموسم {ev['mean_t']} °م)"))
        else:
            reasons.append(_r("-", f"No month gives it the temperatures it needs ({lo:g}–{hi:g} °C); best is {MONTHS[start].title()} at {ev['mean_t']} °C",
                              f"لا يوجد شهر يعطيه الحرارة التي يحتاجها ({lo:g}–{hi:g} °م)؛ الأفضل {AR_MONTHS[start]} بمتوسط {ev['mean_t']} °م"))
    score = ev["score"]
    if ev["frost_days"] >= 0.5 and frost_weight(crop) > 0:
        reasons.append(_r("-", f"{ev['frost_days']:g} frost days in its sensitive period",
                          f"{ev['frost_days']:g} أيام صقيع في فترة حساسيته"))
    need_mm, peak_week_mm = season_need_mm(crop, clim, lat, start)
    area = ctx.get("area_m2") or 0
    water = ctx.get("water_m3_week") or 0
    farm_type = ctx.get("farm_type", "irr")
    if farm_type == "rain":
        if crop.rain_min_mm <= 0:
            score = min(score, 15)
            reasons.append(_r("-", "Needs irrigation: it cannot grow on rain alone here", "يحتاج ري: لا ينمو على المطر وحده هنا"))
        elif ev["rain_mm"] < crop.rain_min_mm:
            score -= min(40, 40 * (1 - ev["rain_mm"] / crop.rain_min_mm))
            reasons.append(_r("-", f"Season rain is {ev['rain_mm']} mm; it needs about {crop.rain_min_mm:g} mm",
                              f"أمطار الموسم {ev['rain_mm']} ملم؛ يحتاج حوالي {crop.rain_min_mm:g} ملم"))
        else:
            reasons.append(_r("+", f"Season rain ({ev['rain_mm']} mm) is enough to grow it rain-fed",
                              f"أمطار الموسم ({ev['rain_mm']} ملم) تكفي لزراعته بعليًا"))
    else:
        peak_m3 = peak_week_mm * area / 1000
        if water and area and peak_m3 > water:
            score -= min(30, 30 * (peak_m3 / water - 1))
            reasons.append(_r("-", f"At its peak it needs {peak_m3:,.0f} m³/week on the whole field; you have {water:,.0f}",
                              f"في ذروته يحتاج {peak_m3:,.0f} م³/أسبوع لكامل الأرض؛ المتاح {water:,.0f}"))
        reasons.append(_r("i", f"Irrigation need ≈ {need_mm:,.0f} mm per season", f"حاجة الري ≈ {need_mm:,.0f} ملم للموسم"))
    grp = soilmod.group(ctx.get("soil_texture", "loam"))
    if grp in crop.soils_poor:
        score -= 15
        names = {"sand": ("sandy", "الرملية"), "clay": ("heavy clay", "الطينية الثقيلة"), "loam": ("loam", "الطميية")}[grp]
        reasons.append(_r("-", f"Grows poorly in {names[0]} soil", f"ينمو بشكل ضعيف في التربة {names[1]}"))
    pr = ctx.get("priority")
    if pr == "water":
        score += 6 if crop.drought_tolerant else -4
    if crop.id in ("chickpea", "lentil", "faba", "beans"):
        if pr == "soil":
            score += 8
        reasons.append(_r("+", "Legume: adds nitrogen to the soil", "بقولي: يضيف النيتروجين للتربة"))
    if not crop.perennial and crop.id in (ctx.get("prev_crops") or []):
        score -= 10
        reasons.append(_r("-", "Grown here last season: rotate to cut pests and disease", "زُرع هنا الموسم الماضي: بدّل المحصول لتقليل الآفات والأمراض"))
    tr = ctx.get("trend") or {}
    if crop.drought_tolerant:
        if tr.get("rain_pct_per_decade", 0) <= -5 or tr.get("temp_c_per_decade", 0) >= 0.3:
            score += 5
        reasons.append(_r("+", "Drought-tolerant: copes with dry years", "يتحمل الجفاف: يصمد في السنوات الجافة"))
    score = round(max(0.0, min(100.0, score)))
    return {"crop": crop.id, "score": score, "start_month": start + 1, "season_need_mm": round(need_mm),
            "peak_week_mm": round(peak_week_mm, 1), "reasons": reasons, **verdict(score, reasons)}


def verdict(score: int, reasons: list[dict]) -> dict:
    bad = next((r for r in reasons if r.get("kind") == "-"), None)
    good = next((r for r in reasons if r.get("kind") == "+"), None)
    if score >= 75:
        v = "good"
        summary = {"en": "Useful here. " + (good["en"] + "." if good else ""), "ar": "مفيد هنا. " + (good["ar"] + "." if good else "")}
    elif score >= 55:
        v = "ok"
        summary = {"en": "Can work, with care. " + (bad["en"] + "." if bad else ""), "ar": "ممكن مع بعض الحذر. " + (bad["ar"] + "." if bad else "")}
    else:
        v = "poor"
        summary = {"en": "Not recommended here. " + (bad["en"] + "." if bad else ""), "ar": "غير منصوح به هنا. " + (bad["ar"] + "." if bad else "")}
    return {"verdict": v, "summary": {k: x.strip() for k, x in summary.items()}}


def rank(clim: dict, lat: float, ctx: dict) -> list[dict]:
    return sorted((score_crop(c, clim, lat, ctx) for c in CROPS.values()), key=lambda x: -x["score"])
