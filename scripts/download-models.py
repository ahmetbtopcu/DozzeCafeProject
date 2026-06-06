#!/usr/bin/env python3
"""Nöbetçi — tüm AI model ağırlıklarını ai-service/models/ altına indirir."""
from __future__ import annotations

import shutil
import sys
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MODELS = ROOT / "ai-service" / "models"
MODELS.mkdir(parents=True, exist_ok=True)

YUNET = [
    (
        "face_detection_yunet_2023mar.onnx",
        "https://github.com/opencv/opencv_zoo/raw/main/models/face_detection_yunet/face_detection_yunet_2023mar.onnx",
    ),
    (
        "license_plate_detection_yunet_2023mar.onnx",
        "https://media.githubusercontent.com/media/opencv/opencv_zoo/main/models/license_plate_detection_yunet/license_plate_detection_lpd_yunet_2023mar.onnx",
    ),
]

SPECIALISTS = [
    # Yol hasarı (çukur + çatlak) — RDD2022 eğitimli, güvenilir.
    ("rdd_road_damage.pt", "ozair23/yolov8-road-damage-detector", "best.pt"),
    # Çöp ve tabela için hazır güvenilir model yok; scripts/finetune/ ile eğitilir.
]


def download_url(name: str, url: str) -> Path:
    dest = MODELS / name
    if dest.is_file() and dest.stat().st_size > 1000:
        print(f"  skip (exists): {name}")
        return dest
    print(f"  download: {name}")
    urllib.request.urlretrieve(url, dest)
    return dest


def download_yolo_world() -> Path:
    dest = MODELS / "yolov8s-worldv2.pt"
    if dest.is_file() and dest.stat().st_size > 1_000_000:
        print("  skip (exists): yolov8s-worldv2.pt")
        return dest
    print("  download: yolov8s-worldv2.pt (Ultralytics)")
    from ultralytics import YOLOWorld

    tmp = Path("yolov8s-worldv2.pt")
    YOLOWorld("yolov8s-worldv2.pt")
    src = tmp if tmp.is_file() else MODELS / "yolov8s-worldv2.pt"
    if tmp.is_file():
        shutil.move(str(tmp), dest)
    elif not dest.is_file():
        raise FileNotFoundError("yolov8s-worldv2.pt indirilemedi")
    return dest


def download_specialists() -> None:
    try:
        from huggingface_hub import hf_hub_download
    except ImportError:
        print("  skip specialists: huggingface_hub yok")
        return
    for local_name, repo_id, filename in SPECIALISTS:
        dest = MODELS / local_name
        if dest.is_file() and dest.stat().st_size > 1000:
            print(f"  skip (exists): {local_name}")
            continue
        print(f"  download HF: {repo_id}")
        path = hf_hub_download(repo_id=repo_id, filename=filename)
        shutil.copy(path, dest)


def main() -> int:
    print(f"Models dir: {MODELS}\n")
    print("[1/3] YuNet ONNX")
    for name, url in YUNET:
        download_url(name, url)

    print("\n[2/3] YOLO-World-S v2")
    try:
        download_yolo_world()
    except Exception as exc:
        print(f"  WARN: YOLO-World indirilemedi: {exc}")
        print("  pip install ultralytics torch sonrası tekrar deneyin.")

    print("\n[3/3] Uzman modeller (opsiyonel)")
    download_specialists()

    print("\n--- Özet ---")
    for f in sorted(MODELS.iterdir()):
        if f.is_file() and f.name != ".gitkeep":
            mb = f.stat().st_size / (1024 * 1024)
            print(f"  {f.name}: {mb:.2f} MB")
    return 0


if __name__ == "__main__":
    sys.exit(main())
