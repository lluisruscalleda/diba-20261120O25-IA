# AGENTS.md — Instruccions permanents del projecte

Aquest document defineix les normes, l'arquitectura, els formats de contingut i els criteris de qualitat obligatoris per a qualsevol sessió de desenvolupament en aquest repositori (**Acadèmia de Preparació de la Prova Teoricopràctica d'IA — Diputació de Barcelona**).

## 1. Idioma i estil

- Tot el contingut educatiu, la interfície web i la documentació han d'estar en **català** correcte, clar i tècnicament rigorós.
- Mantén la terminologia tècnica anglesa habitual en el sector (*Machine Learning*, *overfitting*, *self-attention*, *RAG*, *fine-tuning*, *data drift*, *prompt injection*, etc.) i explica'n sempre el significat la primera vegada que apareix en una lliçó.
- Diferencia explícitament: **teoria establerta**, **pràctica d'enginyeria**, **obligacions legals vigents** i **recomanacions / bones pràctiques**.
- Mai no utilitzis dades personals reals; tots els exemples i datasets han de ser sintètics i ficticis.

## 2. Fonts normatives i rigor

- No inventis articles, obligacions legals, cites bibliogràfiques ni resultats d'execució.
- Per al Mòdul 8 (i referències legals en altres mòduls), basa't únicament en fonts oficials verificades:
  - **AI Act**: Reglament (UE) 2024/1689 del Parlament Europeu i del Consell, de 13 de juny de 2024 (EUR-Lex).
  - **RGPD**: Reglament (UE) 2016/679 (EUR-Lex).
  - **LOPDGDD**: Llei orgànica 3/2018, de 5 de desembre (BOE).
  - **ENS**: Reial decret 311/2022, de 3 de maig, pel qual es regula l'Esquema Nacional de Seguretat (BOE) i guies CCN-CERT.
  - **Procediment administratiu / Actuació automatitzada**: Llei 39/2015 (LPACAP) i Llei 40/2015 (LRJSP, art. 41).
  - **Autoritats de control**: AEPD i APDCAT.
- Identifica explícitament els paràmetres de simulacres d'examen (penalització, durada, ponderació, nota mínima) com a **paràmetres configurables de preparació** i no com a bases oficials de la convocatòria.

## 3. Estructura pedagògica obligatòria de cada lliçó

Cada concepte individual del temari oficial es guarda a `content/module-XX/<concept-id>.md` amb frontmatter YAML i els **10 apartats obligatoris (A–J)**:

```yaml
---
id: m01-01-intelligencia-artificial
module: 1
moduleTitle: "Fonaments d'intel·ligència artificial"
order: 1
title: "Intel·ligència artificial"
shortTitle: "Intel·ligència artificial"
estimatedMinutes: 45
difficulty: "basic" # basic | intermediate | advanced
tags: ["IA", "paradigmes", "fonaments"]
crossReferences: ["m01-06-sistemes-experts", "m08-08-compliment-normatiu"]
---
```

Apartats obligatoris (amb encapçalaments `##` exactes per a validació automàtica):

