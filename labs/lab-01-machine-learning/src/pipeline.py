"""Laboratori 1: Machine Learning (Classificació, Regressió, Clustering i Anomalies).

Implementació 100% reproduïble amb NumPy/Pandas (sense claus externes i executable
sense dependències addicionals), dissenyada per evitar Data Leakage.
"""

from __future__ import annotations

import csv
import math
from dataclasses import dataclass
from pathlib import Path
import numpy as np


FEATURE_COLS = [
    "import_eur",
    "num_documents",
    "complexitat_score",
    "dies_fins_termini",
    "poblacio_municipi_k",
]


@dataclass
class DatasetML:
    expedient_ids: list[str]
    X: np.ndarray
    y_urgent: np.ndarray
    y_dies: np.ndarray


def generar_dataset_sintetic(sortida_csv: Path, n: int = 120, llavor: int = 42) -> Path:
    """Genera un dataset sintètic i determinista de sol·licituds municipals fictícies."""
    rng = np.random.default_rng(llavor)
    sortida_csv.parent.mkdir(parents=True, exist_ok=True)

    rows = []
    for i in range(1, n + 1):
        # Injectem 4 anomalies clares al final per validar el detector MAD
        if i > n - 4:
            import_eur = round(float(rng.uniform(48000, 75000)), 2)
            num_docs = int(rng.integers(18, 28))
            complexitat = round(float(rng.uniform(8.5, 10.0)), 2)
            dies_termini = int(rng.integers(1, 5))
            poblacio_k = round(float(rng.uniform(2, 12)), 1)
        else:
            perfil = i % 3
            if perfil == 0:  # Expedients senzills de micropobles
                import_eur = round(float(rng.uniform(400, 2800)), 2)
                num_docs = int(rng.integers(2, 5))
                complexitat = round(float(rng.uniform(1.0, 3.5)), 2)
                dies_termini = int(rng.integers(20, 45))
                poblacio_k = round(float(rng.uniform(0.8, 5.0)), 1)
            elif perfil == 1:  # Expedients estàndard de ciutat mitjana
                import_eur = round(float(rng.uniform(3000, 9500)), 2)
                num_docs = int(rng.integers(5, 10))
                complexitat = round(float(rng.uniform(3.5, 6.5)), 2)
                dies_termini = int(rng.integers(10, 30))
                poblacio_k = round(float(rng.uniform(10.0, 45.0)), 1)
            else:  # Expedients complexos i urgents
                import_eur = round(float(rng.uniform(8500, 18000)), 2)
                num_docs = int(rng.integers(9, 15))
                complexitat = round(float(rng.uniform(6.5, 9.2)), 2)
                dies_termini = int(rng.integers(2, 14))
                poblacio_k = round(float(rng.uniform(35.0, 120.0)), 1)

        logit = (
            -1.2
            + 0.00018 * import_eur
            + 0.45 * complexitat
            - 0.16 * dies_termini
            + float(rng.normal(0, 0.35))
        )
        prob_urgent = 1.0 / (1.0 + math.exp(-max(-20.0, min(20.0, logit))))
        urgent = 1 if prob_urgent >= 0.5 else 0

        dies_tramitacio = max(
            2.0,
            round(
                4.0
                + 0.0004 * import_eur
                + 1.35 * num_docs
                + 2.4 * complexitat
                - 0.05 * dies_termini
                + float(rng.normal(0, 1.5)),
                1,
            ),
        )
        rows.append(
            {
                "expedient_id": f"EXP-2026-{i:04d}",
                "import_eur": import_eur,
                "num_documents": num_docs,
                "complexitat_score": complexitat,
                "dies_fins_termini": dies_termini,
                "poblacio_municipi_k": poblacio_k,
                "urgent": urgent,
                "dies_tramitacio": dies_tramitacio,
            }
        )

    with sortida_csv.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        writer.writerows(rows)
    return sortida_csv


