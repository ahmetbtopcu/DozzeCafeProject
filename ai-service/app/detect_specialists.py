"""Görev bazlı uzman modeller.

- road: RDD2022 YOLOv8 (ozair23) — çukur + çatlak (road_damage). HF'den indirilir.
- garbage: fine-tune edilmiş yerel model (garbage_finetuned.pt). Yoksa çalışmaz.
CLIP yönlendiricisi sahneyi belirledikten sonra yalnızca ilgili model çalışır.

Not: Hazır atık-ayrıştırma modelleri (cam/kağıt/plastik) sokak çöp yığını için
güvenilmez (çukuru çöp sanıyor), bu yüzden çöp fine-tune'a bırakıldı.
Bkz. scripts/finetune/README.md
"""
from __future__ import annotations

import io
import logging
from typing import Any

from PIL import Image

from app.config import (
    ENABLE_GARBAGE_SPECIALIST,
    ENABLE_SPECIALIST_MODELS,
    GARBAGE_MODEL,
    ROAD_DAMAGE_MODEL,
    VIOLATION_CLASSES,
    YOLO_CONF,
    YOLO_IMGSZ,
)

logger = logging.getLogger(__name__)

_specialists: dict[str, Any] = {}

# task -> (huggingface_repo_id | None, yerel ağırlık yolu, flag)
# repo_id None ise model yalnızca yerel dosyadan yüklenir (fine-tune sonrası).
SPECIALIST_SPECS = {
    "road": ("ozair23/yolov8-road-damage-detector", ROAD_DAMAGE_MODEL, ENABLE_SPECIALIST_MODELS),
    "garbage": (None, GARBAGE_MODEL, ENABLE_GARBAGE_SPECIALIST),
}


def _load_specialist(task: str):
    spec = SPECIALIST_SPECS.get(task)
    if not spec:
        return None
    repo_id, local_path, enabled = spec
    if not enabled:
        return None
    if task in _specialists:
        return _specialists[task]
    try:
        from ultralytics import YOLO

        if local_path.is_file():
            model = YOLO(str(local_path))
        elif repo_id:
            from huggingface_hub import hf_hub_download

            path = hf_hub_download(repo_id=repo_id, filename="best.pt")
            model = YOLO(path)
        else:
            logger.warning("specialist %s: ağırlık yok (%s) — fine-tune gerekli", task, local_path)
            return None
        _specialists[task] = model
        return model
    except Exception as exc:
        logger.warning("specialist %s load failed: %s", task, exc)
        return None


def detect_pothole(image_bytes: bytes) -> list[dict[str, Any]]:
    model = _load_specialist("road")
    if model is None:
        return []
    return _run_yolo(model, image_bytes, "road_damage")


def detect_litter(image_bytes: bytes) -> list[dict[str, Any]]:
    model = _load_specialist("garbage")
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
