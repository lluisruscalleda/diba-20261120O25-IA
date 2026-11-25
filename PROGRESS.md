# PROGRESS.md — Registre d'avanç incremental

Última actualització: 2026-11-25 (Mòduls 1 a 6 completats al 100% — 74,3% del temari oficial!)

## Estat actual per fases

- **Fase 1. Planificació**: ✅ Completada
- **Fase 2. Infraestructura**: ✅ Completada i compilada sense errors
- **Fase 3. Contingut (Mòduls 1–8)**: 🟨 En curs — **52 de 70 conceptes completats (74,3% del temari global; Mòdul 1: 11/11 ✅, Mòdul 2: 10/10 ✅, Mòdul 3: 9/9 ✅, Mòdul 4: 8/8 ✅, Mòdul 5: 8/8 ✅, Mòdul 6: 6/6 ✅)** — 520 preguntes test, 270 flashcards, 156 preguntes de desenvolupament, 52 exercicis amb solució oculta, 56 termes al glossari.
- **Fase 4. Laboratoris (1–8)**: ⬜ Pendent
- **Fase 5. Exàmens i simulacres**: ⬜ Pendent
- **Fase 6. Projecte integrador**: ⬜ Pendent
- **Fase 7. Validació final**: ⬜ Pendent

---

## 1. Què s'ha completat

- **Mòdul 1 — Fonaments d'IA (11/11 ✅)**: 110 preguntes, 64 flashcards. Commit `ad6bd39`.
- **Mòdul 2 — Processament del llenguatge natural (10/10 ✅)**: 100 preguntes, 51 flashcards. Commit `111dc4f`.
- **Mòdul 3 — Models generatius (9/9 ✅)**: 90 preguntes, 45 flashcards. Commit `4e7f2e1`.
- **Mòdul 4 — Processament intel·ligent de documents (8/8 ✅)**: 80 preguntes, 40 flashcards. Commit `b8990e2`.
- **Mòdul 5 — Assistents virtuals i IA conversacional (8/8 ✅)**: 80 preguntes, 40 flashcards. Commit `661bd39`.
- **Mòdul 6 — Automatització intel·ligent (6/6 ✅)**:
  1. `m06-01-rpa` — 10 preg., 5 flashcards, orquestrador RPA idempotent amb separació d'excepcions tècniques vs. negoci verificat.
  2. `m06-02-regles-negoci` — 10 preg., 5 flashcards, motor declaratiu DMN (`FIRST` + `COLLECT`) versionat amb motivació jurídica i senyal ML verificat.
  3. `m06-03-classificadors-automatics` — 10 preg., 5 flashcards, enrutador amb llindars asimètrics per classe, marge Top1-Top2 i mètriques de cobertura/precisió verificat.
  4. `m06-04-sistemes-recomanacio` — 10 preg., 5 flashcards, recomanador híbrid (elegibilitat + cosinus + diversitat) i càlcul `NDCG@3` verificat.
  5. `m06-05-prioritzacio-casos` — 10 preg., 5 flashcards, motor de priorització amb *Override P0*, urgència SLA i *Aging* anti-*Starvation* verificat.
  6. `m06-06-validacio-automatica-processos` — 10 preg., 5 flashcards, validador integral (Via Oberta, art. 28/68 LPACAP, art. 95 LGT, resiliència i semaforització) verificat.

---

## 2. Què queda pendent

- **Mòduls 7 i 8** (18 conceptes restants):
  - **Mòdul 7** (MLOps i LLMOps, 10 conceptes): `m07-01-preparacio-dades` .. `m07-10-integracio-sistemes`.
  - **Mòdul 8** (Ús responsable i seguretat de la IA, 8 conceptes): `m08-01-transparencia` .. `m08-08-compliment-normatiu`.
- **Fases 4–7**: Laboratoris, Exàmens/simulacres, Projecte final i Validació integral.

---

## 3. Comprovacions executades i resultat

- `node scripts/sync_content.mjs`: ✅ OK (52/70 lliçons, 520 preguntes, 270 flashcards, 56 termes glossari).
- `node scripts/validate_content.mjs`: ✅ OK (0 errors, 0 avisos).
- Execució directa amb `python3` dels 6 exemples de codi del Mòdul 6 (`6.1` a `6.6`): ✅ Tots verificats i contrastats.

---

## 4. Següent tasca exacta

Iniciar el **Mòdul 7 — MLOps i LLMOps (10 conceptes)** des de `m07-01-preparacio-dades` fins a `m07-10-integracio-sistemes`, validar-lo amb 0 errors i 0 avisos, actualitzar `COVERAGE.md`, `ROADMAP.md`, `PROGRESS.md` i `docs/glossary.json`, i fer-ne el commit.
