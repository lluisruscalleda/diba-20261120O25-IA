# PROGRESS.md — Registre d'avanç incremental

Última actualització: 2026-11-25 (Final de la Sessió 1)

## Estat actual per fases

- **Fase 1. Planificació**: ✅ Completada
- **Fase 2. Infraestructura**: ✅ Completada i compilada sense errors
- **Fase 3. Contingut (Mòduls 1–8)**: 🟨 En curs — **Mòdul 1: 4 de 11 conceptes completats** (40 preguntes test, 24 flashcards, 12 preguntes de desenvolupament, 4 exercicis amb solució oculta)
- **Fase 4. Laboratoris (1–8)**: ⬜ Pendent
- **Fase 5. Exàmens i simulacres**: ⬜ Pendent
- **Fase 6. Projecte integrador**: ⬜ Pendent
- **Fase 7. Validació final**: ⬜ Pendent

---

## 1. Què s'ha completat (Sessió 1)

### Fase 1 — Planificació i governança del repositori
- `AGENTS.md`: regles permanents del projecte, estructura A–J, esquemes JSON i criteris normatius.
- `ROADMAP.md`: pla mestre per fases (1 a 7).
- `COVERAGE.md`: matriu de traçabilitat dels 70 conceptes oficials, 8 laboratoris, exàmens/simulacres i projecte final.
- `docs/architecture.md`: arquitectura del sistema, diagrames Mermaid i decisions tècniques.
- `content/syllabus.json`: font única de veritat dels 8 mòduls, 70 conceptes i 8 laboratoris.
- `docs/glossary.json`: glossari tècnic bilingüe inicial (14 termes base, ampliable per mòdul).
- `README.md`, `.env.example`, `.gitignore`.

### Fase 2 — Infraestructura completa de la plataforma educativa
- **Scripts de pipeline**:
  - `scripts/sync_content.mjs`: genera `manifest.json`, `search-index.json`, `all-questions.json`, `all-flashcards.json` i sincronitza tot el contingut cap a `frontend/public/data/`.
  - `scripts/validate_content.mjs`: valida estructura A–J, blocs `:::hint`, `:::solution`, `:::model-answer`, esquema JSON dels tests (4 opcions, explicacions dels 3 distractors, distribució de dificultats, detecció de duplicats) i flashcards.
