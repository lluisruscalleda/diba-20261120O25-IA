# Backend local opcional (FastAPI + SQLite)

Aquest backend permet desar el progrés de l'estudiant en una base de dades SQLite local (`academy.db`).
L'aplicació web funciona igualment sense aquest servidor gràcies a `localStorage` i a l'exportació/importació JSON.

## Posada en marxa

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

## Seguretat

- No s'executa codi arbitrari enviat des del navegador.
- Només accepta peticions dels orígens configurats a `ACADEMY_CORS_ORIGINS`.
