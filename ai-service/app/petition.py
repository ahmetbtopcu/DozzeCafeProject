"""Hukuki dilekçe üretimi — LLM veya şablon fallback."""
from __future__ import annotations

from datetime import datetime
from typing import Any, Optional

import httpx

from app.authority import route_authority
from app.config import OPENAI_API_KEY, OPENAI_BASE_URL, VIOLATION_CLASSES
from app.rag import retrieve


def _template_petition(
    violation_type: str,
    authority: dict[str, Any],
    rag_snippets: list[dict[str, Any]],
    lat: Optional[float],
    lng: Optional[float],
    severity: Optional[dict[str, Any]],
) -> str:
    label = VIOLATION_CLASSES.get(violation_type, violation_type)
    loc = f"({lat:.5f}, {lng:.5f})" if lat and lng else "(konum belirtilmedi)"
    sev = severity or {}
    refs = "\n".join(f"- {s['heading']}: {s['text'][:200]}..." for s in rag_snippets[:2])

    return f"""T.C.
CİMER / BİMER BAŞVURUSU

Tarih: {datetime.now().strftime("%d.%m.%Y")}

KONU: {label} — idari şikayet ve denetim talebi

SAYIN YETKİLİ,

{loc} koordinatlarında tespit edilen {label} ihlali hakkında şikayetimi arz ederim.

İHLAL TÜRÜ: {label}
ŞİDDET: {sev.get('level', 'belirtilmedi')} (skor: {sev.get('score', 0)}/100)

HUKUKİ DAYANAK:
{refs}

YETKİLİ KURUM: {authority.get('authority')}
Başvuru kanalı: {authority.get('channel')}
Mevzuat: {authority.get('law_ref')}

TALEP:
1. Söz konusu ihlalin derhal giderilmesi,
2. Gerekli idari yaptırımın uygulanması,
3. İşlem sonucunun tarafıma bildirilmesi.

Ek: Anonimleştirilmiş fotoğraf kanıtı

Saygılarımla,
Vatandaş


---
Bu dilekçe Nöbetçi Otomatik Hesap Sorma Motoru tarafından üretilmiştir.
"""


async def _llm_petition(prompt: str) -> Optional[str]:
    if not OPENAI_API_KEY:
        return None
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            r = await client.post(
                f"{OPENAI_BASE_URL.rstrip('/')}/chat/completions",
                headers={"Authorization": f"Bearer {OPENAI_API_KEY}"},
                json={
                    "model": "gpt-4o-mini",
                    "messages": [
                        {
                            "role": "system",
                            "content": "Sen Türkiye'de resmi dilekçe yazan bir hukuk asistanısın. CİMER formatında, kısa ve net yaz.",
                        },
                        {"role": "user", "content": prompt},
                    ],
                    "temperature": 0.3,
                },
            )
            r.raise_for_status()
            return r.json()["choices"][0]["message"]["content"]
    except Exception:
        return None


async def generate_petition(
    violation_type: str,
    lat: Optional[float] = None,
    lng: Optional[float] = None,
    severity: Optional[dict[str, Any]] = None,
    is_main_artery: Optional[bool] = None,
) -> dict[str, Any]:
    label = VIOLATION_CLASSES.get(violation_type, violation_type)
    query = f"{label} şikayet mevzuat belediye yetki"
    snippets = retrieve(query, top_k=3)
    authority = route_authority(violation_type, lat, lng, is_main_artery)

    prompt = f"""Aşağıdaki bilgilerle resmi CİMER dilekçesi yaz:
İhlal: {label}
Konum: lat={lat}, lng={lng}
Şiddet: {severity}
Kurum: {authority}
Mevzuat: {snippets}
"""
    text = await _llm_petition(prompt)
    if not text:
        text = _template_petition(violation_type, authority, snippets, lat, lng, severity)

    return {
        "petition": text,
        "authority": authority,
        "legal_references": snippets,
        "violation_type": violation_type,
        "violation_label": label,
    }
