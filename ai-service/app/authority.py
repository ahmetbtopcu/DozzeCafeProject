"""Yetki yönlendirici — ihlal türü + konum → sorumlu kurum."""
from __future__ import annotations

from typing import Any, Optional

AUTHORITY_RULES: dict[str, dict[str, str]] = {
    "sidewalk_occupation": {
        "authority": "İlçe Belediyesi Zabıta Müdürlüğü",
        "channel": "CİMER / 153 / e-Belediye",
        "law_ref": "5326 sayılı Kabahatler Kanunu md. 32, 38",
    },
    "road_damage": {
        "authority": "İlçe Belediyesi Fen İşleri",
        "channel": "CİMER / 153",
        "law_ref": "5216 sayılı Büyükşehir Kanunu — görev dağılımı",
    },
    "garbage_pile": {
        "authority": "İlçe Belediyesi Temizlik İşleri",
        "channel": "CİMER / 153",
        "law_ref": "5393 sayılı Belediye Kanunu md. 14",
    },
}

# Ana arter eşiği — basit lat/lng heuristic (Başakşehir merkez)
MAIN_ARTERY_LAT_RANGE = (41.08, 41.10)


def route_authority(
    violation_type: str,
    lat: Optional[float] = None,
    lng: Optional[float] = None,
    is_main_artery: Optional[bool] = None,
) -> dict[str, Any]:
    base = AUTHORITY_RULES.get(
        violation_type,
        AUTHORITY_RULES["sidewalk_occupation"],
    ).copy()

    if violation_type == "road_damage":
        main = is_main_artery
        if main is None and lat is not None:
            main = MAIN_ARTERY_LAT_RANGE[0] <= lat <= MAIN_ARTERY_LAT_RANGE[1]
        if main:
            base["authority"] = "İBB Yol Bakım / Karayolları Genel Müdürlüğü (KGM)"
            base["reason"] = "Ana arter veya büyük yol — büyükşehir/KGM yetkisi"

    if violation_type == "sidewalk_occupation":
        base["reason"] = "Kaldırım işgali ilçe belediyesi zabıta yetkisindedir"

    return {
        "violation_type": violation_type,
        **base,
    }
