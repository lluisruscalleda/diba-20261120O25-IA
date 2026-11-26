"""Laboratori 5: Assistent virtual ciutadà amb context multitorn, permisos i escalada humana."""

from __future__ import annotations

import json
import re
from dataclasses import dataclass, field
from pathlib import Path


def _norm(text: str) -> str:
    mapa = str.maketrans("àèéíïòóúüç·", "aeeiioouuc ")
    return text.lower().translate(mapa)


def redactar_pii(text: str) -> str:
    text = re.sub(r"\b\d{8}[A-Za-z]\b", "[DNI_REDACTAT]", text)
    text = re.sub(r"\b[\w.+-]+@[\w-]+\.[\w.-]+\b", "[EMAIL_REDACTAT]", text)
    return text


@dataclass
class SessioConversa:
    session_id: str
    autenticat: bool = False
    usuari_id: str | None = None
    intencio_activa: str | None = None
    fallades_consecutives: int = 0
    escalada_activa: bool = False
    avís_ia_mostrat: bool = False
    logs_auditoria: list[dict[str, object]] = field(default_factory=list)


class AssistentVirtualMunicipal:
    AVIS_ART50 = (
        "[Avís art. 50 AI Act] Sóc l'Assistent Virtual d'IA de l'Ajuntament (informació orientativa, "
        "no vinculant). Pots demanar parlar amb una persona en qualsevol moment."
    )

    def __init__(self, ruta_kb: Path) -> None:
        self.kb: dict[str, dict[str, object]] = json.loads(ruta_kb.read_text(encoding="utf-8"))
        self.sessions: dict[str, SessioConversa] = {}

    def obtenir_sessio(self, session_id: str, autenticat: bool = False, usuari_id: str | None = None) -> SessioConversa:
        if session_id not in self.sessions:
            self.sessions[session_id] = SessioConversa(
                session_id=session_id, autenticat=autenticat, usuari_id=usuari_id
            )
        return self.sessions[session_id]

    def _detectar_intencio(self, text_norm: str) -> tuple[str | None, float]:
        if any(k in text_norm for k in ("parlar amb una persona", "agent huma", "operador", "010")):
            return "DEMANA_HUMA", 1.0
        if any(k in text_norm for k in ("desnonament", "violencia", "emergencia social", "sense sostre")):
            return "EMERGENCIA_SENSIBLE", 1.0
        if any(k in text_norm for k in ("meu expedient", "estat del meu", "exp-")):
            return "CONSULTA_EXPEDIENT_PRIVAT", 0.95

        millor_int, millor_hits = None, 0
        for intencio, dades in self.kb.items():
            kws = list(dades["keywords"])  # type: ignore[arg-type]
            hits = sum(1 for kw in kws if kw in text_norm)
            if hits > millor_hits:
                millor_int, millor_hits = intencio, hits
        if millor_int:
            conf = min(0.95, 0.55 + 0.20 * millor_hits)
            return millor_int, round(conf, 2)
        return None, 0.0

    def respondre(self, session_id: str, missatge: str, autenticat: bool = False, usuari_id: str | None = None) -> dict[str, object]:
        s = self.obtenir_sessio(session_id, autenticat=autenticat, usuari_id=usuari_id)
        text_norm = _norm(missatge)
        prefix_avis = ""
        if not s.avís_ia_mostrat:
            prefix_avis = self.AVIS_ART50 + "\n"
            s.avís_ia_mostrat = True

        intencio, conf = self._detectar_intencio(text_norm)
        escalada = False
        motiu_escalada = None

        # 1. Escalada directa (petició humana o emergència sensible)
        if intencio in ("DEMANA_HUMA", "EMERGENCIA_SENSIBLE"):
            s.escalada_activa = True
            escalada = True
            motiu_escalada = intencio
            resposta = (
                "Et derivo immediatament a un agent humà especialitzat amb el resum de la consulta "
                "(telèfon 010 / Servei d'Atenció Ciutadana)."
            )

        # 2. Control d'accés (RBAC / Autenticació obligatòria per dades privades)
        elif intencio == "CONSULTA_EXPEDIENT_PRIVAT":
            if not s.autenticat:
                resposta = (
                    "Per consultar l'estat d'un expedient personal cal autenticar-se prèviament "
                    "a la Seu Electrònica amb idCAT Mòbil o Cl@ve (protecció de dades RGPD)."
                )
            else:
                resposta = (
                    f"Sessió autenticada ({s.usuari_id}): el teu expedient consta en estat "
                    "EN_TRAMITACIO (actualitzat avui). Pots descarregar el justificant a La Meva Carpeta."
                )

        # 3. Resolució de pregunta de seguiment multitorn (context actiu!)
        elif intencio is None and s.intencio_activa and any(
            k in text_norm for k in ("termini", "quan", "document", "papers", "cal aportar")
        ):
            s.fallades_consecutives = 0
            bloc = self.kb[s.intencio_activa]
            if any(k in text_norm for k in ("termini", "quan")):
                resposta = str(bloc["termini"])
            else:
                resposta = str(bloc["documentacio"])
            intencio = f"{s.intencio_activa}_SEGUIMENT"
            conf = 0.88

        # 4. Consulta directa a la base de coneixement amb llindar de confiança
        elif intencio in self.kb and conf >= 0.70:
            s.intencio_activa = intencio
            s.fallades_consecutives = 0
            resposta = str(self.kb[intencio]["resposta_base"])

        # 5. Gestió d'incertesa i escalada automàtica després de 2 fallades consecutives
        else:
            s.fallades_consecutives += 1
            if s.fallades_consecutives >= 2:
                s.escalada_activa = True
                escalada = True
                motiu_escalada = "DOS_FALLADES_CONSECUTIVES"
                resposta = (
                    "No he pogut entendre amb prou certesa la teva consulta després de 2 intents. "
                    "Et passo directament amb una persona d'atenció ciutadana."
                )
            else:
                resposta = (
                    "No disposo de prou certesa per respondre això. Em podries concretar si tracta "
                    "sobre IBI, obres menors o empadronament?"
                )

        registre = {
            "session_id": session_id,
            "missatge_redactat": redactar_pii(missatge),
            "intencio": intencio or "DESCONEGUDA",
            "confianca": conf,
            "escalada": escalada,
            "motiu_escalada": motiu_escalada,
        }
        s.logs_auditoria.append(registre)
        return {
            "session_id": session_id,
            "resposta": prefix_avis + resposta,
            "intencio": registre["intencio"],
            "confianca": conf,
            "escalada_humana": escalada,
            "motiu_escalada": motiu_escalada,
            "log_redactat": registre["missatge_redactat"],
        }


def executar_lab_assistent(ruta_kb: Path) -> dict[str, object]:
    bot = AssistentVirtualMunicipal(ruta_kb)
    conversa_a = [
        bot.respondre("SES-01", "Hola, vull saber la bonificació de l'IBI per plaques solars. El meu DNI és 12345678Z."),
        bot.respondre("SES-01", "I quin termini tinc per demanar-ho?"),
        bot.respondre("SES-01", "Pots mirar l'estat del meu expedient EXP-2026-99?"),
    ]
    conversa_b = [
        bot.respondre("SES-02", "Vull consultar l'estat del meu expedient EXP-2026-99", autenticat=True, usuari_id="CIUTADA_FICTICI_42"),
        bot.respondre("SES-02", "Tinc un avís de desnonament demà mateix, ajuda!"),
    ]
    conversa_c = [
        bot.respondre("SES-03", "Blablabla pregunta incomprensible sobre planetes"),
        bot.respondre("SES-03", "Encara una altra pregunta completament fora de domini"),
    ]
    return {
        "conversa_multitorn_i_rbac_anonim": conversa_a,
        "conversa_autenticada_i_emergencia": conversa_b,
        "conversa_escalada_per_incertesa": conversa_c,
    }
