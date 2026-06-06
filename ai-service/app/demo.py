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


def get_demo_pipeline() -> dict[str, Any]:
    samples = _load()["samples"]
    sample = random.choice(samples)
    auth = route_authority(sample["violation_type"], sample["lat"], sample["lng"])
    petition = _template_petition(
        sample["violation_type"],
        auth,
        [{"heading": "Demo", "text": sample["petition_snippet"], "source": "cache"}],
        sample["lat"],
        sample["lng"],
        sample["severity"],
    )
    return {
        "image_base64": "",
        "blur_count": 2,
        "detections": sample["detections"],
        "severity": sample["severity"],
        "demo_id": sample["id"],
        "petition": petition,
        "authority": auth,
        "violation_type": sample["violation_type"],
        "violation_label": sample["violation_label"],
    }
