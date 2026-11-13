"""Turn what a farmer types ("tomatoes, عنب و زيتون") into crop ids, tolerating plurals,
Arabic spelling variants and small typos."""
from __future__ import annotations

import difflib
import re

from .crops import CROPS

# Extra names people use in Jordan (English and Arabic, incl. dialect). Crop en/ar names are added automatically.
SYNONYMS: dict[str, tuple[str, ...]] = {
    "tomato": ("tomato", "tomatoes", "طماطم", "بندوره"),
    "cucumber": ("cucumber", "cucumbers", "خيار", "قثاء"),
    "pepper": ("pepper", "peppers", "bell pepper", "chili", "chilli", "hot pepper", "فلفل حلو", "فلفل حار", "فليفله"),
    "eggplant": ("eggplant", "aubergine", "brinjal", "باذنجان", "بيتنجان"),
    "watermelon": ("watermelon", "melon", "melons", "بطيخ", "شمام", "بطيخ احمر"),
    "potato": ("potato", "potatoes", "بطاطا", "بطاطس"),
    "onion": ("onion", "onions", "بصل"),
    "wheat": ("wheat", "قمح", "حنطه"),
    "barley": ("barley", "شعير"),
    "sorghum": ("sorghum", "ذره بيضاء", "ذره رفيعه"),
    "maize": ("maize", "corn", "sweet corn", "ذره", "ذره صفراء"),
    "chickpea": ("chickpea", "chickpeas", "garbanzo", "حمص"),
    "lentil": ("lentil", "lentils", "عدس"),
    "grape": ("grape", "grapes", "vine", "vineyard", "عنب", "كرمه", "كروم"),
    "olive": ("olive", "olives", "زيتون"),
    "date": ("date", "dates", "date palm", "palm", "نخيل", "نخله", "تمر", "بلح"),
    "citrus": ("citrus", "orange", "oranges", "lemon", "lemons", "mandarin", "clementine", "grapefruit",
               "حمضيات", "برتقال", "ليمون", "مندلينا", "يوسفي", "كلمنتينا", "جريب فروت"),
    "squash": ("squash", "zucchini", "courgette", "marrow", "كوسا", "كوسه", "قرع"),
    "cabbage": ("cabbage", "ملفوف", "كرنب"),
    "cauliflower": ("cauliflower", "زهره", "قرنبيط"),
    "lettuce": ("lettuce", "خس"),
    "beans": ("beans", "green beans", "bean", "فاصوليا", "فاصولياء", "لوبيا"),
    "faba": ("broad beans", "broad bean", "faba", "fava", "fava beans", "فول", "فول اخضر"),
    "okra": ("okra", "بامية", "بامي"),
    "garlic": ("garlic", "ثوم"),
    "carrot": ("carrot", "carrots", "جزر"),
    "spinach": ("spinach", "سبانخ"),
    "strawberry": ("strawberry", "strawberries", "فراوله", "فريز"),
    "pomegranate": ("pomegranate", "pomegranates", "رمان"),
    "fig": ("fig", "figs", "تين"),
    "almond": ("almond", "almonds", "لوز"),
    "apple": ("apple", "apples", "تفاح"),
    "stonefruit": ("peach", "peaches", "apricot", "apricots", "plum", "plums", "nectarine", "stone fruit",
                   "دراق", "خوخ", "مشمش", "برقوق", "نكترين"),
    "banana": ("banana", "bananas", "موز"),
}

_AR_DIACRITICS = re.compile(r"[ؐ-ًؚ-ٰٟۖ-ۭـ]")


def normalise(s: str) -> str:
    s = _AR_DIACRITICS.sub("", s.strip().lower())
    s = (s.replace("أ", "ا").replace("إ", "ا").replace("آ", "ا").replace("ة", "ه").replace("ى", "ي")
          .replace("ؤ", "و").replace("ئ", "ي"))
    s = re.sub(r"[^\w\s]", " ", s)
    words = [w[2:] if w.startswith("ال") and len(w) > 3 else w for w in s.split()]
    return " ".join(words)


def _index() -> dict[str, str]:
    idx: dict[str, str] = {}
    for cid, c in CROPS.items():
        for name in (c.en, c.ar, *SYNONYMS.get(cid, ())):
            idx[normalise(name)] = cid
            for part in re.split(r"[&/]| and | و", name):
                if part.strip():
                    idx.setdefault(normalise(part), cid)
    return idx


INDEX = _index()


def split_text(text: str) -> list[str]:
    parts = re.split(r"[,\n،;؛/+|]|\s+and\s+|\s+و\s+|\s+&\s+", text)
    out = []
    for p in parts:
        p = p.strip(" .-\t")
        if p:
            out.append(p[:60])
    return out[:20]


def match_one(term: str) -> str | None:
    n = normalise(term)
    if not n:
        return None
    if n in INDEX:
        return INDEX[n]
    # Arabic conjunction stuck to the word: "وعنب"
    if n.startswith("و") and n[1:] in INDEX:
        return INDEX[n[1:]]
    # English plural forms not listed
    for cand in (n.rstrip("s"), n[:-2] if n.endswith("es") else None):
        if cand and cand in INDEX:
            return INDEX[cand]
    close = difflib.get_close_matches(n, list(INDEX), n=1, cutoff=0.8)
    return INDEX[close[0]] if close else None


def parse(text: str) -> list[dict]:
    """[{"text": what the farmer wrote, "crop": id or None}] with duplicates removed."""
    seen: set[str] = set()
    out = []
    terms: list[str] = []
    for term in split_text(text or ""):
        if match_one(term) is None and len(term.split()) > 1:
            words = term.split()
            hits = [match_one(w) for w in words]
            if any(hits):  # "عنب وزيتون", "tomatoes potatoes"
                terms.extend(words)
                continue
        terms.append(term)
    for term in terms:
        cid = match_one(term)
        if cid and cid in seen:
            continue
        if cid:
            seen.add(cid)
            if normalise(term) not in INDEX and term.startswith("و") and match_one(term[1:]) == cid:
                term = term[1:]  # "وزيتون" -> "زيتون"
        out.append({"text": term, "crop": cid})
    return out
