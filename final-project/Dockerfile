FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    SIGEA_DB_PATH=/tmp/sigea_audit.db

WORKDIR /app

# Usuari no-root (mesura ENS de contenidors segurs)
RUN useradd --create-home --shell /usr/sbin/nologin sigea

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY data ./data
COPY src ./src
COPY api ./api
COPY run_project.py .

USER sigea
EXPOSE 8010

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD python3 -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8010/health')" || exit 1

CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8010"]
