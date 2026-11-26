"""Esquemes Pydantic v2 per a l'API REST FastAPI de SIGEA-IA."""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field


class DocumentAnnexSchema(BaseModel):
    doc_type: str = Field(..., examples=["factura_solar"])
    filename: str = Field(..., examples=["factura_plaques_001.pdf"])
    ocr_confidence: float = Field(..., ge=0.0, le=1.0)
    fields: dict[str, Any] = Field(default_factory=dict)
    declared_attachments: list[str] = Field(default_factory=list)


class ExpedientCreateRequest(BaseModel):
    expedient_id: str = Field(..., examples=["EXP-2026-0099"])
    idempotency_key: str = Field(..., examples=["IDEMP-0099"])
    municipi: str = Field(..., examples=["Vilafranca Sintètica"])
    comarca: str = Field(..., examples=["Alt Penedès"])
    canal: str = Field(default="seu_electronica")
    user_role: str = Field(default="tecnic_tramitador")
    subject: str = Field(..., min_length=3)
    body: str = Field(..., min_length=5)
    documents: list[DocumentAnnexSchema] = Field(default_factory=list)
    metadata: dict[str, Any] = Field(default_factory=dict)


class HumanDecisionRequest(BaseModel):
    reviewer_id: str = Field(..., examples=["FUNC-0142"])
    reviewer_role: str = Field(..., examples=["tecnic_juridic"])
    decision: str = Field(..., pattern="^(APROVAT|DENEGAT|REQUERIMENT_ESMENA|DERIVAT_INTERVENCIO)$")
    justification: str = Field(..., min_length=15)
