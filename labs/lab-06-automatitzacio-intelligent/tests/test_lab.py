"""Tests automatitzats del Laboratori 6: Automatització intel·ligent."""

import sys
import unittest
from pathlib import Path

LAB_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(LAB_DIR / "src"))

from pipeline import orquestrar_lot_expedients  # noqa: E402


class TestLab06Automatitzacio(unittest.TestCase):
    def setUp(self) -> None:
        self.res = orquestrar_lot_expedients(LAB_DIR / "data" / "expedients_entrada.json")

    def test_idempotencia_elimina_duplicat(self) -> None:
        self.assertEqual(self.res["duplicats_ignorats_idempotencia"], ["REG-2026-001"])

    def test_esmena_art68_per_documents_mancants(self) -> None:
        esmenes = self.res["esmenes_art68_lpacap"]
        self.assertEqual(len(esmenes), 1)
        self.assertEqual(esmenes[0]["registre_id"], "REG-2026-002")
        self.assertEqual(esmenes[0]["termini_esmena_dies_habils"], 10)
        self.assertIn("ESTATUTS", esmenes[0]["documents_mancants"])

    def test_prioritzacio_i_escalada_import_alt(self) -> None:
        cua = self.res["cua_tramitacio_ordenada"]
        self.assertEqual(len(cua), 3)
        # REG-2026-001 (emergència social urgent) ha de ser el primer!
        self.assertEqual(cua[0]["registre_id"], "REG-2026-001")
        # REG-2026-004 (42.000 EUR) escala a Cap de Servei i Intervenció!
        reg4 = next(x for x in cua if x["registre_id"] == "REG-2026-004")
        self.assertEqual(reg4["ruta_assignada"], "ESCALADA_CAP_SERVEI_I_INTERVENCIO")
        # REG-2026-003 (28 dies en cua) rep bonificació d'aging i no queda a 0!
        reg3 = next(x for x in cua if x["registre_id"] == "REG-2026-003")
        self.assertGreater(reg3["prioritat_score"], 0.50)


if __name__ == "__main__":
    unittest.main()
