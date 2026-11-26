"""Tests automatitzats del Laboratori 5: Assistent virtual ciutadà."""

import sys
import unittest
from pathlib import Path

LAB_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(LAB_DIR / "src"))

from pipeline import executar_lab_assistent  # noqa: E402


class TestLab05AssistentVirtual(unittest.TestCase):
    def setUp(self) -> None:
        self.res = executar_lab_assistent(LAB_DIR / "data" / "base_coneixement.json")

    def test_avis_art50_context_multitorn_i_redaccio_pii(self) -> None:
        a = self.res["conversa_multitorn_i_rbac_anonim"]
        self.assertIn("Avís art. 50 AI Act", a[0]["resposta"])
        self.assertIn("[DNI_REDACTAT]", a[0]["log_redactat"])
        self.assertNotIn("12345678Z", a[0]["log_redactat"])
        # Torn 2 resol seguiment pel context actiu IBI
        self.assertEqual(a[1]["intencio"], "IBI_BONIFICACIO_SEGUIMENT")
        self.assertIn("31 de desembre", a[1]["resposta"])
        # Torn 3 bloqueja consulta privada sense autenticació
        self.assertIn("idCAT Mòbil", a[2]["resposta"])

    def test_rbac_autenticat_i_escalada_emergencia(self) -> None:
        b = self.res["conversa_autenticada_i_emergencia"]
        self.assertIn("EN_TRAMITACIO", b[0]["resposta"])
        self.assertTrue(b[1]["escalada_humana"])
        self.assertEqual(b[1]["motiu_escalada"], "EMERGENCIA_SENSIBLE")

    def test_escalada_automatica_despres_dos_fallades(self) -> None:
        c = self.res["conversa_escalada_per_incertesa"]
        self.assertFalse(c[0]["escalada_humana"])
        self.assertTrue(c[1]["escalada_humana"])
        self.assertEqual(c[1]["motiu_escalada"], "DOS_FALLADES_CONSECUTIVES")


if __name__ == "__main__":
    unittest.main()
