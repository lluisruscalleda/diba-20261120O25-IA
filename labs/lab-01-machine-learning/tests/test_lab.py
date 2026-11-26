"""Tests automatitzats del Laboratori 1: Machine Learning."""

import sys
import unittest
from pathlib import Path

LAB_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(LAB_DIR / "src"))

from pipeline import executar_lab_complet, generar_dataset_sintetic  # noqa: E402


class TestLab01MachineLearning(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.csv_path = LAB_DIR / "data" / "sollicituds_sintetiques.csv"
        generar_dataset_sintetic(cls.csv_path, n=120, llavor=42)
        cls.res = executar_lab_complet(cls.csv_path)

    def test_dataset_complet(self) -> None:
        self.assertEqual(self.res["n_registres"], 120)
        self.assertTrue(self.csv_path.exists())

    def test_classificacio_qualitat_minima(self) -> None:
        clf = self.res["classificacio_urgent"]
        self.assertGreaterEqual(clf["f1"], 0.80)
        self.assertGreaterEqual(clf["accuracy"], 0.80)

    def test_regressio_r2_alt(self) -> None:
        reg = self.res["regressio_dies_tramitacio"]
        self.assertGreaterEqual(reg["r2"], 0.90)
        self.assertLessEqual(reg["mae_dies"], 3.0)

    def test_clustering_tres_grups_no_buits(self) -> None:
        mides = self.res["clustering_perfils"]["mides_clusters"]
        self.assertEqual(sum(mides.values()), 120)
        self.assertTrue(all(v > 0 for v in mides.values()))

    def test_anomalies_injectades_detectades(self) -> None:
        anomalies = self.res["anomalies_detectades"]
        ids = {a["expedient_id"] for a in anomalies}
        self.assertGreaterEqual(len(anomalies), 4)
        self.assertIn("EXP-2026-0120", ids)


if __name__ == "__main__":
    unittest.main()
