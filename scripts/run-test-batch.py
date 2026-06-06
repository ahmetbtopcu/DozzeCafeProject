#!/usr/bin/env python3
"""data/test/manifest.json görüntülerinde blur + tespit batch testi."""
from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "ai-service"))

MANIFEST = ROOT / "data" / "test" / "manifest.json"


def _enable_real_inference(specialists: bool) -> None:
    os.environ["DEMO_MODE"] = "false"
    if specialists:
        os.environ["ENABLE_SPECIALIST_MODELS"] = "true"

    import app.config as config
    import app.detect as detect
    import app.detect_specialists as specialists_mod

    config.DEMO_MODE = False
    detect.DEMO_MODE = False
    if specialists:
        config.ENABLE_SPECIALIST_MODELS = True
        specialists_mod.ENABLE_SPECIALIST_MODELS = True


def _run_sample(path: Path, expected: str, specialists: bool) -> dict:
    from app import anonymize, detect, severity

    raw = path.read_bytes()
    anon, blur_count = anonymize.anonymize_image_bytes(raw)
    dets = detect.detect_violations(anon)

    types = {d["type"] for d in dets}
    sev = severity.compute_severity(dets) if dets else None
    primary = sev["primary_type"] if sev else None
    # Birincil tür dilekçeyi belirler — asıl başarı kriteri budur.
    primary_hit = primary == expected
    in_set = expected in types

    return {
        "path": str(path.relative_to(ROOT)),
        "expected": expected,
        "blur_count": blur_count,
        "primary": primary,
        "primary_hit": primary_hit,
        "in_set": in_set,
        "yolo_types": sorted(types),
        "yolo_count": len(dets),
        "top_conf": max((d["confidence"] for d in dets), default=0.0),
        "severity": sev["level"] if sev else None,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Nöbetçi test seti batch inference")
    parser.add_argument("--specialists", action="store_true", help="Uzman modelleri de çalıştır")
    parser.add_argument("--id", help="Tek örnek id (ör. test-sidewalk-02)")
    args = parser.parse_args()

    if not MANIFEST.is_file():
        print(f"Manifest bulunamadı: {MANIFEST}")
        return 1

    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    samples = manifest.get("samples", [])
    if args.id:
        samples = [s for s in samples if s.get("id") == args.id]
        if not samples:
            print(f"Örnek bulunamadı: {args.id}")
            return 1

    _enable_real_inference(args.specialists)

    print("=== Nöbetçi test batch (DEMO_MODE=false) ===\n")
    hits = 0
    for sample in samples:
        rel = sample["file"].replace("/", os.sep)
        path = ROOT / rel
        expected = sample["expected_violation"]
        if not path.is_file():
            print(f"MISSING  {sample['id']}: {rel}")
            continue

        result = _run_sample(path, expected, args.specialists)
        mark = "OK" if result["primary_hit"] else "MISS"
        if result["primary_hit"]:
            hits += 1

        print(f"[{mark}] {sample['id']}")
        print(f"      dosya: {result['path']}")
        print(f"      beklenen: {expected} | birincil: {result['primary'] or '-'}")
        print(f"      blur: {result['blur_count']} | tespit: {result['yolo_count']} | conf: {result['top_conf']:.2f}")
        print(f"      bulunan türler: {result['yolo_types'] or '-'}")
        if not result["primary_hit"] and result["in_set"]:
            print("      not: beklenen tür bulundu ama birincil değil")
        if result["severity"]:
            print(f"      şiddet: {result['severity']}")
        note = sample.get("note")
        if note:
            print(f"      not: {note}")
        print()

    total = len([s for s in samples if (ROOT / s["file"].replace("/", os.sep)).is_file()])
    print(f"--- Özet: {hits}/{total} birincil tür doğru ---")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
