#!/usr/bin/env python3
"""Punt d'entrada executable del Laboratori 7 (MLOps i LLMOps)."""

import json
from pathlib import Path
import sys

LAB_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(LAB_DIR / "src"))

from app import executar_lab_mlops  # noqa: E402


def main() -> None:
    res = executar_lab_mlops(LAB_DIR / "data" / "monitoratge_sintetic.json")
    print("=== LABORATORI 7: MLOPS I LLMOPS (DIBA) ===")
    print(json.dumps(res, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
