"""Demo modu — cache'li örnekler (offline/jüri fallback)."""
from __future__ import annotations

import json
import random
from typing import Any

from app.config import DEMO_CACHE
from app.petition import _template_petition
from app.authority import route_authority

_cache: dict | None = None


def _load() -> dict:
    global _cache
    if _cache is None:
        _cache = json.loads(DEMO_CACHE.read_text(encoding="utf-8"))
    return _cache


def get_demo_pipeline(
    image_base64: str = "",
    blur_count: int = 2,
) -> dict[str, Any]:
    samples = _load()["samples"]
    sample = random.choice(samples)
    auth = route_authority(sample["violation_type"], sample["lat"], sample["lng"])
    if sample.get("authority"):
        auth = {**auth, **sample["authority"]}
    petition = _template_petition(
        sample["violation_type"],
        auth,
        [{"heading": "Demo", "text": sample["petition_snippet"], "source": "cache"}],
        sample["lat"],
        sample["lng"],
        sample["severity"],
    )
    return {
        "image_base64": image_base64 or sample.get("image_base64", ""),
        "blur_count": blur_count,
        "detections": sample["detections"],
        "severity": sample["severity"],
        "demo_id": sample["id"],
        "demo": True,
        "petition": petition,
        "authority": auth,
        "violation_type": sample["violation_type"],
        "violation_label": sample["violation_label"],
    }


def demo_detections_from_cache() -> tuple[list[dict[str, Any]], dict[str, Any]]:
    """Cache'den tespit + şiddet (blur sonrası fallback)."""
    d = get_demo_pipeline()
    return d["detections"], d["severity"]
