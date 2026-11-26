# Model Card — Sistema de suport a la priorització d'ajuts al lloguer (Fictici)

- **Identificador a l'inventari corporatiu**: `IA-DIBA-2026-LLOGUER-01`
- **Versió del model**: `v1.0.0` (Regressió Logística L2 — *white-box* intrínsecament interpretable)
- **Òrgan responsable (*Owner* funcional)**: Àrea d'Habitatge i Cohesió Social
- **Classificació normativa**:
  - **AI Act (Reglament UE 2024/1689)**: **Alt Risc (Annex III, punt 5.a)** — vigent des del 2/08/2026.
  - **RGPD (UE 2016/679)**: Base jurídica art. 6.1.e (+ art. 8 LOPDGDD); **EIPD (art. 35)** validada pel DPD; autoritat competent **APDCAT**.
  - **ENS (RD 311/2022)**: Categoria **ALT** (Confidencialitat = ALT) → Certificació ENS vigent + auditoria biennal.

## 1. Ús previst i usos fora d'abast (*Out-of-Scope*)
- **Ús previst**: ordenar expedients complets i mostrar factors explicatius exactes als treballadors socials per prioritzar l'atenció de casos urgents (**HITL obligatori**).
- **Usos estrictament prohibits**: emissió automàtica de resolucions denegatòries sense revisió humana (art. 22 RGPD), ús en processos disciplinaris o selecció de personal.

## 2. Mètriques desagregades (*Sliced Evaluation*)
| Subgrup avaluat | F1 | TPR (*Equal Opportunity*) | FPR | Disparate Impact |
|---|---|---|---|---|
| Global (conjunt prova sintètic) | 0,91 | 0,90 | 0,06 | — |
| Sol·licituds en català | 0,91 | 0,90 | 0,06 | 1,00 |
| Sol·licituds en castellà | 0,90 | 0,89 | 0,07 | 0,98 |
| Grup protegit (auditoria art. 10.5) | 0,89 | 0,88 | 0,07 | 0,94 (>= 0,80 ✅) |

## 3. Resum FRIA (6 blocs obligatoris — art. 27.1 AI Act)
1. **Processos**: suport a la priorització d'expedients d'ajuts al lloguer.
2. **Període i freqüència**: ús diari durant convocatòria anual (gener–juny).
3. **Persones i grups afectats**: unitats familiars sol·licitants d'ajuts habitacionals.
4. **Riscos específics**: falsos negatius (retard en casos urgents) i biaix d'automatització.
5. **Supervisió humana (art. 14 i 26.2)**: revisió individual obligatòria per treballadors socials formats, quatre ulls en denegacions, registre d'*overrides* i botó d'aturada operatiu.
6. **Mesures de resposta i reclamacions**: canal d'al·legacions amb revisió humana en 48 h, retenció de logs **>= 6 mesos (art. 26.6)** i notificació de resultats FRIA a l'**AESIA (art. 27.3)**.
