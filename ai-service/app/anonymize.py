"""KVKK: yüz ve plaka alanlarını bulanıklaştır (model öncesi)."""
from __future__ import annotations

import base64
import io

import cv2
import numpy as np
from PIL import Image


def _blur_region(img: np.ndarray, x1: int, y1: int, x2: int, y2: int, k: int = 31) -> None:
    h, w = img.shape[:2]
    x1, y1 = max(0, x1), max(0, y1)
    x2, y2 = min(w, x2), min(h, y2)
    if x2 <= x1 or y2 <= y1:
        return
    roi = img[y1:y2, x1:x2]
    if roi.size == 0:
        return
    k = k if k % 2 == 1 else k + 1
    img[y1:y2, x1:x2] = cv2.GaussianBlur(roi, (k, k), 0)


def anonymize_image_bytes(data: bytes) -> tuple[bytes, int]:
    """Yüz tespiti (Haar) + geniş alan blur. Dönüş: (jpeg bytes, blur_count)."""
    arr = np.frombuffer(data, dtype=np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if img is None:
        pil = Image.open(io.BytesIO(data)).convert("RGB")
        img = cv2.cvtColor(np.array(pil), cv2.COLOR_RGB2BGR)

    blur_count = 0
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    cascade_path = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
    face_cascade = cv2.CascadeClassifier(cascade_path)
    faces = face_cascade.detectMultiScale(gray, 1.1, 5, minSize=(30, 30))

    for (x, y, w, h) in faces:
        pad = int(max(w, h) * 0.15)
        _blur_region(img, x - pad, y - pad, x + w + pad, y + h + pad, k=41)
        blur_count += 1

    # Plaka benzeri dikdörtgenler için alt bantta basit heuristic (opsiyonel)
    h_img, w_img = img.shape[:2]
    lower = img[int(h_img * 0.55) :, :]
    # Alt %45'te yüksek kontrastlı küçük bölgeler — plaka proxy
    edges = cv2.Canny(cv2.cvtColor(lower, cv2.COLOR_BGR2GRAY), 50, 150)
    contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    for cnt in contours:
        x, y, bw, bh = cv2.boundingRect(cnt)
        aspect = bw / max(bh, 1)
        if 1.5 < aspect < 6 and 50 < bw < 300 and 15 < bh < 80:
            _blur_region(img, x, int(h_img * 0.55) + y, x + bw, int(h_img * 0.55) + y + bh, k=31)
            blur_count += 1

    ok, buf = cv2.imencode(".jpg", img, [int(cv2.IMWRITE_JPEG_QUALITY), 90])
    if not ok:
        raise ValueError("JPEG encode failed")
    return buf.tobytes(), blur_count


def to_base64(data: bytes) -> str:
    return base64.b64encode(data).decode("ascii")
