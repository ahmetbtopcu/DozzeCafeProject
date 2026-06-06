"""Nöbetçi AI Service — FastAPI uydu servisi."""
from __future__ import annotations

import base64
from typing import Any, Optional

from fastapi import FastAPI, File, Form, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app import anonymize, demo, detect, petition, rag, severity
from app.authority import route_authority
from app.config import DEMO_MODE

app = FastAPI(title="Nobetci AI Service", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict[str, Any]:
    return {"status": "ok", "service": "nobetci-ai-service", "demo_mode": DEMO_MODE}


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


@app.post("/detect", response_model=DetectResponse)
async def detect_endpoint(file: UploadFile = File(...)) -> DetectResponse:
    data = await file.read()
    dets = detect.detect_violations(data)
    return DetectResponse(detections=dets)


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


@app.get("/demo/samples")
async def demo_samples() -> dict[str, Any]:
    from app.demo import _load

    return _load()


@app.post("/pipeline", response_model=PipelineResponse)
async def pipeline_endpoint(file: UploadFile = File(...)) -> PipelineResponse:
    """Anonimleştir → tespit → şiddet (tek çağrı)."""
    if DEMO_MODE:
        d = demo.get_demo_pipeline()
        return PipelineResponse(
            image_base64=d.get("image_base64", ""),
            blur_count=d["blur_count"],
            detections=d["detections"],
            severity=d["severity"],
        )
    data = await file.read()
    anon, blur_count = anonymize.anonymize_image_bytes(data)
    dets = detect.detect_violations(anon)
    sev = severity.compute_severity(dets)
    return PipelineResponse(
        image_base64=anonymize.to_base64(anon),
        blur_count=blur_count,
        detections=dets,
        severity=sev,
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