1. `## A. Objectius d'aprenentatge`
2. `## B. Explicació introductòria`
3. `## C. Explicació tècnica avançada`
4. `## D. Diagrames i recursos visuals` (mínim un diagrama Mermaid i/o taula comparativa)
5. `## E. Aplicació a l'Administració pública` (casos realistes, beneficis, riscos, limitacions i supervisió humana)
6. `## F. Exemple pràctic guiat` (pas a pas, codi executable o artefacte complet amb interpretació)
7. `## G. Exercici pràctic per resoldre` (amb blocs especials `:::hint` i `:::solution` que la UI renderitza desplegables/ocults; inclou enunciat, context, objectius, requisits, dades d'entrada, resultat esperat, restriccions, pistes, criteris d'avaluació, errors habituals, solució comentada i solucions alternatives)
8. `## H. Test individual` (referència automàtica al fitxer `question-bank/module-XX/<concept-id>.json`, que la UI renderitza interactivament)
9. `## I. Preguntes de desenvolupament` (mínim 3 preguntes obertes amb blocs `:::model-answer` ocults inicialment i criteris de correcció)
10. `## J. Resum per memoritzar` (conceptes clau, definicions essencials, taula comparativa si escau, errors freqüents, referència a flashcards i possibles preguntes d'examen)

### Blocs interactius en Markdown

La plataforma admet contenidors delimitats amb `:::`:
- `:::hint [Títol opcional]` ... `:::` → Pista desplegable.
- `:::solution [Títol opcional]` ... `:::` → Solució completa oculta inicialment.
- `:::model-answer [Títol opcional]` ... `:::` → Resposta model i criteris de correcció ocults inicialment.
- `:::callout-info` / `:::callout-warning` / `:::callout-legal` ... `:::` → Caixes destacades.

## 4. Esquemes JSON obligatoris

### 4.1 Banc de preguntes (`question-bank/module-XX/<concept-id>.json`)

Mínim **10 preguntes** per concepte (distribució recomanada: 3 `basic`, 4 `intermediate`, 3 `advanced`).

```json
{
  "conceptId": "m01-01-intelligencia-artificial",
  "module": 1,
  "questions": [
    {
      "id": "m01-01-q01",
      "module": 1,
      "conceptId": "m01-01-intelligencia-artificial",
      "lessonRef": "content/module-01/m01-01-intelligencia-artificial.md",
      "difficulty": "basic",
      "questionType": "conceptual",
      "prompt": "Text de la pregunta...",
      "codeSnippet": null,
      "options": [
        { "key": "A", "text": "Opció A" },
        { "key": "B", "text": "Opció B" },
        { "key": "C", "text": "Opció C" },
        { "key": "D", "text": "Opció D" }
      ],
      "correctOption": "B",
      "explanationCorrect": "Per què B és correcta...",
      "explanationsIncorrect": {
        "A": "Per què A és incorrecta...",
        "C": "Per què C és incorrecta...",
        "D": "Per què D és incorrecta..."
      }
    }
  ]
}
```

Valors vàlids de `questionType`: `"conceptual" | "code" | "architecture" | "metrics" | "case-study" | "normative"`.
Regles de qualitat dels tests:
- Evitar patrons repetitius en `correctOption` (distribuir equilibradament entre A, B, C i D).
- Distractors plausibles, tècnics i no absurds.
- Sense preguntes duplicades ni variacions merament cosmètiques.

### 4.2 Flashcards (`flashcards/module-XX/<concept-id>.json`)

Mínim **5 flashcards** per concepte.

```json
{
  "conceptId": "m01-01-intelligencia-artificial",
  "module": 1,
  "cards": [
    {
      "id": "m01-01-fc01",
      "module": 1,
      "conceptId": "m01-01-intelligencia-artificial",
      "front": "Pregunta o terme a recordar",
      "back": "Definició clara, concisa i rigorosa",
      "tags": ["definició", "fonaments"]
    }
  ]
}
```

### 4.3 Exàmens i supòsits (`exams/`)

- `exams/module-exams/module-01.json` ... `module-08.json` (40 preguntes cadascun).
- `exams/global-mocks/mock-01.json` ... `mock-10.json` (50 preguntes cadascun).
- `exams/practical-cases/case-01.json` ... `case-20.json` (20 supòsits pràctics independents).
- `exams/full-simulations/sim-01.json` ... `sim-05.json` (5 simulacres teoricopràctics complets).

## 5. Flux de treball i validació

1. Després d'afegir o modificar contingut educatiu, executa:
   ```bash
   node scripts/sync_content.mjs
   node scripts/validate_content.mjs
   ```
2. Actualitza `COVERAGE.md` i `PROGRESS.md` després de cada lliçó, laboratori o fita completada.
3. No marquis cap element com a completat si només n'has creat l'estructura o contingut parcial.
4. Abans d'acabar una sessió, deixa `PROGRESS.md` actualitzat amb: completat, pendent, fitxers modificats, comprovacions executades, errors detectats i la següent tasca exacta.
5. No incloguis mai claus d'API al repositori. Les integracions comercials són sempre opcionals; prioritza execució local (Ollama, models open-weights, SQLite).
6. No executis codi arbitrari de l'usuari al servidor backend sense sandboxing; els exercicis Python s'executen localment mitjançant notebooks o scripts.
