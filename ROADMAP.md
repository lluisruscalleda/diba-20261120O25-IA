# ROADMAP.md — Pla mestre de desenvolupament

Aquest full de ruta estructura la construcció incremental de l'**Acadèmia de Preparació de la Prova Teoricopràctica d'IA** orientada a una borsa de treball tècnica de la Diputació de Barcelona.

## Fase 1. Planificació i arquitectura
- [x] Inspecció inicial del repositori i entorn de desenvolupament.
- [x] Definició d'instruccions permanents (`AGENTS.md`).
- [x] Creació de la matriu de traçabilitat completa (`COVERAGE.md`).
- [x] Creació del registre de progrés incremental (`PROGRESS.md`).
- [x] Definició de l'arquitectura técnica i formats de contingut (`docs/architecture.md`).
- [x] Configuració base del repositori (`README.md`, `.env.example`, `.gitignore`).

## Fase 2. Infraestructura de la plataforma educativa
- [x] Estructura del frontend (`frontend/`: React, TypeScript, Vite, Tailwind CSS, Mermaid, Recharts, Markdown + syntax highlighting).
- [x] Scripts d'indexació, sincronització i validació de contingut (`scripts/sync_content.mjs`, `scripts/validate_content.mjs`).
- [x] Sistema de persistència local (`localStorage` amb exportació/importació JSON) i backend opcional (`backend/`: FastAPI + SQLite).
- [x] Dashboard de progrés amb mètriques, gràfics Recharts i recomanacions personalitzades.
- [x] Navegació del temari (8 mòduls, 70 conceptes, cercador, completats, favorits, notes personals).
- [x] Entorn d'aprenentatge (lector de lliçons A–J, Mermaid interactiu, codi amb botó de còpia, pistes desplegables, solucions ocultes, exercicis oberts amb rúbrica).
- [x] Motor de tests interactius i Mode Examen (temporitzador, marcatge, penalització configurable, adaptatiu, preguntes fallades, historial).
- [x] Mode Repàs amb repetició espaiada (algoritme SM-2 per flashcards i preguntes fallades).
- [x] Generador de plans d'estudi (15, 30, 45, 60 i 90 dies).
- [x] Glossari tècnic i vistes de laboratoris / projecte final.
- [x] Verificació de compilació (`tsc`, `vite build`) i validació automàtica.

## Fase 3. Desenvolupament exhaustiu del contingut (8 mòduls, 70 conceptes)
Cada concepte es completa íntegrament (apartats A–J + mínim 10 preguntes test + mínim 3 preguntes desenvolupament + exercici independent amb solució + flashcards) abans de passar al següent.

- [x] **Mòdul 1**: Fonaments d'intel·ligència artificial (11/11 conceptes completats — 100%).
- [x] **Mòdul 2**: Processament del llenguatge natural (10/10 conceptes completats — 100%).
- [x] **Mòdul 3**: Models generatius (9/9 conceptes completats — 100%).
- [x] **Mòdul 4**: Processament intel·ligent de documents (8/8 conceptes completats — 100%).
- [x] **Mòdul 5**: Assistents virtuals i IA conversacional (8/8 conceptes completats — 100%).
- [ ] **Mòdul 6**: Automatització intel·ligent (6 conceptes).
- [ ] **Mòdul 7**: MLOps i LLMOps (10 conceptes).
- [ ] **Mòdul 8**: Ús responsable i seguretat de la IA (8 conceptes, amb verificació normativa oficial EUR-Lex/BOE/AEPD/APDCAT/CCN-CERT).

## Fase 4. Laboratoris pràctics (8 laboratoris executables)
- [ ] **Lab 1**: Machine Learning (classificació, regressió, clustering, detecció d'anomalies amb scikit-learn, pandas, NumPy).
- [ ] **Lab 2**: NLP (classificació d'instàncies, NER, cerca semàntica, comparativa TF-IDF vs embeddings contextuals).
- [ ] **Lab 3**: RAG i models generatius (assistent normatiu RAG complet + agent amb eines + comparativa RAG vs fine-tuning).
- [ ] **Lab 4**: Processament documental (generació PDFs ficticis, OCR, classificació, extracció, validació i derivació humana).
- [ ] **Lab 5**: Assistent virtual ciutadà (context, intencions, base de coneixement, traçabilitat, incertesa, permisos, escalada).
- [ ] **Lab 6**: Automatització intel·ligent (recepció, classificació, validació, priorització combinant regles + ML).
- [ ] **Lab 7**: MLOps i LLMOps (FastAPI, Docker, pytest, versionat, MLflow, monitoratge, data drift, rollback, CI/CD).
- [ ] **Lab 8**: Seguretat i governança (anàlisi de riscos, AI Act/RGPD/ENS, biaixos, Model Card, proves defensives locals de prompt injection).

## Fase 5. Banc d'exàmens i simulacres
- [ ] 8 exàmens acumulatius de mòdul (40 preguntes cadascun = 320 preguntes).
- [ ] 10 simulacres globals de tot el temari (50 preguntes cadascun = 500 preguntes).
- [ ] 20 supòsits pràctics independents (programació, arquitectura, diagnòstic i decisió tècnica).
- [ ] 5 simulacres teoricopràctics complets amb rúbrica i ponderació configurable.

## Fase 6. Projecte pràctic final integrador
- [ ] **Sistema intel·ligent de gestió d'expedients administratius** (integració dels 8 mòduls, flux complet de 13 passos, suport a la tramitació sense decisió administrativa autònoma).
- [ ] Enunciat, arquitectura, diagrames, model de dades, API FastAPI, datasets sintètics, implementació de referència, tests, anàlisi de riscos, criteris d'avaluació, solució completa i alternatives justificades.

## Fase 7. Validació integral final
- [ ] Validació automàtica del 100% de la matriu de cobertura (`COVERAGE.md`).
- [ ] Validació d'esquemes JSON, detecció de preguntes duplicades i verificació de respostes.
- [ ] Execució de tests automatitzats (Python `pytest` + validació de continguts + build frontend).
- [ ] Revisió d'enllaços, codi executable i normativa vigent.
- [ ] Documentació explícita de qualsevol limitació pendent.
