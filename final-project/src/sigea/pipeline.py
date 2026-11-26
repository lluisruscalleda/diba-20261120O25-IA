"""Motor de referència SIGEA-IA: flux complet de 13 passos integrant els 8 mòduls.

Principi rector obligatori:
  - El sistema dona SUPORT a la tramitació administrativa.
  - MAI adopta una decisió administrativa final autònoma (`autonomous_final_decision=False`).
  - Tota proposta requereix validació/resolució de l'òrgan o persona funcionària competent
    (art. 22 RGPD, art. 14 AI Act, art. 41 LRJSP i art. 35 LPACAP).
"""

from __future__ import annotations

import json
import math
import re
import statistics
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from .models import AuditLedger, ExpedientInput, PipelineResult

NIF_LETTERS = "TRWAGMYFPDXBNJZSQVHLCKE"
ALLOWED_ROLES = {"tecnic_tramitador", "tecnic_social", "interventor", "admin_auditor"}

# Patrons defensius de detecció de Prompt Injection directe i indirecte (Mòdul 8)
INJECTION_PATTERNS = [
    r"ignore\s+(all\s+)?previous\s+instructions",
    r"approve\s+automatically",
    r"without\s+human\s+review",
    r"reveal\s+system\s+prompt",
    r"ignora\s+les\s+instruccions\s+anteriors",
    r"eludeix\s+la\s+revisi[oó]\s+humana",
]

# Patrons PII per redacció/pseudonimització als logs (RGPD + DA 7a LOPDGDD)
RE_NIF = re.compile(r"\b\d{8}[A-Za-z]\b")
RE_IBAN = re.compile(r"\bES\d{22}\b")
RE_EMAIL = re.compile(r"\b[\w.\-+]+@[\w\-]+\.[A-Za-z]{2,}\b")
RE_PHONE = re.compile(r"\b(?:\+34\s?)?[6789]\d{8}\b")

# Diccionari NLP ponderat per àrea administrativa (Mòduls 1 i 2)
AREA_KEYWORDS: dict[str, list[str]] = {
    "Hisenda i Tributs": [
        "ibi", "bonificació", "plaques", "solars", "fotovoltaiques", "autoconsum",
        "tribut", "quota", "impost", "cie", "fiscal",
    ],
    "Urbanisme": [
        "obra", "obres", "llicència", "comunicació", "prèvia", "façana", "reforma",
        "bany", "icio", "pressupost", "paviment", "estructural",
    ],
    "Serveis Socials": [
        "ajut", "emergència", "social", "pobresa", "energètica", "tall", "elèctric",
        "menors", "vulnerables", "ivs", "valoració", "llar",
    ],
    "Medi Ambient": [
        "abocament", "residus", "perillosos", "riera", "contenidors", "sorolls",
        "acústica", "inspecció", "ambiental", "salut", "pudor",
    ],
    "Contractació": [
        "factura", "contracte", "menor", "proveïdor", "serveis", "subministrament",
        "manteniment", "servidors", "equipament", "lcsp", "intervenció",
    ],
}

# Requisits documentals deterministes per àrea (Mòduls 4 i 6)
REQUIRED_ATTACHMENTS_BY_AREA: dict[str, list[str]] = {
    "Hisenda i Tributs": ["CIE", "factura_pagada"],
    "Urbanisme": ["pressupost_detallat", "memoria_tecnica", "ICIO"],
    "Serveis Socials": ["IVS", "avis_tall"],
    "Medi Ambient": ["fotografia_geolocalitzada"],
    "Contractació": ["factura_electronica"],
}

# Sinònims per millorar la cerca semàntica/híbrida en català (Mòduls 2 i 3)
SYNONYMS: dict[str, list[str]] = {
    "fotovoltaiques": ["solar", "solars", "plaques", "autoconsum"],
    "talls": ["tall", "subministrament", "elèctric", "pobresa"],
    "reforma": ["obra", "obres", "llicència", "comunicació"],
    "abocaments": ["abocament", "residus", "sorolls", "ambiental"],
    "factures": ["factura", "contracte", "menor", "proveïdor"],
}


