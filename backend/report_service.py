import os
import datetime
from pathlib import Path
from config import REPORT_DIR, UPLOAD_DIR
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image as RLImage, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side

def generate_pdf_report(batch_summary: dict) -> str:
    """
    Generates an executive-grade digital quality PDF report with tables and QR stamp.
    """
    batch = batch_summary["batch"]
    batch_id_clean = batch.batch_id.replace("/", "_")
    pdf_filename = f"report_{batch_id_clean}.pdf"
    pdf_path = REPORT_DIR / pdf_filename

    doc = SimpleDocTemplate(
        str(pdf_path),
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'MainTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=20,
        textColor=colors.HexColor('#0F172A'),
        spaceAfter=4
    )
    subtitle_style = ParagraphStyle(
        'Subtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        textColor=colors.HexColor('#64748B'),
        spaceAfter=12
    )
    section_style = ParagraphStyle(
        'SectionHeader',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=13,
        textColor=colors.HexColor('#1E293B'),
        spaceBefore=14,
        spaceAfter=6
    )
    cell_style = ParagraphStyle(
        'Cell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        textColor=colors.HexColor('#334155')
    )
    cell_bold = ParagraphStyle(
        'CellBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        textColor=colors.HexColor('#0F172A')
    )

    story = []

    # Title & Header
    story.append(Paragraph("WEAVEGUARD AI — QUALITY COMPLIANCE CERTIFICATE", title_style))
    story.append(Paragraph(f"Batch Digital Traceability Record • Generated {datetime.datetime.now().strftime('%Y-%m-%d %H:%M UTC')}", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#0284C7'), spaceBefore=0, spaceAfter=14))

    # Meta Table + QR Stamp
    qr_img_flowable = None
    if batch.qr_code_path:
        qr_full_path = UPLOAD_DIR.parent / batch.qr_code_path.lstrip("/")
        if qr_full_path.exists():
            qr_img_flowable = RLImage(str(qr_full_path), width=90, height=105)

    meta_data = [
        [Paragraph("<b>Batch ID:</b>", cell_style), Paragraph(batch.batch_id, cell_bold), Paragraph("<b>Status:</b>", cell_style), Paragraph(batch.status, cell_bold)],
        [Paragraph("<b>Product:</b>", cell_style), Paragraph(batch.product.name if batch.product else "N/A", cell_style), Paragraph("<b>Category:</b>", cell_style), Paragraph(batch.product.category if batch.product else "N/A", cell_style)],
        [Paragraph("<b>Production Qty:</b>", cell_style), Paragraph(str(batch.quantity), cell_style), Paragraph("<b>Total Inspected:</b>", cell_style), Paragraph(str(batch_summary['total_inspected']), cell_bold)],
        [Paragraph("<b>Pass Rate:</b>", cell_style), Paragraph(f"{batch_summary['pass_rate']}%", cell_bold), Paragraph("<b>Defect Rate:</b>", cell_style), Paragraph(f"{batch_summary['defect_rate']}%", cell_bold)],
        [Paragraph("<b>Inspector:</b>", cell_style), Paragraph(batch.inspector_name or "QA Automated System", cell_style), Paragraph("<b>Production Date:</b>", cell_style), Paragraph(batch.production_date.strftime('%Y-%m-%d'), cell_style)]
    ]

    meta_table = Table(meta_data, colWidths=[90, 160, 90, 160])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F8FAFC')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
    ]))

    if qr_img_flowable:
        header_table = Table([[meta_table, qr_img_flowable]], colWidths=[420, 100])
        header_table.setStyle(TableStyle([
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('ALIGN', (1,0), (1,0), 'CENTER')
        ]))
        story.append(header_table)
    else:
        story.append(meta_table)

    story.append(Spacer(1, 14))

    # Defect Breakdown Section
    story.append(Paragraph("1. Defect Category & Severity Analysis", section_style))
    defect_rows = [
        [Paragraph("<b>Defect Classification</b>", cell_bold), Paragraph("<b>Count</b>", cell_bold), Paragraph("<b>Primary Region</b>", cell_bold), Paragraph("<b>Severity Impact</b>", cell_bold)]
    ]

    if batch_summary["defect_breakdown"]:
        for d_name, count in batch_summary["defect_breakdown"].items():
            defect_rows.append([
                Paragraph(d_name, cell_style),
                Paragraph(str(count), cell_bold),
                Paragraph("Surface & Edges", cell_style),
                Paragraph("Configured Rule", cell_style)
            ])
    else:
        defect_rows.append([Paragraph("No defects detected across batch inspections.", cell_style), Paragraph("0", cell_style), Paragraph("N/A", cell_style), Paragraph("PASSED", cell_style)])

    defect_table = Table(defect_rows, colWidths=[180, 80, 140, 120])
    defect_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#E0F2FE')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#BAE6FD')),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(defect_table)

    story.append(Spacer(1, 14))

    # Inspection Log Section
    story.append(Paragraph("2. Individual Product Inspection Records", section_style))
    insp_rows = [
        [Paragraph("<b>Code</b>", cell_bold), Paragraph("<b>Status</b>", cell_bold), Paragraph("<b>AI Conf.</b>", cell_bold), Paragraph("<b>Score</b>", cell_bold), Paragraph("<b>Decision Reason</b>", cell_bold)]
    ]
    for insp in batch_summary["inspections"][:15]: # Show up to 15 in print PDF
        status_color = "#16A34A" if insp.status == "PASSED" else ("#DC2626" if insp.status == "FAILED" else "#D97706")
        insp_rows.append([
            Paragraph(insp.inspection_code, cell_style),
            Paragraph(f"<font color='{status_color}'><b>{insp.status}</b></font>", cell_style),
            Paragraph(f"{int(insp.ai_confidence*100)}%", cell_style),
            Paragraph(f"{insp.quality_score}%", cell_style),
            Paragraph(insp.decision_reason or "Compliant", cell_style)
        ])

    insp_table = Table(insp_rows, colWidths=[110, 75, 55, 55, 225])
    insp_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#F1F5F9')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(insp_table)

    # Alerts & Actions Section
    if batch_summary["alerts"] or batch_summary["corrective_actions"]:
        story.append(Spacer(1, 14))
        story.append(Paragraph("3. Quality Alerts & Corrective Action Log", section_style))
        alert_rows = [
            [Paragraph("<b>Alert / Action Code</b>", cell_bold), Paragraph("<b>Type / Priority</b>", cell_bold), Paragraph("<b>Status</b>", cell_bold), Paragraph("<b>Resolution / Action</b>", cell_bold)]
        ]
        for a in batch_summary["alerts"][:8]:
            alert_rows.append([
                Paragraph(a.alert_code, cell_style),
                Paragraph(f"{a.alert_type} ({a.priority})", cell_style),
                Paragraph(a.status, cell_bold),
                Paragraph(a.title, cell_style)
            ])
        for ca in batch_summary["corrective_actions"][:8]:
            alert_rows.append([
                Paragraph(ca.action_code, cell_style),
                Paragraph(f"Corrective Action ({ca.assigned_person})", cell_style),
                Paragraph(ca.status, cell_bold),
                Paragraph(ca.action_taken, cell_style)
            ])
        al_table = Table(alert_rows, colWidths=[130, 130, 80, 180])
        al_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#FEF2F2')),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#FECACA')),
            ('TOPPADDING', (0,0), (-1,-1), 4),
            ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ]))
        story.append(al_table)

    doc.build(story)
    return str(pdf_path)

