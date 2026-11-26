"""Tests automatitzats del Projecte Final Integrador SIGEA-IA (compatible unittest i pytest)."""

from __future__ import annotations

import json
import sys
import unittest
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from data.generate_synthetic_data import build_synthetic_expedients
from src.sigea.models import AuditLedger
from src.sigea.pipeline import ExternalEniConnector, SigeaPipeline, tokenize_catalan, validate_nif


class TestSigeaPipeline(unittest.TestCase):
    def setUp(self) -> None:
        self.expedients = {e["expedient_id"]: e for e in build_synthetic_expedients()}
        self.ledger = AuditLedger(":memory:")
        self.pipeline = SigeaPipeline(ledger=self.ledger)

    def tearDown(self) -> None:
        self.ledger.close()

    def test_01_rbac_rejects_unauthorized_role(self) -> None:
        exp = dict(self.expedients["EXP-2026-0001"])
        exp["user_role"] = "convidat_extern"
        with self.assertRaises(PermissionError):
            self.pipeline.process_expedient(exp)

    def test_02_idempotency_prevents_duplicate_processing(self) -> None:
        exp = self.expedients["EXP-2026-0001"]
        first = self.pipeline.process_expedient(exp)
        second = self.pipeline.process_expedient(exp)
        self.assertEqual(first.status, "PREVALIDAT_SUPORT")
        self.assertEqual(second.status, "DUPLICAT_IDEMPOTENT")
        self.assertEqual(first.audit_hash, second.audit_hash)

    def test_03_prompt_injection_firewall_blocks_attack(self) -> None:
        res = self.pipeline.process_expedient(self.expedients["EXP-2026-0007"])
        self.assertEqual(res.status, "BLOQUEJAT_SEGURETAT")
        self.assertTrue(res.requires_human_review)
        self.assertFalse(res.autonomous_final_decision)
        self.assertGreater(len(res.security_flags), 0)
        self.assertEqual(res.external_sync_status, "SKIPPED_SECURITY")

    def test_04_pii_zero_leakage_in_audit_log(self) -> None:
        exp = self.expedients["EXP-2026-0003"]
        res = self.pipeline.process_expedient(exp)
        self.assertGreaterEqual(res.pii_redacted_count, 2)
        stored = self.ledger.get_expedient("EXP-2026-0003")
        assert stored is not None
        payload = stored["payload_redacted_json"]
        self.assertNotIn("ES1200000000000000001234", payload)
        self.assertNotIn(exp["documents"][0]["fields"]["nif"], payload)
        self.assertIn("[IBAN_REDACTAT]", payload)
        self.assertIn("[NIF_REDACTAT]", payload)

    def test_05_catalan_tokenization_and_nlp_classification(self) -> None:
        tokens = tokenize_catalan("Bonificació de l'IBI d'autoconsum i l'obra")
        self.assertIn("ibi", tokens)
        self.assertIn("autoconsum", tokens)
        self.assertIn("obra", tokens)
        res = self.pipeline.process_expedient(self.expedients["EXP-2026-0001"])
        self.assertEqual(res.area, "Hisenda i Tributs")
        self.assertGreaterEqual(res.classification_confidence, 0.75)

    def test_06_rag_filters_out_derogated_ordinance(self) -> None:
        res = self.pipeline.process_expedient(self.expedients["EXP-2026-0001"])
        citations = [c["citation"] for c in res.rag_citations]
        self.assertIn("[OF-IBI-2026, art. 9]", citations)
        for cite in citations:
            self.assertNotIn("OF-IBI-2024", cite)

    def test_07_art68_lpacap_missing_documents_generates_esmena_draft(self) -> None:
        res = self.pipeline.process_expedient(self.expedients["EXP-2026-0002"])
        self.assertEqual(res.area, "Urbanisme")
        self.assertIn("ICIO", res.missing_attachments)
        self.assertIsNotNone(res.esmena_draft_art68)
        self.assertIn("10 dies hàbils", res.esmena_draft_art68 or "")
        self.assertTrue(res.requires_human_review)

    def test_08_arithmetic_lcsp_and_mad_anomaly_trigger_hitl(self) -> None:
        res = self.pipeline.process_expedient(self.expedients["EXP-2026-0005"])
        self.assertEqual(res.area, "Contractació")
        self.assertTrue(res.is_anomaly)
        self.assertTrue(res.requires_human_review)
        self.assertTrue(any("aritmètica" in e for e in res.validation_errors))
        self.assertTrue(any("15.000" in e for e in res.validation_errors))

    def test_09_invalid_nif_detected_deterministically(self) -> None:
        self.assertFalse(validate_nif("10000010A"))
        res = self.pipeline.process_expedient(self.expedients["EXP-2026-0010"])
        self.assertTrue(any("NIF invàlid" in e for e in res.validation_errors))
        self.assertTrue(res.requires_human_review)

    def test_10_low_ocr_confidence_escalates_to_hitl(self) -> None:
        res = self.pipeline.process_expedient(self.expedients["EXP-2026-0008"])
        self.assertTrue(res.requires_human_review)
        self.assertTrue(any("OCR" in r for r in res.hitl_reasons))

    def test_11_social_vulnerability_and_anti_starvation_priority(self) -> None:
        social = self.pipeline.process_expedient(self.expedients["EXP-2026-0003"])
        aged = self.pipeline.process_expedient(self.expedients["EXP-2026-0009"])
        normal = self.pipeline.process_expedient(self.expedients["EXP-2026-0001"])
        self.assertEqual(social.priority_band, "ALTA")
        self.assertTrue(social.requires_human_review)
        self.assertGreater(aged.priority_score, normal.priority_score)

    def test_12_out_of_domain_abstains_and_never_hallucinates(self) -> None:
        res = self.pipeline.process_expedient(self.expedients["EXP-2026-0012"])
        self.assertEqual(res.rag_citations, [])
        self.assertIn("ABSTENCIÓ CONTROLADA", res.generated_draft)
        self.assertTrue(res.requires_human_review)
        self.assertFalse(res.autonomous_final_decision)

    def test_13_audit_chain_sha256_detects_tampering(self) -> None:
        for exp in list(self.expedients.values())[:4]:
            self.pipeline.process_expedient(exp)
        ok, count = self.ledger.verify_chain()
        self.assertTrue(ok)
        self.assertEqual(count, 4)

        # Manipulació deliberada d'un registre per validar detecció criptogràfica
        self.ledger.conn.execute("UPDATE audit_log SET status = 'MANIPULAT' WHERE seq = 2")
        self.ledger.conn.commit()
        ok_after, bad_seq = self.ledger.verify_chain()
        self.assertFalse(ok_after)
        self.assertEqual(bad_seq, 2)

    def test_14_circuit_breaker_and_outbox_resilience_on_eni_outage(self) -> None:
        down_eni = ExternalEniConnector(failure_threshold=2, force_down=True)
        pipe = SigeaPipeline(ledger=self.ledger, eni_connector=down_eni)
        r1 = pipe.process_expedient(self.expedients["EXP-2026-0001"])
        r2 = pipe.process_expedient(self.expedients["EXP-2026-0004"])
        self.assertEqual(r1.external_sync_status, "QUEUED_OUTBOX_CIRCUIT_OPEN")
        self.assertEqual(r2.external_sync_status, "QUEUED_OUTBOX_CIRCUIT_OPEN")
        self.assertTrue(down_eni.circuit_open)
        self.assertEqual(self.ledger.outbox_count("PENDING_RETRY"), 2)

    def test_15_human_decision_requires_motivation_and_no_autonomous_decision(self) -> None:
        for exp in self.expedients.values():
            res = self.pipeline.process_expedient(exp)
            self.assertFalse(res.autonomous_final_decision)
            self.assertIn("Art. 50", res.ai_transparency_notice)

        with self.assertRaises(ValueError):
            self.ledger.record_human_decision(
                expedient_id="EXP-2026-0003",
                reviewer_id="FUNC-1",
                reviewer_role="tecnic_social",
                decision="APROVAT",
                justification="OK",  # Massa curta -> bloquejada per art. 35 LPACAP
            )

        dec = self.ledger.record_human_decision(
            expedient_id="EXP-2026-0003",
            reviewer_id="FUNC-1",
            reviewer_role="tecnic_social",
            decision="APROVAT",
            justification="Verificada documentació social completa segons reglament vigent 2026.",
        )
        self.assertEqual(dec["decision"], "APROVAT")
        report = self.pipeline.compute_mlops_report()
        self.assertEqual(report["total_processed"], 12)
        self.assertTrue(report["audit_chain_valid"])


if __name__ == "__main__":
    unittest.main()
