"""Laboratori 3: Assistent normatiu RAG amb cites, abstenció, agent amb eines i RAG vs Fine-tuning."""

from __future__ import annotations

import json
import math
import re
from collections import Counter
from pathlib import Path

STOPWORDS = {"el", "la", "els", "les", "de", "del", "dels", "a", "al", "en", "per", "amb", "un", "una", "que", "es", "i", "o", "quin", "quina", "com"}


def _toks(text: str) -> list[str]:
    mapa = str.maketrans("àèéíïòóúüç·", "aeeiioouuc ")
    net = re.sub(r"\b[ldsnm]['’]", " ", text.lower()).translate(mapa)
    return [t for t in re.findall(r"[a-z0-9]{2,}", net) if t not in STOPWORDS]


class MotorRAGNormatiu:
    """Motor RAG determinista local amb filtratge obligatori de vigència i porta d'abstenció."""

    def __init__(self, docs: list[dict[str, object]], llindar_evidencia: float = 0.8) -> None:
        # Filtre estricte de vigència: mai no indexem normativa derogada per evitar confusió!
        self.docs_vigents = [d for d in docs if d.get("vigent") is True]
        self.llindar = llindar_evidencia
        self.toks_docs = [_toks(f"{d['titol']} {d['text']}") for d in self.docs_vigents]
        self.avg_len = sum(len(t) for t in self.toks_docs) / max(1, len(self.toks_docs))
        self.df: Counter[str] = Counter()
        for toks in self.toks_docs:
            for t in set(toks):
                self.df[t] += 1

    def _bm25(self, q_toks: list[str], doc_toks: list[str], k1: float = 1.5, b: float = 0.75) -> float:
        n = len(self.docs_vigents)
        cnt = Counter(doc_toks)
        score = 0.0
        dl = len(doc_toks)
        for t in q_toks:
            if t not in cnt:
                continue
            idf = math.log((n - self.df[t] + 0.5) / (self.df[t] + 0.5) + 1.0)
            tf = cnt[t]
            score += idf * (tf * (k1 + 1)) / (tf + k1 * (1 - b + b * dl / max(1.0, self.avg_len)))
        return score

    def consultar(self, pregunta: str, top_k: int = 2) -> dict[str, object]:
        q_toks = _toks(pregunta)
        puntuats = []
        for doc, d_toks in zip(self.docs_vigents, self.toks_docs):
            sc = self._bm25(q_toks, d_toks)
            puntuats.append((sc, doc))
        puntuats.sort(key=lambda x: x[0], reverse=True)

        if not puntuats or puntuats[0][0] < self.llindar:
            return {
                "pregunta": pregunta,
                "abstencio": True,
                "resposta": (
                    "No disposo d'evidència normativa vigent suficient al corpus per respondre "
                    "aquesta pregunta amb rigor. Consulta el BOPB o contacta amb atenció ciutadana."
                ),
                "cites": [],
                "millor_score": round(puntuats[0][0], 4) if puntuats else 0.0,
            }

        seleccionats = [(sc, d) for sc, d in puntuats[:top_k] if sc >= self.llindar]
        cites = [f"[{d['doc_id']}, {d['article']}]" for _, d in seleccionats]
        millor_doc = seleccionats[0][1]
        resposta = (
            f"Segons la normativa vigent {cites[0]} ({millor_doc['titol']}): "
            f"{millor_doc['text']}"
        )
        return {
            "pregunta": pregunta,
            "abstencio": False,
            "resposta": resposta,
            "cites": cites,
            "millor_score": round(seleccionats[0][0], 4),
        }


def eina_calcular_bonificacio_ibi(quota_anual_eur: float, plaques_solars: bool) -> dict[str, object]:
    """Eina determinista (OF-IBI-2026, art. 9): 50% amb topall de 400 EUR anuals."""
    if not plaques_solars or quota_anual_eur <= 0:
        return {"bonificacio_eur": 0.0, "quota_final_eur": round(max(0.0, quota_anual_eur), 2), "norma": "OF-IBI-2026, art. 9"}
    bonificacio = min(quota_anual_eur * 0.50, 400.0)
    return {
        "bonificacio_eur": round(bonificacio, 2),
        "quota_final_eur": round(quota_anual_eur - bonificacio, 2),
        "norma": "OF-IBI-2026, art. 9",
    }


def decidir_rag_vs_finetuning(
    coneixement_canvia_sovint: bool,
    cal_citacio_verificable: bool,
    conte_pii_personals: bool,
    cal_canviar_estil_o_format: bool,
) -> dict[str, object]:
    """Matriu de decisió arquitectònica per a l'Administració pública."""
    if conte_pii_personals or coneixement_canvia_sovint or cal_citacio_verificable:
        recomanacio = "RAG_PRIORITARI"
        motiu = (
            "El RAG permet actualitzar normativa sense reentrenar, citar fonts verificables "
            "i aplicar RBAC + dret de supressió sense memoritzar PII als pesos."
        )
        if cal_canviar_estil_o_format:
            recomanacio = "RAG_MES_ADAPTACIO_ESTIL_SENSE_PII"
    else:
        recomanacio = "FINE_TUNING_LORA"
        motiu = "Tasca estable d'estil/format sobre dades no personals."
    return {"recomanacio": recomanacio, "motiu": motiu}


def executar_lab_rag(ruta_corpus: Path) -> dict[str, object]:
    docs = json.loads(ruta_corpus.read_text(encoding="utf-8"))
    rag = MotorRAGNormatiu(docs)

    q_vigent = rag.consultar("Quina bonificació de l'IBI tinc si poso plaques solars?")
    q_fora_domini = rag.consultar("Quin és el calendari d'impostos sobre criptomonedes a Andorra?")
    calcul_agent = eina_calcular_bonificacio_ibi(quota_anual_eur=950.0, plaques_solars=True)
    decisio = decidir_rag_vs_finetuning(
        coneixement_canvia_sovint=True,
        cal_citacio_verificable=True,
        conte_pii_personals=True,
        cal_canviar_estil_o_format=False,
    )
    return {
        "docs_totals": len(docs),
        "docs_vigents_indexats": len(rag.docs_vigents),
        "consulta_normativa_vigent": q_vigent,
        "consulta_fora_domini_abstencio": q_fora_domini,
        "agent_eina_calcul_ibi": calcul_agent,
        "comparativa_rag_vs_finetuning": decisio,
    }
