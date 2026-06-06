"""İhlal tespiti — CLIP sahne doğrulaması + türe özel dedektörler.

Akış (iki aşamalı doğrulama):
  1. CLIP resmin sahnesini sınıflandırır → kaldırım / yol / çöp / yok.
  2. Yalnızca o türe ait dedektör çalışır ve doğrular:
       - sidewalk_occupation → YOLO-World araç tespiti
       - road_damage         → RDD2022 uzman modeli
       - garbage_pile        → fine-tune çöp modeli (varsa)
  3. Dedektör doğrularsa kesin sonuç; doğrulayamaz ama CLIP çok eminse
     CLIP-temelli (tam-kare) sonuç döner.
CLIP yoksa eski "araç kapısı" mantığına düşülür.
"""
from __future__ import annotations

import io
import logging
from concurrent.futures import ThreadPoolExecutor, TimeoutError as FuturesTimeout
from typing import Any

from PIL import Image

from app.config import (
    CLIP_MIN_CONF,
    CLIP_STRONG_CONF,
    DEMO_MODE,
    DETECT_GATE_CONF,
    DETECT_TIMEOUT_SEC,
    SPECIALIST_GARBAGE_CONF,
    SPECIALIST_ROAD_CONF,
    VIOLATION_CLASSES,
    YOLO_CONF,
    YOLO_IMGSZ,
    YOLO_WORLD_MODEL,
)

logger = logging.getLogger(__name__)

_yolo_model = None
_executor = ThreadPoolExecutor(max_workers=1)

# YOLO-World prompt -> ihlal türü.
# Deneyle doğrulandı: düz araç promptları gerçek araçlarda 0.45-0.60, çöp/çukur
# görsellerinde 0.00 verir (temiz ayrım). "car on sidewalk" gibi qualifier'lı
# promptlar gürültülü olduğundan kullanılmaz. Kullanıcı kaldırım ihlali fotoğrafı
# yüklediği için tespit edilen araç = kaldırım işgali kabul edilir.
# Çukur ve çöp uzman modellere bırakılır (YOLO-World bu sınıflarda güvenilmez).
CLASS_MAP = {
    "car": "sidewalk_occupation",
    "parked car": "sidewalk_occupation",
    "van": "sidewalk_occupation",
    "truck": "sidewalk_occupation",
    "motorcycle": "sidewalk_occupation",
}

PROMPTS = list(CLASS_MAP.keys())


def _get_yolo():
    global _yolo_model
    if _yolo_model is not None:
        return _yolo_model
    if DEMO_MODE:
        return None
    try:
        from ultralytics import YOLOWorld

        weights = str(YOLO_WORLD_MODEL) if YOLO_WORLD_MODEL.is_file() else "yolov8s-worldv2.pt"
        model = YOLOWorld(weights)
        model.set_classes(PROMPTS)
        _yolo_model = model
        return model
    except Exception as exc:
        logger.warning("YOLO-World load failed: %s", exc)
        return None


def _class_name(model, cls_id: int) -> str:
    names = getattr(model, "names", None)
    if isinstance(names, dict):
        return names.get(cls_id, str(cls_id))
    if isinstance(names, (list, tuple)) and 0 <= cls_id < len(names):
        return names[cls_id]
    return str(cls_id)


def _yolo_world_detect(image_bytes: bytes) -> list[dict[str, Any]]:
    """YOLO-World: kaldırım işgali (araç). Tanınmayan sınıf atlanır."""
    model = _get_yolo()
    if model is None:
        return []

    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")

    import os
    import tempfile

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
    for r in results:
        if r.boxes is None:
            continue
        h, w = r.orig_shape
        for box in r.boxes:
            name = _class_name(model, int(box.cls[0]))
            vtype = CLASS_MAP.get(name)
            if vtype is None:
                continue  # tanınmayan sınıfı sidewalk'a zorlama
            x1, y1, x2, y2 = box.xyxy[0].tolist()
            detections.append(
                {
                    "type": vtype,
                    "label": VIOLATION_CLASSES.get(vtype, name),
                    "confidence": float(box.conf[0]),
                    "bbox": [x1 / w, y1 / h, x2 / w, y2 / h],
                }
            )
    return detections


