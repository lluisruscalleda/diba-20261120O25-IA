# PROGRESS.md — Registre d'avanç incremental

Última actualització: 2026-11-25 (Mòdul 1 completat al 100%)

## Estat actual per fases

- **Fase 1. Planificació**: ✅ Completada
- **Fase 2. Infraestructura**: ✅ Completada i compilada sense errors
- **Fase 3. Contingut (Mòduls 1–8)**: 🟨 En curs — **Mòdul 1: 11 de 11 conceptes completats (100% del Mòdul 1; 15,7% del temari global)** — 110 preguntes test, 64 flashcards, 33 preguntes de desenvolupament, 11 exercicis amb solució oculta, 23 termes al glossari.
- **Fase 4. Laboratoris (1–8)**: ⬜ Pendent
- **Fase 5. Exàmens i simulacres**: ⬜ Pendent
- **Fase 6. Projecte integrador**: ⬜ Pendent
- **Fase 7. Validació final**: ⬜ Pendent

---

## 1. Què s'ha completat

### Fase 1 — Planificació i governança del repositori
- `AGENTS.md`, `ROADMAP.md`, `COVERAGE.md`, `PROGRESS.md`, `docs/architecture.md`, `content/syllabus.json`, `docs/glossary.json` (23 termes), `README.md`, `.env.example`, `.gitignore`.

### Fase 2 — Infraestructura completa de la plataforma educativa
- Scripts `scripts/sync_content.mjs` i `scripts/validate_content.mjs`.
- Backend opcional FastAPI + SQLite (`backend/`).
- Frontend complet React 19 + TypeScript + Vite 6 + Tailwind CSS v4 + Mermaid + Recharts (`frontend/`).

### Fase 3 — Mòdul 1 completat (11/11 conceptes amb apartats A–J, codi Python verificat, test ≥10 i flashcards ≥5)
1. `m01-01-intelligencia-artificial` — 10 preg., 6 flashcards, exemple Python verificat.
2. `m01-02-machine-learning` — 10 preg., 6 flashcards, exemple NumPy verificat.
3. `m01-03-deep-learning` — 10 preg., 6 flashcards, xarxa amb backpropagation NumPy verificada.
4. `m01-04-xarxes-neuronals` — 10 preg., 6 flashcards, comptador de paràmetres i Softmax/Sigmoid verificats.
5. `m01-05-models-generatius` — 10 preg., 6 flashcards, mostreig temperatura + top-p verificat.
6. `m01-06-sistemes-experts` — 10 preg., 6 flashcards, motor d'inferència *forward chaining* auditable verificat.
7. `m01-07-classificacio` — 10 preg., 6 flashcards, regressió logística i ajust de llindar verificats.
8. `m01-08-regressio` — 10 preg., 5 flashcards, OLS vs Ridge amb multicol·linealitat verificats.
9. `m01-09-clustering` — 10 preg., 5 flashcards, K-Means estandarditzat + Silhouette verificats.
10. `m01-10-deteccio-anomalies` — 10 preg., 6 flashcards, Z-score vs MAD (emmascarament) + arbres d'aïllament verificats.
11. `m01-11-avaluacio-generalitzacio-hiperparametres` — 10 preg., 6 flashcards, validació creuada 5-fold (underfitting → òptim → overfitting) verificada.

---

## 2. Què queda pendent

- **Mòduls 2 a 8** (59 conceptes restants):
  - **Mòdul 2** (NLP, 10 conceptes): començar per `m02-01-fonaments-nlp` fins a `m02-10-cerca-semantica`.
  - **Mòdul 3** (Models generatius, 9 conceptes).
  - **Mòdul 4** (Processament intel·ligent de documents, 8 conceptes).
  - **Mòdul 5** (Assistents virtuals i IA conversacional, 8 conceptes).
  - **Mòdul 6** (Automatització intel·ligent, 6 conceptes).
  - **Mòdul 7** (MLOps i LLMOps, 10 conceptes).
  - **Mòdul 8** (Ús responsable i seguretat de la IA, 8 conceptes).
- **Fase 4**: 8 laboratoris pràctics executables (Python / Jupyter Notebook + datasets sintètics + tests).
- **Fase 5**: 8 exàmens de mòdul (40 preg.), 10 simulacres globals (50 preg.), 20 supòsits pràctics independents i 5 simulacres teoricopràctics complets.
- **Fase 6**: Projecte pràctic final integrador (*Sistema intel·ligent de gestió d'expedients administratius*).
- **Fase 7**: Validació integral final.

---

## 3. Comprovacions executades i resultat

- `node scripts/sync_content.mjs`: ✅ OK (11/70 lliçons, 110 preguntes, 64 flashcards, 23 termes glossari).
- `node scripts/validate_content.mjs`: ✅ OK (0 errors, 0 avisos).
- `(cd frontend && pnpm build)`: ✅ OK (`tsc -b && vite build` sense errors).
- Execució directa amb `python3` dels exemples de codi de les 11 lliçons (`1.1` a `1.11`): ✅ Tots verificats i contrastats numèricament amb les interpretacions de cada lliçó.

---

## 4. Errors detectats / Limitacions conegudes

- `scikit-learn`, `fastapi` i `pytest` no estan instal·lats al Python global (sí `numpy 2.3.5` i `pandas 2.3.3`); s'instal·laran en un entorn virtual dedicat (`.venv`) en iniciar la Fase 4.
- Els chunks de producció de Vite inclouen `mermaid` i `recharts` al bundle principal (avís informatiu de mida >500 kB); optimitzable amb `manualChunks` / importació dinàmica.

---

## 5. Següent tasca exacta

Iniciar el **Mòdul 2 — Processament del llenguatge natural (10 conceptes)** desenvolupant seqüencialment des de `m02-01-fonaments-nlp` fins a `m02-10-cerca-semantica` (lliçó A–J + 10 preguntes test + ≥5 flashcards per concepte), amb execució verificada dels exemples Python, actualització del glossari, `COVERAGE.md`, `PROGRESS.md` i validació automàtica.
