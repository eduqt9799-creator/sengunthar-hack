import datetime
from sqlalchemy.orm import Session
from models import Alert, Batch, Inspection, Detection, QualityRule, AuditLog

def check_and_trigger_alerts(
    db: Session,
    batch_id: int,
    inspection_id: int = None,
    product_id: int = None
) -> list:
    """
    Evaluates inspection events, defect frequencies, and batch defect rates.
    Generates structured smart alerts with deduplication and priority levels.
    """
    created_alerts = []
    batch = db.query(Batch).filter(Batch.id == batch_id).first()
    if not batch:
        return created_alerts

    inspections = db.query(Inspection).filter(Inspection.batch_id == batch_id).all()
    total_inspected = len(inspections)
    if total_inspected == 0:
        return created_alerts

    # 1. Critical Defect Alert for current inspection
    if inspection_id:
        current_insp = db.query(Inspection).filter(Inspection.id == inspection_id).first()
        if current_insp:
            crit_dets = [d for d in current_insp.detections if d.severity == "CRITICAL"]
            if crit_dets:
                for cd in crit_dets:
                    alert_code = f"ALT-CRIT-{batch.batch_id}-{current_insp.id}-{cd.id}"
                    existing = db.query(Alert).filter(Alert.alert_code == alert_code).first()
                    if not existing:
                        alert = Alert(
                            alert_code=alert_code,
                            batch_id=batch.id,
                            product_id=product_id or batch.product_id,
                            inspection_id=current_insp.id,
                            alert_type="CRITICAL_DEFECT",
                            priority="CRITICAL",
                            title=f"CRITICAL DEFECT: {cd.defect_name}",
                            message=f"Critical flaw '{cd.defect_name}' detected on item {current_insp.inspection_code} at {cd.image_region}. Immediate halt & verification required.",
                            defect_type=cd.defect_name,
                            defect_location=cd.image_region,
                            status="OPEN",
                            assigned_to="Quality Lead / Safety Manager",
                            triggered_at=datetime.datetime.utcnow()
                        )
                        db.add(alert)
                        created_alerts.append(alert)
                        # Optionally mark batch ON_HOLD
                        batch.status = "ON_HOLD"

            # Low Confidence Check
            if current_insp.status == "MANUAL_REVIEW" and current_insp.ai_confidence < 0.60:
                alert_code = f"ALT-LOWCONF-{batch.batch_id}-{current_insp.id}"
                existing = db.query(Alert).filter(Alert.alert_code == alert_code).first()
                if not existing:
                    alert = Alert(
                        alert_code=alert_code,
                        batch_id=batch.id,
                        product_id=product_id or batch.product_id,
                        inspection_id=current_insp.id,
                        alert_type="LOW_CONFIDENCE",
                        priority="MEDIUM",
                        title=f"Low Confidence AI Prediction ({int(current_insp.ai_confidence*100)}%)",
                        message=f"Inspection {current_insp.inspection_code} scored below confidence threshold. Physical manual inspection required.",
                        status="OPEN",
                        assigned_to="Line Inspector",
                        triggered_at=datetime.datetime.utcnow()
                    )
                    db.add(alert)
                    created_alerts.append(alert)

    # 2. Repeated Defect Analysis across batch
    defect_counts = {}
    for insp in inspections:
        for det in insp.detections:
            defect_counts[det.defect_name] = defect_counts.get(det.defect_name, 0) + 1

    for def_name, count in defect_counts.items():
        if count >= 3:
            alert_code = f"ALT-REPEAT-{batch.batch_id}-{def_name.replace(' ', '_')}"
            existing = db.query(Alert).filter(Alert.alert_code == alert_code).first()
            if not existing:
                alert = Alert(
                    alert_code=alert_code,
                    batch_id=batch.id,
                    product_id=batch.product_id,
                    alert_type="REPEATED_DEFECT",
                    priority="HIGH",
                    title=f"Repeated Issue: '{def_name}' (Count: {count})",
                    message=f"Defect '{def_name}' has occurred {count} times in batch {batch.batch_id}. Potential tooling wear or machine calibration failure.",
                    defect_type=def_name,
                    status="OPEN",
                    assigned_to="Tooling & Maintenance Supervisor",
                    triggered_at=datetime.datetime.utcnow()
                )
                db.add(alert)
                created_alerts.append(alert)

    # 3. High Defect Rate Alert
    failed_count = sum(1 for i in inspections if i.status == "FAILED")
    defect_rate = (failed_count / total_inspected) * 100.0 if total_inspected > 0 else 0
    rule = batch.product.quality_rules if batch.product else None
    threshold_rate = rule.max_defect_rate_percent if rule else 15.0

    if total_inspected >= 3 and defect_rate >= threshold_rate:
        alert_code = f"ALT-RATE-{batch.batch_id}"
        existing = db.query(Alert).filter(Alert.alert_code == alert_code).first()
        if not existing:
            alert = Alert(
                alert_code=alert_code,
                batch_id=batch.id,
                product_id=batch.product_id,
                alert_type="HIGH_DEFECT_RATE",
                priority="HIGH",
                title=f"Batch Defect Rate Threshold Exceeded ({round(defect_rate, 1)}%)",
                message=f"Defect rate in batch {batch.batch_id} reached {round(defect_rate, 1)}%, exceeding allowed threshold of {threshold_rate}%. Flagged for QA review.",
                status="OPEN",
                assigned_to="Quality Operations Director",
                triggered_at=datetime.datetime.utcnow()
            )
            db.add(alert)
            created_alerts.append(alert)

    if created_alerts:
        db.commit()
        for a in created_alerts:
            db.refresh(a)

    return created_alerts
