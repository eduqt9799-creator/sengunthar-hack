import os
import uuid
import datetime
from pathlib import Path
from typing import List, Optional

from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form, Query, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from sqlalchemy.orm import Session

from database import engine, Base, get_db, SessionLocal
from models import (
    User, Product, DefectClass, QualityRule, Batch,
    Inspection, Detection, Alert, CorrectiveAction, ReportVersion, AuditLog
)
from schemas import (
    ProductCreate, ProductOut, BatchCreate, BatchOut,
    InspectionOut, AlertOut, AlertUpdate, CorrectiveActionCreate, CorrectiveActionOut,
    FeedbackSubmit, BatchSummaryReport
)
from config import (
    UPLOAD_DIR, INSPECTION_DIR, ANNOTATED_DIR, QR_DIR, REPORT_DIR, FRONTEND_BASE_URL
)
from qr_service import generate_batch_qr
from detector import run_ai_defect_detection
from quality import evaluate_inspection_quality
from alert_service import check_and_trigger_alerts
from batch_service import calculate_batch_metrics
from report_service import generate_pdf_report, generate_excel_report
from seed_data import seed_database

# Create DB tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="WeaveGuard AI — Multi-Product AI Quality Inspection API",
    description="Automated Defect Detection, Localization, Smart Quality Assessment, QR Traceability & Batch Analytics",
    version="1.0.0"
)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static directories for image previews and reports
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")
app.mount("/reports", StaticFiles(directory=str(REPORT_DIR)), name="reports")

# Auto-seed on startup if needed
@app.on_event("startup")
def startup_event():
    db = SessionLocal()
    try:
        seed_database(db)
    except Exception as e:
        print(f"[Startup] Seeding error or skipped: {e}")
    finally:
        db.close()

# ----------------- PRODUCT ENDPOINTS -----------------

@app.post("/api/products", response_model=ProductOut, status_code=status.HTTP_201_CREATED)
def create_product(product_in: ProductCreate, db: Session = Depends(get_db)):
    existing = db.query(Product).filter(Product.code == product_in.code).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Product with code '{product_in.code}' already exists.")

    product = Product(
        name=product_in.name,
        category=product_in.category,
        code=product_in.code,
        description=product_in.description,
        regions=product_in.regions or ["Surface Core", "Edges", "Mounting Points"]
    )
    db.add(product)
    db.flush()

    # Create defect classes
    if product_in.defect_classes:
        for dc in product_in.defect_classes:
            defect_class = DefectClass(
                product_id=product.id,
                name=dc.name,
                code=dc.code,
                description=dc.description,
                default_severity=dc.default_severity,
                permitted_limit=dc.permitted_limit,
                inspection_method=dc.inspection_method,
                is_image_verifiable=dc.is_image_verifiable
            )
            db.add(defect_class)

    # Create quality rules
    qr_data = product_in.quality_rules
    if qr_data:
        qrule = QualityRule(
            product_id=product.id,
            max_minor_defects=qr_data.max_minor_defects,
            max_major_defects=qr_data.max_major_defects,
            allow_critical=qr_data.allow_critical,
            min_confidence_threshold=qr_data.min_confidence_threshold,
            max_defect_rate_percent=qr_data.max_defect_rate_percent,
            auto_hold_on_critical=qr_data.auto_hold_on_critical
        )
    else:
        qrule = QualityRule(product_id=product.id)
    db.add(qrule)

    db.commit()
    db.refresh(product)
    return product

@app.get("/api/products", response_model=List[ProductOut])
def get_products(db: Session = Depends(get_db)):
    return db.query(Product).order_by(Product.id.asc()).all()

