"""Tests automatitzats del Laboratori 8: Seguretat i governança de la IA."""

import sys
import unittest
from pathlib import Path

LAB_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(LAB_DIR / "src"))

from pipeline import executar_lab_seguretat  # noqa: E402


class TestLab08SeguretatGovernanca(unittest.TestCase):
    def setUp(self) -> None:
        self.res = executar_lab_seguretat(
            LAB_DIR / "data" / "auditoria_sintetica.json",
            LAB_DIR / "MODEL_CARD.md",
        )

    def test_inventari_ai_act_rgpd_ens(self) -> None:
        per_id = {x["id"]: x for x in self.res["inventari_normatiu"]}
        self.assertEqual(per_id["SYS-01"]["ai_act"], "ALT_RISC_ANNEX_III")
        self.assertEqual(per_id["SYS-01"]["categoria_ens"], "ALT")
        self.assertTrue(per_id["SYS-01"]["eipd_obligatoria_rgpd"])
        self.assertEqual(per_id["SYS-02"]["ai_act"], "PROHIBIT_ART_5")
        self.assertEqual(per_id["SYS-03"]["ai_act"], "TRANSPARENCIA_ART_50")
        self.assertEqual(per_id["SYS-03"]["categoria_ens"], "MITJA")

    def test_auditoria_equitat_detecta_biaix_greu(self) -> None:
        eq = self.res["auditoria_equitat"]
        self.assertEqual(eq["veredicte"], "BLOQUEJAT_PER_BIAIX")
        self.assertLess(eq["disparate_impact"], 0.80)
        self.assertGreater(eq["bretxa_TPR"], 0.10)

    def test_red_teaming_bloqueja_tots_els_atacs_sense_falsos_positius(self) -> None:
        rt = self.res["red_teaming_defensiu"]
        self.assertEqual(rt["taxa_bloqueig"], 1.0)
        self.assertEqual(rt["falsos_positius_legitims"], 0)
        self.assertTrue(self.res["model_card_present"])


if __name__ == "__main__":
    unittest.main()
