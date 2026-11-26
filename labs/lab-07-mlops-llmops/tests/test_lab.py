"""Tests automatitzats del Laboratori 7: MLOps i LLMOps."""

import sys
import unittest
from pathlib import Path

LAB_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(LAB_DIR / "src"))

from app import ModelRegistryMLOps, ModelVersion, executar_lab_mlops  # noqa: E402


class TestLab07MLOps(unittest.TestCase):
    def test_bloqueja_docker_latest(self) -> None:
        reg = ModelRegistryMLOps()
        with self.assertRaises(ValueError):
            reg.registrar(ModelVersion("v9", "abc", "sha256:d", "registry.diba/ia:latest", 0.90, 0.5))

    def test_flux_complet_drift_i_rollback(self) -> None:
        res = executar_lab_mlops(LAB_DIR / "data" / "monitoratge_sintetic.json")
        # v1.2.0-bad (F1=0.74) bloquejat pel Quality Gate
        self.assertFalse(res["promocions"]["v1_2_rebutjat"]["promogut"])
        # Setmana 1 estable, Setmana 8 drift greu -> rollback automàtic a v1.0.0!
        self.assertEqual(res["monitoratge_psi_setmana_1"]["estat"], "ESTABLE")
        self.assertEqual(res["monitoratge_psi_setmana_8"]["estat"], "ALERTA_DRIFT_GREU")
        self.assertAlmostEqual(res["monitoratge_psi_setmana_8"]["psi"], 0.6847, places=4)
        self.assertEqual(res["champion_final"], "v1.0.0")
        self.assertGreater(res["monitoratge_latencies"]["p99_ms"], res["monitoratge_latencies"]["mitjana_ms"])


if __name__ == "__main__":
    unittest.main()
