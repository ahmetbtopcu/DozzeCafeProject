"""Hackathon sonrası — görev bazlı uzman modeller (ENABLE_SPECIALIST_MODELS=true)."""
from __future__ import annotations

import io
import logging
from typing import Any

from PIL import Image

from app.config import ENABLE_SPECIALIST_MODELS, VIOLATION_CLASSES, YOLO_CONF, YOLO_IMGSZ

logger = logging.getLogger(__name__)

_specialists: dict[str, Any] = {}

# Hugging Face model ID'leri — Standard tier'da indirilir
SPECIALIST_MODELS = {
    "pothole": "keremberke/yolov8s-pothole-segmentation",
    "litter": "Alope/trash-detection-yolo11n",
}


def _load_specialist(task: str):
    if not ENABLE_SPECIALIST_MODELS:
        return None
    if task in _specialists:
        return _specialists[task]
    model_id = SPECIALIST_MODELS.get(task)
    if not model_id:
        return None
    try:
        from huggingface_hub import hf_hub_download
        from ultralytics import YOLO

        path = hf_hub_download(repo_id=model_id, filename="best.pt")
        model = YOLO(path)
        _specialists[task] = model
        return model
    except Exception as exc:
        logger.warning("specialist %s load failed: %s", task, exc)
        return None


def detect_pothole(image_bytes: bytes) -> list[dict[str, Any]]:
    model = _load_specialist("pothole")
    if model is None:
        return []
    return _run_yolo(model, image_bytes, "road_damage")


def detect_litter(image_bytes: bytes) -> list[dict[str, Any]]:
    model = _load_specialist("litter")
    if model is None:
        return []
    return _run_yolo(model, image_bytes, "garbage_pile")


def _run_yolo(model, image_bytes: bytes, violation_type: str) -> list[dict[str, Any]]:
    import tempfile
    import os

    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as f:
        img.save(f, format="JPEG")
        path = f.name
    try:
        results = model.predict(path, conf=YOLO_CONF, imgsz=YOLO_IMGSZ, verbose=False)
    finally:
        try:
            os.unlink(path)
        except OSError:
            pass

    detections: list[dict[str, Any]] = []
    label = VIOLATION_CLASSES.get(violation_type, violation_type)
    for r in results:
        if r.boxes is None:
            continue
        h, w = r.orig_shape
        for box in r.boxes:
            x1, y1, x2, y2 = box.xyxy[0].tolist()
            detections.append(
                {
                    "type": violation_type,
                    "label": label,
                    "confidence": float(box.conf[0]),
                    "bbox": [x1 / w, y1 / h, x2 / w, y2 / h],
                }
            )
    return detections
