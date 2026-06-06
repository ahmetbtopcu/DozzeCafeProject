#!/usr/bin/env python3
"""YOLO-World ONNX export — Standard tier RAM tasarrufu (opsiyonel)."""
from pathlib import Path

def main() -> None:
    try:
        from ultralytics import YOLOWorld
    except ImportError:
        print("ultralytics gerekli: pip install ultralytics")
        return

    out = Path(__file__).resolve().parents[1] / "ai-service" / "models"
    out.mkdir(parents=True, exist_ok=True)

    model = YOLOWorld("yolov8s-worldv2.pt")
    model.set_classes(
        [
            "car parked on sidewalk",
            "garbage pile on street",
            "broken traffic sign",
            "pothole on road",
        ]
    )
    path = model.export(format="onnx", imgsz=320, simplify=True)
    print(f"Exported: {path}")


if __name__ == "__main__":
    main()
