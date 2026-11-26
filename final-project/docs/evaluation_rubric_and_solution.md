# Criteris d'avaluació, rúbrica i solució comentada — SIGEA-IA

## 1. Rúbrica d'avaluació del projecte (100 punts)

| Bloc | Criteri avaluat | Punts màx. | Evidència verificable a la solució |
|---|---|---:|---|
| 1. Arquitectura i integració dels 8 mòduls | Coherència del flux de 13 passos, separació domini/API/persistència i justificació d'alternatives (ADR) | 20 | `docs/architecture.md`, `src/sigea/pipeline.py`, `api/main.py` |
| 2. NLP en català, IDP i RAG rigorós | Tokenització amb apòstrofs catalans, validació determinista (NIF, aritmètica, art. 68 LPACAP), filtre de vigència RAG i abstenció | 20 | Passos 4–8 a `pipeline.py`, `test_05`..`test_12` |
| 3. Automatització intel·ligent i priorització | Idempotència, detector d'anomalies MAD, priorització híbrida amb *aging* anti-*starvation* | 15 | Passos 1, 6 i 9 a `pipeline.py`, `test_02`, `test_08`, `test_11` |
| 4. MLOps, LLMOps i resiliència | Versionat de model/prompt, latència P95, càlcul PSI de *drift*, *Circuit Breaker* + cua *outbox* ENI, Dockerfile no-root | 15 | Passos 12–13, `Dockerfile`, `test_14` |
| 5. Seguretat, privacitat i compliment normatiu | Tallafoc anti-*Prompt Injection*, zero PII als logs, `autonomous_final_decision=False`, cadena SHA-256, AI Act/RGPD/ENS/FRIA/EIPD | 20 | Passos 2, 3, 10, 11, `docs/risk_analysis_and_compliance.md`, `test_03`, `test_04`, `test_13`, `test_15` |
| 6. Qualitat del codi, dades sintètiques i tests | Dades 100% sintètiques, execució reproduïble sense secrets, suite de tests automatitzats en verd | 10 | `data/generate_synthetic_data.py`, `run_project.py`, `tests/test_sigea_pipeline.py` |
| **Total** | | **100** | |

## 2. Errors eliminatoris (o penalització crítica en prova pràctica)

1. Permetre que el sistema **resolgui o denegui automàticament** una prestació social o expedient sancionador sense supervisió humana (vulnera art. 22 RGPD i art. 14 AI Act).
2. Emmagatzemar NIFs, IBANs o dades de salut en text pla als *logs* de depuració o enviar-los a APIs externes no autoritzades.
3. No filtrar normativa derogada al RAG (citar `OF-IBI-2024` com si estigués vigent).
4. Confiar la verificació aritmètica de factures o del dígit de control NIF a un LLM en lloc d'una regla determinista.
5. Utilitzar dades personals reals al repositori o incrustar claus d'API al codi font.

## 3. Guia de defensa oral / escrita davant tribunal

1. **Comença pel principi de legalitat i supervisió humana**: deixa clar des del primer minut que SIGEA-IA és una plataforma de **suport a la tramitació** (`autonomous_final_decision=False`), no un decisor administratiu autònom.
2. **Separa determinisme de probabilisme**: explica per què la classificació i recuperació normativa són components d'IA/NLP, mentre que el NIF, les sumes de factura, el llindar LCSP de 15.000 EUR i el termini de 10 dies de l'art. 68 LPACAP són regles deterministes.
3. **Demostra defensa en profunditat**: assenyala el tallafoc previ (Pas 2), la redacció de PII abans de persistir (Pas 3), la porta HITL (Pas 10) i l'encadenament SHA-256 verificable (Pas 11).
4. **Tanca amb operació sostenible (MLOps/FinOps)**: destaca el monitoratge de *data drift* (PSI), la prevenció de caigudes del *legacy* amb *Circuit Breaker* + *outbox* ENI i la sobirania tecnològica amb desplegament local/*on-premise*.
