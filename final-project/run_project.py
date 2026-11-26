#!/usr/bin/env python3
"""Script executable de demostració integral del Projecte Final Integrador (SIGEA-IA).

Executa els 13 passos del flux sobre els 12 expedients sintètics, registra una decisió
humana motivada (art. 35 LPACAP), verifica la cadena criptogràfica SHA-256 i mostra
l'informe MLOps/LLMOps.
"""

from __future__ import annotations

import json
from pathlib import Path

from data.generate_synthetic_data import build_synthetic_expedients
from src.sigea.models import AuditLedger
from src.sigea.pipeline import SigeaPipeline


def main() -> None:
    base_dir = Path(__file__).resolve().parent
    data_path = base_dir / "data" / "expedients_sintetics.json"
    if not data_path.exists():
        data = build_synthetic_expedients()
        data_path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    else:
        data = json.loads(data_path.read_text(encoding="utf-8"))

    ledger = AuditLedger(":memory:")
    pipeline = SigeaPipeline(ledger=ledger)

    print("=== SIGEA-IA: EXECUCIÓ INTEGRAL DEL FLUX DE 13 PASSOS (8 MÒDULS) ===\n")
    for raw in data:
        res = pipeline.process_expedient(raw)
        cites = ", ".join(c["citation"] for c in res.rag_citations) or "cap (abstenció)"
        print(
            f"- {res.expedient_id} | Àrea: {res.area:<32} | Estat: {res.status:<20} | "
            f"Prioritat: {res.priority_score:5.1f} ({res.priority_band:<7}) | "
            f"HITL: {'SÍ' if res.requires_human_review else 'NO'} | Cites: {cites}"
        )

    # Registre d'una decisió humana motivada sobre un expedient crític (EXP-2026-0003)
    human_dec = ledger.record_human_decision(
        expedient_id="EXP-2026-0003",
        reviewer_id="FUNC-SOC-042",
        reviewer_role="tecnic_social",
        decision="APROVAT",
        justification=(
            "Verificat IVS vigent i avís de tall de subministrament elèctric amb dos menors "
            "a càrrec; s'eleva proposta favorable urgent segons REG-AJUTS-2026 art. 12."
        ),
    )
    print("\n=== DECISIÓ HUMANA REGISTRADA (SENSE DECISIÓ AUTÒNOMA) ===")
    print(json.dumps(human_dec, ensure_ascii=False, indent=2))

    report = pipeline.compute_mlops_report()
    print("\n=== INFORME MLOPS / LLMOPS I INTEGRITAT D'AUDITORIA ===")
    print(json.dumps(report, ensure_ascii=False, indent=2))
    ledger.close()


if __name__ == "__main__":
    main()
