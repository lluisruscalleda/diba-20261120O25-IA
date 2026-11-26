#!/usr/bin/env python3
"""Punt d'entrada executable del Laboratori 6 (Automatització intel·ligent)."""

import json
from pathlib import Path
import sys

LAB_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(LAB_DIR / "src"))

from pipeline import orquestrar_lot_expedients  # noqa: E402


def main() -> None:
    res = orquestrar_lot_expedients(LAB_DIR / "data" / "expedients_entrada.json")
    print("=== LABORATORI 6: AUTOMATITZACIÓ INTEL·LIGENT (DIBA) ===")
    print(json.dumps(res, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
