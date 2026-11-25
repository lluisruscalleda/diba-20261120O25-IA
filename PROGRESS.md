# PROGRESS.md — Registre d'avanç incremental

Última actualització: 2026-11-25 (Mòduls 1, 2, 3 i 4 completats al 100% — Superat el 50% del temari!)

## Estat actual per fases

- **Fase 1. Planificació**: ✅ Completada
- **Fase 2. Infraestructura**: ✅ Completada i compilada sense errors
- **Fase 3. Contingut (Mòduls 1–8)**: 🟨 En curs — **38 de 70 conceptes completats (54,3% del temari global; Mòdul 1: 11/11 ✅, Mòdul 2: 10/10 ✅, Mòdul 3: 9/9 ✅, Mòdul 4: 8/8 ✅)** — 380 preguntes test, 200 flashcards, 114 preguntes de desenvolupament, 38 exercicis amb solució oculta, 44 termes al glossari.
- **Fase 4. Laboratoris (1–8)**: ⬜ Pendent
- **Fase 5. Exàmens i simulacres**: ⬜ Pendent
- **Fase 6. Projecte integrador**: ⬜ Pendent
- **Fase 7. Validació final**: ⬜ Pendent

---

## 1. Què s'ha completat

- **Mòdul 1 — Fonaments d'IA (11/11 ✅)**: 110 preguntes, 64 flashcards. Commit `ad6bd39`.
- **Mòdul 2 — Processament del llenguatge natural (10/10 ✅)**: 100 preguntes, 51 flashcards. Commit `111dc4f`.
- **Mòdul 3 — Models generatius (9/9 ✅)**: 90 preguntes, 45 flashcards. Commit `4e7f2e1`.
- **Mòdul 4 — Processament intel·ligent de documents (8/8 ✅)**:
  1. `m04-01-ocr` — 10 preg., 5 flashcards, càlcul exacte CER/WER (Levenshtein) i enrutador OCR verificats.
  2. `m04-02-classificacio-documental` — 10 preg., 5 flashcards, motor *Split & Classify* multipàgina ENI verificat.
  3. `m04-03-extraccio-camps` — 10 preg., 5 flashcards, confiança composta + validació aritmètica creuada `Decimal` i STP verificats.
  4. `m04-04-reconeixement-entitats-documents` — 10 preg., 5 flashcards, pseudonimitzador consistent PII + preservació càrrecs públics + verificador post-redacció verificats.
  5. `m04-05-validacio-automatica-documental` — 10 preg., 5 flashcards, validador multicapa (DNI/NIE mod 23, IBAN MOD 97-10 i coherència creuada) verificat.
  6. `m04-06-tractament-formularis` — 10 preg., 5 flashcards, detector OMR en NumPy amb zona ambigua i grups excloents verificat.
  7. `m04-07-documents-administratius` — 10 preg., 5 flashcards, estructurador de decrets amb metadades ENI i SHA-256 verificat.
  8. `m04-08-documents-tributaris` — 10 preg., 5 flashcards, algorisme oficial de Referència Cadastral (20 chars) + motor fiscal determinista IIVTNU en `Decimal` verificats.

---

## 2. Què queda pendent

- **Mòduls 5 a 8** (32 conceptes restants):
  - **Mòdul 5** (Assistents virtuals i IA conversacional, 8 conceptes): `m05-01-chatbots` .. `m05-08-escalada-humana`.
  - **Mòdul 6** (Automatització intel·ligent, 6 conceptes).
  - **Mòdul 7** (MLOps i LLMOps, 10 conceptes).
  - **Mòdul 8** (Ús responsable i seguretat de la IA, 8 conceptes).
- **Fases 4–7**: Laboratoris, Exàmens/simulacres, Projecte final i Validació integral.

---

## 3. Comprovacions executades i resultat

- `node scripts/sync_content.mjs`: ✅ OK (38/70 lliçons, 380 preguntes, 200 flashcards, 44 termes glossari).
- `node scripts/validate_content.mjs`: ✅ OK (0 errors, 0 avisos).
- Execució directa amb `python3` dels 8 exemples de codi del Mòdul 4 (`4.1` a `4.8`): ✅ Tots verificats i contrastats.

---

## 4. Següent tasca exacta

Iniciar el **Mòdul 5 — Assistents virtuals i IA conversacional (8 conceptes)** des de `m05-01-chatbots` fins a `m05-08-escalada-humana`, validar-lo amb 0 errors i 0 avisos, actualitzar `COVERAGE.md`, `ROADMAP.md`, `PROGRESS.md` i `docs/glossary.json`, i fer-ne el commit.
