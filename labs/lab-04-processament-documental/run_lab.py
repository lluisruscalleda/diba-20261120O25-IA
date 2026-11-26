#!/usr/bin/env python3
"""Punt d'entrada executable del Laboratori 4 (Processament Intel·ligent de Documents)."""

import json
from pathlib import Path
import sys

LAB_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(LAB_DIR / "src"))

from pipeline import executar_lab_idp  # noqa: E402


def main() -> None:
    res = executar_lab_idp(LAB_DIR / "data" / "pdfs")
    print("=== LABORATORI 4: PROCESSAMENT DOCUMENTAL IDP (DIBA) ===")
    print(json.dumps(res, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
