#!/usr/bin/env python3
"""Punt d'entrada executable del Laboratori 1 (Machine Learning)."""

import json
from pathlib import Path
import sys

LAB_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(LAB_DIR / "src"))

from pipeline import executar_lab_complet  # noqa: E402


def main() -> None:
    ruta_csv = LAB_DIR / "data" / "sollicituds_sintetiques.csv"
    res = executar_lab_complet(ruta_csv)
    print("=== LABORATORI 1: MACHINE LEARNING (DIBA) ===")
    print(json.dumps(res, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
