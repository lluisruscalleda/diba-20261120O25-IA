# PROGRESS.md — Registre d'avanç incremental

Última actualització: 2026-11-25 (Mòduls 1 i 2 completats al 100%)

## Estat actual per fases

- **Fase 1. Planificació**: ✅ Completada
- **Fase 2. Infraestructura**: ✅ Completada i compilada sense errors
- **Fase 3. Contingut (Mòduls 1–8)**: 🟨 En curs — **21 de 70 conceptes completats (30,0% del temari global; Mòdul 1: 11/11 ✅, Mòdul 2: 10/10 ✅)** — 210 preguntes test, 115 flashcards, 63 preguntes de desenvolupament, 21 exercicis amb solució oculta, 30 termes al glossari.
- **Fase 4. Laboratoris (1–8)**: ⬜ Pendent
- **Fase 5. Exàmens i simulacres**: ⬜ Pendent
- **Fase 6. Projecte integrador**: ⬜ Pendent
- **Fase 7. Validació final**: ⬜ Pendent

---

## 1. Què s'ha completat

- **Mòdul 1 — Fonaments d'IA (11/11 ✅)**: 110 preguntes test, 64 flashcards, 11 exemples Python/NumPy verificats. Commit `ad6bd39`.
- **Mòdul 2 — Processament del llenguatge natural (10/10 ✅)**:
  1. `m02-01-fonaments-nlp` — 10 preg., 6 flashcards, TF-IDF conscient del català (`l·l`, apòstrofs) verificat.
  2. `m02-02-tokenitzacio` — 10 preg., 5 flashcards, entrenador BPE en Python verificat.
  3. `m02-03-embeddings-nlp` — 10 preg., 5 flashcards, equivalència cosinus/dot/L2 verificada.
  4. `m02-04-classificacio-textos` — 10 preg., 5 flashcards, Multinomial Naive Bayes + zona gris verificat.
  5. `m02-05-extraccio-informacio` — 10 preg., 5 flashcards, extractor híbrid amb validació DNI/Decimal/ISO verificat.
  6. `m02-06-ner` — 10 preg., 5 flashcards, decodificador BIO + Strict Entity-Level F1 (`seqeval`) verificat.
  7. `m02-07-resum-automatic` — 10 preg., 5 flashcards, TextRank extractiu + ROUGE-1 verificat.
  8. `m02-08-traduccio-automatica` — 10 preg., 5 flashcards, BLEU (*clipped precision* + BP) + chrF verificat.
  9. `m02-09-recuperacio-informacio` — 10 preg., 5 flashcards, Okapi BM25 + Recall@k/MRR/nDCG@k verificat.
  10. `m02-10-cerca-semantica` — 10 preg., 5 flashcards, cerca híbrida amb Reciprocal Rank Fusion (RRF) verificada.

---

## 2. Què queda pendent

- **Mòduls 3 a 8** (49 conceptes restants):
  - **Mòdul 3** (Models generatius, 9 conceptes): `m03-01-llm` .. `m03-09-agents-ia`.
  - **Mòdul 4** (Processament intel·ligent de documents, 8 conceptes).
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

- `node scripts/sync_content.mjs`: ✅ OK (21/70 lliçons, 210 preguntes, 115 flashcards, 30 termes glossari).
- `node scripts/validate_content.mjs`: ✅ OK (0 errors, 0 avisos).
- Execució directa amb `python3` dels 10 exemples de codi del Mòdul 2 (`2.1` a `2.10`): ✅ Tots verificats i contrastats.

---

## 4. Següent tasca exacta

Iniciar el **Mòdul 3 — Models generatius (9 conceptes)** des de `m03-01-llm` fins a `m03-09-agents-ia`, validar-lo amb 0 errors i 0 avisos, actualitzar `COVERAGE.md`, `ROADMAP.md`, `PROGRESS.md` i `docs/glossary.json`, i fer-ne el commit.