# Stopwords catalanes per evitar falsos positius lèxics en recuperació RAG (Mòdul 2)
CATALAN_STOPWORDS = {
    "a", "al", "als", "amb", "cap", "com", "de", "del", "dels", "el", "els", "en",
    "es", "hi", "i", "la", "les", "ni", "no", "o", "per", "que", "s", "se", "sense",
    "si", "sobre", "un", "una", "uns", "unes", "pel", "pels", "cal", "son", "són",
}


def tokenize_catalan(text: str) -> list[str]:
    """Tokenitzador adaptat al català que separa apòstrofs i guionets (Mòdul 2)."""
    cleaned = text.lower().replace("’", "'")
    cleaned = re.sub(r"\b(?:l|d|s|m|t|n)'", " ", cleaned)
    return re.findall(r"[a-zàèéíïòóúüç0-9]+", cleaned)


def validate_nif(nif: str) -> bool:
    """Validació determinista de lletra de NIF (mòdul 23)."""
    cleaned = nif.strip().upper()
    if not re.fullmatch(r"\d{8}[A-Z]", cleaned):
        return False
    num = int(cleaned[:8])
    return NIF_LETTERS[num % 23] == cleaned[8]


def redact_pii(text: str) -> tuple[str, int]:
    """Redacta PII abans d'emmagatzemar en logs/auditoria (RGPD + DA 7a LOPDGDD)."""
    count = 0

    def _sub(pattern: re.Pattern[str], repl: str, src: str) -> str:
        nonlocal count
        src, n = pattern.subn(repl, src)
        count += n
        return src

    out = text
    out = _sub(RE_NIF, "[NIF_REDACTAT]", out)
    out = _sub(RE_IBAN, "[IBAN_REDACTAT]", out)
    out = _sub(RE_EMAIL, "[EMAIL_REDACTAT]", out)
    out = _sub(RE_PHONE, "[TELEFON_REDACTAT]", out)
    return out, count


class ExternalEniConnector:
    """Connector resilient cap al registre corporatiu ENI amb Circuit Breaker (Pas 13 / M7)."""

    def __init__(self, failure_threshold: int = 2, force_down: bool = False) -> None:
        self.failure_threshold = failure_threshold
        self.force_down = force_down
        self.consecutive_failures = 0
        self.circuit_open = False

    def send_eni_package(self, expedient_id: str, payload: dict[str, Any]) -> bool:
        if self.circuit_open:
            return False
        if self.force_down:
            self.consecutive_failures += 1
            if self.consecutive_failures >= self.failure_threshold:
                self.circuit_open = True
            return False
        self.consecutive_failures = 0
        return True


