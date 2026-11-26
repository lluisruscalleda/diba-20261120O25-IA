# PROGRESS.md — Registre d'avanç incremental

Última actualització: 2026-11-26 (Fases 1–5 completades al 100%: 70/70 conceptes, 8/8 laboratoris, 43/43 artefactes d'examen i simulacre!)

## Estat actual per fases

- **Fase 1. Planificació**: ✅ Completada
- **Fase 2. Infraestructura**: ✅ Completada i compilada sense errors
- **Fase 3. Contingut (Mòduls 1–8)**: ✅ **100% (70/70 conceptes, 700 preguntes, 360 flashcards, 71 termes glossari)** — publicat a `origin/main`.
- **Fase 4. Laboratoris (1–8)**: ✅ **100% (8/8 laboratoris executables, datasets sintètics, notebooks i 26 tests en verd)** — publicat a `origin/main` (`dcbac0d`).
- **Fase 5. Exàmens i simulacres**: ✅ **100% (8 exàmens de mòdul, 10 simulacres globals, 20 supòsits pràctics independents i 5 simulacres teoricopràctics complets)**.
- **Fase 6. Projecte integrador**: ⬜ Pendent
- **Fase 7. Validació final**: ⬜ Pendent

---

## 1. Què s'ha completat en aquesta sessió

- **Push a `origin/main`** de la Fase 4 (`ba259ee..dcbac0d`).
- **Fase 5 — Banc d'exàmens i simulacres (`exams/`, 43 fitxers JSON)**:
  - **8 exàmens de mòdul** (`exams/module-exams/module-01.json` .. `module-08.json`): 40 preguntes estratificades per tots els conceptes de cada mòdul (320 preguntes en total).
  - **10 simulacres globals** (`exams/global-mocks/mock-01.json` .. `mock-10.json`): 50 preguntes proporcionals als 8 mòduls cadascun (500 preguntes úniques del banc de 700, distribució `{1:8, 2:7, 3:7, 4:6, 5:6, 6:4, 7:6, 8:6}`).
  - **20 supòsits pràctics independents** (`exams/practical-cases/case-01.json` .. `case-20.json`): enunciats originals ambientats a la Diputació de Barcelona / administració local, tots amb requisits, rúbrica exacta de 100 punts, solució model detallada i enfocaments alternatius (cobrint ML/*data leakage*, NLP en català, RAG normatiu, IDP factures, Assistent 010/RBAC, Automatització + *Once-Only* + art. 68 LPACAP, MLOps/PSI/*rollback*, PromptOps/FinOps/vLLM, EIPD+FRIA+ENS, *Indirect Prompt Injection* + APDCAT 72 h, *clustering* territorial, *sentiment*/*topic modeling*, anonimització/DA 7a LOPDGDD, ASR actes de Ple, RAG vs. LoRA/LCSP, auditoria biaixos selecció personal, *anti-rubber-stamping* HITL, integració *legacy* ENI/*Circuit Breaker*, governança anti-*Shadow AI* i cas integrador transversal).
  - **5 simulacres teoricopràctics complets** (`exams/full-simulations/sim-01.json` .. `sim-05.json`): 60 preguntes estratificades pels 8 mòduls (`{1:9, 2:8, 3:8, 4:7, 5:7, 6:5, 7:8, 8:8}`) vinculades a un supòsit pràctic (`case-03`, `case-06`, `case-07`, `case-09`, `case-20`), amb paràmetres orientatius i configurables (no bases oficials).

---

## 2. Què queda pendent

- **Fase 6**: Projecte pràctic final integrador (`final-project/` — Sistema intel·ligent de gestió d'expedients administratius de 13 passos, arquitectura, API FastAPI, datasets sintètics, tests i anàlisi de riscos).
- **Fase 7**: Validació final integral (tests Python, validació de continguts, build frontend i revisió d'enllaços).

---

## 3. Comprovacions executades i resultat

- Validació estructural i de rúbriques dels 43 fitxers de `exams/`: ✅ **43/43 OK** (0 duplicats interns, totes les rúbriques sumen exactament 100 punts).
- `node scripts/sync_content.mjs`: ✅ OK (70/70 lliçons, 700 preguntes, 360 flashcards, 71 termes glossari, 8/8 laboratoris, 8 exàmens de mòdul, 10 simulacres globals, 20 supòsits pràctics, 5 simulacres complets).
- `node scripts/validate_content.mjs`: ✅ OK (0 errors, 0 avisos).

---

## 4. Següent tasca exacta

Iniciar la **Fase 6 (Projecte pràctic final integrador)** a `final-project/` (o fer `git push` de la Fase 5 quan l'usuari ho indiqui).
