"""No sign-in: each phone or browser is identified by a random key it keeps itself.

The app creates a long random "farm key" on first use and sends it as the X-Farm-Key header.
The server stores only its SHA-256 hash and creates the farmer's workspace on first sight.
Showing the key in the app lets a farmer open the same farms on another device.
"""
from __future__ import annotations

import hashlib

from fastapi import Depends, Header, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from .db import User, get_db

MIN_KEY_LEN = 24


def key_hash(key: str) -> str:
    return hashlib.sha256(key.strip().encode()).hexdigest()


def current_user(x_farm_key: str | None = Header(default=None), db: Session = Depends(get_db)) -> User:
    key = (x_farm_key or "").strip()
    if len(key) < MIN_KEY_LEN or len(key) > 200:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Missing or invalid farm key.")
    h = key_hash(key)
    user = db.scalar(select(User).where(User.device_key == h))
    if user is None:
        user = User(email=f"device-{h[:24]}@farmstudio.local", name="", password_hash="", device_key=h)
        db.add(user)
        try:
            db.commit()
        except IntegrityError:  # the same device sent two first requests at once
            db.rollback()
            user = db.scalar(select(User).where(User.device_key == h))
        db.refresh(user)
    return user