class SigeaPipeline:
    """Pipeline complet de 13 passos integrant els 8 mòduls del temari oficial."""

    MODEL_VERSION = "sigea-nlp-rag-v1.0.0"
    PROMPT_VERSION = "prompt-esborrany-v1.0.0"
    AI_NOTICE = (
        "AVÍS DE TRANSPARÈNCIA (Art. 50 Reglament (UE) 2024/1689 - AI Act): "
        "Aquest esborrany ha estat generat amb suport d'un sistema d'intel·ligència artificial "
        "i no constitueix cap resolució administrativa definitiva. Requereix revisió i signatura "
        "del personal funcionari competent."
    )

    def __init__(
        self,
        *,
        corpus_path: str | Path | None = None,
        ledger: AuditLedger | None = None,
        eni_connector: ExternalEniConnector | None = None,
    ) -> None:
        default_corpus = Path(__file__).resolve().parents[2] / "data" / "ordenances_sintetiques.json"
        self.corpus_path = Path(corpus_path) if corpus_path else default_corpus
        self.corpus: list[dict[str, Any]] = json.loads(self.corpus_path.read_text(encoding="utf-8"))
        self.ledger = ledger if ledger is not None else AuditLedger(":memory:")
        self.eni = eni_connector if eni_connector is not None else ExternalEniConnector()

        # Històric sintètic d'imports per al detector MAD (Mòdul 1) i PSI de drift (Mòdul 7)
        self.baseline_amounts = [250.0, 320.0, 420.0, 1200.0, 1800.0, 2200.0, 2600.0, 3100.0, 3800.0, 4100.0]
        self.observed_amounts: list[float] = []
        self.observed_latencies_ms: list[float] = []
        self.processed_records: list[PipelineResult] = []

    # --- PAS 1: Recepció, RBAC i idempotència ---
    def _step1_intake_and_rbac(self, exp: ExpedientInput) -> dict[str, Any] | None:
        if exp.user_role not in ALLOWED_ROLES:
            raise PermissionError(f"Rol no autoritzat per operar SIGEA-IA: {exp.user_role}")
        return self.ledger.find_by_idempotency_key(exp.idempotency_key)

    # --- PAS 2: Tallafoc anti-Prompt Injection ---
    def _step2_security_firewall(self, exp: ExpedientInput) -> list[str]:
        full_text = f"{exp.subject}\n{exp.body}\n" + " ".join(d.filename for d in exp.documents)
        flags = []
        for pat in INJECTION_PATTERNS:
            if re.search(pat, full_text, flags=re.IGNORECASE):
                flags.append(f"PROMPT_INJECTION:{pat}")
        return flags

    # --- PAS 3: Redacció PII ---
    def _step3_redact_pii(self, exp: ExpedientInput) -> tuple[str, int]:
        redacted_body, count = redact_pii(f"{exp.subject} | {exp.body}")
        return redacted_body, count

    # --- PAS 4: Processament Documental (IDP / OCR / KIE) ---
    def _step4_idp_extraction(self, exp: ExpedientInput) -> tuple[dict[str, Any], float, list[str]]:
        if not exp.documents:
            return {}, 1.0, []
        primary = exp.documents[0]
        min_conf = min(d.ocr_confidence for d in exp.documents)
        attachments: list[str] = []
        for d in exp.documents:
            attachments.extend(d.declared_attachments)
        extracted = {
            "doc_type": primary.doc_type,
            "filename": primary.filename,
            "ocr_confidence": round(min_conf, 3),
            "nif": primary.fields.get("nif"),
            "base_imposable": primary.fields.get("base_imposable", 0.0),
            "iva": primary.fields.get("iva", 0.0),
            "total": primary.fields.get("total", 0.0),
        }
        return extracted, min_conf, sorted(set(attachments))

    # --- PAS 5: Classificació NLP en català ---
    def _step5_classify_nlp(self, exp: ExpedientInput) -> tuple[str, float, list[str]]:
        tokens = set(tokenize_catalan(f"{exp.subject} {exp.body}"))
        scores: dict[str, int] = {}
        matched_terms: dict[str, list[str]] = {}
        for area, keywords in AREA_KEYWORDS.items():
            hits = [kw for kw in keywords if kw in tokens]
            scores[area] = len(hits)
            matched_terms[area] = hits
        best_area = max(scores, key=lambda k: scores[k])
        best_hits = scores[best_area]
        total_hits = sum(scores.values())
        if best_hits == 0:
            return "Fora de domini / Sense classificar", 0.25, []
        confidence = round(min(0.98, 0.55 + 0.12 * best_hits * (best_hits / max(1, total_hits))), 3)
        return best_area, confidence, matched_terms[best_area]

    # --- PAS 6: Validació determinista (NIF, aritmètica, LCSP, art. 68 LPACAP) ---
    def _step6_deterministic_validation(
        self, area: str, extracted: dict[str, Any], attachments: list[str]
    ) -> tuple[list[str], list[str], str | None]:
        errors: list[str] = []
        nif = extracted.get("nif")
        if nif and not validate_nif(str(nif)):
            errors.append(f"NIF invàlid (falla verificació mòdul 23): {str(nif)[:4]}****")

        base = float(extracted.get("base_imposable", 0.0) or 0.0)
        iva = float(extracted.get("iva", 0.0) or 0.0)
        total = float(extracted.get("total", 0.0) or 0.0)
        if total > 0 and abs((base + iva) - total) > 0.02:
            errors.append(
                f"Discrepància aritmètica documental: base ({base:.2f}) + IVA ({iva:.2f}) != total ({total:.2f})"
            )

        if area == "Contractació" and base > 15000.0:
            errors.append(
                f"Supera el llindar de contracte menor de serveis/subministraments (art. 118 LCSP: 15.000 EUR sense IVA; base={base:.2f} EUR)"
            )

        required = REQUIRED_ATTACHMENTS_BY_AREA.get(area, [])
        missing = [req for req in required if req not in attachments]
        esmena_draft = None
        if missing:
            esmena_draft = (
                f"ESBORRANY DE REQUERIMENT D'ESMENA (Art. 68 Llei 39/2015, LPACAP): "
                f"S'observa que manca la documentació obligatòria següent: {', '.join(missing)}. "
                f"Es requereix a la persona interessada que l'aporti en un termini de 10 dies hàbils."
            )
        return errors, missing, esmena_draft

    # --- PAS 7: Recuperació RAG amb filtre obligatori de vigència ---
    def _step7_rag_retrieve(self, exp: ExpedientInput, area: str) -> list[dict[str, str]]:
        # FILTRE OBLIGATORI: només documents vigents (mai derogats!)
        active_docs = [d for d in self.corpus if d.get("vigencia") == "vigent"]
        query_tokens = {
            t for t in tokenize_catalan(f"{exp.subject} {exp.body}")
            if len(t) >= 3 and t not in CATALAN_STOPWORDS
        }
        expanded_tokens = set(query_tokens)
        for tok in list(query_tokens):
            for syn in SYNONYMS.get(tok, []):
                expanded_tokens.add(syn)

        ranked: list[tuple[float, dict[str, Any]]] = []
        for doc in active_docs:
            doc_tokens = {
                t for t in tokenize_catalan(f"{doc['title']} {doc['text']}")
                if len(t) >= 3 and t not in CATALAN_STOPWORDS
            }
            overlap = len(expanded_tokens & doc_tokens)
            area_bonus = 2.0 if doc["area"] == area else 0.0
            score = overlap + area_bonus
            if overlap >= 2:
                ranked.append((score, doc))

        ranked.sort(key=lambda item: item[0], reverse=True)
        return [
            {
                "citation": f"[{d['doc_id']}, {d['article']}]",
                "title": d["title"],
                "vigencia": d["vigencia"],
                "excerpt": d["text"],
            }
            for _, d in ranked[:2]
        ]

    # --- PAS 8: Generació controlada d'esborrany amb grounding i abstenció ---
    def _step8_generate_draft(
        self,
        exp: ExpedientInput,
        area: str,
        citations: list[dict[str, str]],
        esmena_draft: str | None,
        validation_errors: list[str],
    ) -> str:
        if not citations or area.startswith("Fora de domini"):
            return (
                "ABSTENCIÓ CONTROLADA: No s'ha trobat normativa vigent aplicable al corpus corporatiu "
                "per a la matèria consultada. Es deriva a atenció ciutadana o unitat jurídica per a valoració."
            )
        cite_str = ", ".join(c["citation"] for c in citations)
        parts = [
            f"PROPOSTA TÈCNICA D'ESBORRANY — Àrea assignada: {area} (Ref. normativa vigent: {cite_str}).",
            f"Base normativa: {citations[0]['excerpt']}",
        ]
        if validation_errors:
            parts.append("Incidències detectades a verificar per personal funcionari: " + "; ".join(validation_errors) + ".")
        if esmena_draft:
            parts.append(esmena_draft)
        else:
            parts.append("Documentació formal completa a reserva de comprovació material i resolució de l'òrgan competent.")
        return " ".join(parts)

    # --- PAS 9: Detecció d'anomalies (MAD) i priorització híbrida anti-starvation ---
    def _step9_anomaly_and_priority(
        self, exp: ExpedientInput, area: str, validation_errors: list[str]
    ) -> tuple[bool, str | None, float, str]:
        amount = float(exp.metadata.get("import_sollicitat", 0.0) or 0.0)
        median = statistics.median(self.baseline_amounts)
        abs_devs = [abs(x - median) for x in self.baseline_amounts]
        mad = max(statistics.median(abs_devs), 1.0)
        robust_z = 0.6745 * (amount - median) / mad
        is_anomaly = amount > 0 and robust_z > 3.5
        anomaly_reason = (
            f"Import atípic detectat per MAD (import={amount:.2f} EUR, z_robust={robust_z:.2f} > 3.5)"
            if is_anomaly
            else None
        )

        # Priorització híbrida (0..100): urgència legal/salut + vulnerabilitat + errors + aging anti-starvation
        score = 30.0
        vulnerabilitat = bool(exp.metadata.get("vulnerabilitat_declarada", False))
        dies_cua = int(exp.metadata.get("dies_en_cua", 0))
        if vulnerabilitat or area == "Serveis Socials":
            score += 45.0
        if area == "Medi Ambient" and ("perillosos" in exp.body.lower() or "salut" in exp.body.lower()):
            score += 40.0
        if is_anomaly or validation_errors:
            score += 15.0
        # Factor aging anti-starvation (+1.5 punts per dia en cua, màxim +30)
        score += min(30.0, dies_cua * 1.5)
        score = round(min(100.0, score), 1)

        if score >= 80:
            band = "CRITICA"
        elif score >= 60:
            band = "ALTA"
        elif score >= 45:
            band = "MITJANA"
        else:
            band = "NORMAL"
        return is_anomaly, anomaly_reason, score, band

    # --- PAS 10: Avaluació de risc, explicabilitat local i porta HITL ---
    def _step10_risk_explainability_hitl(
        self,
        *,
        exp: ExpedientInput,
        area: str,
        class_conf: float,
        matched_terms: list[str],
        ocr_conf: float,
        validation_errors: list[str],
        missing_attachments: list[str],
        is_anomaly: bool,
        citations: list[dict[str, str]],
    ) -> tuple[bool, list[str], list[str]]:
        hitl_reasons: list[str] = []
        if class_conf < 0.70 or area.startswith("Fora de domini"):
            hitl_reasons.append(f"Confiança de classificació baixa ({class_conf:.2f} < 0.70)")
        if ocr_conf < 0.80:
            hitl_reasons.append(f"Confiança OCR insuficient ({ocr_conf:.2f} < 0.80)")
        if validation_errors:
            hitl_reasons.append("Errors de validació normativa/aritmètica detectats")
        if missing_attachments:
            hitl_reasons.append("Manca documentació obligatòria (requeriment art. 68 LPACAP)")
        if is_anomaly:
            hitl_reasons.append("Anomalia estadística d'import detectada (MAD)")
        if exp.metadata.get("vulnerabilitat_declarada") or area == "Serveis Socials":
            hitl_reasons.append("Alt risc social / vulnerabilitat (supervisió humana reforçada art. 14 AI Act)")
        if not citations:
            hitl_reasons.append("Sense evidència normativa vigent al corpus RAG")

        explainability = [
            f"Termes NLP determinants: {', '.join(matched_terms) if matched_terms else 'cap coincidència forta'}",
            f"Confiança classificació={class_conf:.2f} | Confiança OCR={ocr_conf:.2f}",
            f"Dies en cua (factor anti-starvation)={exp.metadata.get('dies_en_cua', 0)}",
            f"Normativa vigent recuperada: {', '.join(c['citation'] for c in citations) if citations else 'cap'}",
        ]
        return len(hitl_reasons) > 0, hitl_reasons, explainability

    # --- EXECUCIÓ INTEGRADA DELS 13 PASSOS ---
    def process_expedient(self, raw_or_input: ExpedientInput | dict[str, Any]) -> PipelineResult:
        exp = raw_or_input if isinstance(raw_or_input, ExpedientInput) else ExpedientInput.from_dict(raw_or_input)
        t_total_start = time.perf_counter()
        latencies: dict[str, float] = {}

        def _mark(step_name: str, t0: float) -> None:
            latencies[step_name] = round((time.perf_counter() - t0) * 1000.0, 3)

        # Pas 1: Recepció, RBAC i idempotència
        t0 = time.perf_counter()
        existing = self._step1_intake_and_rbac(exp)
        _mark("step_01_intake_rbac", t0)
        if existing is not None:
            return PipelineResult(
                expedient_id=exp.expedient_id,
                idempotency_key=exp.idempotency_key,
                model_version=self.MODEL_VERSION,
                prompt_version=self.PROMPT_VERSION,
                status="DUPLICAT_IDEMPOTENT",
                requires_human_review=bool(existing["requires_human_review"]),
                autonomous_final_decision=False,
                area=str(existing["area"]),
                classification_confidence=1.0,
                pii_redacted_count=0,
                security_flags=[],
                extracted_fields={},
                validation_errors=[],
                missing_attachments=[],
                esmena_draft_art68=None,
                rag_citations=[],
                generated_draft=f"Expedient ja processat prèviament (clau idempotència {exp.idempotency_key}).",
                ai_transparency_notice=self.AI_NOTICE,
                is_anomaly=False,
                anomaly_reason=None,
                priority_score=float(existing["priority_score"]),
                priority_band="NORMAL",
                hitl_reasons=["Registre duplicat interceptat per idempotència"],
                explainability_factors=["Retornat resultat existent sense reprocesar"],
                audit_hash=str(existing["record_hash"]),
                external_sync_status="SYNCED_ENI",
                step_latencies_ms=latencies,
                processed_at=str(existing["created_at"]),
            )

        # Pas 2: Tallafoc de seguretat anti-Prompt Injection
        t0 = time.perf_counter()
        sec_flags = self._step2_security_firewall(exp)
        _mark("step_02_security_firewall", t0)

        # Pas 3: Redacció de PII per a logs/auditoria
        t0 = time.perf_counter()
        redacted_text, pii_count = self._step3_redact_pii(exp)
        _mark("step_03_pii_redaction", t0)

        if sec_flags:
            t11 = time.perf_counter()
            audit_hash = self.ledger.append_audit(
                expedient_id=exp.expedient_id,
                idempotency_key=exp.idempotency_key,
                municipi=exp.municipi,
                comarca=exp.comarca,
                area="Seguretat / Incident",
                status="BLOQUEJAT_SEGURETAT",
                requires_human_review=True,
                priority_score=95.0,
                model_version=self.MODEL_VERSION,
                prompt_version=self.PROMPT_VERSION,
                payload_redacted={
                    "redacted_text": redacted_text,
                    "security_flags": sec_flags,
                    "pii_redacted_count": pii_count,
                },
            )
            _mark("step_11_audit_ledger", t11)
            res = PipelineResult(
                expedient_id=exp.expedient_id,
                idempotency_key=exp.idempotency_key,
                model_version=self.MODEL_VERSION,
                prompt_version=self.PROMPT_VERSION,
                status="BLOQUEJAT_SEGURETAT",
                requires_human_review=True,
                autonomous_final_decision=False,
                area="Seguretat / Incident",
                classification_confidence=1.0,
                pii_redacted_count=pii_count,
                security_flags=sec_flags,
                extracted_fields={},
                validation_errors=["Entrada bloquejada per intent de Prompt Injection"],
                missing_attachments=[],
                esmena_draft_art68=None,
                rag_citations=[],
                generated_draft="BLOQUEIG PREVENTIU DE SEGURETAT: S'ha detectat un patró d'injecció d'instruccions. L'expedient s'ha derivat a revisió humana i seguretat (ENS).",
                ai_transparency_notice=self.AI_NOTICE,
                is_anomaly=True,
                anomaly_reason="Intent de manipulació d'instruccions detectat al tallafoc",
                priority_score=95.0,
                priority_band="CRITICA",
                hitl_reasons=["Incident de seguretat: Prompt Injection detectat"],
                explainability_factors=[f"Patrons detectats: {', '.join(sec_flags)}"],
                audit_hash=audit_hash,
                external_sync_status="SKIPPED_SECURITY",
                step_latencies_ms=latencies,
                processed_at=datetime.now(timezone.utc).isoformat(),
            )
            self.processed_records.append(res)
            self.observed_latencies_ms.append((time.perf_counter() - t_total_start) * 1000.0)
            return res

        # Pas 4: Processament documental IDP
        t0 = time.perf_counter()
        extracted, ocr_conf, attachments = self._step4_idp_extraction(exp)
        _mark("step_04_idp_extraction", t0)

        # Pas 5: Classificació NLP en català
        t0 = time.perf_counter()
        area, class_conf, matched_terms = self._step5_classify_nlp(exp)
        _mark("step_05_nlp_classification", t0)

        # Pas 6: Validació determinista
        t0 = time.perf_counter()
        val_errors, missing_att, esmena_draft = self._step6_deterministic_validation(
            area, extracted, attachments
        )
        _mark("step_06_deterministic_validation", t0)

        # Pas 7: Recuperació RAG amb filtre temporal de vigència
        t0 = time.perf_counter()
        citations = self._step7_rag_retrieve(exp, area)
        _mark("step_07_rag_retrieval", t0)

        # Pas 8: Generació controlada d'esborrany
        t0 = time.perf_counter()
        draft = self._step8_generate_draft(exp, area, citations, esmena_draft, val_errors)
        _mark("step_08_draft_generation", t0)

        # Pas 9: Detecció d'anomalies (MAD) + priorització híbrida
        t0 = time.perf_counter()
        is_anomaly, anomaly_reason, priority_score, priority_band = self._step9_anomaly_and_priority(
            exp, area, val_errors
        )
        _mark("step_09_anomaly_and_priority", t0)

        # Pas 10: Avaluació de risc, explicabilitat i porta HITL
        t0 = time.perf_counter()
        requires_hitl, hitl_reasons, explainability = self._step10_risk_explainability_hitl(
            exp=exp,
            area=area,
            class_conf=class_conf,
            matched_terms=matched_terms,
            ocr_conf=ocr_conf,
            validation_errors=val_errors,
            missing_attachments=missing_att,
            is_anomaly=is_anomaly,
            citations=citations,
        )
        status = "ESCALAT_HITL" if requires_hitl else "PREVALIDAT_SUPORT"
        _mark("step_10_risk_hitl_gate", t0)

        # Pas 11: Persistència en registre immutable SHA-256 (sense PII!)
        t0 = time.perf_counter()
        safe_extracted = {k: ("[NIF_REDACTAT]" if k == "nif" and v else v) for k, v in extracted.items()}
        audit_hash = self.ledger.append_audit(
            expedient_id=exp.expedient_id,
            idempotency_key=exp.idempotency_key,
            municipi=exp.municipi,
            comarca=exp.comarca,
            area=area,
            status=status,
            requires_human_review=requires_hitl,
            priority_score=priority_score,
            model_version=self.MODEL_VERSION,
            prompt_version=self.PROMPT_VERSION,
            payload_redacted={
                "redacted_text": redacted_text,
                "extracted_redacted": safe_extracted,
                "citations": [c["citation"] for c in citations],
                "hitl_reasons": hitl_reasons,
                "pii_redacted_count": pii_count,
            },
        )
        _mark("step_11_audit_ledger", t0)

        # Pas 12: Telemetria MLOps/LLMOps
        t0 = time.perf_counter()
        amount = float(exp.metadata.get("import_sollicitat", 0.0) or 0.0)
        if amount > 0:
            self.observed_amounts.append(amount)
        _mark("step_12_mlops_telemetry", t0)

        # Pas 13: Integració resilient ENI amb Circuit Breaker + Outbox
        t0 = time.perf_counter()
        eni_payload = {
            "expedient_id": exp.expedient_id,
            "area": area,
            "status": status,
            "priority_band": priority_band,
            "audit_hash": audit_hash,
        }
        if self.eni.send_eni_package(exp.expedient_id, eni_payload):
            sync_status = "SYNCED_ENI"
        else:
            self.ledger.enqueue_outbox(exp.expedient_id, eni_payload, "PENDING_RETRY")
            sync_status = "QUEUED_OUTBOX_CIRCUIT_OPEN"
        _mark("step_13_eni_resilient_sync", t0)

        result = PipelineResult(
            expedient_id=exp.expedient_id,
            idempotency_key=exp.idempotency_key,
            model_version=self.MODEL_VERSION,
            prompt_version=self.PROMPT_VERSION,
            status=status,
            requires_human_review=requires_hitl,
            autonomous_final_decision=False,
            area=area,
            classification_confidence=class_conf,
            pii_redacted_count=pii_count,
            security_flags=sec_flags,
            extracted_fields=safe_extracted,
            validation_errors=val_errors,
            missing_attachments=missing_att,
            esmena_draft_art68=esmena_draft,
            rag_citations=citations,
            generated_draft=draft,
            ai_transparency_notice=self.AI_NOTICE,
            is_anomaly=is_anomaly,
            anomaly_reason=anomaly_reason,
            priority_score=priority_score,
            priority_band=priority_band,
            hitl_reasons=hitl_reasons,
            explainability_factors=explainability,
            audit_hash=audit_hash,
            external_sync_status=sync_status,
            step_latencies_ms=latencies,
            processed_at=datetime.now(timezone.utc).isoformat(),
        )
        self.processed_records.append(result)
        self.observed_latencies_ms.append((time.perf_counter() - t_total_start) * 1000.0)
        return result

    # --- PAS 12 (agregat): Informe MLOps (PSI, P95, taxes HITL i integritat SHA-256) ---
    def compute_mlops_report(self) -> dict[str, Any]:
        """Calcula mètriques operatives MLOps/LLMOps i verifica la cadena SHA-256."""
        n = len(self.processed_records)
        hitl_count = sum(1 for r in self.processed_records if r.requires_human_review)
        sec_blocks = sum(1 for r in self.processed_records if r.status == "BLOQUEJAT_SEGURETAT")
        sorted_lat = sorted(self.observed_latencies_ms)
        p95 = sorted_lat[int(0.95 * (len(sorted_lat) - 1))] if sorted_lat else 0.0

        psi = self._compute_psi(self.baseline_amounts, self.observed_amounts or self.baseline_amounts)
        chain_ok, chain_len = self.ledger.verify_chain()
        return {
            "model_version": self.MODEL_VERSION,
            "prompt_version": self.PROMPT_VERSION,
            "total_processed": n,
            "hitl_escalated": hitl_count,
            "hitl_rate": round(hitl_count / max(1, n), 3),
            "security_blocked": sec_blocks,
            "latency_p95_ms": round(p95, 3),
            "amounts_psi": round(psi, 4),
            "drift_alert": psi >= 0.25,
            "audit_chain_valid": chain_ok,
            "audit_chain_records": chain_len,
            "eni_outbox_pending": self.ledger.outbox_count("PENDING_RETRY"),
        }

    @staticmethod
    def _compute_psi(expected: list[float], actual: list[float], bins: tuple[float, ...] = (0, 500, 2000, 5000, 1e9)) -> float:
        def _dist(vals: list[float]) -> list[float]:
            counts = [0] * (len(bins) - 1)
            for v in vals:
                for i in range(len(bins) - 1):
                    if bins[i] <= v < bins[i + 1]:
                        counts[i] += 1
                        break
            total = max(1, len(vals))
            return [max(c / total, 1e-4) for c in counts]

        e_dist = _dist(expected)
        a_dist = _dist(actual)
        return sum((a - e) * math.log(a / e) for e, a in zip(e_dist, a_dist))
