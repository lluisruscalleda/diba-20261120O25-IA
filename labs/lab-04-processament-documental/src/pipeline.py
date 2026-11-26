"""Laboratori 4: Processament Intel·ligent de Documents (IDP) amb generador PDF sintètic."""

from __future__ import annotations

import re
from pathlib import Path

LLETRES_NIF = "TRWAGMYFPDXBNJZSQVHLCKE"


def escriure_pdf_sintetic(ruta_pdf: Path, linies: list[str]) -> Path:
    """Genera un fitxer PDF 1.4 mínim, vàlid i llegible en Python pur (sense dependències)."""
    ruta_pdf.parent.mkdir(parents=True, exist_ok=True)
    # Normalitzem a ASCII net per a la font Type1 Helvetica bàsica del PDF
    mapa = str.maketrans("àèéíïòóúüçÀÈÉÍÏÒÓÚÜÇ·€", "aeeiioouucAEEIIOOUUC E")
    contingut_ops = ["BT", "/F1 11 Tf", "50 760 Td", "15 TL"]
    for idx, linia in enumerate(linies):
        net = linia.translate(mapa).replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")
        prefix = "" if idx == 0 else "T* "
        contingut_ops.append(f"{prefix}({net}) Tj")
    contingut_ops.append("ET")
    stream = "\n".join(contingut_ops).encode("latin-1", errors="ignore")

    objs = [
        b"1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n",
        b"2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n",
        b"3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj\n",
        b"4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj\n",
        f"5 0 obj << /Length {len(stream)} >> stream\n".encode("ascii") + stream + b"\nendstream endobj\n",
    ]

    pdf = bytearray(b"%PDF-1.4\n")
    offsets = [0]
    for obj in objs:
        offsets.append(len(pdf))
        pdf.extend(obj)
    xref_pos = len(pdf)
    pdf.extend(f"xref\n0 {len(offsets)}\n0000000000 65535 f \n".encode("ascii"))
    for off in offsets[1:]:
        pdf.extend(f"{off:010d} 00000 n \n".encode("ascii"))
    pdf.extend(f"trailer << /Size {len(offsets)} /Root 1 0 R >>\nstartxref\n{xref_pos}\n%%EOF\n".encode("ascii"))
    ruta_pdf.write_bytes(bytes(pdf))
    return ruta_pdf


def generar_lot_pdfs_sintetics(dir_pdfs: Path) -> list[dict[str, object]]:
    """Crea 4 PDFs sintètics ficticis cobrint casos STP vàlids i casos de derivació HITL."""
    specs = [
        {
            "fitxer": "doc_01_factura_valida.pdf",
            "confianca_ocr": 0.97,
            "linies": [
                "FACTURA NUM: FAC-2026-001",
                "PROVEIDOR: SERVEIS FICTICIS VALLES SL",
                "NIF: 12345678Z",
                "DATA: 15/03/2026",
                "BASE IMPOSABLE: 1000.00 EUR",
                "IVA 21%: 210.00 EUR",
                "TOTAL FACTURA: 1210.00 EUR",
            ],
        },
        {
            "fitxer": "doc_02_factura_error_aritmetic.pdf",
            "confianca_ocr": 0.95,
            "linies": [
                "FACTURA NUM: FAC-2026-002",
                "PROVEIDOR: OBRES SIMULADES MARESME SL",
                "NIF: 12345678Z",
                "DATA: 18/03/2026",
                "BASE IMPOSABLE: 500.00 EUR",
                "IVA 21%: 105.00 EUR",
                "TOTAL FACTURA: 650.00 EUR",  # Error aritmètic! Hauria de ser 605.00
            ],
        },
        {
            "fitxer": "doc_03_instancia_baixa_qualitat_ocr.pdf",
            "confianca_ocr": 0.72,  # Baixa confiança OCR -> HITL!
            "linies": [
                "INSTANCIA GENERICA MUNICIPAL",
                "EXPEDIENT: EXP-2026-3310",
                "NIF: 12345678Z",
                "DATA: 20/03/2026",
                "ASSUMPTE: Sollicitud de bonificacio IBI familia nombrosa",
            ],
        },
        {
            "fitxer": "doc_04_certificat_nif_erroni.pdf",
            "confianca_ocr": 0.96,
            "linies": [
                "CERTIFICAT D EMPADRONAMENT MUNICIPAL",
                "EXPEDIENT: EXP-2026-4402",
                "NIF: 12345678A",  # Lletra NIF incorrecta! (12345678 % 23 -> Z)
                "DATA: 22/03/2026",
                "MUNICIPI: VIC (FICTICI)",
            ],
        },
    ]
    for s in specs:
        escriure_pdf_sintetic(dir_pdfs / str(s["fitxer"]), list(s["linies"]))
    return specs


