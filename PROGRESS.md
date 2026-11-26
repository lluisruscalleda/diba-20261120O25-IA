# PROGRESS.md — Registre d'avanç incremental

Última actualització: 2026-11-26 (PROJECTE COMPLETAT AL 100% — Fases 1 a 7 finalitzades i validades sense errors!)

## Estat actual per fases

- **Fase 1. Planificació**: ✅ Completada
- **Fase 2. Infraestructura**: ✅ Completada i compilada sense errors
- **Fase 3. Contingut (Mòduls 1–8)**: ✅ **100%** (70/70 conceptes, 700 preguntes úniques, 360 flashcards, 71 termes glossari)
- **Fase 4. Laboratoris (1–8)**: ✅ **100%** (8/8 laboratoris executables, datasets sintètics, notebooks i 26/26 tests en verd)
- **Fase 5. Exàmens i simulacres**: ✅ **100%** (8 exàmens de mòdul, 10 simulacres globals, 20 supòsits pràctics i 5 simulacres complets)
- **Fase 6. Projecte integrador (`final-project/`)**: ✅ **100%** (SIGEA-IA: 8 mòduls, flux de 13 passos, API FastAPI, Dockerfile no-root, SQLite SHA-256 i 15/15 tests en verd)
- **Fase 7. Validació integral final**: ✅ **100%** (auditoria completa de cobertura, esquemes, duplicats, enllaços, 41/41 tests Python, build frontend i documentació de limitacions)

---

## 1. Resultat de la Validació Integral Final (Fase 7)

1. **Matriu de cobertura (`COVERAGE.md`)**: **100,0%** (0 elements pendents `⬜` ni parcials `🟨`).
2. **Esquemes JSON, duplicats i distribució del banc de preguntes**:
   - **70/70 lliçons** amb els 10 apartats obligatoris (`A–J`), frontmatter YAML i **0 `crossReferences` trencades** (corregides 7 referències creuades obsoletes detectades a `content/module-08/m08-01..05.md`).
   - **700/700 preguntes** vàlides, **700 enunciats únics (0 duplicats)**, **0 `lessonRef` trencades**, distribució exacta de dificultat (`210 basic`, `280 intermediate`, `210 advanced`) i totes les opcions incorrectes explicades.
   - **360 flashcards** amb IDs únics i esquema vàlid.
   - **43/43 fitxers d'examen** (`8` exàmens de mòdul de 40 preg., `10` simulacres globals de 50 preg., `20` supòsits pràctics amb rúbrica exacta de 100 punts i `5` simulacres complets de 60 preg. + supòsit vinculat): **0 errors** i tots els camins sincronitzats a `frontend/public/data/`.
3. **Tests automatitzats Python i compilació**:
   - **8 laboratoris (`labs/lab-01..08`)**: **26/26 tests `unittest` OK**.
   - **Projecte final (`final-project/`)**: **15/15 tests `unittest` OK** (total: **41/41 tests Python en verd**).
   - `python3 -m py_compile` sobre `backend/`, `labs/` i `final-project/`: **OK**.
4. **Frontend i sincronització**:
   - `node scripts/sync_content.mjs` i `node scripts/validate_content.mjs`: **0 errors | 0 avisos**.
   - `npx tsc --noEmit`, `tsc -b` i `vite build`: **OK** (compilació de producció neta).
5. **Higiene de seguretat i normativa**:
   - Escaneig automàtic de patrons de claus d'API/secrets: **0 coincidències**.
   - Normativa verificada (Reglament UE 2024/1689 AI Act, RGPD 2016/679, LOPDGDD LO 3/2018, ENS RD 311/2022, LPACAP 39/2015, LRJSP 40/2015, LCSP 9/2017) i paràmetres d'examen marcats explícitament com a orientatius/configurables.

---

## 2. Limitacions explícites documentades

1. **Dependències Python opcionals a l'entorn amfitrió**: l'entorn local de verificació disposa de Python 3 estàndard (sense `fastapi`, `pydantic`, `uvicorn` ni `pytest` instal·lats globalment). Per aquest motiu, tant els 8 laboratoris com el nucli de 13 passos de `final-project/` s'han dissenyat perquè siguin 100% executables i verificables amb la llibreria estàndard (`unittest`), mentre que les APIs FastAPI (`backend/` i `final-project/api/`) s'han validat sintàcticament (`py_compile`) i requereixen instal·lar `requirements.txt` en un entorn virtual o contenidor Docker per servir trànsit HTTP en viu.
2. **Dades 100% sintètiques i models locals deterministes**: tots els datasets, NIFs, ordenances i expedients són sintètics (cap dada personal real). Els motors NLP/RAG/IDP inclosos als laboratoris i a SIGEA-IA funcionen localment sense GPU ni APIs externes; en un desplegament real de producció es connectarien a un servidor d'inferència *on-premise* (p. ex. vLLM/Ollama amb models *open-weights* i base vectorial `pgvector`/Qdrant dins perímetre ENS).
3. **Mida del paquet (*bundle*) frontend**: `vite build` emet un avís informatiu de chunk principal superior a 500 kB a causa de les llibreries `mermaid`, `katex` i `recharts`; no afecta la funcionalitat ni la compilació, i es pot optimitzar opcionalment en el futur amb `manualChunks`.
4. **Distribució d'opcions correctes als tests**: sobre les 700 preguntes, les 4 opcions estan presents (`A: 208`, `B: 225`, `C: 190`, `D: 77`), amb menor pes relatiu de `D` (11%), mantingut així per no alterar preguntes ja revisades.

---

## 3. Següent tasca exacta

Fer commit de la **Fase 7** (i `git push` dels commits pendents a `origin/main` quan l'usuari ho indiqui).
