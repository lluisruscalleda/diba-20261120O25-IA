"""Persistència SQLite local per a l'Acadèmia d'IA (opcional)."""
from __future__ import annotations

import json
import os
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

DEFAULT_DB_PATH = Path(__file__).resolve().parent.parent / "academy.db"


def get_db_path() -> Path:
    env_path = os.getenv("ACADEMY_DB_PATH")
    return Path(env_path) if env_path else DEFAULT_DB_PATH


def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(get_db_path())
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    with get_connection() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS student_state (
                profile_id TEXT PRIMARY KEY,
                payload_json TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
            """
        )
        conn.commit()


def load_state(profile_id: str = "default") -> dict[str, Any] | None:
    with get_connection() as conn:
        row = conn.execute(
            "SELECT payload_json, updated_at FROM student_state WHERE profile_id = ?",
            (profile_id,),
        ).fetchone()
        if not row:
            return None
        return {
            "profileId": profile_id,
            "state": json.loads(row["payload_json"]),
            "updatedAt": row["updated_at"],
        }


def save_state(state: dict[str, Any], profile_id: str = "default") -> str:
    now = datetime.now(timezone.utc).isoformat()
    payload = json.dumps(state, ensure_ascii=False)
    with get_connection() as conn:
        conn.execute(
            """
            INSERT INTO student_state (profile_id, payload_json, updated_at)
            VALUES (?, ?, ?)
            ON CONFLICT(profile_id) DO UPDATE SET
                payload_json = excluded.payload_json,
                updated_at = excluded.updated_at
            """,
            (profile_id, payload, now),
        )
        conn.commit()
    return now
