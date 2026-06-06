"""İhlal tespiti — YOLO-World (varsa) veya heuristic fallback."""
from __future__ import annotations

import io
from typing import Any

import numpy as np
from PIL import Image

from app.config import VIOLATION_CLASSES

_yolo_model = None


def _get_yolo():
    global _yolo_model
    if _yolo_model is not None:
        return _yolo_model
    try:
        from ultralytics import YOLOWorld

        model = YOLOWorld("yolov8s-world.pt")
        model.set_classes(
            [
                "car parked on sidewalk",
                "garbage pile on street",
                "broken traffic sign",
                "pothole on road",
                "construction debris",
                "table on sidewalk",
            ]
        )
        _yolo_model = model
        return model
    except Exception:
        return None


CLASS_MAP = {
    "car parked on sidewalk": "sidewalk_occupation",
    "table on sidewalk": "sidewalk_occupation",
    "garbage pile on street": "garbage_pile",
    "construction debris": "garbage_pile",
    "broken traffic sign": "broken_sign",
    "pothole on road": "road_damage",
}


def _heuristic_detect(img: Image.Image) -> list[dict[str, Any]]:
    """Model yoksa demo için basit renk/kenar heuristic."""
    w, h = img.size
    arr = np.array(img.convert("L"))
    # Alt yarıda koyu büyük alan → olası araç/işgal
    lower = arr[int(h * 0.4) :, :]
    dark_ratio = (lower < 80).mean()
    detections: list[dict[str, Any]] = []
    if dark_ratio > 0.25:
        detections.append(
            {
                "type": "sidewalk_occupation",
                "label": VIOLATION_CLASSES["sidewalk_occupation"],
                "confidence": min(0.65 + dark_ratio * 0.2, 0.92),
                "bbox": [0.1, 0.45, 0.9, 0.95],
            }
        )
    return detections


def detect_violations(image_bytes: bytes) -> list[dict[str, Any]]:
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    model = _get_yolo()
    if model is None:
        return _heuristic_detect(img)

    import tempfile

    with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as f:
        img.save(f, format="JPEG")
        path = f.name

    try:
        results = model.predict(path, conf=0.25, verbose=False)
    finally:
        import os

        try:
            os.unlink(path)
        except OSError:
            pass

    detections: list[dict[str, Any]] = []
    for r in results:
        if r.boxes is None:
            continue
        h, w = r.orig_shape
        for box in r.boxes:
            cls_id = int(box.cls[0])
            name = model.names.get(cls_id, str(cls_id))
            vtype = CLASS_MAP.get(name, "sidewalk_occupation")
            x1, y1, x2, y2 = box.xyxy[0].tolist()
            detections.append(
                {
                    "type": vtype,
                    "label": VIOLATION_CLASSES.get(vtype, name),
                    "confidence": float(box.conf[0]),
                    "bbox": [x1 / w, y1 / h, x2 / w, y2 / h],
                }
            )

    if not detections:
        detections = _heuristic_detect(img)
    return detections
