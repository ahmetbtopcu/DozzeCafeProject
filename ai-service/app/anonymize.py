"""KVKK: YuNet (yüz) + LPD-YuNet (plaka) blur — model öncesi."""
from __future__ import annotations

import base64
import io
import logging

import cv2
import numpy as np
from PIL import Image

from app.config import FACE_MODEL, MAX_IMAGE_WIDTH, PLATE_MODEL

logger = logging.getLogger(__name__)

_face_detector = None
_plate_detector = None


def _resize_if_needed(img: np.ndarray) -> np.ndarray:
    h, w = img.shape[:2]
    if w <= MAX_IMAGE_WIDTH:
        return img
    scale = MAX_IMAGE_WIDTH / w
    return cv2.resize(img, (MAX_IMAGE_WIDTH, int(h * scale)), interpolation=cv2.INTER_AREA)


def _get_face_detector():
    global _face_detector
    if _face_detector is not None:
        return _face_detector
    if not FACE_MODEL.is_file():
        logger.warning("YuNet model missing: %s", FACE_MODEL)
        return None
    _face_detector = cv2.FaceDetectorYN.create(
        str(FACE_MODEL),
        "",
        (320, 320),
        score_threshold=0.6,
        nms_threshold=0.3,
        top_k=5000,
    )
    return _face_detector


def _get_plate_detector():
    global _plate_detector
    if _plate_detector is not None:
        return _plate_detector
    if not PLATE_MODEL.is_file():
        logger.warning("LPD-YuNet model missing: %s", PLATE_MODEL)
        return None
    _plate_detector = cv2.FaceDetectorYN.create(
        str(PLATE_MODEL),
        "",
        (320, 320),
        score_threshold=0.5,
        nms_threshold=0.3,
        top_k=5000,
    )
    return _plate_detector


def _expand_box(x: int, y: int, w: int, h: int, pad_ratio: float, img_w: int, img_h: int) -> tuple[int, int, int, int]:
    pad = int(max(w, h) * pad_ratio)
    x1 = max(0, x - pad)
    y1 = max(0, y - pad)
    x2 = min(img_w, x + w + pad)
    y2 = min(img_h, y + h + pad)
    return x1, y1, x2, y2


def _blur_region(img: np.ndarray, x1: int, y1: int, x2: int, y2: int, *, pixelate: bool = False) -> None:
    if x2 <= x1 or y2 <= y1:
        return
    roi = img[y1:y2, x1:x2]
    if roi.size == 0:
        return
    if pixelate:
        small = cv2.resize(roi, (max(1, (x2 - x1) // 12), max(1, (y2 - y1) // 12)), interpolation=cv2.INTER_LINEAR)
        img[y1:y2, x1:x2] = cv2.resize(small, (x2 - x1, y2 - y1), interpolation=cv2.INTER_NEAREST)
    else:
        img[y1:y2, x1:x2] = cv2.GaussianBlur(roi, (41, 41), 0)


def _detect_boxes(detector, img: np.ndarray) -> list[tuple[int, int, int, int]]:
    if detector is None:
        return []
    h, w = img.shape[:2]
    detector.setInputSize((w, h))
    _, faces = detector.detect(img)
    if faces is None:
        return []
    boxes: list[tuple[int, int, int, int]] = []
    for f in faces:
        x, y, bw, bh = int(f[0]), int(f[1]), int(f[2]), int(f[3])
        boxes.append((x, y, bw, bh))
    return boxes


def anonymize_image_bytes(data: bytes) -> tuple[bytes, int]:
    arr = np.frombuffer(data, dtype=np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if img is None:
        pil = Image.open(io.BytesIO(data)).convert("RGB")
        img = cv2.cvtColor(np.array(pil), cv2.COLOR_RGB2BGR)

    img = _resize_if_needed(img)
    h, w = img.shape[:2]
    blur_count = 0

    for x, y, bw, bh in _detect_boxes(_get_face_detector(), img):
        x1, y1, x2, y2 = _expand_box(x, y, bw, bh, 0.15, w, h)
        _blur_region(img, x1, y1, x2, y2, pixelate=False)
        blur_count += 1

    for x, y, bw, bh in _detect_boxes(_get_plate_detector(), img):
        x1, y1, x2, y2 = _expand_box(x, y, bw, bh, 0.10, w, h)
        _blur_region(img, x1, y1, x2, y2, pixelate=True)
        blur_count += 1

    ok, buf = cv2.imencode(".jpg", img, [int(cv2.IMWRITE_JPEG_QUALITY), 90])
    if not ok:
        raise ValueError("JPEG encode failed")
    return buf.tobytes(), blur_count


def to_base64(data: bytes) -> str:
    return base64.b64encode(data).decode("ascii")