def carregar_dataset(ruta_csv: Path) -> DatasetML:
    ids: list[str] = []
    feats: list[list[float]] = []
    y_urg: list[int] = []
    y_dies: list[float] = []
    with ruta_csv.open("r", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            ids.append(row["expedient_id"])
            feats.append([float(row[c]) for c in FEATURE_COLS])
            y_urg.append(int(row["urgent"]))
            y_dies.append(float(row["dies_tramitacio"]))
    return DatasetML(
        expedient_ids=ids,
        X=np.array(feats, dtype=float),
        y_urgent=np.array(y_urg, dtype=int),
        y_dies=np.array(y_dies, dtype=float),
    )


def particio_estratificada_sense_leakage(
    ds: DatasetML, test_ratio: float = 0.2, llavor: int = 42
) -> tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
    """Divideix estratificadament per classe i ajusta l'escalat NOMÉS sobre Train."""
    rng = np.random.default_rng(llavor)
    idx_train, idx_test = [], []
    for cls in (0, 1):
        idx = np.where(ds.y_urgent == cls)[0]
        rng.shuffle(idx)
        n_test = max(1, int(round(len(idx) * test_ratio)))
        idx_test.extend(idx[:n_test].tolist())
        idx_train.extend(idx[n_test:].tolist())

    X_tr_raw, X_te_raw = ds.X[idx_train], ds.X[idx_test]
    mitjana = X_tr_raw.mean(axis=0)
    desv = np.where(X_tr_raw.std(axis=0) > 1e-8, X_tr_raw.std(axis=0), 1.0)
    X_tr = (X_tr_raw - mitjana) / desv
    X_te = (X_te_raw - mitjana) / desv
    return (
        X_tr,
        X_te,
        ds.y_urgent[idx_train],
        ds.y_urgent[idx_test],
        ds.y_dies[idx_train],
        ds.y_dies[idx_test],
    )


def entrenar_logistica_l2(
    X_tr: np.ndarray,
    y_tr: np.ndarray,
    lr: float = 0.15,
    epochs: int = 500,
    l2: float = 0.05,
) -> tuple[np.ndarray, float]:
    """Regressió logística binària amb regularització L2 (intrínsecament interpretable)."""
    n, d = X_tr.shape
    w = np.zeros(d, dtype=float)
    b = 0.0
    for _ in range(epochs):
        z = np.clip(X_tr @ w + b, -25.0, 25.0)
        p = 1.0 / (1.0 + np.exp(-z))
        err = p - y_tr
        w -= lr * ((X_tr.T @ err) / n + l2 * w)
        b -= lr * float(err.mean())
    return w, b


def avaluar_classificacio(
    X_te: np.ndarray, y_te: np.ndarray, w: np.ndarray, b: float, llindar: float = 0.5
) -> dict[str, float]:
    probs = 1.0 / (1.0 + np.exp(-np.clip(X_te @ w + b, -25.0, 25.0)))
    preds = (probs >= llindar).astype(int)
    tp = int(np.sum((preds == 1) & (y_te == 1)))
    fp = int(np.sum((preds == 1) & (y_te == 0)))
    fn = int(np.sum((preds == 0) & (y_te == 1)))
    tn = int(np.sum((preds == 0) & (y_te == 0)))
    precision = tp / (tp + fp) if (tp + fp) else 0.0
    recall = tp / (tp + fn) if (tp + fn) else 0.0
    f1 = 2 * precision * recall / (precision + recall) if (precision + recall) else 0.0
    accuracy = (tp + tn) / len(y_te)
    return {
        "accuracy": round(accuracy, 4),
        "precision": round(precision, 4),
        "recall": round(recall, 4),
        "f1": round(f1, 4),
        "tp": tp,
        "fp": fp,
        "fn": fn,
        "tn": tn,
    }


def entrenar_i_avaluar_ridge(
    X_tr: np.ndarray, y_tr: np.ndarray, X_te: np.ndarray, y_te: np.ndarray, alpha: float = 1.0
) -> dict[str, float]:
    """Regressió Ridge en forma tancada (equació normal regularitzada)."""
    X_tr_b = np.column_stack([np.ones(len(X_tr)), X_tr])
    X_te_b = np.column_stack([np.ones(len(X_te)), X_te])
    reg = alpha * np.eye(X_tr_b.shape[1])
    reg[0, 0] = 0.0  # No penalitzem el biaix/intercept
    theta = np.linalg.solve(X_tr_b.T @ X_tr_b + reg, X_tr_b.T @ y_tr)
    y_pred = X_te_b @ theta
    mae = float(np.mean(np.abs(y_te - y_pred)))
    rmse = float(np.sqrt(np.mean((y_te - y_pred) ** 2)))
    ss_res = float(np.sum((y_te - y_pred) ** 2))
    ss_tot = float(np.sum((y_te - np.mean(y_te)) ** 2))
    r2 = 1.0 - ss_res / ss_tot if ss_tot > 0 else 0.0
    return {"mae_dies": round(mae, 3), "rmse_dies": round(rmse, 3), "r2": round(r2, 4)}


def executar_kmeans(X: np.ndarray, k: int = 3, iteracions: int = 40, llavor: int = 42) -> dict[str, object]:
    """K-Means sobre dades estandarditzades retornant mides de clúster i inèrcia."""
    X_std = (X - X.mean(axis=0)) / np.where(X.std(axis=0) > 1e-8, X.std(axis=0), 1.0)
    rng = np.random.default_rng(llavor)
    centroides = X_std[rng.choice(len(X_std), size=k, replace=False)].copy()
    etiquetes = np.zeros(len(X_std), dtype=int)

    for _ in range(iteracions):
        dists = np.linalg.norm(X_std[:, None, :] - centroides[None, :, :], axis=2)
        noves = np.argmin(dists, axis=1)
        if np.array_equal(noves, etiquetes):
            break
        etiquetes = noves
        for c in range(k):
            punts = X_std[etiquetes == c]
            if len(punts) > 0:
                centroides[c] = punts.mean(axis=0)

    inercia = float(
        sum(np.sum((X_std[etiquetes == c] - centroides[c]) ** 2) for c in range(k))
    )
    mides = {f"cluster_{c}": int(np.sum(etiquetes == c)) for c in range(k)}
    return {"k": k, "mides_clusters": mides, "inercia": round(inercia, 2)}


def detectar_anomalies_mad(ds: DatasetML, llindar_z: float = 3.5) -> list[dict[str, object]]:
    """Detecta expedients anòmals per Z-score modificat (Mediana + MAD) sobre import_eur."""
    imports = ds.X[:, 0]
    mediana = float(np.median(imports))
    mad = float(np.median(np.abs(imports - mediana)))
    mad = mad if mad > 1e-8 else 1.0
    z_mod = 0.6745 * np.abs(imports - mediana) / mad

    anomalies = []
    for idx, score in enumerate(z_mod):
        if score >= llindar_z:
            anomalies.append(
                {
                    "expedient_id": ds.expedient_ids[idx],
                    "import_eur": round(float(imports[idx]), 2),
                    "z_score_modificat": round(float(score), 2),
                    "accio": "DERIVAR_AUDITORIA_HUMANA",
                }
            )
    return anomalies


def executar_lab_complet(ruta_csv: Path) -> dict[str, object]:
    if not ruta_csv.exists():
        generar_dataset_sintetic(ruta_csv)
    ds = carregar_dataset(ruta_csv)
    X_tr, X_te, y_urg_tr, y_urg_te, y_dies_tr, y_dies_te = particio_estratificada_sense_leakage(ds)
    w, b = entrenar_logistica_l2(X_tr, y_urg_tr)
    clf = avaluar_classificacio(X_te, y_urg_te, w, b)
    reg = entrenar_i_avaluar_ridge(X_tr, y_dies_tr, X_te, y_dies_te)
    clu = executar_kmeans(ds.X, k=3)
    ano = detectar_anomalies_mad(ds)
    return {
        "n_registres": len(ds.expedient_ids),
        "classificacio_urgent": clf,
        "regressio_dies_tramitacio": reg,
        "clustering_perfils": clu,
        "anomalies_detectades": ano,
    }