- **Backend opcional (`backend/`)**:
  - `backend/app/database.py`, `backend/app/main.py`, `backend/requirements.txt`, `backend/README.md` (FastAPI + SQLite local per persistència d'estat, sense execució de codi arbitrari).
- **Frontend (`frontend/`)**:
  - React 19 + TypeScript estricte + Vite 6 + Tailwind CSS v4 + `@tailwindcss/typography` + Mermaid + Recharts + `react-markdown` + `remark-gfm` + `rehype-highlight` + `lucide-react`.
  - `AcademyContext.tsx`: persistència en `localStorage`, exportació/importació JSON i sincronització transparent opcional amb FastAPI.
  - Components: `Layout.tsx`, `MarkdownRenderer.tsx`, `MermaidDiagram.tsx`, `QuizRunner.tsx`, `FlashcardDeck.tsx`.
  - Utilitats: `sm2.ts` (repetició espaiada SM-2), `examEngine.ts` (penalització configurable, càlcul de domini i selecció adaptativa), `studyPlan.ts` (plans 15/30/45/60/90 dies), `markdownBlocks.ts` (parser A–J i directives interactives).
  - Pàgines: `DashboardPage.tsx`, `LessonPage.tsx`, `ExamCenterPage.tsx`, `ReviewPage.tsx`, `StudyPlanPage.tsx`, `GlossaryPage.tsx`, `LabsAndProjectPage.tsx`.

### Fase 3 — Mòdul 1 (4/11 conceptes completats amb tots els apartats A–J)
1. `m01-01-intelligencia-artificial`: lliçó completa + 10 preguntes test + 6 flashcards + exemple Python verificat.
2. `m01-02-machine-learning`: lliçó completa + 10 preguntes test + 6 flashcards + exemple NumPy verificat.
3. `m01-03-deep-learning`: lliçó completa + 10 preguntes test + 6 flashcards + xarxa neuronal amb backpropagation en NumPy verificada.
4. `m01-04-xarxes-neuronals`: lliçó completa + 10 preguntes test + 6 flashcards + comptador de paràmetres i comparativa Softmax/Sigmoid verificats.

---

## 2. Què queda pendent

- **Mòdul 1 (7 conceptes pendents)**:
  - `m01-05-models-generatius`
  - `m01-06-sistemes-experts`
  - `m01-07-classificacio`
  - `m01-08-regressio`
  - `m01-09-clustering`
  - `m01-10-deteccio-anomalies`
  - `m01-11-avaluacio-generalitzacio-hiperparametres`
- **Mòduls 2 a 8** (59 conceptes restants).
- **Fase 4**: 8 laboratoris pràctics en Python / Jupyter Notebook + datasets sintètics + tests.
- **Fase 5**: 8 exàmens de mòdul (40 preg.), 10 simulacres globals (50 preg.), 20 supòsits pràctics independents i 5 simulacres teoricopràctics complets.
- **Fase 6**: Projecte pràctic final integrador (*Sistema intel·ligent de gestió d'expedients administratius*).
- **Fase 7**: Validació integral final.

---

## 3. Fitxers creats / modificats en aquesta sessió

- Arrel: `AGENTS.md`, `ROADMAP.md`, `COVERAGE.md`, `PROGRESS.md`, `README.md`, `.env.example`, `.gitignore`.
- Documentació i temari: `docs/architecture.md`, `docs/glossary.json`, `content/syllabus.json`.
- Scripts: `scripts/sync_content.mjs`, `scripts/validate_content.mjs`.
- Backend: `backend/requirements.txt`, `backend/README.md`, `backend/app/__init__.py`, `backend/app/database.py`, `backend/app/main.py`.
- Frontend: `frontend/package.json`, `frontend/tsconfig*.json`, `frontend/vite.config.ts`, `frontend/index.html`, `frontend/src/*` (`types/`, `utils/`, `context/`, `components/`, `pages/`, `App.tsx`, `main.tsx`, `index.css`, `vite-env.d.ts`).
- Contingut Mòdul 1:
  - `content/module-01/m01-01-intelligencia-artificial.md` .. `m01-04-xarxes-neuronals.md`
  - `question-bank/module-01/m01-01-intelligencia-artificial.json` .. `m01-04-xarxes-neuronals.json`
  - `flashcards/module-01/m01-01-intelligencia-artificial.json` .. `m01-04-xarxes-neuronals.json`

---

## 4. Comprovacions executades i resultat

- `node scripts/sync_content.mjs`: ✅ OK (4/70 lliçons, 40 preguntes, 24 flashcards, 14 termes glossari).
- `node scripts/validate_content.mjs`: ✅ OK (0 errors, 0 avisos).
- `cd frontend && pnpm build` (`tsc -b && vite build`): ✅ OK (compilació TypeScript estricta i bundle Vite sense errors).
- `python3 -m py_compile backend/app/database.py backend/app/main.py`: ✅ OK.
- Execució directa amb `python3` dels exemples de codi de les lliçons `1.1`, `1.2`, `1.3` i `1.4`: ✅ Tots quatre executats i resultats numèrics contrastats exactament amb el text de les lliçons.

---

## 5. Errors detectats / Limitacions conegudes

- `scikit-learn`, `fastapi` i `pytest` no estan instal·lats a l'intèrpret Python global del sistema (sí que ho estan `numpy 2.3.5` i `pandas 2.3.3`). Quan s'implementin el backend tests i els laboratoris (Fase 4), caldrà crear un entorn virtual dedicat (`.venv`) amb les dependències definides als respectius `requirements.txt`.
- Els chunks de producció de Vite inclouen `mermaid` i `recharts` al bundle principal (avís informatiu de mida de chunk >500 kB); en una millora futura es pot afegir `manualChunks` o càrrega dinàmica de `mermaid` per reduir el bundle inicial.

---

## 6. Següent tasca exacta

Continuar el **Mòdul 1** desenvolupant seqüencialment el concepte **`m01-05-models-generatius`** (lliçó A–J a `content/module-01/m01-05-models-generatius.md`, 10 preguntes tipus test a `question-bank/module-01/m01-05-models-generatius.json` i ≥5 flashcards a `flashcards/module-01/m01-05-models-generatius.json`), i tot seguit completar `m01-06` fins a `m01-11`, actualitzant `COVERAGE.md`, `PROGRESS.md` i executant `sync_content.mjs` i `validate_content.mjs` després de cada bloc.
