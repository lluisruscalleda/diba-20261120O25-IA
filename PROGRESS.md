# PROGRESS.md — Registre d'avanç incremental

Última actualització: 2026-11-25 (FITA COMPLETADA: Mòduls 1 a 8 — 70/70 conceptes = 100% del temari oficial!)

## Estat actual per fases

- **Fase 1. Planificació**: ✅ Completada
- **Fase 2. Infraestructura**: ✅ Completada i compilada sense errors
- **Fase 3. Contingut (Mòduls 1–8)**: ✅ **COMPLETADA AL 100% — 70 de 70 conceptes oficials!** (M1: 11/11 ✅, M2: 10/10 ✅, M3: 9/9 ✅, M4: 8/8 ✅, M5: 8/8 ✅, M6: 6/6 ✅, M7: 10/10 ✅, M8: 8/8 ✅) — **700 preguntes test**, **360 flashcards**, **210 preguntes de desenvolupament**, **70 exercicis pràctics amb solució oculta**, **71 termes al glossari**.
- **Fase 4. Laboratoris (1–8)**: ⬜ Pendent
- **Fase 5. Exàmens i simulacres**: ⬜ Pendent
- **Fase 6. Projecte integrador**: ⬜ Pendent
- **Fase 7. Validació final**: ⬜ Pendent

---

## 1. Què s'ha completat (Mòduls 1–8 al 100%)

- **Mòdul 1 — Fonaments d'IA (11/11 ✅)**: 110 preguntes, 64 flashcards. Commit `ad6bd39`.
- **Mòdul 2 — Processament del llenguatge natural (10/10 ✅)**: 100 preguntes, 51 flashcards. Commit `111dc4f`.
- **Mòdul 3 — Models generatius (9/9 ✅)**: 90 preguntes, 45 flashcards. Commit `4e7f2e1`.
- **Mòdul 4 — Processament intel·ligent de documents (8/8 ✅)**: 80 preguntes, 40 flashcards. Commit `b8990e2`.
- **Mòdul 5 — Assistents virtuals i IA conversacional (8/8 ✅)**: 80 preguntes, 40 flashcards. Commit `661bd39`.
- **Mòdul 6 — Automatització intel·ligent (6/6 ✅)**: 60 preguntes, 30 flashcards. Commit `47bb62a`.
- **Mòdul 7 — MLOps i LLMOps (10/10 ✅)**: 100 preguntes, 50 flashcards. Commit `c94e303`.
- **Mòdul 8 — Ús responsable i seguretat de la IA (8/8 ✅)**:
  1. `m08-01-transparencia` — 10 preg., 5 flashcards, atribució additiva (SHAP lineal) + contrafactual accionable bloquejant variables immutables verificat (AI Act art. 13 i 50, RGPD art. 13–15, LPACAP art. 35).
  2. `m08-02-biaixos` — 10 preg., 5 flashcards, auditor d'equitat (*Disparate Impact 4/5*, *Equal Opportunity*, *Equalized Odds*, *proxies* i AI Act art. 10) verificat.
  3. `m08-03-supervisio-humana` — 10 preg., 5 flashcards, supervisor HITL amb detector de *rubber-stamping* i quatre ulls verificat (RGPD art. 22, AI Act art. 14 i 26.2, LRJSP art. 41).
  4. `m08-04-proteccio-dades` — 10 preg., 5 flashcards, cribratge automàtic EIPD (art. 35 RGPD) + porta de minimització/transferències EEE verificat (RGPD, LOPDGDD, DPD, APDCAT/AEPD).
  5. `m08-05-seguretat-ia` — 10 preg., 5 flashcards, calculador categoria ENS (RD 311/2022) + tallafoc d'agents RBAC/HITL contra *Indirect Prompt Injection* verificat (ENS, CCN-CERT, OWASP LLM, AI Act art. 15).
  6. `m08-06-auditoria` — 10 preg., 5 flashcards, verificador automatitzat d'expedient FRIA (6 blocs art. 27.1 AI Act), retenció logs >= 6 mesos (art. 26.6) i segellat SHA-256 verificat.
  7. `m08-07-governanca-models` — 10 preg., 5 flashcards, registre corporatiu amb portes *Stage-Gate* i matriu RACI verificat (ISO 42001, NIST AI RMF, *Shadow AI*, art. 26.7 AI Act, LCSP).
  8. `m08-08-compliment-normatiu` — 10 preg., 5 flashcards, motor classificatori AI Act (Reglament UE 2024/1689, piràmide de risc, calendari exacte 2024–2027 art. 113, rol *Provider/Deployer* art. 25, sancions art. 99 i AESIA) verificat.

---

## 2. Què queda pendent

- **Fase 4**: Laboratoris pràctics 1–8 (`labs/`).
- **Fase 5**: Exàmens per mòdul (8 × 40 preg.), simulacres globals (10 × 50 preg.), supòsits pràctics (20) i simulacres teoricopràctics complets (5).
- **Fase 6**: Projecte integrador final.
- **Fase 7**: Validació final i revisió integral.

---

## 3. Comprovacions executades i resultat

- `node scripts/sync_content.mjs`: ✅ OK (70/70 lliçons, 700 preguntes, 360 flashcards, 71 termes glossari).
- `node scripts/validate_content.mjs`: ✅ OK (0 errors, 0 avisos).
- Execució directa amb `python3` dels 8 exemples de codi del Mòdul 8 (`8.1` a `8.8`): ✅ Tots verificats i contrastats.

---

## 4. Següent tasca exacta

Iniciar la **Fase 4 (Laboratoris pràctics 1–8)** o la **Fase 5 (Exàmens de mòdul i simulacres)** segons la prioritat de l'usuari.
