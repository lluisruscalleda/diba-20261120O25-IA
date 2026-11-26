"""API REST FastAPI per al Sistema Intel·ligent de Gestió d'Expedients Administratius (SIGEA-IA).

Execució local (amb dependències instal·lades):
    uvicorn api.main:app --reload --port 8010
"""

from __future__ import annotations

import os
from pathlib import Path

from fastapi import FastAPI, HTTPException

from api.schemas import ExpedientCreateRequest, HumanDecisionRequest
from src.sigea.models import AuditLedger
from src.sigea.pipeline import SigeaPipeline

DB_PATH = Path(os.getenv("SIGEA_DB_PATH", "sigea_audit.db"))
ledger = AuditLedger(DB_PATH)
pipeline = SigeaPipeline(ledger=ledger)

app = FastAPI(
    title="SIGEA-IA — API de Suport a la Tramitació d'Expedients Administratius",
    description=(
        "Projecte Final Integrador (8 mòduls, flux de 13 passos). "
        "Suport a la tramitació sense decisió administrativa autònoma."
    ),
    version="1.0.0",
)


@app.get("/health")
def health() -> dict[str, str]:
    return {
        "status": "ok",
        "model_version": pipeline.MODEL_VERSION,
        "prompt_version": pipeline.PROMPT_VERSION,
    }


@app.post("/api/v1/expedients/process")
def process_expedient(req: ExpedientCreateRequest) -> dict:
    try:
        result = pipeline.process_expedient(req.model_dump())
        return result.to_dict()
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from exc


@app.get("/api/v1/expedients/{expedient_id}")
def get_expedient(expedient_id: str) -> dict:
    rec = ledger.get_expedient(expedient_id)
    if not rec:
        raise HTTPException(status_code=404, detail="Expedient no trobat al registre d'auditoria")
    return rec


@app.post("/api/v1/expedients/{expedient_id}/human-decision")
def register_human_decision(expedient_id: str, req: HumanDecisionRequest) -> dict:
    rec = ledger.get_expedient(expedient_id)
    if not rec:
        raise HTTPException(status_code=404, detail="Expedient no trobat")
    try:
        return ledger.record_human_decision(
            expedient_id=expedient_id,
            reviewer_id=req.reviewer_id,
            reviewer_role=req.reviewer_role,
            decision=req.decision,
            justification=req.justification,
        )
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@app.get("/api/v1/metrics/mlops")
def get_mlops_metrics() -> dict:
    return pipeline.compute_mlops_report()


@app.get("/api/v1/audit/verify")
def verify_audit_chain() -> dict:
    valid, total = ledger.verify_chain()
    return {"valid": valid, "records_verified": total}
