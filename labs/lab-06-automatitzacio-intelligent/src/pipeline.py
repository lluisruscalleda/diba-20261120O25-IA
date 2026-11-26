"""Laboratori 6: Orquestrador híbrid d'automatització intel·ligent (Regles + ML + Anti-starvation)."""

from __future__ import annotations

import json
from pathlib import Path

DOCS_OBLIGATORIS: dict[str, set[str]] = {
    "AJUT_EMERGENCIA_SOCIAL": {"SOL_LICITUD", "CERTIFICAT_RENDA", "EMPADRONAMENT"},
    "SUBVENCIO_ENTITAT": {"SOL_LICITUD", "PRESSUPOST", "ESTATUTS"},
    "LLICENCIA_OBRA_MENOR": {"SOL_LICITUD", "PRESSUPOST", "MEMORIA_TECNICA"},
}


def calcular_prioritat_hibrida(exp: dict[str, object]) -> float:
    """Combina urgència legal (regla) + risc/vulnerabilitat (ML) + envelliment (anti-starvation)."""
    dies_termini = max(1, int(exp["dies_fins_termini_legal"]))
    dies_cua = max(0, int(exp["dies_en_cua"]))
    ml_score = float(exp["indicador_vulnerabilitat_ml"])

    urgencia_legal = min(1.0, 7.0 / dies_termini)      # Màxima quan queden <= 7 dies
    aging_bonus = min(0.45, dies_cua * 0.015)          # Evita starvation d'expedients antics!
    score = 0.45 * urgencia_legal + 0.35 * ml_score + aging_bonus
    return round(min(1.0, score), 4)


def orquestrar_lot_expedients(ruta_json: Path) -> dict[str, object]:
    entrades = json.loads(ruta_json.read_text(encoding="utf-8"))
    vistos: set[str] = set()
    duplicats_ignorats: list[str] = []
    esmenes_art68: list[dict[str, object]] = []
    cua_tramitacio: list[dict[str, object]] = []

    for exp in entrades:
        reg_id = str(exp["registre_id"])
        # 1. Idempotència obligatòria
        if reg_id in vistos:
            duplicats_ignorats.append(reg_id)
            continue
        vistos.add(reg_id)

        # 2. Validació documental determinista (Shift-Left / Art. 68 LPACAP)
        tipus = str(exp["tipus"])
        requerits = DOCS_OBLIGATORIS.get(tipus, {"SOL_LICITUD"})
        aportats = set(exp.get("docs_aportats", []))  # type: ignore[arg-type]
        mancants = sorted(requerits - aportats)
        if mancants:
            esmenes_art68.append(
                {
                    "registre_id": reg_id,
                    "tipus": tipus,
                    "estat": "ESBORRANY_REQUERIMENT_ESMENA_ART68",
                    "termini_esmena_dies_habils": 10,
                    "documents_mancants": mancants,
                    "requereix_signatura_humana": True,
                }
            )
            continue

        # 3. Priorització híbrida (Regles + ML + Aging) i enrutament
        prio = calcular_prioritat_hibrida(exp)
        import_eur = float(exp["import_eur"])
        if import_eur >= 25000.0:
            ruta = "ESCALADA_CAP_SERVEI_I_INTERVENCIO"
        elif prio >= 0.70:
            ruta = "CUA_PRIORITAT_ALTA_HITL"
        else:
            ruta = "CUA_TRAMITACIO_ESTANDARD"

        cua_tramitacio.append(
            {
                "registre_id": reg_id,
                "tipus": tipus,
                "import_eur": import_eur,
                "dies_en_cua": exp["dies_en_cua"],
                "prioritat_score": prio,
                "ruta_assignada": ruta,
            }
        )

    # Ordenem la cua per prioritat descendent
    cua_tramitacio.sort(key=lambda x: float(x["prioritat_score"]), reverse=True)
    return {
        "total_entrades_rebudes": len(entrades),
        "duplicats_ignorats_idempotencia": duplicats_ignorats,
        "esmenes_art68_lpacap": esmenes_art68,
        "cua_tramitacio_ordenada": cua_tramitacio,
    }
