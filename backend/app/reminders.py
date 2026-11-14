"""Watering reminders: same day, the day before, and a weekly summary per crop.

Each farmer picks the times (in their own time zone) and can switch every kind off. A loop checks
once a minute; each reminder is created at most once per day (or week) and is both stored in the
in-app notification list and pushed to every phone/browser the farmer subscribed.
"""
from __future__ import annotations

import asyncio
import datetime as dt
import json
import logging

from sqlalchemy import delete, select

from . import webpush
from .agro.crops import CROPS
from .config import settings
from .db import AppSetting, Notice, Plot, PushSub, SessionLocal, User, jload
from .http import client

log = logging.getLogger("farmstudio.reminders")

DEFAULTS = {
    "enabled": True,
    "same_day": True, "same_day_time": "07:00",
    "day_before": True, "day_before_time": "19:00",
    "weekly": True, "weekly_day": 6, "weekly_time": "08:00",   # weekday 0 = Monday … 6 = Sunday
    "tz_offset_min": 180,                                        # Jordan, UTC+3
}
LATE_LIMIT = dt.timedelta(hours=6)  # do not send a morning reminder in the evening after a long outage


def prefs_of(user: User) -> dict:
    return {**DEFAULTS, **(jload(user.prefs, {}) or {})}


def _setting(db, key: str) -> str | None:
    row = db.get(AppSetting, key)
    return row.value if row else None


def vapid_pem() -> str:
    with SessionLocal() as db:
        pem = _setting(db, "vapid_pem")
        if not pem:
            pem = webpush.new_vapid_key()
            db.add(AppSetting(key="vapid_pem", value=pem))
            db.commit()
        return pem


def public_key() -> str:
    return webpush.public_key_b64(vapid_pem())


def _subject() -> str:
    return f"mailto:{settings.nominatim_email}" if settings.nominatim_email else "https://github.com/Alkatout-HTU/NASA---Fullerene"


async def push_to_user(user_id: int, title: str, body: str, url: str = "/") -> int:
    """Send to every subscription of the user; drops subscriptions the browser has cancelled."""
    with SessionLocal() as db:
        subs = list(db.scalars(select(PushSub).where(PushSub.user_id == user_id)))
    if not subs:
        return 0
    pem = vapid_pem()
    payload = json.dumps({"title": title, "body": body, "url": url}).encode()
    sent, dead = 0, []
    for s in subs:
        try:
            data = webpush.encrypt(payload, s.p256dh, s.auth)
            r = await client().post(s.endpoint, content=data, headers={
                "Authorization": webpush.vapid_header(s.endpoint, pem, _subject()),
                "Content-Encoding": "aes128gcm", "Content-Type": "application/octet-stream",
                "TTL": "86400", "Urgency": "normal"}, timeout=20)
            if r.status_code in (404, 410):
                dead.append(s.id)
            elif r.status_code < 300:
                sent += 1
            else:
                log.warning("push refused (%s): %s", r.status_code, r.text[:200])
        except Exception as e:  # one bad subscription must not stop the others
            log.warning("push failed: %s", e)
    if dead:
        with SessionLocal() as db:
            db.execute(delete(PushSub).where(PushSub.id.in_(dead)))
            db.commit()
    return sent


# ------------------------------------------------------------------ message text
def _day(d: str, lang: str) -> str:
    x = dt.date.fromisoformat(d)
    if lang == "ar":
        days = ["الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت", "الأحد"]
        return f"{days[x.weekday()]} {x.day}"
    return x.strftime("%a %d").replace(" 0", " ")


def _crop(cid: str, lang: str) -> str:
    c = CROPS.get(cid)
    return (c.ar if lang == "ar" else c.en) if c else cid


