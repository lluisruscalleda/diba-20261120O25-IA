# PROGRESS.md — Registre d'avanç incremental

Última actualització: 2026-11-25 (Mòduls 1, 2 i 3 completats al 100%)

## Estat actual per fases

- **Fase 1. Planificació**: ✅ Completada
- **Fase 2. Infraestructura**: ✅ Completada i compilada sense errors
- **Fase 3. Contingut (Mòduls 1–8)**: 🟨 En curs — **30 de 70 conceptes completats (42,9% del temari global; Mòdul 1: 11/11 ✅, Mòdul 2: 10/10 ✅, Mòdul 3: 9/9 ✅)** — 300 preguntes test, 160 flashcards, 90 preguntes de desenvolupament, 30 exercicis amb solució oculta, 38 termes al glossari.
- **Fase 4. Laboratoris (1–8)**: ⬜ Pendent
- **Fase 5. Exàmens i simulacres**: ⬜ Pendent
- **Fase 6. Projecte integrador**: ⬜ Pendent
- **Fase 7. Validació final**: ⬜ Pendent

---

## 1. Què s'ha completat

- **Mòdul 1 — Fonaments d'IA (11/11 ✅)**: 110 preguntes test, 64 flashcards, 11 exemples Python/NumPy verificats. Commit `ad6bd39`.
- **Mòdul 2 — Processament del llenguatge natural (10/10 ✅)**: 100 preguntes test, 51 flashcards, 10 exemples Python/NumPy verificats. Commit `111dc4f`.
- **Mòdul 3 — Models generatius (9/9 ✅)**:
  1. `m03-01-llm` — 10 preg., 5 flashcards, calculadora VRAM (pesos + KV Cache GQA) verificada.
  2. `m03-02-arquitectura-transformer` — 10 preg., 5 flashcards, RMSNorm + codificació posicional sinusoidal verificats.
  3. `m03-03-atencio-self-attention` — 10 preg., 5 flashcards, Scaled Dot-Product Self-Attention causal amb/sense `1/√d_k` verificat.
  4. `m03-04-prompt-engineering` — 10 preg., 5 flashcards, plantilla versionada SHA-256 + delimitadors XML + validació estricta verificada.
  5. `m03-05-fine-tuning` — 10 preg., 5 flashcards, LoRA (inicialització B=0, paràmetres 0,78%, fusió `W0 + (α/r)BA`) verificada.
  6. `m03-06-embeddings-rag` — 10 preg., 5 flashcards, quantització escalar `INT8` + truncament Matryoshka (`MRL`) i Recall@10 verificats.
  7. `m03-07-bases-dades-vectorials` — 10 preg., 5 flashcards, índex ANN IVF des de zero (`nprobe` vs Recall@10) verificat.
  8. `m03-08-rag` — 10 preg., 5 flashcards, mini-pipeline RAG (chunking per articles, pre-filtre vigència, abstenció i verificador de cites) verificat.
  9. `m03-09-agents-ia` — 10 preg., 5 flashcards, runtime d'agent segur (llista blanca, *circuit breaker*, bloqueig HITL i traça d'auditoria) verificat.

---

## 2. Què queda pendent

- **Mòduls 4 a 8** (40 conceptes restants):
  - **Mòdul 4** (Processament intel·ligent de documents, 8 conceptes): `m04-01-ocr` .. `m04-08-documents-tributaris`.
  - **Mòdul 5** (Assistents virtuals i IA conversacional, 8 conceptes).
  - **Mòdul 6** (Automatització intel·ligent, 6 conceptes).
  - **Mòdul 7** (MLOps i LLMOps, 10 conceptes).
  - **Mòdul 8** (Ús responsable i seguretat de la IA, 8 conceptes).
- **Fase 4**: 8 laboratoris pràctics executables.
- **Fase 5**: Exàmens de mòdul, simulacres globals, supòsits pràctics i simulacres complets.
- **Fase 6**: Projecte pràctic final integrador.
- **Fase 7**: Validació integral final.

---

## 3. Comprovacions executades i resultat

- `node scripts/sync_content.mjs`: ✅ OK (30/70 lliçons, 300 preguntes, 160 flashcards, 38 termes glossari).
- `node scripts/validate_content.mjs`: ✅ OK (0 errors, 0 avisos).
- Execució directa amb `python3` dels 9 exemples de codi del Mòdul 3 (`3.1` a `3.9`): ✅ Tots verificats i contrastats.

---

## 4. Següent tasca exacta

Iniciar el **Mòdul 4 — Processament intel·ligent de documents (8 conceptes)** des de `m04-01-ocr` fins a `m04-08-documents-tributaris`, validar-lo amb 0 errors i 0 avisos, actualitzar `COVERAGE.md`, `ROADMAP.md`, `PROGRESS.md` i `docs/glossary.json`, i fer-ne el commit.
