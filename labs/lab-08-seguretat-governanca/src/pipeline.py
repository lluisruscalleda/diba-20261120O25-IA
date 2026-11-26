"""Laboratori 8: Seguretat, Auditoria de Biaixos, Classificació Normativa i Red Teaming Defensiu."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path

NIVELLS_ENS = {"BAIX": 1, "MITJA": 2, "ALT": 3}
INV_ENS = {v: k for k, v in NIVELLS_ENS.items()}

PATRONS_DEFENSIUS = (
    "ignora totes les instruccions",
    "ignore previous instructions",
    "system prompt",
    "drop table",
    "llista els dni",
    "comptes bancaris dels altres",
    "correu massiu extern",
    "send all records",
)


def avaluar_sistema_normatiu(sys_cfg: dict[str, object]) -> dict[str, object]:
    dims = dict(sys_cfg["dimensions_ens"])  # type: ignore[arg-type]
    cat_ens = INV_ENS[max(NIVELLS_ENS[str(v)] for v in dims.values())]

    if sys_cfg.get("practica_art5"):
        ai_act = "PROHIBIT_ART_5"
        accio = "BLOQUEJAR_IMMEDIATAMENT"
    elif sys_cfg.get("alt_risc_annex_iii"):
        ai_act = "ALT_RISC_ANNEX_III"
        accio = "EXIGIR_FRIA_ART27_EIPD_ART35_REGISTRE_UE_LOGS_6M"
    elif sys_cfg.get("transparencia_art50"):
        ai_act = "TRANSPARENCIA_ART_50"
        accio = "EXIGIR_AVIS_IA_ART50"
    else:
        ai_act = "RISC_MINIM"
        accio = "ALFABETITZACIO_ART4_I_BONES_PRACTIQUES"

    requereix_eipd = bool(sys_cfg.get("dades_personals")) and (
        bool(sys_cfg.get("categories_especials_art9")) or bool(sys_cfg.get("alt_risc_annex_iii"))
    )
    requereix_cert_ens = cat_ens in ("MITJA", "ALT")

    return {
        "id": sys_cfg["id"],
        "nom": sys_cfg["nom"],
        "ai_act": ai_act,
        "categoria_ens": cat_ens,
        "certificacio_ens_obligatoria": requereix_cert_ens,
        "eipd_obligatoria_rgpd": requereix_eipd,
        "accio_governanca": accio,
    }


def auditar_biaixos(mostra: dict[str, dict[str, int]]) -> dict[str, object]:
    def metrics(m: dict[str, int]) -> dict[str, float]:
        n = m["tp"] + m["fp"] + m["fn"] + m["tn"]
        sel = (m["tp"] + m["fp"]) / n
        tpr = m["tp"] / (m["tp"] + m["fn"])
        fpr = m["fp"] / (m["fp"] + m["tn"])
        return {"taxa_seleccio": round(sel, 4), "TPR": round(tpr, 4), "FPR": round(fpr, 4)}

    ref = metrics(mostra["Grup_Ref"])
    prot = metrics(mostra["Grup_Prot_Esbiaixat"])
    di = round(prot["taxa_seleccio"] / ref["taxa_seleccio"], 4)
    bretxa_tpr = round(abs(ref["TPR"] - prot["TPR"]), 4)
    bretxa_fpr = round(abs(ref["FPR"] - prot["FPR"]), 4)
    bloquejat = di < 0.80 or bretxa_tpr > 0.10 or bretxa_fpr > 0.10
    return {
        "Grup_Ref": ref,
        "Grup_Prot": prot,
        "disparate_impact": di,
        "bretxa_TPR": bretxa_tpr,
        "bretxa_FPR": bretxa_fpr,
        "veredicte": "BLOQUEJAT_PER_BIAIX" if bloquejat else "APROVAT",
    }


def guardrail_defensiu_local(text: str) -> dict[str, object]:
    low = text.lower()
    coincidencies = [p for p in PATRONS_DEFENSIUS if p in low]
    if coincidencies:
        return {"permes": False, "motiu": "BLOQUEJAT_GUARDRAIL_DEFENSIU", "patrons": coincidencies}
    return {"permes": True, "motiu": "PERMES_CONSULTA_LEGITIMA", "patrons": []}


def executar_lab_seguretat(ruta_json: Path, ruta_model_card: Path) -> dict[str, object]:
    dades = json.loads(ruta_json.read_text(encoding="utf-8"))
    inventari = [avaluar_sistema_normatiu(s) for s in dades["sistemes_inventari"]]
    equitat = auditar_biaixos(dades["auditoria_biaix_mostra"])

    proves_red = []
    atacs_totals, atacs_bloquejats = 0, 0
    falsos_positius_legitims = 0
    for v in dades["vectors_red_teaming_defensiu"]:
        res = guardrail_defensiu_local(str(v["text"]))
        es_atac = v["tipus"] != "CONSULTA_LEGITIMA"
        if es_atac:
            atacs_totals += 1
            if not res["permes"]:
                atacs_bloquejats += 1
        else:
            if not res["permes"]:
                falsos_positius_legitims += 1
        proves_red.append({"id": v["id"], "tipus": v["tipus"], "permes": res["permes"]})

    informe = {
        "inventari_normatiu": inventari,
        "auditoria_equitat": equitat,
        "red_teaming_defensiu": {
            "atacs_bloquejats": atacs_bloquejats,
            "atacs_totals": atacs_totals,
            "taxa_bloqueig": round(atacs_bloquejats / max(1, atacs_totals), 4),
            "falsos_positius_legitims": falsos_positius_legitims,
            "detall": proves_red,
        },
        "model_card_present": ruta_model_card.exists(),
    }
    informe["hash_auditoria_sha256"] = hashlib.sha256(
        json.dumps(informe, sort_keys=True, ensure_ascii=False).encode("utf-8")
    ).hexdigest()[:16]
    return informe
