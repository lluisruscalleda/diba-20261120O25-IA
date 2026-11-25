"""API REST FastAPI opcional per persistir el progrés de l'estudiant en SQLite local.

Nota de seguretat: aquest servidor NO executa codi Python introduït per l'usuari.
Els laboratoris i exercicis pràctics s'executen localment mitjançant Jupyter o scripts.
"""
from __future__ import annotations

import os
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from .database import init_db, load_state, save_state

app = FastAPI(
    title="Acadèmia IA — API de Persistència Local",
    version="1.0.0",
    description="API local opcional per desar el progrés, notes, intents d'examen i repetició espaiada.",
)

raw_origins = os.getenv(
    "ACADEMY_CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173"
)
allowed_origins = [o.strip() for o in raw_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "PUT", "OPTIONS"],
    allow_headers=["*"],
)


class StatePayload(BaseModel):
    state: dict[str, Any] = Field(..., description="Estat serialitzat del progrés de l'estudiant")


@app.on_event("startup")
def on_startup() -> None:
    init_db()


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "ai-academy-backend"}


@app.get("/api/state")
def get_student_state(profile_id: str = "default") -> dict[str, Any]:
    record = load_state(profile_id=profile_id)
    if record is None:
        return {"profileId": profile_id, "state": None, "updatedAt": None}
    return record


@app.put("/api/state")
def put_student_state(payload: StatePayload, profile_id: str = "default") -> dict[str, Any]:
    if len(profile_id) > 64 or not profile_id.replace("-", "").replace("_", "").isalnum():
        raise HTTPException(status_code=400, detail="Identificador de perfil invàlid.")
    updated_at = save_state(payload.state, profile_id=profile_id)
    return {"profileId": profile_id, "updatedAt": updated_at, "saved": True}
