"""Laboratori 2: NLP en català (Preprocés, TF-IDF, NER i comparativa lèxica vs. semàntica)."""

from __future__ import annotations

import json
import math
import re
from collections import Counter, defaultdict
from pathlib import Path

STOPWORDS_CA = {
    "el", "la", "els", "les", "un", "una", "uns", "unes", "de", "del", "dels",
    "a", "al", "als", "en", "per", "amb", "i", "o", "que", "es", "hi", "ha",
    "pel", "pels", "sobre", "des", "com", "mes", "se", "su", "cal", "dos",
    "sollicito", "sollicitud", "demano", "presento", "comunico", "necessito",
    "vull", "ajuntament", "municipal", "municipals",
}

MUNICIPIS_DIBA = {"vic", "mataró", "sabadell", "manresa", "granollers", "terrassa", "barcelona"}

# Espai semàntic conceptual (8 dimensions latents) per demostrar la diferència TF-IDF vs Embeddings
CONCEPTES_SEMANCS: dict[str, list[float]] = {
    # [obres, tributs, habitatge_ajut, familia_social, enllumenat, via_neteja, vehicle, documentacio]
    "llicencia": [1.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.4],
    "obres": [1.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
    "reforma": [0.95, 0.0, 0.1, 0.0, 0.0, 0.0, 0.0, 0.0],
    "rehabilitacio": [0.9, 0.0, 0.2, 0.0, 0.0, 0.0, 0.0, 0.0],
    "facana": [0.9, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
    "ibi": [0.0, 1.0, 0.1, 0.0, 0.0, 0.0, 0.0, 0.0],
    "impost": [0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 0.1, 0.0],
    "tributs": [0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
    "taxa": [0.0, 0.95, 0.0, 0.0, 0.0, 0.1, 0.0, 0.0],
    "rebut": [0.0, 0.9, 0.0, 0.0, 0.0, 0.0, 0.0, 0.3],
    "pagar": [0.0, 0.5, 0.5, 0.0, 0.0, 0.0, 0.0, 0.0],
    "subvencions": [0.0, 0.0, 0.95, 0.4, 0.0, 0.0, 0.0, 0.0],
    "lloguer": [0.0, 0.0, 1.0, 0.2, 0.0, 0.0, 0.0, 0.0],
    "habitatge": [0.1, 0.0, 1.0, 0.2, 0.0, 0.0, 0.0, 0.0],
    "pis": [0.1, 0.0, 1.0, 0.2, 0.0, 0.0, 0.0, 0.0],
    "ajut": [0.0, 0.0, 0.9, 0.6, 0.0, 0.0, 0.0, 0.0],
    "beca": [0.0, 0.0, 0.5, 0.95, 0.0, 0.0, 0.0, 0.0],
    "menjador": [0.0, 0.0, 0.2, 1.0, 0.0, 0.0, 0.0, 0.0],
    "social": [0.0, 0.0, 0.5, 0.95, 0.0, 0.0, 0.0, 0.0],
    "vulnerable": [0.0, 0.0, 0.6, 0.95, 0.0, 0.0, 0.0, 0.0],
    "fanals": [0.0, 0.0, 0.0, 0.0, 1.0, 0.3, 0.0, 0.0],
    "enllumenat": [0.0, 0.0, 0.0, 0.0, 1.0, 0.3, 0.0, 0.0],
    "llum": [0.0, 0.0, 0.0, 0.0, 1.0, 0.2, 0.0, 0.0],
    "carrer": [0.1, 0.0, 0.0, 0.0, 0.5, 0.7, 0.0, 0.0],
    "vorera": [0.0, 0.0, 0.0, 0.0, 0.2, 1.0, 0.0, 0.0],
    "semafor": [0.0, 0.0, 0.0, 0.0, 0.6, 0.7, 0.4, 0.0],
    "asfalt": [0.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.3, 0.0],
    "contenidors": [0.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0],
    "neteja": [0.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0],
}


def treure_accents(text: str) -> str:
    mapa = str.maketrans("àèéíïòóúüç·", "aeeiioouuc ")
    return text.lower().translate(mapa)


def tokenitzar_catala(text: str) -> list[str]:
    text = text.lower()
    # Separem contraccions apostrofades habituals en català (l', d', s', n')
    text = re.sub(r"\b[ldsnm]['’]", " ", text)
    text = treure_accents(text)
    tokens = re.findall(r"[a-z]{2,}", text)
    return [t for t in tokens if t not in STOPWORDS_CA]


def cosinus(v1: dict[str, float], v2: dict[str, float]) -> float:
    comuns = set(v1) & set(v2)
    num = sum(v1[k] * v2[k] for k in comuns)
    den = math.sqrt(sum(x * x for x in v1.values())) * math.sqrt(sum(x * x for x in v2.values()))
    return num / den if den > 1e-12 else 0.0


def cosinus_dens(a: list[float], b: list[float]) -> float:
    num = sum(x * y for x, y in zip(a, b))
    den = math.sqrt(sum(x * x for x in a)) * math.sqrt(sum(x * x for x in b))
    return num / den if den > 1e-12 else 0.0


class ClassificadorTFIDF:
    def __init__(self) -> None:
        self.idf: dict[str, float] = {}
        self.centroides: dict[str, dict[str, float]] = {}

    def _tfidf(self, tokens: list[str]) -> dict[str, float]:
        cnt = Counter(tokens)
        total = max(1, len(tokens))
        return {t: (c / total) * self.idf.get(t, 0.0) for t, c in cnt.items() if t in self.idf}

    def entrenar(self, docs: list[dict[str, str]]) -> None:
        n = len(docs)
        df: Counter[str] = Counter()
        toks_per_doc = []
        for d in docs:
            toks = tokenitzar_catala(d["text"])
            toks_per_doc.append((d["dept"], toks))
            for t in set(toks):
                df[t] += 1
        self.idf = {t: math.log((n + 1) / (f + 1)) + 1.0 for t, f in df.items()}

        sumes: dict[str, dict[str, float]] = defaultdict(lambda: defaultdict(float))
        comptes: Counter[str] = Counter()
        for dept, toks in toks_per_doc:
            vec = self._tfidf(toks)
            for t, val in vec.items():
                sumes[dept][t] += val
            comptes[dept] += 1

        self.centroides = {
            dept: {t: val / comptes[dept] for t, val in vec.items()}
            for dept, vec in sumes.items()
        }

    def predir(self, text: str) -> tuple[str, float]:
        vec = self._tfidf(tokenitzar_catala(text))
        millor_dept, millor_sim = "", -1.0
        for dept, cent in self.centroides.items():
            sim = cosinus(vec, cent)
            if sim > millor_sim:
                millor_dept, millor_sim = dept, sim
        return millor_dept, round(millor_sim, 4)


def extreure_entitats_ner(text: str) -> dict[str, list[str]]:
    """NER administratiu i detecció preventiva de PII fictícia."""
    entitats: dict[str, list[str]] = {
        "EXPEDIENT": re.findall(r"\bEXP-\d{4}-\d{3,6}\b", text),
        "DATA": re.findall(r"\b\d{2}/\d{2}/\d{4}\b", text),
        "IMPORT_EUR": re.findall(r"\b\d+(?:[.,]\d+)?\s*(?:EUR|€)\b", text),
        "DNI_PII": re.findall(r"\b\d{8}[A-Za-z]\b", text),
        "EMAIL_PII": re.findall(r"\b[\w.+-]+@[\w-]+\.[\w.-]+\b", text),
        "MUNICIPI": [m.capitalize() for m in MUNICIPIS_DIBA if m in text.lower()],
    }
    return {k: v for k, v in entitats.items() if v}


def embedding_semantic(text: str) -> list[float]:
    toks = tokenitzar_catala(text)
    vec = [0.0] * 8
    hits = 0
    for t in toks:
        if t in CONCEPTES_SEMANCS:
            for i, val in enumerate(CONCEPTES_SEMANCS[t]):
                vec[i] += val
            hits += 1
    return [v / hits for v in vec] if hits else vec


def comparar_tfidf_vs_embeddings(docs: list[dict[str, str]]) -> list[dict[str, object]]:
    """Compara cerca purament lèxica (TF-IDF) vs. cerca semàntica en consultes amb sinònims."""
    clf = ClassificadorTFIDF()
    clf.entrenar(docs)
    doc_vecs_tfidf = [(d["id"], d["dept"], clf._tfidf(tokenitzar_catala(d["text"]))) for d in docs]
    doc_vecs_emb = [(d["id"], d["dept"], embedding_semantic(d["text"])) for d in docs]

    consultes = [
        {"consulta": "ajut per pagar el pis", "dept_esperat": "SERVEIS_SOCIALS"},
        {"consulta": "no funciona la llum del carrer", "dept_esperat": "VIA_PUBLICA"},
    ]
    resultats = []
    for c in consultes:
        q_tfidf = clf._tfidf(tokenitzar_catala(c["consulta"]))
        top_lex = max(doc_vecs_tfidf, key=lambda x: cosinus(q_tfidf, x[2]))
        sim_lex = round(cosinus(q_tfidf, top_lex[2]), 4)

        q_emb = embedding_semantic(c["consulta"])
        top_sem = max(doc_vecs_emb, key=lambda x: cosinus_dens(q_emb, x[2]))
        sim_sem = round(cosinus_dens(q_emb, top_sem[2]), 4)

        resultats.append(
            {
                "consulta": c["consulta"],
                "dept_esperat": c["dept_esperat"],
                "tfidf_top1": {"doc": top_lex[0], "dept": top_lex[1], "sim": sim_lex},
                "embedding_top1": {"doc": top_sem[0], "dept": top_sem[1], "sim": sim_sem},
            }
        )
    return resultats


def executar_lab_nlp(ruta_json: Path) -> dict[str, object]:
    docs = json.loads(ruta_json.read_text(encoding="utf-8"))
    # Validació creuada Leave-One-Out (LOOCV) sobre les 16 instàncies
    encerts = 0
    for i, doc_test in enumerate(docs):
        train = docs[:i] + docs[i + 1 :]
        clf = ClassificadorTFIDF()
        clf.entrenar(train)
        pred, _ = clf.predir(doc_test["text"])
        if pred == doc_test["dept"]:
            encerts += 1

    ner_mostres = [
        {"id": d["id"], "entitats": extreure_entitats_ner(d["text"])}
        for d in docs
        if extreure_entitats_ner(d["text"])
    ]
    comparativa = comparar_tfidf_vs_embeddings(docs)
    return {
        "n_instancies": len(docs),
        "loocv_accuracy_tfidf": round(encerts / len(docs), 4),
        "docs_amb_entitats_ner": len(ner_mostres),
        "exemple_ner": ner_mostres[:4],
        "comparativa_lexica_vs_semantica": comparativa,
    }
