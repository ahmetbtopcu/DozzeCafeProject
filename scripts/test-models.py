#!/usr/bin/env python3
"""Model yükleme smoke testi."""
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "ai-service"))

from app.config import FACE_MODEL, YOLO_WORLD_MODEL, ROAD_DAMAGE_MODEL


def check(path: Path, label: str) -> bool:
    ok = path.is_file() and path.stat().st_size > 1000
    mb = path.stat().st_size / (1024 * 1024) if ok else 0
    print(f"{'OK' if ok else 'MISSING':8} {label}: {path.name} ({mb:.2f} MB)")
    return ok


def main() -> int:
    print("=== Dosya kontrolü ===")
    all_ok = all(
        [
            check(FACE_MODEL, "YuNet (yüz)"),
            check(YOLO_WORLD_MODEL, "YOLO-World"),
            check(ROAD_DAMAGE_MODEL, "RDD road damage"),
        ]
    )

    print("\n=== YuNet (yüz) yükleme ===")
    from app.anonymize import _get_face_detector

    fd = _get_face_detector()
    print(f"face detector: {'OK' if fd else 'FAIL'}")

    print("\n=== YOLO-World yükleme ===")
    import os

    os.environ["DEMO_MODE"] = "false"
    from app import detect

    detect.DEMO_MODE = False
    m = detect._get_yolo()
    print(f"yolo-world: {'OK' if m else 'FAIL'}")

    return 0 if all_ok and fd and m else 1


if __name__ == "__main__":
    raise SystemExit(main())
