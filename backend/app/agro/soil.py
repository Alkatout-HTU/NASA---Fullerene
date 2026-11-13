"""Soil texture classes and water holding (FAO-56 Table 19 midpoints)."""
from __future__ import annotations

# θFC and θWP (m³/m³) midpoints from FAO-56 Table 19.
TEXTURE = {
    "sand": (0.12, 0.045), "loamy_sand": (0.14, 0.055), "sandy_loam": (0.23, 0.10),
    "loam": (0.25, 0.10), "silt_loam": (0.29, 0.13), "silt": (0.32, 0.15),
    "silty_clay_loam": (0.34, 0.185), "silty_clay": (0.36, 0.21), "clay": (0.36, 0.205),
    "sandy_clay_loam": (0.27, 0.13), "clay_loam": (0.31, 0.16), "sandy_clay": (0.32, 0.18),
}
# User-facing choices on the onboarding form map onto a texture class.
USER_CHOICES = {"loam": "loam", "clay": "clay", "sandy": "sandy_loam", "calc": "loam"}
NAMES = {
    "sand": ("Sand", "رملية"), "loamy_sand": ("Loamy sand", "رملية طميية"), "sandy_loam": ("Sandy loam", "طميية رملية"),
    "loam": ("Loam", "طميية"), "silt_loam": ("Silt loam", "طميية سلتية"), "silt": ("Silt", "سلتية"),
    "silty_clay_loam": ("Silty clay loam", "طميية طينية سلتية"), "silty_clay": ("Silty clay", "طينية سلتية"),
    "clay": ("Clay", "طينية"), "sandy_clay_loam": ("Sandy clay loam", "طميية طينية رملية"),
    "clay_loam": ("Clay loam", "طميية طينية"), "sandy_clay": ("Sandy clay", "طينية رملية"),
}


def classify(sand: float, clay: float, silt: float | None = None) -> str:
    """USDA texture triangle."""
    silt = 100 - sand - clay if silt is None else silt
    if silt + 1.5 * clay < 15:
        return "sand"
    if silt + 1.5 * clay >= 15 and silt + 2 * clay < 30:
        return "loamy_sand"
    if clay >= 40:
        if silt >= 40:
            return "silty_clay"
        if sand > 45:
            return "sandy_clay"
        return "clay"
    if clay >= 35 and sand > 45:
        return "sandy_clay"
    if 27 <= clay < 40:
        if sand > 20 and sand <= 45:
            return "clay_loam"
        if sand <= 20:
            return "silty_clay_loam"
    if 20 <= clay < 35 and silt < 28 and sand > 45:
        return "sandy_clay_loam"
    if 7 <= clay < 27 and 28 <= silt < 50 and sand <= 52:
        return "loam"
    if silt >= 80 and clay < 12:
        return "silt"
    if (silt >= 50 and 12 <= clay < 27) or (50 <= silt < 80 and clay < 12):
        return "silt_loam"
    return "sandy_loam"


def group(texture: str) -> str:
    """Coarse group used by crop rules: sand | loam | clay."""
    if texture in ("sand", "loamy_sand", "sandy_loam"):
        return "sand"
    if texture in ("clay", "silty_clay", "sandy_clay"):
        return "clay"
    return "loam"


def awc_mm_per_m(texture: str) -> float:
    fc, wp = TEXTURE.get(texture, TEXTURE["loam"])
    return (fc - wp) * 1000


def fc_wp(texture: str) -> tuple[float, float]:
    return TEXTURE.get(texture, TEXTURE["loam"])
