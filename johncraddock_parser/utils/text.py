"""Text helpers."""

from __future__ import annotations

import re
from typing import Iterable, List, Optional

from config import KNOWN_BRAND_TOKENS


def clean_ws(value: Optional[str]) -> str:
    if not value:
        return ""
    return re.sub(r"\s+", " ", value).strip()


def infer_brand(name: str) -> str:
    """Return manufacturer brand only when a known token appears in the name."""
    if not name:
        return ""
    lower = name.lower()
    for token in sorted(KNOWN_BRAND_TOKENS, key=len, reverse=True):
        if token.lower() in lower:
            return token
    return ""


def unique_preserve(items: Iterable[str]) -> List[str]:
    seen = set()
    out: List[str] = []
    for item in items:
        item = clean_ws(item)
        if not item or item in seen:
            continue
        seen.add(item)
        out.append(item)
    return out


def schema_availability(value: str) -> str:
    value = clean_ws(value)
    if not value:
        return ""
    if "/" in value:
        value = value.rstrip("/").split("/")[-1]
    return value
