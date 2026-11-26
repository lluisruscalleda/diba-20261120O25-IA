#!/usr/bin/env python3
"""Punt d'entrada executable del Laboratori 8 (Seguretat i governança de la IA)."""

import json
from pathlib import Path
import sys

LAB_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(LAB_DIR / "src"))

from pipeline import executar_lab_seguretat  # noqa: E402


def main() -> None:
    res = executar_lab_seguretat(
        LAB_DIR / "data" / "auditoria_sintetica.json",
        LAB_DIR / "MODEL_CARD.md",
    )
    print("=== LABORATORI 8: SEGURETAT I GOVERNANÇA DE LA IA (DIBA) ===")
    print(json.dumps(res, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
