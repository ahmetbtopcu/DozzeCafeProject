"""CLIP sahne doğrulama / yönlendirme katmanı.

Resmin içeriğini (sahnesini) sıfır-atış (zero-shot) sınıflandırır ve hangi ihlal
türüne ait olduğunu döner. Böylece sonraki adımda yalnızca ilgili uzman model
çalıştırılıp doğrulama yapılır (iki aşamalı: sahne + nesne).

Lazy-load: CLIP yalnızca ilk istekte yüklenir. Model yoksa/yüklenemezse None
döner ve çağıran taraf eski "araç kapısı" mantığına düşer.
"""
from __future__ import annotations

import io
import logging

from app.config import CLIP_MODEL_NAME, ENABLE_CLIP_ROUTER

logger = logging.getLogger(__name__)

_clip = None  # (model, preprocess, device, text_features, owners)

# Her ihlal türü + "yok" için CLIP metin promptları. Birden fazla prompt skoru
# toplanır (ensemble), kategori bazında softmax sonrası en yüksek kazanır.
SCENE_PROMPTS: dict[str, list[str]] = {
    "sidewalk_occupation": [
        "a photo of a car parked on the sidewalk",
        "a vehicle blocking the pedestrian walkway",
        "goods or a market stall occupying the sidewalk",
    ],
    "road_damage": [
        "a photo of a pothole in the road",
        "cracked and damaged asphalt pavement",
    ],
    "garbage_pile": [
        "a photo of a pile of garbage bags and trash on the street",
        "scattered rubbish, waste and litter dumped on the ground",
        "an overflowing pile of household garbage",
    ],
    "none": [
        "a clean ordinary street scene with no problem",
    ],
}


def _load():
    global _clip
    if _clip is not None:
        return _clip
    if not ENABLE_CLIP_ROUTER:
        return None
    try:
        import clip
        import torch

        device = "cuda" if torch.cuda.is_available() else "cpu"
        model, preprocess = clip.load(CLIP_MODEL_NAME, device=device)
        model.eval()

        prompts, owners = [], []
        for cat, ps in SCENE_PROMPTS.items():
            for p in ps:
                prompts.append(p)
                owners.append(cat)
        with torch.no_grad():
            tokens = clip.tokenize(prompts).to(device)
            tfeat = model.encode_text(tokens)
            tfeat /= tfeat.norm(dim=-1, keepdim=True)
        _clip = (model, preprocess, device, tfeat, owners)
        logger.info("CLIP router yüklendi: %s (%s)", CLIP_MODEL_NAME, device)
        return _clip
    except Exception as exc:
        logger.warning("CLIP router yüklenemedi: %s", exc)
        return None


def classify_scene(image_bytes: bytes) -> dict[str, float] | None:
    """Sahne -> {tür: olasılık}. CLIP yoksa None döner."""
    loaded = _load()
    if loaded is None:
        return None
    model, preprocess, device, tfeat, owners = loaded
    try:
        import torch
        from PIL import Image

        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        tensor = preprocess(img).unsqueeze(0).to(device)
        with torch.no_grad():
            ifeat = model.encode_image(tensor)
            ifeat /= ifeat.norm(dim=-1, keepdim=True)
            sims = (100.0 * ifeat @ tfeat.T).softmax(dim=-1)[0].tolist()
        scores: dict[str, float] = {}
        for owner, s in zip(owners, sims):
            scores[owner] = scores.get(owner, 0.0) + float(s)
        return scores
    except Exception as exc:
        logger.warning("CLIP classify_scene başarısız: %s", exc)
        return None