def generate_excel_report(batch_summary: dict) -> str:
    """
    Generates a structured multi-tab Excel Workbook with formatting, charts-ready data, and logs.
    """
    batch = batch_summary["batch"]
    batch_id_clean = batch.batch_id.replace("/", "_")
    excel_filename = f"report_{batch_id_clean}.xlsx"
    excel_path = REPORT_DIR / excel_filename

    wb = openpyxl.Workbook()
    
    # 1. Summary Sheet
    ws1 = wb.active
    ws1.title = "Batch Summary"
    
    # Styling headers
    header_fill = PatternFill(start_color="0F172A", end_color="0F172A", fill_type="solid")
    header_font = Font(name="Arial", size=11, bold=True, color="FFFFFF")
    title_font = Font(name="Arial", size=14, bold=True, color="0284C7")
    bold_font = Font(name="Arial", size=10, bold=True)
    
    ws1["A1"] = "WEAVEGUARD AI — QUALITY INSPECTION BATCH REPORT"
    ws1["A1"].font = title_font
    
    summary_data = [
        ("Batch ID", batch.batch_id),
        ("Product Name", batch.product.name if batch.product else "N/A"),
        ("Product Category", batch.product.category if batch.product else "N/A"),
        ("Production Quantity", batch.quantity),
        ("Total Inspected Items", batch_summary["total_inspected"]),
        ("Passed Items", batch_summary["total_passed"]),
        ("Failed Items", batch_summary["total_failed"]),
        ("Manual Review Required", batch_summary["total_review"]),
        ("Batch Pass Rate (%)", f"{batch_summary['pass_rate']}%"),
        ("Batch Defect Rate (%)", f"{batch_summary['defect_rate']}%"),
        ("Final Batch Status", batch.status),
        ("Inspector", batch.inspector_name or "QA Automated System"),
        ("Production Date", batch.production_date.strftime('%Y-%m-%d')),
        ("Report Generation Time", datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S UTC'))
    ]
    
    for row_idx, (k, v) in enumerate(summary_data, start=3):
        ws1.cell(row=row_idx, column=1, value=k).font = bold_font
        ws1.cell(row=row_idx, column=2, value=str(v))
    
    # 2. Inspections Sheet
    ws2 = wb.create_sheet(title="Inspections")
    headers2 = ["Inspection Code", "Item Serial", "Status", "Quality Score", "AI Confidence", "Model Version", "Decision Reason", "Timestamp"]
    ws2.append(headers2)
    for col_num in range(1, len(headers2) + 1):
        cell = ws2.cell(row=1, column=col_num)
        cell.fill = header_fill
        cell.font = header_font
        
    for insp in batch_summary["inspections"]:
        ws2.append([
            insp.inspection_code,
            insp.item_serial or f"SN-{insp.id}",
            insp.status,
            f"{insp.quality_score}%",
            f"{int(insp.ai_confidence * 100)}%",
            insp.model_version,
            insp.decision_reason,
            insp.inspected_at.strftime('%Y-%m-%d %H:%M:%S')
        ])
        
    # 3. Defect Register Sheet
    ws3 = wb.create_sheet(title="Defects Register")
    headers3 = ["Inspection Code", "Defect Name", "Severity", "Region", "Confidence", "Approx Size (mm)"]
    ws3.append(headers3)
    for col_num in range(1, len(headers3) + 1):
        cell = ws3.cell(row=1, column=col_num)
        cell.fill = header_fill
        cell.font = header_font
        
    for insp in batch_summary["inspections"]:
        for det in insp.detections:
            ws3.append([
                insp.inspection_code,
                det.defect_name,
                det.severity,
                det.image_region,
                f"{int(det.confidence * 100)}%",
                det.physical_approx_size_mm or "N/A"
            ])

    # 4. Alerts & Corrective Actions Sheet
    ws4 = wb.create_sheet(title="Alerts & Actions")
    headers4 = ["Code", "Type", "Priority / Assigned", "Status", "Description / Action Taken", "Triggered / Recorded Date"]
    ws4.append(headers4)
    for col_num in range(1, len(headers4) + 1):
        cell = ws4.cell(row=1, column=col_num)
        cell.fill = header_fill
        cell.font = header_font
        
    for a in batch_summary["alerts"]:
        ws4.append([
            a.alert_code,
            f"ALERT: {a.alert_type}",
            f"{a.priority} | {a.assigned_to}",
            a.status,
            a.message,
            a.triggered_at.strftime('%Y-%m-%d %H:%M:%S')
        ])
    for ca in batch_summary["corrective_actions"]:
        ws4.append([
            ca.action_code,
            "CORRECTIVE ACTION",
            ca.assigned_person,
            ca.status,
            f"Action: {ca.action_taken} | RCA: {ca.root_cause_analysis or 'N/A'}",
            ca.recorded_at.strftime('%Y-%m-%d %H:%M:%S')
        ])

    # Adjust column widths automatically
    for ws in [ws1, ws2, ws3, ws4]:
        for col in ws.columns:
            max_len = max(len(str(cell.value or '')) for cell in col)
            col_letter = openpyxl.utils.get_column_letter(col[0].column)
            ws.column_dimensions[col_letter].width = max(max_len + 3, 12)

    wb.save(str(excel_path))
    return str(excel_path)
