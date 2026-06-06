"""Mevzuat RAG — turkish-e5 veya TF-IDF fallback."""
from __future__ import annotations

import re
from pathlib import Path
from typing import Any

from app.config import MEVZUAT_DIR

_chunks: list[dict[str, str]] = []
_embedder = None
_embeddings = None


def _load_corpus() -> list[dict[str, str]]:
    global _chunks
    if _chunks:
        return _chunks
    for path in sorted(MEVZUAT_DIR.glob("*.md")):
        text = path.read_text(encoding="utf-8")
        parts = re.split(r"\n## ", text)
        title = parts[0].strip("# \n")
        for part in parts[1:]:
            lines = part.strip().split("\n", 1)
            heading = lines[0].strip()
            body = lines[1].strip() if len(lines) > 1 else ""
            _chunks.append(
                {
                    "source": path.name,
                    "heading": heading,
                    "text": f"{heading}\n{body}",
                }
            )
    return _chunks


def _get_embedder():
    global _embedder
    if _embedder is not None:
        return _embedder
    try:
        from sentence_transformers import SentenceTransformer

        _embedder = SentenceTransformer("ytu-ce-cosmos/turkish-e5-large")
        return _embedder
    except Exception:
        return None


def _ensure_embeddings():
    global _embeddings
    if _embeddings is not None:
        return
    chunks = _load_corpus()
    model = _get_embedder()
    if model is None:
        _embeddings = []
        return
    texts = [c["text"] for c in chunks]
    _embeddings = model.encode(texts, normalize_embeddings=True)


def retrieve(query: str, top_k: int = 3) -> list[dict[str, Any]]:
    chunks = _load_corpus()
    if not chunks:
        return []

    _ensure_embeddings()
    model = _get_embedder()

    if model is None or _embeddings is None or len(_embeddings) == 0:
        # Keyword fallback
        q = query.lower()
        scored = []
        for c in chunks:
            score = sum(1 for w in q.split() if w in c["text"].lower())
            scored.append((score, c))
        scored.sort(key=lambda x: -x[0])
        return [
            {"source": c["source"], "heading": c["heading"], "text": c["text"], "score": float(s)}
            for s, c in scored[:top_k]
            if s > 0
        ] or [{"source": chunks[0]["source"], "heading": chunks[0]["heading"], "text": chunks[0]["text"], "score": 0.5}]

    import numpy as np

    q_emb = model.encode([query], normalize_embeddings=True)[0]
    sims = np.dot(_embeddings, q_emb)
    idx = np.argsort(-sims)[:top_k]
    return [
        {
            "source": chunks[i]["source"],
            "heading": chunks[i]["heading"],
            "text": chunks[i]["text"],
            "score": float(sims[i]),
        }
        for i in idx
    ]
