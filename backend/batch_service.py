import datetime
from sqlalchemy.orm import Session
from models import Batch, Inspection, Detection, Alert, CorrectiveAction

def calculate_batch_metrics(db: Session, batch: Batch) -> dict:
    """
    Computes comprehensive quality metrics, defect aggregations, and status for a batch.
    """
    inspections = db.query(Inspection).filter(Inspection.batch_id == batch.id).all()
    total_inspected = len(inspections)
    total_passed = sum(1 for i in inspections if i.status == "PASSED")
    total_failed = sum(1 for i in inspections if i.status == "FAILED")
    total_review = sum(1 for i in inspections if i.status == "MANUAL_REVIEW")

    pass_rate = round((total_passed / total_inspected * 100.0), 1) if total_inspected > 0 else 0.0
    defect_rate = round((total_failed / total_inspected * 100.0), 1) if total_inspected > 0 else 0.0

    defect_breakdown = {}
    severity_breakdown = {"MINOR": 0, "MAJOR": 0, "CRITICAL": 0}
    region_breakdown = {}

    for insp in inspections:
        for det in insp.detections:
            defect_breakdown[det.defect_name] = defect_breakdown.get(det.defect_name, 0) + 1
            if det.severity in severity_breakdown:
                severity_breakdown[det.severity] += 1
            if det.image_region:
                region_breakdown[det.image_region] = region_breakdown.get(det.image_region, 0) + 1

    alerts = db.query(Alert).filter(Alert.batch_id == batch.id).all()
    alerts_summary = {
        "OPEN": sum(1 for a in alerts if a.status == "OPEN"),
        "IN_PROGRESS": sum(1 for a in alerts if a.status == "IN_PROGRESS"),
        "RESOLVED": sum(1 for a in alerts if a.status == "RESOLVED"),
        "CRITICAL": sum(1 for a in alerts if a.priority == "CRITICAL"),
    }

    corrective_actions = db.query(CorrectiveAction).filter(CorrectiveAction.batch_id == batch.id).all()

    # Dynamic status update if batch was PENDING and has inspections
    if batch.status == "PENDING" and total_inspected > 0:
        batch.status = "IN_INSPECTION"
        db.commit()

    return {
        "batch": batch,
        "total_inspected": total_inspected,
        "total_passed": total_passed,
        "total_failed": total_failed,
        "total_review": total_review,
        "pass_rate": pass_rate,
        "defect_rate": defect_rate,
        "defect_breakdown": defect_breakdown,
        "severity_breakdown": severity_breakdown,
        "region_breakdown": region_breakdown,
        "alerts_summary": alerts_summary,
        "inspections": inspections,
        "alerts": alerts,
        "corrective_actions": corrective_actions,
        "report_version": f"v1.{len(inspections)}",
        "generated_at": datetime.datetime.utcnow()
    }
