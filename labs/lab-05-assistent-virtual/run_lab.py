#!/usr/bin/env python3
"""Punt d'entrada executable del Laboratori 5 (Assistent virtual ciutadà)."""

import json
from pathlib import Path
import sys

LAB_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(LAB_DIR / "src"))

from pipeline import executar_lab_assistent  # noqa: E402


def main() -> None:
    res = executar_lab_assistent(LAB_DIR / "data" / "base_coneixement.json")
    print("=== LABORATORI 5: ASSISTENT VIRTUAL CIUTADÀ (DIBA) ===")
    print(json.dumps(res, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
