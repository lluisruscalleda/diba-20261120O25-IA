"""Tests automatitzats del Laboratori 3: RAG i models generatius."""

import sys
import unittest
from pathlib import Path

LAB_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(LAB_DIR / "src"))

from pipeline import eina_calcular_bonificacio_ibi, executar_lab_rag  # noqa: E402


class TestLab03RAG(unittest.TestCase):
    def setUp(self) -> None:
        self.res = executar_lab_rag(LAB_DIR / "data" / "ordenances_sintetiques.json")

    def test_descarta_ordenanca_derogada_i_cita_vigent(self) -> None:
        self.assertEqual(self.res["docs_totals"], 5)
        self.assertEqual(self.res["docs_vigents_indexats"], 4)
        q = self.res["consulta_normativa_vigent"]
        self.assertFalse(q["abstencio"])
        self.assertIn("[OF-IBI-2026, art. 9]", q["cites"])
        self.assertIn("50%", q["resposta"])
        self.assertNotIn("OF-IBI-2024", str(q["cites"]))

    def test_abstencio_sense_evidencia(self) -> None:
        q = self.res["consulta_fora_domini_abstencio"]
        self.assertTrue(q["abstencio"])
        self.assertEqual(q["cites"], [])

    def test_eina_determinista_respecta_topall_400_eur(self) -> None:
        calc = eina_calcular_bonificacio_ibi(950.0, True)
        self.assertEqual(calc["bonificacio_eur"], 400.0)
        self.assertEqual(calc["quota_final_eur"], 550.0)

    def test_decisio_rag_prioritari_amb_pii_i_normativa_canviant(self) -> None:
        self.assertEqual(self.res["comparativa_rag_vs_finetuning"]["recomanacio"], "RAG_PRIORITARI")


if __name__ == "__main__":
    unittest.main()
