import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

ROOT = Path(__file__).resolve().parents[2]
MEVZUAT_DIR = ROOT / "docs" / "mevzuat"
DEMO_CACHE = Path(__file__).resolve().parents[1] / "demo" / "cache.json"

DEMO_MODE = os.getenv("DEMO_MODE", "false").lower() == "true"
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
OPENAI_BASE_URL = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1")

VIOLATION_CLASSES = {
    "sidewalk_occupation": "Kaldırım işgali",
    "road_damage": "Çukur / bozuk yol",
    "broken_sign": "Kırık / devrik tabela",
    "garbage_pile": "Çöp / moloz yığını",
}
