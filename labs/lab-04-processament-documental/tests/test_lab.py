"""Tests automatitzats del Laboratori 4: Processament Intel·ligent de Documents (IDP)."""

import sys
import unittest
from pathlib import Path

LAB_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(LAB_DIR / "src"))

from pipeline import executar_lab_idp, validar_nif  # noqa: E402


class TestLab04IDP(unittest.TestCase):
    def setUp(self) -> None:
        self.dir_pdfs = LAB_DIR / "data" / "pdfs"
        self.res = executar_lab_idp(self.dir_pdfs)

    def test_pdfs_sintetics_valids_creats(self) -> None:
        self.assertEqual(self.res["total_pdfs_generats"], 4)
        for p in self.dir_pdfs.glob("*.pdf"):
            self.assertTrue(p.read_bytes().startswith(b"%PDF-1.4"))

    def test_enrutament_stp_vs_hitl_exacte(self) -> None:
        self.assertEqual(self.res["stp_automatics"], 1)
        self.assertEqual(self.res["derivats_hitl"], 3)
        per_nom = {r["fitxer"]: r for r in self.res["detall"]}
        self.assertEqual(per_nom["doc_01_factura_valida.pdf"]["decisio_ruta"], "STP_AUTOMATIC")
        self.assertIn("DESQUADRE_ARITMETIC", per_nom["doc_02_factura_error_aritmetic.pdf"]["incidencies"][0])
        self.assertIn("BAIXA_CONFIANCA_OCR", per_nom["doc_03_instancia_baixa_qualitat_ocr.pdf"]["incidencies"][0])
        self.assertIn("NIF_INVALID", per_nom["doc_04_certificat_nif_erroni.pdf"]["incidencies"][0])

    def test_validador_nif(self) -> None:
        self.assertTrue(validar_nif("12345678Z"))
        self.assertFalse(validar_nif("12345678A"))


if __name__ == "__main__":
    unittest.main()
