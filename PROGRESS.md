# PROGRESS.md — Registre d'avanç incremental

Última actualització: 2026-11-26 (Fases 1–6 completades al 100%: 70/70 conceptes, 8/8 laboratoris, 43/43 exàmens i simulacres, i Projecte Pràctic Final Integrador SIGEA-IA executable i testat!)

## Estat actual per fases

- **Fase 1. Planificació**: ✅ Completada
- **Fase 2. Infraestructura**: ✅ Completada i compilada sense errors
- **Fase 3. Contingut (Mòduls 1–8)**: ✅ **100% (70/70 conceptes, 700 preguntes, 360 flashcards, 71 termes glossari)** — publicat a `origin/main`.
- **Fase 4. Laboratoris (1–8)**: ✅ **100% (8/8 laboratoris executables, datasets sintètics, notebooks i 26 tests en verd)** — publicat a `origin/main` (`dcbac0d`).
- **Fase 5. Exàmens i simulacres**: ✅ **100% (8 exàmens de mòdul, 10 simulacres globals, 20 supòsits pràctics i 5 simulacres complets)** — comitejat (`c98a93e`).
- **Fase 6. Projecte integrador (`final-project/`)**: ✅ **100% (SIGEA-IA: 8 mòduls, flux de 13 passos, API FastAPI + Pydantic v2, Dockerfile no-root, SQLite immutable SHA-256, 12 expedients sintètics, documentació d'arquitectura/ADR/riscos/rúbrica i 15/15 tests en verd)**.
- **Fase 7. Validació final**: ⬜ Pendent

---

## 1. Què s'ha completat en aquesta sessió

- **Fase 5** comitejada al commit `c98a93e`.
- **Fase 6 — Projecte Pràctic Final Integrador (`final-project/`)**:
  - `final-project/README.md`: document mestre integrador amb diagrama Mermaid dels 13 passos, guia d'execució i referències sincronitzades a la UI (`finalProjectAvailable: true`).
  - `final-project/src/sigea/models.py`: model de dades (`ExpedientInput`, `DocumentAnnex`, `PipelineResult`) i `AuditLedger` SQLite immutable amb encadenament criptogràfic `SHA-256`, taula `human_decisions` i cua `eni_outbox`.
  - `final-project/src/sigea/pipeline.py`: implementació de referència completa dels **13 passos** integrant els **8 mòduls** (RBAC + idempotència, tallafoc anti-*Prompt Injection*, redacció PII abans de logs, IDP/OCR, tokenització catalana + NLP, validació determinista NIF/aritmètica/LCSP/art. 68 LPACAP, RAG amb filtre de vigència temporal i abstenció, esborrany amb avís art. 50 AI Act, detecció d'anomalies MAD + priorització anti-*starvation*, porta HITL amb `autonomous_final_decision=False`, auditoria SHA-256, monitoratge MLOps P95/PSI i connector ENI amb *Circuit Breaker* + *outbox*).
  - `final-project/api/main.py`, `final-project/api/schemas.py`, `final-project/requirements.txt` i `final-project/Dockerfile`: API REST FastAPI (6 endpoints) amb Pydantic v2 i contenidor segur amb usuari no-root.
  - `final-project/data/generate_synthetic_data.py`, `expedients_sintetics.json` (12 casos límit 100% sintètics) i `ordenances_sintetiques.json` (5 normes vigents + 1 derogada).
  - `final-project/docs/`: `architecture.md` (4 ADR amb alternatives justificades), `risk_analysis_and_compliance.md` (AI Act, RGPD, EIPD, FRIA, ENS, matriu de riscos i Model Card) i `evaluation_rubric_and_solution.md` (rúbrica 100 punts i guia de defensa).
  - `final-project/run_project.py` i `final-project/tests/test_sigea_pipeline.py` (**15/15 tests en verd**).

---

## 2. Què queda pendent

- **Fase 7**: Validació final integral (executar tots els tests Python de `labs/` + `final-project/`, validació completa de continguts, `tsc` + `vite build` del frontend, comprovació de duplicats/esquemes i documentació de limitacions).

---

## 3. Comprovacions executades i resultat

- `python3 run_project.py` a `final-project/`: ✅ OK (12 expedients sintètics processats, cadena SHA-256 vàlida, decisió humana motivada registrada).
- `python3 -m unittest discover -s tests -v` a `final-project/`: ✅ **15/15 tests OK**.
- `python3 -m py_compile` sobre tots els fitxers Python (`api/`, `src/sigea/`, `run_project.py`): ✅ OK.
- `node scripts/sync_content.mjs` i `node scripts/validate_content.mjs`: ✅ OK (0 errors, 0 avisos, `finalProjectAvailable: true`).

---

## 4. Següent tasca exacta

Fer commit de la **Fase 6** i executar la **Fase 7 (Validació integral final)** (i `git push` quan l'usuari ho indiqui).
