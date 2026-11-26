#!/usr/bin/env python3
"""Punt d'entrada executable del Laboratori 2 (NLP en català)."""

import json
from pathlib import Path
import sys

LAB_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(LAB_DIR / "src"))

from pipeline import executar_lab_nlp  # noqa: E402


def main() -> None:
    res = executar_lab_nlp(LAB_DIR / "data" / "instancies_catala.json")
    print("=== LABORATORI 2: NLP EN CATALÀ (DIBA) ===")
    print(json.dumps(res, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
