"""Minimal Web Push sender (RFC 8291 message encryption + RFC 8292 VAPID), using only `cryptography`.

Phones and browsers give the app a push subscription (endpoint + p256dh + auth keys). To notify,
we encrypt the message for that browser with aes128gcm and POST it to the endpoint with a signed
VAPID header that proves which server sent it.
"""
from __future__ import annotations

import base64
import json
import os
import struct
import time
from urllib.parse import urlsplit

from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives.asymmetric.utils import decode_dss_signature
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.hkdf import HKDF


def b64u(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode().rstrip("=")


def unb64u(s: str) -> bytes:
    return base64.urlsafe_b64decode(s + "=" * (-len(s) % 4))


def new_vapid_key() -> str:
    """A new P-256 private key as PEM text."""
    key = ec.generate_private_key(ec.SECP256R1())
    return key.private_bytes(serialization.Encoding.PEM, serialization.PrivateFormat.PKCS8,
                             serialization.NoEncryption()).decode()


def _load(pem: str) -> ec.EllipticCurvePrivateKey:
    return serialization.load_pem_private_key(pem.encode(), password=None)  # type: ignore[return-value]


def public_key_b64(pem: str) -> str:
    """Application server key for PushManager.subscribe (uncompressed point, base64url)."""
    pub = _load(pem).public_key().public_bytes(serialization.Encoding.X962, serialization.PublicFormat.UncompressedPoint)
    return b64u(pub)


def vapid_header(endpoint: str, pem: str, subject: str, ttl_s: int = 12 * 3600) -> str:
    parts = urlsplit(endpoint)
    claims = {"aud": f"{parts.scheme}://{parts.netloc}", "exp": int(time.time()) + ttl_s, "sub": subject}
    signing_input = (b64u(json.dumps({"typ": "JWT", "alg": "ES256"}, separators=(",", ":")).encode()) + "."
                     + b64u(json.dumps(claims, separators=(",", ":")).encode()))
    der = _load(pem).sign(signing_input.encode(), ec.ECDSA(hashes.SHA256()))
    r, s = decode_dss_signature(der)
    jwt = signing_input + "." + b64u(r.to_bytes(32, "big") + s.to_bytes(32, "big"))
    return f"vapid t={jwt}, k={public_key_b64(pem)}"


def _hkdf(salt: bytes, ikm: bytes, info: bytes, length: int) -> bytes:
    return HKDF(algorithm=hashes.SHA256(), length=length, salt=salt, info=info).derive(ikm)


def encrypt(payload: bytes, p256dh: str, auth: str, salt: bytes | None = None,
            server_key: ec.EllipticCurvePrivateKey | None = None) -> bytes:
    """aes128gcm body (RFC 8188 header + one record) for a browser's keys."""
    ua_pub_bytes = unb64u(p256dh)
    auth_secret = unb64u(auth)
    ua_pub = ec.EllipticCurvePublicKey.from_encoded_point(ec.SECP256R1(), ua_pub_bytes)
    as_key = server_key or ec.generate_private_key(ec.SECP256R1())
    as_pub_bytes = as_key.public_key().public_bytes(serialization.Encoding.X962, serialization.PublicFormat.UncompressedPoint)
    shared = as_key.exchange(ec.ECDH(), ua_pub)
    ikm = _hkdf(auth_secret, shared, b"WebPush: info\x00" + ua_pub_bytes + as_pub_bytes, 32)
    salt = salt or os.urandom(16)
    cek = _hkdf(salt, ikm, b"Content-Encoding: aes128gcm\x00", 16)
    nonce = _hkdf(salt, ikm, b"Content-Encoding: nonce\x00", 12)
    record = AESGCM(cek).encrypt(nonce, payload + b"\x02", None)
    header = salt + struct.pack("!I", 4096) + bytes([len(as_pub_bytes)]) + as_pub_bytes
    return header + record


def decrypt(body: bytes, ua_key: ec.EllipticCurvePrivateKey, auth: str) -> bytes:
    """The browser side of `encrypt` (used by the tests to prove the encryption is correct)."""
    salt, idlen = body[:16], body[20]
    as_pub_bytes = body[21:21 + idlen]
    ciphertext = body[21 + idlen:]
    ua_pub_bytes = ua_key.public_key().public_bytes(serialization.Encoding.X962, serialization.PublicFormat.UncompressedPoint)
    as_pub = ec.EllipticCurvePublicKey.from_encoded_point(ec.SECP256R1(), as_pub_bytes)
    shared = ua_key.exchange(ec.ECDH(), as_pub)
    ikm = _hkdf(unb64u(auth), shared, b"WebPush: info\x00" + ua_pub_bytes + as_pub_bytes, 32)
    cek = _hkdf(salt, ikm, b"Content-Encoding: aes128gcm\x00", 16)
    nonce = _hkdf(salt, ikm, b"Content-Encoding: nonce\x00", 12)
    plain = AESGCM(cek).decrypt(nonce, ciphertext, None)
    return plain.rstrip(b"\x00")[:-1]  # drop padding and the 0x02 delimiter