def build(kind: str, plot_name: str, plan: dict, today: dt.date, lang: str) -> tuple[str, str] | None:
    """(title, body) for one plot, or None when there is nothing to say."""
    ar = lang == "ar"
    if plan.get("status") in ("rainfed", "no_crops"):
        return None
    if kind in ("today", "tomorrow"):
        day = today if kind == "today" else today + dt.timedelta(days=1)
        lines = []
        for c in plan["crops"]:
            for d in c["dates"]:
                if d["date"] == day.isoformat():
                    lines.append(f"{_crop(c['crop'], lang)}: {d['mm']:g} " + ("ملم" if ar else "mm")
                                 + f" ({d['m3']:g} " + ("م³" if ar else "m³") + ")")
        if not lines:
            return None
        if kind == "today":
            title = f"اسقِ اليوم · {plot_name}" if ar else f"Water today · {plot_name}"
        else:
            title = f"ري غدًا · {plot_name}" if ar else f"Watering tomorrow · {plot_name}"
        return title, "\n".join(lines)
    # weekly summary, one line per crop
    lines = []
    for c in plan["crops"]:
        if c["dormant"]:
            lines.append(f"{_crop(c['crop'], lang)}: " + ("سكون الشتاء، بدون ري" if ar else "resting for winter, no watering"))
        elif c["dates"]:
            when = ", ".join(f"{_day(d['date'], lang)} {d['mm']:g}" + (" ملم" if ar else " mm") for d in c["dates"])
            lines.append(f"{_crop(c['crop'], lang)}: {when} · {c['give_m3']:g} " + ("م³" if ar else "m³"))
        else:
            lines.append(f"{_crop(c['crop'], lang)}: " + ("لا حاجة للري هذا الأسبوع" if ar else "no watering needed this week"))
    if not lines:
        return None
    if plan["status"] == "short":
        lines.append(f"المياه تغطي {plan['share_pct']}% من الحاجة" if ar else f"Your water covers {plan['share_pct']}% of the need")
    title = f"خطة ري هذا الأسبوع · {plot_name}" if ar else f"This week's watering · {plot_name}"
    return title, "\n".join(lines)


async def make_notices(user_id: int, kind: str, today: dt.date, force: bool = False) -> list[Notice]:
    """Create (and push) the notices of one kind for all of a farmer's plots."""
    from . import services  # late import: services imports a lot
    out = []
    with SessionLocal() as db:
        user = db.get(User, user_id)
        if not user:
            return []
        lang = user.lang or "en"
        plots = list(db.scalars(select(Plot).where(Plot.user_id == user_id)))
        for p in plots:
            key = f"{kind}:{today.isoformat()}:{p.id}"
            if not force and db.scalar(select(Notice.id).where(Notice.user_id == user_id, Notice.key == key)):
                continue
            state = await services.plot_state(db, p)
            msg = build(kind, p.name, state["water_plan"], today, lang)
            if not msg:
                continue
            n = Notice(user_id=user_id, key=key, kind=kind, title=msg[0], body=msg[1])
            db.add(n)
            db.commit()
            out.append(n)
            await push_to_user(user_id, msg[0], msg[1])
    return out


def _due(now_local: dt.datetime, hhmm: str) -> bool:
    try:
        h, m = (int(x) for x in hhmm.split(":"))
    except ValueError:
        return False
    at = now_local.replace(hour=h, minute=m, second=0, microsecond=0)
    return at <= now_local <= at + LATE_LIMIT


def _mark(db, key: str) -> bool:
    """True the first time a key is seen (so each reminder kind runs once per day/week)."""
    if db.get(AppSetting, key):
        return False
    db.add(AppSetting(key=key, value="1"))
    db.commit()
    return True


async def tick(now_utc: dt.datetime | None = None) -> None:
    now_utc = now_utc or dt.datetime.now(dt.UTC).replace(tzinfo=None)
    with SessionLocal() as db:
        users = [(u.id, prefs_of(u)) for u in db.scalars(select(User))]
    for uid, pr in users:
        if not pr["enabled"]:
            continue
        local = now_utc + dt.timedelta(minutes=int(pr.get("tz_offset_min") or 0))
        today = local.date()
        jobs = []
        if pr["same_day"] and _due(local, pr["same_day_time"]):
            jobs.append("today")
        if pr["day_before"] and _due(local, pr["day_before_time"]):
            jobs.append("tomorrow")
        if pr["weekly"] and local.weekday() == int(pr["weekly_day"]) and _due(local, pr["weekly_time"]):
            jobs.append("week")
        for kind in jobs:
            with SessionLocal() as db:
                if not _mark(db, f"rem:{uid}:{kind}:{today.isoformat()}"):
                    continue
            try:
                await make_notices(uid, kind, today)
            except Exception:
                log.exception("reminder %s failed for user %s", kind, uid)


async def loop() -> None:
    while True:
        try:
            await tick()
        except Exception:
            log.exception("reminder tick failed")
        await asyncio.sleep(60)
