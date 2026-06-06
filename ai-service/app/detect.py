"""İhlal tespiti — YOLO-World-S @320 veya demo cache fallback."""
from __future__ import annotations

import io
import logging
from concurrent.futures import ThreadPoolExecutor, TimeoutError as FuturesTimeout
from typing import Any

import numpy as np
from PIL import Image

from app.config import DEMO_MODE, DETECT_TIMEOUT_SEC, VIOLATION_CLASSES, YOLO_CONF, YOLO_IMGSZ

logger = logging.getLogger(__name__)

_yolo_model = None
_executor = ThreadPoolExecutor(max_workers=1)

CLASS_MAP = {
    "car parked on sidewalk": "sidewalk_occupation",
    "table on sidewalk": "sidewalk_occupation",
    "garbage pile on street": "garbage_pile",
    "construction debris": "garbage_pile",
    "broken traffic sign": "broken_sign",
    "pothole on road": "road_damage",
}

PROMPTS = [
    "car parked on sidewalk",
    "garbage pile on street",
    "broken traffic sign",
    "pothole on road",
    "construction debris",
    "table on sidewalk",
]


def _get_yolo():
    global _yolo_model
    if _yolo_model is not None:
        return _yolo_model
    if DEMO_MODE:
        return None
    try:
        from ultralytics import YOLOWorld

        model = YOLOWorld("yolov8s-worldv2.pt")
        model.set_classes(PROMPTS)
        _yolo_model = model
        return model
    except Exception as exc:
        logger.warning("YOLO-World load failed: %s", exc)
        return None


def _heuristic_detect(img: Image.Image) -> list[dict[str, Any]]:
    w, h = img.size
    arr = np.array(img.convert("L"))
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


def _detect_sync(image_bytes: bytes) -> list[dict[str, Any]]:
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    model = _get_yolo()
    if model is None:
        return _heuristic_detect(img)

    import tempfile
    import os

    with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as f:
        img.save(f, format="JPEG")
        path = f.name

    try:
        results = model.predict(
            path,
            conf=YOLO_CONF,
            imgsz=YOLO_IMGSZ,
            verbose=False,
        )
    finally:
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


def detect_violations(image_bytes: bytes) -> list[dict[str, Any]]:
    """Tespit — timeout sonrası boş liste (caller cache fallback kullanır)."""
    if DEMO_MODE:
        return []

    fut = _executor.submit(_detect_sync, image_bytes)
    try:
        return fut.result(timeout=DETECT_TIMEOUT_SEC)
    except FuturesTimeout:
        logger.warning("detect timeout after %ss", DETECT_TIMEOUT_SEC)
        return []
    except Exception as exc:
        logger.warning("detect failed: %s", exc)
        return []
