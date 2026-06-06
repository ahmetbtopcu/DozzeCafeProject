import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

APP_ROOT = Path(__file__).resolve().parents[1]
MEVZUAT_DIR = APP_ROOT / "docs" / "mevzuat"
DEMO_CACHE = APP_ROOT / "demo" / "cache.json"
MODELS_DIR = APP_ROOT / "models"

FACE_MODEL = MODELS_DIR / "face_detection_yunet_2023mar.onnx"
PLATE_MODEL = MODELS_DIR / "license_plate_detection_yunet_2023mar.onnx"

DEMO_MODE = os.getenv("DEMO_MODE", "false").lower() == "true"
ENABLE_SPECIALIST_MODELS = os.getenv("ENABLE_SPECIALIST_MODELS", "false").lower() == "true"
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
OPENAI_BASE_URL = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1")

DETECT_TIMEOUT_SEC = float(os.getenv("DETECT_TIMEOUT_SEC", "5"))
YOLO_CONF = float(os.getenv("YOLO_CONF", "0.35"))
YOLO_IMGSZ = int(os.getenv("YOLO_IMGSZ", "320"))
MAX_IMAGE_WIDTH = int(os.getenv("MAX_IMAGE_WIDTH", "1280"))

VIOLATION_CLASSES = {
    "sidewalk_occupation": "Kaldırım işgali",
    "road_damage": "Çukur / bozuk yol",
    "broken_sign": "Kırık / devrik tabela",
    "garbage_pile": "Çöp / moloz yığını",
}
