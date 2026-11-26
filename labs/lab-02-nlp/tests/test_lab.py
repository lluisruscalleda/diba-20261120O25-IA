"""Tests automatitzats del Laboratori 2: NLP en català."""

import sys
import unittest
from pathlib import Path

LAB_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(LAB_DIR / "src"))

from pipeline import executar_lab_nlp, extreure_entitats_ner, tokenitzar_catala  # noqa: E402


class TestLab02NLP(unittest.TestCase):
    def test_tokenitzacio_apostrofs_catala(self) -> None:
        toks = tokenitzar_catala("L'edifici d'obres i l'enllumenat de l'ajuntament")
        self.assertIn("edifici", toks)
        self.assertIn("obres", toks)
        self.assertIn("enllumenat", toks)
        self.assertNotIn("ajuntament", toks)

    def test_ner_detecta_pii_i_entitats(self) -> None:
        ents = extreure_entitats_ner("Rebut 145,50 EUR amb DNI 12345678A i EXP-2026-1044 el 12/03/2026.")
        self.assertEqual(ents["DNI_PII"], ["12345678A"])
        self.assertEqual(ents["EXPEDIENT"], ["EXP-2026-1044"])
        self.assertEqual(ents["DATA"], ["12/03/2026"])

    def test_pipeline_complet_i_superioritat_semantica(self) -> None:
        res = executar_lab_nlp(LAB_DIR / "data" / "instancies_catala.json")
        self.assertGreaterEqual(res["loocv_accuracy_tfidf"], 0.75)
        for comp in res["comparativa_lexica_vs_semantica"]:
            self.assertEqual(comp["embedding_top1"]["dept"], comp["dept_esperat"])
            self.assertGreater(comp["embedding_top1"]["sim"], comp["tfidf_top1"]["sim"])


if __name__ == "__main__":
    unittest.main()
