# Acadèmia de Preparació — Prova Teoricopràctica d'Intel·ligència Artificial (Diputació de Barcelona)

Plataforma educativa completa, interactiva i local per preparar la prova teoricopràctica d'una borsa de treball tècnica d'intel·ligència artificial a l'Administració pública (Diputació de Barcelona).

## Contingut del projecte

- **8 mòduls oficials / 70 conceptes individuals** amb estructura pedagògica completa (apartats A–J: objectius, introducció, teoria avançada, diagrames Mermaid, aplicació a l'Administració pública, exemple guiat, exercici independent amb pistes i solució oculta, test ≥10 preguntes, ≥3 preguntes de desenvolupament i resum amb flashcards).
- **8 laboratoris pràctics** en Python i Jupyter Notebook amb datasets sintètics.
- **Sistema de simulacres d'examen**: tests per concepte, mòdul, globals, preguntes fallades, adaptatiu, cronometrats, supòsits pràctics i simulacres teoricopràctics complets.
- **Projecte pràctic final integrador**: *Sistema intel·ligent de gestió d'expedients administratius* (suport a la tramitació integrant els 8 mòduls).
- **Aplicació web educativa** (React + TypeScript + Vite + Tailwind CSS + Mermaid + Recharts) amb dashboard, lector interactiu, mode examen, repetició espaiada SM-2, pla d'estudi configurable i glossari.

## Posada en marxa local

### 1. Sincronitzar i validar el contingut educatiu

```bash
node scripts/sync_content.mjs
node scripts/validate_content.mjs
```

### 2. Aplicació web (Frontend)

```bash
cd frontend
pnpm install
pnpm dev
```

L'aplicació funciona sense necessitat de backend (persistència automàtica a `localStorage` amb exportació/importació JSON).

### 3. Backend opcional (FastAPI + SQLite)

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

## Seguiment del desenvolupament

- Full de ruta: [`ROADMAP.md`](./ROADMAP.md)
- Matriu de traçabilitat del temari: [`COVERAGE.md`](./COVERAGE.md)
- Estat detallat del progrés: [`PROGRESS.md`](./PROGRESS.md)
- Arquitectura tècnica: [`docs/architecture.md`](./docs/architecture.md)
- Normes del projecte: [`AGENTS.md`](./AGENTS.md)

## Avís sobre paràmetres d'examen i normativa

Els paràmetres dels simulacres d'examen (durada, nombre de preguntes, penalització per error, nota mínima i ponderació teoria/pràctica) són **paràmetres configurables de preparació** i no substitueixen les bases oficials de cap convocatòria concreta.
