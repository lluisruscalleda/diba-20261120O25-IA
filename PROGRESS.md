# PROGRESS.md — Registre d'avanç incremental

Última actualització: 2026-11-25 (Mòduls 1 a 7 completats al 100% — 88,6% del temari oficial!)

## Estat actual per fases

- **Fase 1. Planificació**: ✅ Completada
- **Fase 2. Infraestructura**: ✅ Completada i compilada sense errors
- **Fase 3. Contingut (Mòduls 1–8)**: 🟨 En curs — **62 de 70 conceptes completats (88,6% del temari global; Mòdul 1: 11/11 ✅, Mòdul 2: 10/10 ✅, Mòdul 3: 9/9 ✅, Mòdul 4: 8/8 ✅, Mòdul 5: 8/8 ✅, Mòdul 6: 6/6 ✅, Mòdul 7: 10/10 ✅)** — 620 preguntes test, 320 flashcards, 186 preguntes de desenvolupament, 62 exercicis amb solució oculta, 63 termes al glossari.
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
- **Mòdul 6 — Automatització intel·ligent (6/6 ✅)**: 60 preguntes, 30 flashcards. Commit `47bb62a`.
- **Mòdul 7 — MLOps i LLMOps (10/10 ✅)**:
  1. `m07-01-preparacio-dades` — 10 preg., 5 flashcards, *Data Contract Gate* + partició temporal sense *Data Leakage* verificat.
  2. `m07-02-etiquetatge` — 10 preg., 5 flashcards, càlcul exacte Kappa de Cohen en classe desequilibrada + *Active Learning* per marge verificat.
  3. `m07-03-entrenament` — 10 preg., 5 flashcards, *MiniMLflowTracker* multi-criteri amb bloqueig `git_dirty` verificat.
  4. `m07-04-validacio-models` — 10 preg., 5 flashcards, *Quality Gate* (*Champion vs. Challenger* + *Sliced Evaluation* + assercions PromptOps) verificat.
  5. `m07-05-desplegament` — 10 preg., 5 flashcards, *CanaryRouter* amb *rollback* automàtic davant violació d'SLA verificat.
  6. `m07-06-monitoratge` — 10 preg., 5 flashcards, càlcul exacte PSI (`0.0018` vs `0.6847`) + mitjana vs P95/P99 verificat.
  7. `m07-07-versionat` — 10 preg., 5 flashcards, *RegistryImmutable* amb bloqueig `:latest`, promoció per àlies i *rollback* atòmic verificat.
  8. `m07-08-avaluacio-continua` — 10 preg., 5 flashcards, test Z bilateral de proporcions A/B + *Guardrail Metrics* verificat.
  9. `m07-09-actualitzacio-models` — 10 preg., 5 flashcards, orquestrador CI/CD/CT amb *Cooldown*, mínim d'etiquetes i *Continuous Delivery* verificat.
  10. `m07-10-integracio-sistemes` — 10 preg., 5 flashcards, *CircuitBreakerIA* (`CLOSED → OPEN → HALF_OPEN`) amb `correlation_id` i *fallback* segur verificat.

---

## 2. Què queda pendent

- **Mòdul 8** (darrer mòdul del temari oficial — 8 conceptes restants!):
  - `m08-01-transparencia` .. `m08-08-compliment-normatiu` (amb rigor normatiu estricte: AI Act UE 2024/1689, RGPD UE 2016/679, LOPDGDD 3/2018, ENS RD 311/2022, LPACAP 39/2015, LRJSP 40/2015, AEPD, APDCAT, CCN-CERT).
- **Fases 4–7**: Laboratoris, Exàmens/simulacres, Projecte final i Validació integral.

---

## 3. Comprovacions executades i resultat

- `node scripts/sync_content.mjs`: ✅ OK (62/70 lliçons, 620 preguntes, 320 flashcards, 63 termes glossari).
- `node scripts/validate_content.mjs`: ✅ OK (0 errors, 0 avisos).
- Execució directa amb `python3` dels 10 exemples de codi del Mòdul 7 (`7.1` a `7.10`): ✅ Tots verificats i contrastats.

---

## 4. Següent tasca exacta

Completar el **Mòdul 8 — Ús responsable i seguretat de la IA (8 conceptes)** des de `m08-01-transparencia` fins a `m08-08-compliment-normatiu`, validar el 100% del temari oficial (70/70 conceptes, 700 preguntes, ≥360 flashcards) amb 0 errors i 0 avisos, actualitzar `COVERAGE.md`, `ROADMAP.md`, `PROGRESS.md` i `docs/glossary.json`, i fer-ne el commit.
