# PROGRESS.md — Registre d'avanç incremental

Última actualització: 2026-11-25 (Mòduls 1, 2, 3, 4 i 5 completats al 100% — 65,7% del temari oficial!)

## Estat actual per fases

- **Fase 1. Planificació**: ✅ Completada
- **Fase 2. Infraestructura**: ✅ Completada i compilada sense errors
- **Fase 3. Contingut (Mòduls 1–8)**: 🟨 En curs — **46 de 70 conceptes completats (65,7% del temari global; Mòdul 1: 11/11 ✅, Mòdul 2: 10/10 ✅, Mòdul 3: 9/9 ✅, Mòdul 4: 8/8 ✅, Mòdul 5: 8/8 ✅)** — 460 preguntes test, 240 flashcards, 138 preguntes de desenvolupament, 46 exercicis amb solució oculta, 50 termes al glossari.
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
- **Mòdul 5 — Assistents virtuals i IA conversacional (8/8 ✅)**:
  1. `m05-01-chatbots` — 10 preg., 5 flashcards, enrutador híbrid NLU + *slot extraction* + OOS + escalada verificat.
  2. `m05-02-assistents-corporatius` — 10 preg., 5 flashcards, control d'accés *Pre-filtering ACL* multi-tenant (municipi, departament, confidencialitat) verificat.
  3. `m05-03-fluxos-conversacionals` — 10 preg., 5 flashcards, màquina d'estats (FSM) amb *slot filling*, confirmació explícita i *fallback* esglaonat 1–3 verificat.
  4. `m05-04-integracio-bases-coneixement` — 10 preg., 5 flashcards, sincronitzador incremental SSOT amb hash SHA-256 i expiració per `valid_until` verificat.
  5. `m05-05-canals-digitals` — 10 preg., 5 flashcards, adaptador omnicanal (Web, WhatsApp amb tallafocs PII, Voicebot 010) verificat.
  6. `m05-06-tracabilitat-conversacional` — 10 preg., 5 flashcards, *PII scrubbing* + cadena de hashes SHA-256 antimanipulació (*tamper-evident*) verificat.
  7. `m05-07-supervisio-conversacional` — 10 preg., 5 flashcards, *guardrails* síncrons (emergències 112, injecció, promeses vinculants, cites) + *Kill Switch* automàtic a `DEGRADAT_SEGUR` verificat.
  8. `m05-08-escalada-humana` — 10 preg., 5 flashcards, motor *Warm Handoff* amb cues especialitzades i escalada síncrona vs. tiquet/*callback* fora d'horari verificat.

---

## 2. Què queda pendent

- **Mòduls 6 a 8** (24 conceptes restants):
  - **Mòdul 6** (Automatització intel·ligent, 6 conceptes): `m06-01-rpa` .. `m06-06-validacio-automatica-processos`.
  - **Mòdul 7** (MLOps i LLMOps, 10 conceptes).
  - **Mòdul 8** (Ús responsable i seguretat de la IA, 8 conceptes).
- **Fases 4–7**: Laboratoris, Exàmens/simulacres, Projecte final i Validació integral.

---

## 3. Comprovacions executades i resultat

- `node scripts/sync_content.mjs`: ✅ OK (46/70 lliçons, 460 preguntes, 240 flashcards, 50 termes glossari).
- `node scripts/validate_content.mjs`: ✅ OK (0 errors, 0 avisos).
- Execució directa amb `python3` dels 8 exemples de codi del Mòdul 5 (`5.1` a `5.8`): ✅ Tots verificats i contrastats.

---

## 4. Següent tasca exacta

Iniciar el **Mòdul 6 — Automatització intel·ligent (6 conceptes)** des de `m06-01-rpa` fins a `m06-06-validacio-automatica-processos`, validar-lo amb 0 errors i 0 avisos, actualitzar `COVERAGE.md`, `ROADMAP.md`, `PROGRESS.md` i `docs/glossary.json`, i fer-ne el commit.
