#!/usr/bin/env python3
"""Çöp/moloz tespiti için YOLOv8 fine-tune scripti.

Kullanım (GPU'lu ortam, örn. Google Colab veya CUDA'lı makine önerilir):

    python scripts/finetune/train.py \
        --data data/finetune/garbage/data.yaml \
        --task garbage --epochs 80 --imgsz 640 --model yolov8s.pt

Eğitim bitince en iyi ağırlık otomatik olarak ai-service/models/garbage_finetuned.pt
olarak kopyalanır. Sonra flag'i açın: ENABLE_GARBAGE_SPECIALIST=true

data.yaml formatı (Ultralytics standart):
    path: /abs/or/rel/dataset/root
    train: images/train
    val: images/val
    names:
      0: garbage_pile
"""
from __future__ import annotations

import argparse
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
MODELS_DIR = ROOT / "ai-service" / "models"

TASK_OUTPUT = {
    "garbage": "garbage_finetuned.pt",
}


def main() -> int:
    parser = argparse.ArgumentParser(description="Nöbetçi uzman model fine-tune")
    parser.add_argument("--data", required=True, help="Ultralytics data.yaml yolu")
    parser.add_argument("--task", required=True, choices=sorted(TASK_OUTPUT), help="garbage")
    parser.add_argument("--model", default="yolov8s.pt", help="Başlangıç ağırlığı")
    parser.add_argument("--epochs", type=int, default=80)
    parser.add_argument("--imgsz", type=int, default=640)
    parser.add_argument("--batch", type=int, default=16)
    parser.add_argument("--name", default=None, help="Çıktı run adı")
    args = parser.parse_args()

    data_path = Path(args.data)
    if not data_path.is_file():
        print(f"data.yaml bulunamadı: {data_path}")
        return 1

    try:
        from ultralytics import YOLO
    except ImportError:
        print("ultralytics kurulu değil: pip install ultralytics")
        return 1

    run_name = args.name or f"nobetci_{args.task}"
    model = YOLO(args.model)
    results = model.train(
        data=str(data_path),
        epochs=args.epochs,
        imgsz=args.imgsz,
        batch=args.batch,
        name=run_name,
        patience=20,
        seed=42,
    )

    save_dir = Path(results.save_dir) if hasattr(results, "save_dir") else None
    best = (save_dir / "weights" / "best.pt") if save_dir else None
    if not best or not best.is_file():
        candidates = sorted(ROOT.glob(f"runs/detect/{run_name}*/weights/best.pt"))
        best = candidates[-1] if candidates else None

    if not best or not best.is_file():
        print("best.pt bulunamadı; runs/ klasörünü kontrol edin.")
        return 1

    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    out = MODELS_DIR / TASK_OUTPUT[args.task]
    shutil.copy(best, out)
    print(f"\nOK -> {out}")
    print(f"Şimdi ENABLE_{args.task.upper()}_SPECIALIST=true yapıp servisi yeniden başlatın.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
