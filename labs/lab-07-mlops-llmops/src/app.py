"""Laboratori 7: MLOps i LLMOps (Registry immutable, PSI Drift, P95/P99, Rollback i API FastAPI)."""

from __future__ import annotations

import json
import math
from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class ModelVersion:
    versio: str
    git_sha: str
    dataset_hash: str
    docker_image: str
    macro_f1_catala: float
    llindar_urgencia: float


class ModelRegistryMLOps:
    """Registre immutable de models amb bloqueig de :latest, Quality Gate i rollback atòmic."""

    def __init__(self) -> None:
        self.versions: dict[str, ModelVersion] = {}
        self.alies: dict[str, str] = {}
        self.historial_auditoria: list[dict[str, str]] = []

    def registrar(self, mv: ModelVersion) -> None:
        if mv.docker_image.endswith(":latest") or "@sha256:" not in mv.docker_image:
            raise ValueError("Imatge Docker rebutjada: prohibida l'etiqueta :latest; cal digest @sha256.")
        if mv.versio in self.versions:
            raise ValueError(f"La versió {mv.versio} és immutable i ja existeix al registre.")
        self.versions[mv.versio] = mv

    def promoure_champion(self, versio: str, f1_minim: float = 0.85) -> dict[str, object]:
        mv = self.versions[versio]
        if mv.macro_f1_catala < f1_minim:
            return {
                "promogut": False,
                "motiu": f"QUALITY_GATE_BLOQUEJAT: F1 català {mv.macro_f1_catala} < {f1_minim}",
            }
        anterior = self.alies.get("champion")
        if anterior:
            self.alies["previous_champion"] = anterior
        self.alies["champion"] = versio
        self.historial_auditoria.append({"accio": "PROMOCIO", "de": str(anterior), "a": versio})
        return {"promogut": True, "champion_actual": versio, "previous_champion": anterior}

    def rollback_atomic(self, motiu: str) -> dict[str, str]:
        prev = self.alies.get("previous_champion")
        actual = self.alies.get("champion")
        if not prev:
            raise RuntimeError("No existeix @previous_champion per executar rollback.")
        self.alies["champion"] = prev
        self.historial_auditoria.append({"accio": "ROLLBACK", "de": str(actual), "a": prev, "motiu": motiu})
        return {"estat": "ROLLBACK_COMPLETAT", "champion_restaurat": prev, "versio_retirada": str(actual)}

    def obtenir_champion(self) -> ModelVersion:
        return self.versions[self.alies["champion"]]


def calcular_psi(esperat: list[float], actual: list[float], eps: float = 1e-6) -> dict[str, object]:
    psi = 0.0
    for e, a in zip(esperat, actual):
        e_c, a_c = max(e, eps), max(a, eps)
        psi += (a_c - e_c) * math.log(a_c / e_c)
    psi_r = round(psi, 4)
    estat = "ESTABLE" if psi_r < 0.10 else ("DRIFT_MODERAT" if psi_r < 0.25 else "ALERTA_DRIFT_GREU")
    return {"psi": psi_r, "estat": estat}


def resum_latencies(latencies_ms: list[float]) -> dict[str, float]:
    ordenades = sorted(latencies_ms)
    n = len(ordenades)

    def pct(p: float) -> float:
        idx = max(0, min(n - 1, math.ceil(p / 100.0 * n) - 1))
        return float(ordenades[idx])

    return {
        "mitjana_ms": round(sum(ordenades) / n, 2),
        "p95_ms": pct(95),
        "p99_ms": pct(99),
    }


def predir_servei(registry: ModelRegistryMLOps, import_eur: float, complexitat: float) -> dict[str, object]:
    """Lògica de l'endpoint POST /predict desconnectada del framework web."""
    mv = registry.obtenir_champion()
    score = min(1.0, round(0.00004 * import_eur + 0.08 * complexitat, 4))
    return {
        "model_version": mv.versio,
        "git_sha": mv.git_sha,
        "score_urgencia": score,
        "urgent": score >= mv.llindar_urgencia,
    }


def executar_lab_mlops(ruta_monitoratge: Path) -> dict[str, object]:
    dades = json.loads(ruta_monitoratge.read_text(encoding="utf-8"))
    reg = ModelRegistryMLOps()

    reg.registrar(ModelVersion("v1.0.0", "a1b2c3d", "sha256:data_v1", "registry.diba/ia@sha256:1111", 0.89, 0.60))
    reg.registrar(ModelVersion("v1.1.0", "e4f5g6h", "sha256:data_v2", "registry.diba/ia@sha256:2222", 0.92, 0.55))
    reg.registrar(ModelVersion("v1.2.0-bad", "999aaaa", "sha256:data_v3", "registry.diba/ia@sha256:3333", 0.74, 0.55))

    p1 = reg.promoure_champion("v1.0.0")
    p2 = reg.promoure_champion("v1.1.0")
    p_bad = reg.promoure_champion("v1.2.0-bad")  # Bloquejat pel Quality Gate!

    pred_abans = predir_servei(reg, import_eur=9000.0, complexitat=4.0)
    psi_s1 = calcular_psi(dades["distribucio_entrenament_imports"], dades["distribucio_prod_setmana_1"])
    psi_s8 = calcular_psi(dades["distribucio_entrenament_imports"], dades["distribucio_prod_setmana_8_drift"])
    lat = resum_latencies(dades["latencies_ms_mostra"])

    rb = None
    if psi_s8["estat"] == "ALERTA_DRIFT_GREU":
        rb = reg.rollback_atomic(f"PSI={psi_s8['psi']} >= 0.25 a la setmana 8")

    return {
        "promocions": {"v1": p1, "v1_1": p2, "v1_2_rebutjat": p_bad},
        "prediccio_api_v1_1": pred_abans,
        "monitoratge_psi_setmana_1": psi_s1,
        "monitoratge_psi_setmana_8": psi_s8,
        "monitoratge_latencies": lat,
        "rollback_executat": rb,
        "champion_final": reg.obtenir_champion().versio,
    }


# Integració FastAPI opcional (si està instal·lat a l'entorn)
try:
    from fastapi import FastAPI  # type: ignore

    app = FastAPI(title="DIBA MLOps API (Lab 7)", version="1.0.0")
    _registry_api = ModelRegistryMLOps()
    _registry_api.registrar(
        ModelVersion("v1.0.0", "a1b2c3d", "sha256:data_v1", "registry.diba/ia@sha256:1111", 0.89, 0.60)
    )
    _registry_api.promoure_champion("v1.0.0")

    @app.get("/health")
    def health() -> dict[str, str]:
        return {"status": "ok", "champion": _registry_api.obtenir_champion().versio}

    @app.post("/predict")
    def predict(import_eur: float, complexitat: float) -> dict[str, object]:
        return predir_servei(_registry_api, import_eur, complexitat)
except ImportError:
    app = None