def _run_detector_for(vtype: str, image_bytes: bytes) -> list[dict[str, Any]]:
    """CLIP'in seçtiği türe ait dedektörü çalıştırır + güven eşiğiyle filtreler."""
    if vtype == "sidewalk_occupation":
        return _yolo_world_detect(image_bytes)

    from app import detect_specialists

    if vtype == "road_damage":
        dets = detect_specialists.detect_pothole(image_bytes)
        return [d for d in dets if d.get("confidence", 0.0) >= SPECIALIST_ROAD_CONF]
    if vtype == "garbage_pile":
        dets = detect_specialists.detect_litter(image_bytes)
        return [d for d in dets if d.get("confidence", 0.0) >= SPECIALIST_GARBAGE_CONF]
    return []


def _clip_gated_specialists(image_bytes: bytes) -> list[dict[str, Any]]:
    """Araç yokken: CLIP sahneyi belirler → yalnızca ilgili uzman model doğrular.

    CLIP yoksa her iki uzman modeli de dener (eski davranış).
    """
    from app import clip_router

    scene = clip_router.classify_scene(image_bytes)

    if scene is None:
        # CLIP yok → yol + çöp uzman modellerini dene
        out: list[dict[str, Any]] = []
        try:
            from app import detect_specialists

            road = detect_specialists.detect_pothole(image_bytes)
            garbage = detect_specialists.detect_litter(image_bytes)
            out += [d for d in road if d.get("confidence", 0.0) >= SPECIALIST_ROAD_CONF]
            out += [d for d in garbage if d.get("confidence", 0.0) >= SPECIALIST_GARBAGE_CONF]
        except Exception as exc:
            logger.warning("specialist detect failed: %s", exc)
        return out

    # CLIP yalnızca uzman-model türlerini yönlendirir (kaldırım YOLO-World'de).
    cands = {k: v for k, v in scene.items() if k in ("road_damage", "garbage_pile")}
    if not cands:
        return []
    top_type = max(cands, key=cands.get)
    top_score = cands[top_type]
    none_score = scene.get("none", 0.0)

    if top_score < CLIP_MIN_CONF or (none_score > top_score and top_score < CLIP_STRONG_CONF):
        logger.info("CLIP: ihlal yok (top=%s %.2f, none=%.2f)", top_type, top_score, none_score)
        return []

    dets = _run_detector_for(top_type, image_bytes)
    if dets:
        for d in dets:
            d["clip_score"] = round(top_score, 3)
        return dets

    # Dedektör doğrulayamadı ama CLIP çok emin → CLIP-temelli sonuç (tam kare bbox).
    if top_score >= CLIP_STRONG_CONF:
        logger.info("CLIP-only tespit: %s %.2f", top_type, top_score)
        return [
            {
                "type": top_type,
                "label": VIOLATION_CLASSES[top_type],
                "confidence": round(top_score, 3),
                "bbox": [0.0, 0.0, 1.0, 1.0],
                "source": "clip",
                "clip_score": round(top_score, 3),
            }
        ]
    return []


def _detect_sync(image_bytes: bytes) -> list[dict[str, Any]]:
    """Hibrit: güvenilir araç tespiti her zaman + CLIP-kapılı uzman modeller.

    1. YOLO-World araç tespiti (kaldırım) — düşük yanlış pozitif, hep çalışır.
       Güçlü araç bulunursa kesin kaldırım işgali → uzman modellere gerek yok.
    2. Araç yoksa CLIP sahneyi belirler ve yalnızca ilgili uzman model (yol/çöp)
       çalışıp doğrular (gürültülü modellerin yanlış sahnede ateşlemesi önlenir).
    """
    detections: list[dict[str, Any]] = []
    detections += _yolo_world_detect(image_bytes)
    vehicle_strong = any(d.get("confidence", 0.0) >= DETECT_GATE_CONF for d in detections)

    if not vehicle_strong:
        detections += _clip_gated_specialists(image_bytes)

    detections.sort(key=lambda d: d.get("confidence", 0.0), reverse=True)
    return detections


def detect_violations(image_bytes: bytes) -> list[dict[str, Any]]:
    """İhlal tespiti — CLIP sahne doğrulaması + türe özel dedektör.

    DEMO_MODE=true ise boş döner (caller cache fallback kullanır).
    """
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
