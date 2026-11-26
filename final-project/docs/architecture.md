# Arquitectura tècnica i alternatives justificades — SIGEA-IA

## 1. Visió arquitectònica (Monòlit Modular + Adaptadors Desacoblats)

El **Sistema Intel·ligent de Gestió d'Expedients Administratius (SIGEA-IA)** adopta una arquitectura de **monòlit modular orientat a flux (13 passos)** amb separació estricta entre:

1. **Capa de domini pur (`src/sigea/pipeline.py` i `src/sigea/models.py`)**: sense dependències d'HTTP ni de proveïdors comercials; fàcilment testable, determinista i auditable.
2. **Capa d'interfície REST (`api/main.py` i `api/schemas.py`)**: exposada amb FastAPI + Pydantic v2, validació estricta de contractes i codis HTTP semàntics (`200`, `403`, `404`, `422`).
3. **Capa de persistència immutable (`AuditLedger` sobre SQLite, extensible a PostgreSQL)**: tres taules (`audit_log`, `human_decisions`, `eni_outbox`) amb encadenament criptogràfic `SHA-256` per garantir la no-manipulació (*tamper-evidence*).
4. **Capa d'integració resilient (`ExternalEniConnector`)**: patró *Circuit Breaker* + *Transactional Outbox* per protegir la plataforma davant caigudes del registre corporatiu o gestors d'expedients *legacy* (ENI/SIA).

## 2. Mapa dels 13 passos i cobertura dels 8 mòduls

| Pas | Responsabilitat | Mòduls coberts |
|---|---|---|
| 1 | Recepció, control d'accés RBAC i idempotència | M5, M6, M8 |
| 2 | Tallafoc de seguretat anti-*Prompt Injection* (directe i indirecte) | M8 |
| 3 | Redacció / pseudonimització de PII (NIF, IBAN, telèfon, correu) | M2, M8 |
| 4 | Processament documental IDP (OCR + KIE + confiança mínima) | M4 |
| 5 | Tokenització catalana i classificació NLP d'àrea administrativa | M1, M2 |
| 6 | Validació determinista (NIF mòdul 23, `base+IVA=total`, art. 118 LCSP, art. 68 LPACAP) | M4, M6 |
| 7 | Recuperació RAG amb filtre temporal obligatori (`vigencia == "vigent"`) | M2, M3 |
| 8 | Generació controlada d'esborrany amb cites, abstenció i avís art. 50 AI Act | M3, M5 |
| 9 | Detecció d'anomalies (MAD robust) i priorització híbrida anti-*starvation* | M1, M6 |
| 10 | Porta de supervisió humana (HITL) i explicabilitat local (mai decisió autònoma) | M1, M5, M8 |
| 11 | Registre d'auditoria immutable amb cadena SHA-256 (sense PII) | M5, M7, M8 |
| 12 | Telemetria MLOps/LLMOps (latència P95, taxa HITL, PSI de *data drift*) | M7, M8 |
| 13 | Sincronització resilient amb ENI (*Circuit Breaker* + cua *outbox*) | M7 |

## 3. Decisions arquitectòniques i alternatives comparades (ADR)

### ADR-01: RAG amb filtre de vigència vs. *Fine-tuning* del LLM
- **Decisió escollida**: **RAG amb filtre de metadades temporals (`vigencia == "vigent"`)** + cites verificables `[DOC, art. X]`.
- **Alternativa descartada**: *Fine-tuning* (LoRA) per memoritzar ordenances municipals.
- **Justificació**: Les ordenances fiscals i reglaments canvien cada exercici (p. ex. `OF-IBI-2024` → `OF-IBI-2026`). Un model ajustat retindria percentatges derogats i no garantiria citació traçable ni revocació immediata en segons. El *fine-tuning* només s'hauria de valorar per a estil o format de sortida, mai com a base de coneixement normatiu.

### ADR-02: Validació determinista en codi vs. delegació al LLM
- **Decisió escollida**: Totes les regles jurídiques i numèriques exactes (lletra NIF mòdul 23, `base + IVA == total`, topall 15.000 EUR de contracte menor art. 118 LCSP, termini de 10 dies hàbils art. 68 LPACAP) s'executen en **codi Python determinista**.
- **Alternativa descartada**: Demanar al LLM via *prompt* que comprovi el NIF i les sumes.
- **Justificació**: Els models probabilístics pateixen errors aritmètics i no ofereixen determinisme ni verificabilitat legal (pràctica d'enginyeria consolidada + seguretat jurídica).

### ADR-03: Monòlit modular FastAPI vs. 8 microserveis distribuïts
- **Decisió escollida**: Monòlit modular amb fronteres internes clares (`pipeline.py`, `models.py`, `api/`).
- **Alternativa descartada**: Desplegar 8 microserveis separats (un per cada pas d'IA) des del dia 1.
- **Justificació**: Redueix dràsticament la latència de xarxa, la complexitat operativa ENS (menys superfície d'atac i menys certificats mTLS), facilita l'auditoria unificada i permet extreure el motor d'inferència LLM/OCR a un node GPU dedicat (vLLM) només quan el volum ho justifiqui.

### ADR-04: Desplegament *on-premise* / núvol sobirà (open-weights) vs. API comercial externa
- **Decisió escollida**: Arquitectura agnòstica amb execució local / *on-premise* prioritària (models *open-weights* servits amb vLLM/Ollama dins el perímetre de la Diputació o núvol amb certificació ENS Alta i residència UE).
- **Alternativa descartada**: Enviar expedients amb dades especialment protegides (Serveis Socials, art. 9 RGPD) a APIs públiques fora de l'EEE.
- **Justificació**: Evita transferències internacionals de dades (Capítol V RGPD), elimina riscos de reentrenament amb dades ciutadanes i facilita el compliment de l'ENS i el control de costos FinOps.
