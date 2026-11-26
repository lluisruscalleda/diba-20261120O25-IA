"""Model de dades i registre d'auditoria immutable (SQLite + SHA-256) per a SIGEA-IA."""

from __future__ import annotations

import hashlib
import json
import sqlite3
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


@dataclass
class DocumentAnnex:
    doc_type: str
    filename: str
    ocr_confidence: float
    fields: dict[str, Any] = field(default_factory=dict)
    declared_attachments: list[str] = field(default_factory=list)


@dataclass
class ExpedientInput:
    expedient_id: str
    idempotency_key: str
    municipi: str
    comarca: str
    canal: str
    user_role: str
    subject: str
    body: str
    documents: list[DocumentAnnex] = field(default_factory=list)
    metadata: dict[str, Any] = field(default_factory=dict)

    @classmethod
    def from_dict(cls, raw: dict[str, Any]) -> "ExpedientInput":
        docs = [
            DocumentAnnex(
                doc_type=d.get("doc_type", "desconegut"),
                filename=d.get("filename", "sense_nom.pdf"),
                ocr_confidence=float(d.get("ocr_confidence", 0.0)),
                fields=dict(d.get("fields", {})),
                declared_attachments=list(d.get("declared_attachments", [])),
            )
            for d in raw.get("documents", [])
        ]
        return cls(
            expedient_id=str(raw["expedient_id"]),
            idempotency_key=str(raw.get("idempotency_key", raw["expedient_id"])),
            municipi=str(raw.get("municipi", "Municipi Sintètic")),
            comarca=str(raw.get("comarca", "Comarca Sintètica")),
            canal=str(raw.get("canal", "seu_electronica")),
            user_role=str(raw.get("user_role", "tecnic_tramitador")),
            subject=str(raw.get("subject", "")),
            body=str(raw.get("body", "")),
            documents=docs,
            metadata=dict(raw.get("metadata", {})),
        )


@dataclass
class PipelineResult:
    expedient_id: str
    idempotency_key: str
    model_version: str
    prompt_version: str
    status: str  # "PREVALIDAT_SUPORT" | "ESCALAT_HITL" | "BLOQUEJAT_SEGURETAT" | "DUPLICAT_IDEMPOTENT"
    requires_human_review: bool
    autonomous_final_decision: bool  # SEMPRE False per requisit legal (art. 22 RGPD / art. 14 AI Act / art. 41 LRJSP)
    area: str
    classification_confidence: float
    pii_redacted_count: int
    security_flags: list[str]
    extracted_fields: dict[str, Any]
    validation_errors: list[str]
    missing_attachments: list[str]
    esmena_draft_art68: str | None
    rag_citations: list[dict[str, str]]
    generated_draft: str
    ai_transparency_notice: str
    is_anomaly: bool
    anomaly_reason: str | None
    priority_score: float
    priority_band: str  # "CRITICA" | "ALTA" | "MITJANA" | "NORMAL"
    hitl_reasons: list[str]
    explainability_factors: list[str]
    audit_hash: str
    external_sync_status: str  # "SYNCED_ENI" | "QUEUED_OUTBOX_CIRCUIT_OPEN" | "SKIPPED_SECURITY"
    step_latencies_ms: dict[str, float]
    processed_at: str

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


