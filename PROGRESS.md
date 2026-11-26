# PROGRESS.md — Registre d'avanç incremental

Última actualització: 2026-11-26 (Fases 1, 2, 3 i 4 completades al 100%: 70/70 conceptes + 8/8 laboratoris executables i testats!)

## Estat actual per fases

- **Fase 1. Planificació**: ✅ Completada
- **Fase 2. Infraestructura**: ✅ Completada i compilada sense errors
- **Fase 3. Contingut (Mòduls 1–8)**: ✅ **100% (70/70 conceptes, 700 preguntes, 360 flashcards, 71 termes glossari)** — publicat a `origin/main`.
- **Fase 4. Laboratoris (1–8)**: ✅ **100% (8/8 laboratoris executables amb datasets 100% sintètics, notebooks Jupyter, documentació i 26 tests automatitzats en verd!)**.
- **Fase 5. Exàmens i simulacres**: ⬜ Pendent
- **Fase 6. Projecte integrador**: ⬜ Pendent
- **Fase 7. Validació final**: ⬜ Pendent

---

## 1. Què s'ha completat en aquesta sessió

- **Push a `origin/main`** dels Mòduls 1–8 (`7c02e5c..ba259ee`).
- **Fase 4 — 8/8 Laboratoris pràctics executables i verificats (`labs/`)**:
  1. `labs/lab-01-machine-learning`: 120 expedients sintètics (`data/sollicituds_sintetiques.csv`), classificació logística L2 (`F1 = 0,9474`), regressió Ridge (`R² = 0,9851`, `MAE = 1,28 dies`), K-Means `k = 3`, detecció d'anomalies MAD (4/4 detectades), notebook + 5 tests ✅.
  2. `labs/lab-02-nlp`: 20 instàncies en català sintètiques, tokenització amb apòstrofs catalans, classificador TF-IDF LOOCV, NER administratiu + PII, comparativa lèxica vs. semàntica (embeddings superen TF-IDF en sinònims), notebook + 3 tests ✅.
  3. `labs/lab-03-rag-generatius`: corpus d'ordenances sintètiques amb filtre de vigència (descarta `OF-IBI-2024` derogada), recuperació BM25 amb cites `[OF-IBI-2026, art. 9]`, abstenció automàtica fora de domini, eina determinista de càlcul d'IBI (topall 400 €), matriu RAG vs. *fine-tuning*, notebook + 4 tests ✅.
  4. `labs/lab-04-processament-documental`: generador en Python pur de 4 PDFs `%PDF-1.4` vàlids (`data/pdfs/`), lectura OCR, classificació documental, KIE, validació creuada aritmètica (`base + IVA = total`) i lletra NIF, enrutament STP vs. HITL, notebook + 3 tests ✅.
  5. `labs/lab-05-assistent-virtual`: assistent multitorn amb avís art. 50 AI Act, memòria de context per sessió, RBAC/autenticació `idCAT Mòbil / Cl@ve`, redacció de PII abans dels logs i escalada humana (emergència o 2 fallades), notebook + 3 tests ✅.
  6. `labs/lab-06-automatitzacio-intelligent`: deduplicació idempotent, validació documental determinista amb esborrany d'esmena (art. 68 LPACAP, 10 dies hàbils), priorització híbrida (urgència legal + ML + *aging* anti-*starvation*), notebook + 3 tests ✅.
  7. `labs/lab-07-mlops-llmops`: `ModelRegistryMLOps` immutable (bloqueja `:latest`), *Quality Gate* en català, càlcul exacte PSI (`0,6847` a setmana 8), P95/P99 vs. mitjana, *rollback* atòmic `@champion → @previous_champion`, API FastAPI + `Dockerfile` + `ci_workflow.yml`, notebook + 2 tests ✅.
  8. `labs/lab-08-seguretat-governanca`: inventari normatiu AI Act/RGPD/ENS, auditoria de biaixos (DI 4/5, TPR, FPR), `MODEL_CARD.md` amb els 6 blocs FRIA (art. 27.1 AI Act), *Red Teaming* defensiu local (100% bloqueig, 0 falsos positius) i segell SHA-256, notebook + 3 tests ✅.

---

## 2. Què queda pendent

- **Fase 5**: 8 exàmens de mòdul (40 preg.), 10 simulacres globals (50 preg.), 20 supòsits pràctics independents i 5 simulacres teoricopràctics complets (`exams/`).
- **Fase 6**: Projecte pràctic final integrador (`final-project/`).
- **Fase 7**: Validació final integral.

---

## 3. Comprovacions executades i resultat

- Execució de `run_lab.py` i `python3 -m unittest discover` als 8 laboratoris: ✅ **8/8 laboratoris i 26/26 tests OK**.
- `node scripts/sync_content.mjs`: ✅ OK (70/70 lliçons, 700 preguntes, 360 flashcards, 71 termes glossari, **8/8 laboratoris sincronitzats**).
- `node scripts/validate_content.mjs`: ✅ OK (0 errors, 0 avisos).

---

## 4. Següent tasca exacta

Fer commit (i push si escau) de la **Fase 4 (Laboratoris 1–8)** i continuar amb la **Fase 5 (Banc d'exàmens i simulacres)**.
