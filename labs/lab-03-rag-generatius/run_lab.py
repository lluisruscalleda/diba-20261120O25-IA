#!/usr/bin/env python3
"""Punt d'entrada executable del Laboratori 3 (RAG i models generatius)."""

import json
from pathlib import Path
import sys

LAB_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(LAB_DIR / "src"))

from pipeline import executar_lab_rag  # noqa: E402


def main() -> None:
    res = executar_lab_rag(LAB_DIR / "data" / "ordenances_sintetiques.json")
    print("=== LABORATORI 3: RAG I MODELS GENERATIUS (DIBA) ===")
    print(json.dumps(res, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