class AuditLedger:
    """Registre SQLite immutable amb encadenament SHA-256 i cua outbox per a ENI."""

    def __init__(self, db_path: str | Path = ":memory:") -> None:
        self.db_path = str(db_path)
        self.conn = sqlite3.connect(self.db_path, check_same_thread=False)
        self.conn.row_factory = sqlite3.Row
        self._init_schema()

    def _init_schema(self) -> None:
        cur = self.conn.cursor()
        cur.executescript(
            """
            CREATE TABLE IF NOT EXISTS audit_log (
                seq INTEGER PRIMARY KEY AUTOINCREMENT,
                expedient_id TEXT NOT NULL,
                idempotency_key TEXT UNIQUE NOT NULL,
                municipi TEXT NOT NULL,
                comarca TEXT NOT NULL,
                area TEXT NOT NULL,
                status TEXT NOT NULL,
                requires_human_review INTEGER NOT NULL,
                priority_score REAL NOT NULL,
                model_version TEXT NOT NULL,
                prompt_version TEXT NOT NULL,
                payload_redacted_json TEXT NOT NULL,
                prev_hash TEXT NOT NULL,
                record_hash TEXT NOT NULL,
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS human_decisions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                expedient_id TEXT NOT NULL,
                reviewer_id TEXT NOT NULL,
                reviewer_role TEXT NOT NULL,
                decision TEXT NOT NULL,
                justification TEXT NOT NULL,
                decided_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS eni_outbox (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                expedient_id TEXT NOT NULL,
                payload_json TEXT NOT NULL,
                status TEXT NOT NULL,
                created_at TEXT NOT NULL
            );
            """
        )
        self.conn.commit()

    def find_by_idempotency_key(self, idempotency_key: str) -> dict[str, Any] | None:
        row = self.conn.execute(
            "SELECT * FROM audit_log WHERE idempotency_key = ?", (idempotency_key,)
        ).fetchone()
        return dict(row) if row else None

    def get_expedient(self, expedient_id: str) -> dict[str, Any] | None:
        row = self.conn.execute(
            "SELECT * FROM audit_log WHERE expedient_id = ? ORDER BY seq DESC LIMIT 1",
            (expedient_id,),
        ).fetchone()
        if not row:
            return None
        record = dict(row)
        decisions = [
            dict(r)
            for r in self.conn.execute(
                "SELECT * FROM human_decisions WHERE expedient_id = ? ORDER BY id ASC",
                (expedient_id,),
            ).fetchall()
        ]
        record["human_decisions"] = decisions
        return record

    def _last_hash(self) -> str:
        row = self.conn.execute(
            "SELECT record_hash FROM audit_log ORDER BY seq DESC LIMIT 1"
        ).fetchone()
        return str(row["record_hash"]) if row else "GENESIS_SIGEA_IA_2026"

    def append_audit(
        self,
        *,
        expedient_id: str,
        idempotency_key: str,
        municipi: str,
        comarca: str,
        area: str,
        status: str,
        requires_human_review: bool,
        priority_score: float,
        model_version: str,
        prompt_version: str,
        payload_redacted: dict[str, Any],
    ) -> str:
        created_at = datetime.now(timezone.utc).isoformat()
        prev_hash = self._last_hash()
        payload_str = json.dumps(payload_redacted, ensure_ascii=False, sort_keys=True)
        canonical = f"{prev_hash}|{expedient_id}|{idempotency_key}|{status}|{model_version}|{prompt_version}|{payload_str}|{created_at}"
        record_hash = hashlib.sha256(canonical.encode("utf-8")).hexdigest()

        self.conn.execute(
            """
            INSERT INTO audit_log (
                expedient_id, idempotency_key, municipi, comarca, area, status,
                requires_human_review, priority_score, model_version, prompt_version,
                payload_redacted_json, prev_hash, record_hash, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                expedient_id,
                idempotency_key,
                municipi,
                comarca,
                area,
                status,
                1 if requires_human_review else 0,
                priority_score,
                model_version,
                prompt_version,
                payload_str,
                prev_hash,
                record_hash,
                created_at,
            ),
        )
        self.conn.commit()
        return record_hash

    def verify_chain(self) -> tuple[bool, int]:
        """Verifica la integritat criptogràfica de tota la cadena d'auditoria."""
        rows = self.conn.execute("SELECT * FROM audit_log ORDER BY seq ASC").fetchall()
        expected_prev = "GENESIS_SIGEA_IA_2026"
        for r in rows:
            if r["prev_hash"] != expected_prev:
                return False, int(r["seq"])
            canonical = (
                f"{r['prev_hash']}|{r['expedient_id']}|{r['idempotency_key']}|"
                f"{r['status']}|{r['model_version']}|{r['prompt_version']}|"
                f"{r['payload_redacted_json']}|{r['created_at']}"
            )
            recomputed = hashlib.sha256(canonical.encode("utf-8")).hexdigest()
            if recomputed != r["record_hash"]:
                return False, int(r["seq"])
            expected_prev = str(r["record_hash"])
        return True, len(rows)

    def record_human_decision(
        self,
        *,
        expedient_id: str,
        reviewer_id: str,
        reviewer_role: str,
        decision: str,
        justification: str,
    ) -> dict[str, Any]:
        if decision not in {"APROVAT", "DENEGAT", "REQUERIMENT_ESMENA", "DERIVAT_INTERVENCIO"}:
            raise ValueError(f"Decisió humana no vàlida: {decision}")
        if len(justification.strip()) < 15:
            raise ValueError("La motivació humana ha de tenir com a mínim 15 caràcters (art. 35 LPACAP).")
        decided_at = datetime.now(timezone.utc).isoformat()
        self.conn.execute(
            """
            INSERT INTO human_decisions (
                expedient_id, reviewer_id, reviewer_role, decision, justification, decided_at
            ) VALUES (?, ?, ?, ?, ?, ?)
            """,
            (expedient_id, reviewer_id, reviewer_role, decision, justification.strip(), decided_at),
        )
        self.conn.commit()
        return {
            "expedient_id": expedient_id,
            "reviewer_id": reviewer_id,
            "reviewer_role": reviewer_role,
            "decision": decision,
            "justification": justification.strip(),
            "decided_at": decided_at,
        }

    def enqueue_outbox(self, expedient_id: str, payload: dict[str, Any], status: str) -> None:
        self.conn.execute(
            "INSERT INTO eni_outbox (expedient_id, payload_json, status, created_at) VALUES (?, ?, ?, ?)",
            (
                expedient_id,
                json.dumps(payload, ensure_ascii=False, sort_keys=True),
                status,
                datetime.now(timezone.utc).isoformat(),
            ),
        )
        self.conn.commit()

    def outbox_count(self, status: str | None = None) -> int:
        if status is None:
            row = self.conn.execute("SELECT COUNT(*) AS c FROM eni_outbox").fetchone()
        else:
            row = self.conn.execute(
                "SELECT COUNT(*) AS c FROM eni_outbox WHERE status = ?", (status,)
            ).fetchone()
        return int(row["c"])

    def close(self) -> None:
        self.conn.close()