def extreure_text_pdf_basic(ruta_pdf: Path) -> str:
    """Llegeix el text dels operadors Tj del PDF sintètic."""
    raw = ruta_pdf.read_bytes().decode("latin-1", errors="ignore")
    blocs = re.findall(r"\(([^()]*)\)\s*Tj", raw)
    return "\n".join(blocs)


def validar_nif(nif: str) -> bool:
    if not re.fullmatch(r"\d{8}[A-Z]", nif):
        return False
    return LLETRES_NIF[int(nif[:8]) % 23] == nif[8]


def classificar_document(text: str) -> str:
    up = text.upper()
    if "FACTURA" in up and "BASE IMPOSABLE" in up:
        return "FACTURA"
    if "CERTIFICAT" in up and "EMPADRONAMENT" in up:
        return "CERTIFICAT_EMPADRONAMENT"
    if "INSTANCIA" in up:
        return "INSTANCIA"
    return "DESCONEGUT"


def extreure_camps_kie(text: str) -> dict[str, object]:
    camps: dict[str, object] = {}
    if m := re.search(r"NIF:\s*(\d{8}[A-Z])", text):
        camps["nif"] = m.group(1)
    if m := re.search(r"DATA:\s*(\d{2}/\d{2}/\d{4})", text):
        camps["data"] = m.group(1)
    if m := re.search(r"EXPEDIENT:\s*(EXP-\d{4}-\d+)", text):
        camps["expedient"] = m.group(1)
    if m := re.search(r"BASE IMPOSABLE:\s*(\d+\.\d{2})", text):
        camps["base_eur"] = float(m.group(1))
    if m := re.search(r"IVA 21%:\s*(\d+\.\d{2})", text):
        camps["iva_eur"] = float(m.group(1))
    if m := re.search(r"TOTAL FACTURA:\s*(\d+\.\d{2})", text):
        camps["total_eur"] = float(m.group(1))
    return camps


def processar_document_idp(ruta_pdf: Path, confianca_ocr: float, llindar_ocr: float = 0.85) -> dict[str, object]:
    text = extreure_text_pdf_basic(ruta_pdf)
    tipus = classificar_document(text)
    camps = extreure_camps_kie(text)
    incidencies: list[str] = []

    if confianca_ocr < llindar_ocr:
        incidencies.append(f"BAIXA_CONFIANCA_OCR ({confianca_ocr} < {llindar_ocr})")

    nif = str(camps.get("nif", ""))
    if not nif or not validar_nif(nif):
        incidencies.append(f"NIF_INVALID ({nif or 'ABSENT'})")

    if tipus == "FACTURA":
        base = float(camps.get("base_eur", 0.0))
        iva = float(camps.get("iva_eur", 0.0))
        total = float(camps.get("total_eur", 0.0))
        if abs((base + iva) - total) > 0.01:
            incidencies.append(f"DESQUADRE_ARITMETIC ({base} + {iva} != {total})")

    ruta = "STP_AUTOMATIC" if not incidencies else "DERIVAR_REVISIO_HUMANA_HITL"
    return {
        "fitxer": ruta_pdf.name,
        "tipus_documental": tipus,
        "confianca_ocr": confianca_ocr,
        "camps_extrets": camps,
        "incidencies": incidencies,
        "decisio_ruta": ruta,
    }


def executar_lab_idp(dir_pdfs: Path) -> dict[str, object]:
    specs = generar_lot_pdfs_sintetics(dir_pdfs)
    resultats = [
        processar_document_idp(dir_pdfs / str(s["fitxer"]), float(s["confianca_ocr"]))
        for s in specs
    ]
    stp = sum(1 for r in resultats if r["decisio_ruta"] == "STP_AUTOMATIC")
    return {
        "total_pdfs_generats": len(resultats),
        "stp_automatics": stp,
        "derivats_hitl": len(resultats) - stp,
        "detall": resultats,
    }
