"""İhlal şiddet skoru — bbox alanı + konum heuristic (0-100)."""
from __future__ import annotations

from typing import Any


def compute_severity(detections: list[dict[str, Any]]) -> dict[str, Any]:
    if not detections:
        return {"score": 0, "level": "none", "primary_type": None}

    best = max(detections, key=lambda d: d.get("confidence", 0) * _bbox_area(d.get("bbox", [])))
    area = _bbox_area(best.get("bbox", []))
    conf = best.get("confidence", 0.5)
    # Büyük alan + yüksek güven = yüksek şiddet
    score = int(min(100, (area * 60 + conf * 40) * 100))
    if score >= 70:
        level = "critical"
    elif score >= 45:
        level = "high"
    elif score >= 25:
        level = "medium"
    else:
        level = "low"

    return {
        "score": score,
        "level": level,
        "primary_type": best.get("type"),
        "primary_label": best.get("label"),
    }


def _bbox_area(bbox: list[float]) -> float:
    if len(bbox) != 4:
        return 0.1
    x1, y1, x2, y2 = bbox
    return max(0, (x2 - x1) * (y2 - y1))
