"""Nöbetçi AI Service — FastAPI uydu servisi."""
from __future__ import annotations

from typing import Any, Optional

from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app import anonymize, demo, detect, detect_specialists, petition, rag, severity
from app.authority import route_authority
from app.config import DEMO_MODE, ENABLE_SPECIALIST_MODELS

app = FastAPI(title="Nobetci AI Service", version="0.2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict[str, Any]:
    return {
        "status": "ok",
        "service": "nobetci-ai-service",
        "demo_mode": DEMO_MODE,
        "specialist_models": ENABLE_SPECIALIST_MODELS,
    }


class AnonymizeResponse(BaseModel):
    image_base64: str
    blur_count: int
    mime: str = "image/jpeg"


@app.post("/anonymize", response_model=AnonymizeResponse)
async def anonymize_endpoint(file: UploadFile = File(...)) -> AnonymizeResponse:
    data = await file.read()
    out, count = anonymize.anonymize_image_bytes(data)
    return AnonymizeResponse(image_base64=anonymize.to_base64(out), blur_count=count)


class DetectResponse(BaseModel):
    detections: list[dict[str, Any]]
    demo: bool = False


@app.post("/detect", response_model=DetectResponse)
async def detect_endpoint(file: UploadFile = File(...)) -> DetectResponse:
    data = await file.read()
    anon, _ = anonymize.anonymize_image_bytes(data)
    dets = detect.detect_violations(anon)
    used_demo = False
    # Cache fallback yalnızca demo modunda; gerçek modda boş sonuç gerçek sonuçtur.
    if not dets and DEMO_MODE:
        dets, _ = demo.demo_detections_from_cache()
        used_demo = True
    return DetectResponse(detections=dets, demo=used_demo)


@app.post("/detect/pothole", response_model=DetectResponse)
async def detect_pothole_endpoint(file: UploadFile = File(...)) -> DetectResponse:
    data = await file.read()
    anon, _ = anonymize.anonymize_image_bytes(data)
    dets = detect_specialists.detect_pothole(anon)
    return DetectResponse(detections=dets, demo=not bool(dets))


@app.post("/detect/litter", response_model=DetectResponse)
async def detect_litter_endpoint(file: UploadFile = File(...)) -> DetectResponse:
    data = await file.read()
    anon, _ = anonymize.anonymize_image_bytes(data)
    dets = detect_specialists.detect_litter(anon)
    return DetectResponse(detections=dets, demo=not bool(dets))


class SeverityRequest(BaseModel):
    detections: list[dict[str, Any]]


class SeverityResponse(BaseModel):
    score: int
    level: str
    primary_type: Optional[str] = None
    primary_label: Optional[str] = None


@app.post("/severity", response_model=SeverityResponse)
async def severity_endpoint(body: SeverityRequest) -> SeverityResponse:
    result = severity.compute_severity(body.detections)
    return SeverityResponse(**result)


class PipelineResponse(BaseModel):
    image_base64: str
    blur_count: int
    detections: list[dict[str, Any]]
    severity: dict[str, Any]
    demo: bool = False


@app.get("/demo/samples")
async def demo_samples() -> dict[str, Any]:
    return demo._load()


@app.post("/pipeline", response_model=PipelineResponse)
async def pipeline_endpoint(file: UploadFile = File(...)) -> PipelineResponse:
    """KVKK: anonimleştir → tespit (veya demo cache) → şiddet."""
    data = await file.read()
    anon, blur_count = anonymize.anonymize_image_bytes(data)
    image_b64 = anonymize.to_base64(anon)
    used_demo = False

    if DEMO_MODE:
        d = demo.get_demo_pipeline(image_b64, blur_count)
        return PipelineResponse(
            image_base64=d["image_base64"],
            blur_count=d["blur_count"],
            detections=d["detections"],
            severity=d["severity"],
            demo=True,
        )

    dets = detect.detect_violations(anon)
    if not dets and DEMO_MODE:
        # Yalnızca demo modunda cache fallback; gerçek modda boş = ihlal yok.
        dets, sev = demo.demo_detections_from_cache()
        used_demo = True
    else:
        sev = severity.compute_severity(dets)

    return PipelineResponse(
        image_base64=image_b64,
        blur_count=blur_count,
        detections=dets,
        severity=sev,
        demo=used_demo,
    )


class RagRequest(BaseModel):
    query: str
    top_k: int = 3


@app.post("/rag/retrieve")
async def rag_retrieve(body: RagRequest) -> dict[str, Any]:
    results = rag.retrieve(body.query, top_k=body.top_k)
    return {"results": results}


class AuthorityRequest(BaseModel):
    violation_type: str
    lat: Optional[float] = None
    lng: Optional[float] = None
    is_main_artery: Optional[bool] = None


@app.post("/authority")
async def authority_endpoint(body: AuthorityRequest) -> dict[str, Any]:
    return route_authority(body.violation_type, body.lat, body.lng, body.is_main_artery)


class PetitionRequest(BaseModel):
    violation_type: str
    lat: Optional[float] = None
    lng: Optional[float] = None
    severity: Optional[dict[str, Any]] = None
    is_main_artery: Optional[bool] = None


@app.post("/petition")
async def petition_endpoint(body: PetitionRequest) -> dict[str, Any]:
    return await petition.generate_petition(
        body.violation_type,
        body.lat,
        body.lng,
        body.severity,
        body.is_main_artery,
    )