@app.get("/api/products/{product_id}", response_model=ProductOut)
def get_product_by_id(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

# ----------------- BATCH ENDPOINTS -----------------

@app.post("/api/batches", response_model=BatchOut, status_code=status.HTTP_201_CREATED)
def create_batch(batch_in: BatchCreate, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == batch_in.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found for batch creation.")

    # Generate unique Batch ID (e.g. WG-MET-2026-042)
    year = datetime.datetime.utcnow().year
    cat_prefix = product.category[:3].upper()
    existing_count = db.query(Batch).filter(Batch.product_id == product.id).count() + 1
    batch_id_str = f"WG-{cat_prefix}-{year}-{existing_count:03d}"

    # Generate unique QR code
    qr_rel_path = generate_batch_qr(batch_id_str, batch_in.batch_name)
    qr_url = f"{FRONTEND_BASE_URL}/batches/{batch_id_str}"

    batch = Batch(
        batch_id=batch_id_str,
        product_id=product.id,
        batch_name=batch_in.batch_name,
        quantity=batch_in.quantity,
        status="IN_INSPECTION",
        qr_code_path=qr_rel_path,
        qr_payload=qr_url,
        production_date=datetime.datetime.utcnow(),
        inspector_name=batch_in.inspector_name or "Senior QA Inspector",
        notes=batch_in.notes
    )
    db.add(batch)
    db.commit()
    db.refresh(batch)

    # Log audit
    audit = AuditLog(
        entity_type="BATCH",
        entity_id=batch.batch_id,
        action="BATCH_CREATED",
        performed_by=batch.inspector_name or "QA Inspector",
        details={"quantity": batch.quantity, "product": product.name}
    )
    db.add(audit)
    db.commit()

    return batch

@app.get("/api/batches", response_model=List[BatchOut])
def get_batches(db: Session = Depends(get_db)):
    return db.query(Batch).order_by(Batch.id.desc()).all()

@app.get("/api/batches/{batch_id}")
def get_batch_by_id(batch_id: str, db: Session = Depends(get_db)):
    batch = db.query(Batch).filter((Batch.batch_id == batch_id) | (Batch.id == (int(batch_id) if batch_id.isdigit() else -1))).first()
    if not batch:
        raise HTTPException(status_code=404, detail=f"Batch '{batch_id}' not found.")
    metrics = calculate_batch_metrics(db, batch)
    return metrics

# ----------------- INSPECTION & AI DETECTION -----------------

@app.post("/api/inspect")
async def inspect_product_image(
    batch_id: str = Form(...),
    product_id: Optional[int] = Form(None),
    item_serial: Optional[str] = Form(None),
    inspector_notes: Optional[str] = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    # Retrieve batch
    batch = db.query(Batch).filter((Batch.batch_id == batch_id) | (Batch.id == (int(batch_id) if batch_id.isdigit() else -1))).first()
    if not batch:
        raise HTTPException(status_code=404, detail=f"Batch '{batch_id}' not found.")

    product = batch.product
    if not product and product_id:
        product = db.query(Product).filter(Product.id == product_id).first()

    # Save uploaded file
    file_ext = Path(file.filename).suffix or ".jpg"
    unique_filename = f"insp_{uuid.uuid4().hex[:10]}{file_ext}"
    saved_file_path = INSPECTION_DIR / unique_filename

    contents = await file.read()
    with open(saved_file_path, "wb") as f:
        f.write(contents)

    rel_image_path = f"/uploads/inspections/{unique_filename}"

    # Extract product defect classes for AI mapping
    p_defect_classes = [
        {"name": dc.name, "default_severity": dc.default_severity, "code": dc.code}
        for dc in product.defect_classes
    ] if product else []

    # Run AI Defect Detection
    detection_res = run_ai_defect_detection(
        image_path=str(saved_file_path),
        product_category=product.category if product else "Metal",
        product_regions=product.regions if product else [],
        product_defect_classes=p_defect_classes
    )

    # Evaluate Quality Rules & Severity
    quality_rules = product.quality_rules if product else None
    eval_status, quality_score, decision_reason = evaluate_inspection_quality(
        detections=detection_res["detections"],
        quality_rules=quality_rules,
        overall_confidence=detection_res["ai_confidence"]
    )

    # Generate unique inspection code
    insp_count = db.query(Inspection).filter(Inspection.batch_id == batch.id).count() + 1
    insp_code = f"INSP-{batch.batch_id}-{insp_count:03d}"

    inspection = Inspection(
        inspection_code=insp_code,
        batch_id=batch.id,
        product_id=product.id if product else 1,
        item_serial=item_serial or f"SN-{uuid.uuid4().hex[:6].upper()}",
        image_path=rel_image_path,
        annotated_image_path=detection_res["annotated_image_path"],
        ai_confidence=detection_res["ai_confidence"],
        quality_score=quality_score,
        status=eval_status,
        decision_reason=decision_reason,
        model_version=detection_res["model_version"],
        inspected_at=datetime.datetime.utcnow(),
        inspector_notes=inspector_notes
    )
    db.add(inspection)
    db.flush()

    # Save detections to DB
    for det in detection_res["detections"]:
        # Find matching defect class if any
        matching_dc = None
        if product:
            matching_dc = next((dc for dc in product.defect_classes if dc.name.lower() == det["defect_name"].lower()), None)

        detection_row = Detection(
            inspection_id=inspection.id,
            defect_class_id=matching_dc.id if matching_dc else None,
            defect_name=det["defect_name"],
            confidence=det["confidence"],
            bbox_x1=det["bbox_x1"],
            bbox_y1=det["bbox_y1"],
            bbox_x2=det["bbox_x2"],
            bbox_y2=det["bbox_y2"],
            image_region=det["image_region"],
            severity=det["severity"],
            physical_approx_size_mm=det.get("physical_approx_size_mm")
        )
        db.add(detection_row)

    db.commit()
    db.refresh(inspection)

    # Check and trigger smart alerts
    triggered_alerts = check_and_trigger_alerts(
        db=db,
        batch_id=batch.id,
        inspection_id=inspection.id,
        product_id=product.id if product else None
    )

    return {
        "inspection": inspection,
        "detections": detection_res["detections"],
        "quality_score": quality_score,
        "status": eval_status,
        "decision_reason": decision_reason,
        "triggered_alerts": [a.alert_code for a in triggered_alerts]
    }

@app.get("/api/batches/{batch_id}/inspections", response_model=List[InspectionOut])
def get_batch_inspections(batch_id: str, db: Session = Depends(get_db)):
    batch = db.query(Batch).filter((Batch.batch_id == batch_id) | (Batch.id == (int(batch_id) if batch_id.isdigit() else -1))).first()
    if not batch:
        raise HTTPException(status_code=404, detail=f"Batch '{batch_id}' not found.")
    return db.query(Inspection).filter(Inspection.batch_id == batch.id).order_by(Inspection.id.desc()).all()

@app.post("/api/inspections/{inspection_id}/feedback")
def submit_inspection_feedback(
    inspection_id: int,
    feedback: FeedbackSubmit,
    db: Session = Depends(get_db)
):
    insp = db.query(Inspection).filter(Inspection.id == inspection_id).first()
    if not insp:
        raise HTTPException(status_code=404, detail="Inspection not found.")

    insp.feedback_status = feedback.feedback_status
    insp.reviewed_by = feedback.reviewed_by
    insp.feedback_notes = feedback.feedback_notes
    if feedback.override_status:
        insp.status = feedback.override_status

    # Add audit log
    audit = AuditLog(
        entity_type="INSPECTION",
        entity_id=insp.inspection_code,
        action="FEEDBACK_SUBMITTED",
        performed_by=feedback.reviewed_by,
        details={"feedback_status": feedback.feedback_status, "override": feedback.override_status}
    )
    db.add(audit)
    db.commit()
    return {"message": "Feedback recorded successfully", "inspection_code": insp.inspection_code, "status": insp.status}

# ----------------- QUALITY REPORTS -----------------

@app.get("/api/batches/{batch_id}/report")
def get_batch_report(batch_id: str, db: Session = Depends(get_db)):
    batch = db.query(Batch).filter((Batch.batch_id == batch_id) | (Batch.id == (int(batch_id) if batch_id.isdigit() else -1))).first()
    if not batch:
        raise HTTPException(status_code=404, detail=f"Batch '{batch_id}' not found.")
    return calculate_batch_metrics(db, batch)

@app.get("/api/batches/{batch_id}/report/pdf")
def download_batch_pdf_report(batch_id: str, db: Session = Depends(get_db)):
    batch = db.query(Batch).filter((Batch.batch_id == batch_id) | (Batch.id == (int(batch_id) if batch_id.isdigit() else -1))).first()
    if not batch:
        raise HTTPException(status_code=404, detail=f"Batch '{batch_id}' not found.")
    summary = calculate_batch_metrics(db, batch)
    pdf_path = generate_pdf_report(summary)
    return FileResponse(
        path=pdf_path,
        media_type="application/pdf",
        filename=f"WeaveGuard_Report_{batch.batch_id}.pdf"
    )

@app.get("/api/batches/{batch_id}/report/excel")
def download_batch_excel_report(batch_id: str, db: Session = Depends(get_db)):
    batch = db.query(Batch).filter((Batch.batch_id == batch_id) | (Batch.id == (int(batch_id) if batch_id.isdigit() else -1))).first()
    if not batch:
        raise HTTPException(status_code=404, detail=f"Batch '{batch_id}' not found.")
    summary = calculate_batch_metrics(db, batch)
    excel_path = generate_excel_report(summary)
    return FileResponse(
        path=excel_path,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        filename=f"WeaveGuard_Report_{batch.batch_id}.xlsx"
    )

# ----------------- SMART ALERTS & CORRECTIVE ACTIONS -----------------

@app.get("/api/alerts", response_model=List[AlertOut])
def get_alerts(status_filter: Optional[str] = None, db: Session = Depends(get_db)):
    q = db.query(Alert).order_by(Alert.triggered_at.desc())
    if status_filter and status_filter != "ALL":
        q = q.filter(Alert.status == status_filter)
    return q.all()

@app.patch("/api/alerts/{alert_id}", response_model=AlertOut)
def update_alert(alert_id: int, alert_in: AlertUpdate, db: Session = Depends(get_db)):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found.")

    if alert_in.status:
        alert.status = alert_in.status
        if alert_in.status == "RESOLVED":
            alert.resolved_at = datetime.datetime.utcnow()
    if alert_in.assigned_to:
        alert.assigned_to = alert_in.assigned_to
    if alert_in.resolution_notes:
        alert.resolution_notes = alert_in.resolution_notes

    db.commit()
    db.refresh(alert)
    return alert

@app.post("/api/alerts/{alert_id}/corrective-action", response_model=CorrectiveActionOut)
def create_corrective_action(
    alert_id: int,
    action_in: CorrectiveActionCreate,
    db: Session = Depends(get_db)
):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found.")

    action_code = f"CA-{alert.alert_code}-{uuid.uuid4().hex[:4].upper()}"
    ca = CorrectiveAction(
        action_code=action_code,
        alert_id=alert.id,
        batch_id=alert.batch_id,
        assigned_person=action_in.assigned_person,
        root_cause_analysis=action_in.root_cause_analysis,
        action_taken=action_in.action_taken,
        status="PENDING_REINSPECTION" if action_in.requires_reinspection else "VERIFIED_CLOSED",
        requires_reinspection=action_in.requires_reinspection,
        reinspection_notes=action_in.reinspection_notes,
        recorded_at=datetime.datetime.utcnow(),
        closed_at=datetime.datetime.utcnow() if not action_in.requires_reinspection else None
    )
    db.add(ca)
    
    # Update alert status
    alert.status = "IN_PROGRESS" if action_in.requires_reinspection else "RESOLVED"
    if not action_in.requires_reinspection:
        alert.resolved_at = datetime.datetime.utcnow()
        alert.resolution_notes = f"Closed with corrective action: {action_in.action_taken}"

    db.commit()
    db.refresh(ca)
    return ca

@app.get("/api/corrective-actions", response_model=List[CorrectiveActionOut])
def list_corrective_actions(db: Session = Depends(get_db)):
    return db.query(CorrectiveAction).order_by(CorrectiveAction.recorded_at.desc()).all()

# ----------------- ANALYTICS & AUDIT -----------------

@app.get("/api/analytics/overview")
def get_analytics_overview(db: Session = Depends(get_db)):
    total_batches = db.query(Batch).count()
    total_inspections = db.query(Inspection).count()
    passed_inspections = db.query(Inspection).filter(Inspection.status == "PASSED").count()
    failed_inspections = db.query(Inspection).filter(Inspection.status == "FAILED").count()
    review_inspections = db.query(Inspection).filter(Inspection.status == "MANUAL_REVIEW").count()
    active_alerts = db.query(Alert).filter(Alert.status.in_(["OPEN", "IN_PROGRESS"])).count()

    overall_defect_rate = round((failed_inspections / total_inspections * 100.0), 1) if total_inspections > 0 else 0.0
    overall_pass_rate = round((passed_inspections / total_inspections * 100.0), 1) if total_inspections > 0 else 0.0

    # Defect breakdown
    detections = db.query(Detection).all()
    defect_counts = {}
    severity_counts = {"MINOR": 0, "MAJOR": 0, "CRITICAL": 0}
    region_counts = {}

    for d in detections:
        defect_counts[d.defect_name] = defect_counts.get(d.defect_name, 0) + 1
        if d.severity in severity_counts:
            severity_counts[d.severity] += 1
        if d.image_region:
            region_counts[d.image_region] = region_counts.get(d.image_region, 0) + 1

    # Batch comparison data
    batches = db.query(Batch).order_by(Batch.id.desc()).limit(8).all()
    batch_stats = []
    for b in batches:
        insps = b.inspections
        b_total = len(insps)
        b_failed = sum(1 for i in insps if i.status == "FAILED")
        b_rate = round((b_failed / b_total * 100.0), 1) if b_total > 0 else 0.0
        batch_stats.append({
            "batch_id": b.batch_id,
            "product_name": b.product.name if b.product else "N/A",
            "inspected": b_total,
            "defect_rate": b_rate,
            "status": b.status
        })

    return {
        "total_batches": total_batches,
        "total_inspections": total_inspections,
        "passed_inspections": passed_inspections,
        "failed_inspections": failed_inspections,
        "pending_reviews": review_inspections,
        "active_alerts": active_alerts,
        "overall_defect_rate": overall_defect_rate,
        "overall_pass_rate": overall_pass_rate,
        "defect_breakdown": [{"name": k, "count": v} for k, v in defect_counts.items()],
        "severity_breakdown": [{"name": k, "count": v} for k, v in severity_counts.items()],
        "region_breakdown": [{"region": k, "count": v} for k, v in region_counts.items()],
        "batch_comparison": batch_stats
    }

@app.get("/api/audit-logs")
def get_audit_logs(db: Session = Depends(get_db)):
    return db.query(AuditLog).order_by(AuditLog.timestamp.desc()).limit(50).all()

@app.post("/api/reseed")
def reseed_database(db: Session = Depends(get_db)):
    seed_database(db)
    return {"message": "Database successfully seeded with multi-product baseline."}
