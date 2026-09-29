import os
import datetime
import random
from PIL import Image, ImageDraw
from sqlalchemy.orm import Session
from database import Base, engine, SessionLocal
from models import (
    User, Product, DefectClass, QualityRule, Batch,
    Inspection, Detection, Alert, CorrectiveAction, AuditLog
)
from config import INSPECTION_DIR, ANNOTATED_DIR
from qr_service import generate_batch_qr
from detector import run_ai_defect_detection
from quality import evaluate_inspection_quality

def create_sample_part_image(filename: str, category: str, defect_type: str = None) -> str:
    """Creates a stylized industrial part image for seeding."""
    img = Image.new("RGB", (640, 480), color="#1E293B")
    draw = ImageDraw.Draw(img)

    if category == "Metal":
        # Draw metal bracket
        draw.rounded_rectangle([(80, 80), (560, 400)], radius=24, fill="#475569", outline="#94A3B8", width=4)
        draw.ellipse([(140, 140), (220, 220)], fill="#0F172A", outline="#64748B", width=3)
        draw.ellipse([(420, 140), (500, 220)], fill="#0F172A", outline="#64748B", width=3)
        draw.rectangle([(220, 260), (420, 340)], fill="#334155", outline="#64748B", width=2)
        if defect_type == "Crack":
            draw.line([(320, 100), (360, 180), (350, 240)], fill="#DC2626", width=4)
        elif defect_type == "Surface Scratch":
            draw.line([(180, 280), (320, 320)], fill="#E2E8F0", width=2)
    elif category == "Electronic":
        # Draw PCB board
        draw.rectangle([(60, 60), (580, 420)], fill="#064E3B", outline="#10B981", width=4)
        # Copper traces
        for y in range(100, 400, 40):
            draw.line([(100, y), (540, y)], fill="#D97706", width=2)
        # IC Chips
        draw.rectangle([(220, 160), (420, 320)], fill="#1E293B", outline="#94A3B8", width=2)
        draw.text((260, 230), "MCU-ARM32", fill="#F8FAFC")
        if defect_type == "Solder Bridge":
            draw.ellipse([(200, 240), (240, 270)], fill="#CBD5E1")
    elif category == "Textile":
        # Draw woven fabric pattern
        draw.rectangle([(40, 40), (600, 440)], fill="#1E1B4B", outline="#4338CA", width=3)
        for i in range(50, 600, 25):
            draw.line([(i, 40), (i, 440)], fill="#3730A3", width=2)
        for j in range(50, 440, 25):
            draw.line([(40, j), (600, j)], fill="#312E81", width=2)
        if defect_type == "Fabric Tear":
            draw.polygon([(260, 200), (340, 180), (380, 280), (280, 310)], fill="#020617")
    else:
        # Generic Automotive / Plastic part
        draw.rounded_rectangle([(100, 70), (540, 410)], radius=30, fill="#374151", outline="#9CA3AF", width=3)
        draw.ellipse([(260, 180), (380, 300)], fill="#111827", outline="#6B7280", width=3)

    filepath = INSPECTION_DIR / filename
    img.save(filepath, "JPEG", quality=90)
    return f"/uploads/inspections/{filename}"

def seed_database(db: Session):
    # Ensure tables exist
    Base.metadata.create_all(bind=engine)

    # Check if already seeded
    if db.query(Product).count() > 0:
        print("[Seed] Database already initialized with products.")
        return

    print("[Seed] Populating initial products, defect classes, quality rules and batches...")

    # 1. Products definition
    products_data = [
        {
            "name": "Precision CNC Aluminum Bracket",
            "category": "Metal",
            "code": "MET-ALU-01",
            "description": "Aircraft-grade 6061-T6 aluminum mounting bracket for robotic automation arms.",
            "regions": ["Top Surface", "Center Flange", "Bottom Mounting Flange", "Left Bore", "Right Bore", "Edge Seams"],
            "defect_classes": [
                {"name": "Surface Scratch", "code": "MET-SCRATCH", "default_severity": "MINOR", "permitted_limit": 2, "description": "Shallow cosmetic surface abrasive mark"},
                {"name": "Stress Crack", "code": "MET-CRACK", "default_severity": "CRITICAL", "permitted_limit": 0, "description": "Structural micro-fracture or fissure"},
                {"name": "Dent / Impact Defect", "code": "MET-DENT", "default_severity": "MAJOR", "permitted_limit": 0, "description": "Mechanical deformation exceeding 0.5mm"},
                {"name": "Missing Mounting Hole", "code": "MET-MISSHOLE", "default_severity": "CRITICAL", "permitted_limit": 0, "description": "Omission in machining cycle"},
                {"name": "Machining Burr", "code": "MET-BURR", "default_severity": "MINOR", "permitted_limit": 1, "description": "Residual sharp edge along contour"}
            ],
            "quality_rules": {
                "max_minor_defects": 2,
                "max_major_defects": 0,
                "allow_critical": False,
                "min_confidence_threshold": 0.65,
                "max_defect_rate_percent": 12.0,
                "auto_hold_on_critical": True
            }
        },
        {
            "name": "Industrial IoT Controller PCB",
            "category": "Electronic",
            "code": "ELEC-PCB-04",
            "description": "Multi-layer FR4 PCB with surface-mount components, MCU and power regulating circuits.",
            "regions": ["MCU Core Grid", "Power Rail Section", "SMD Resistor Array", "Terminal Block Pins", "Edge Connectors"],
            "defect_classes": [
                {"name": "Solder Bridge", "code": "PCB-BRIDGE", "default_severity": "CRITICAL", "permitted_limit": 0, "description": "Unintended conductive bridge across IC pins"},
                {"name": "Missing SMD Resistor", "code": "PCB-MISS-SMD", "default_severity": "CRITICAL", "permitted_limit": 0, "description": "Missing passives on footprint"},
                {"name": "Component Misalignment", "code": "PCB-MISALIGN", "default_severity": "MAJOR", "permitted_limit": 0, "description": "Angular tilt > 15 deg"},
                {"name": "Damaged PCB Trace", "code": "PCB-TRACE", "default_severity": "CRITICAL", "permitted_limit": 0, "description": "Scratched or severed copper track"},
                {"name": "Solder Void", "code": "PCB-VOID", "default_severity": "MINOR", "permitted_limit": 1, "description": "Micro-gas pocket in solder joint"}
            ],
            "quality_rules": {
                "max_minor_defects": 1,
                "max_major_defects": 0,
                "allow_critical": False,
                "min_confidence_threshold": 0.70,
                "max_defect_rate_percent": 8.0,
                "auto_hold_on_critical": True
            }
        },
        {
            "name": "High-Tenacity Technical Weave Fabric",
            "category": "Textile",
            "code": "TEX-FAB-10",
            "description": "Ballistic grade nylon woven textile roll for protective tactical gear and conveyor belts.",
            "regions": ["Top Selvedge", "Central Weave Body", "Bottom Selvedge", "Left Edge", "Right Edge"],
            "defect_classes": [
                {"name": "Weave Misalignment", "code": "TEX-MISALIGN", "default_severity": "MAJOR", "permitted_limit": 0, "description": "Distorted warp or weft thread spacing"},
                {"name": "Yarn Knot", "code": "TEX-KNOT", "default_severity": "MINOR", "permitted_limit": 3, "description": "Spun slub or tie knot in yarn"},
                {"name": "Color Bleed / Stain", "code": "TEX-STAIN", "default_severity": "MAJOR", "permitted_limit": 0, "description": "Oil residue or dye smear"},
                {"name": "Fabric Tear / Hole", "code": "TEX-TEAR", "default_severity": "CRITICAL", "permitted_limit": 0, "description": "Rupture in textile weave matrix"}
            ],
            "quality_rules": {
                "max_minor_defects": 3,
                "max_major_defects": 0,
                "allow_critical": False,
                "min_confidence_threshold": 0.60,
                "max_defect_rate_percent": 15.0,
                "auto_hold_on_critical": True
            }
        },
        {
            "name": "Automotive Transmission Gear Casing",
            "category": "Automotive",
            "code": "AUTO-CAS-88",
            "description": "Die-cast magnesium alloy gearbox housing casing with precision bore alignment.",
            "regions": ["Shaft Bore #1", "Shaft Bore #2", "Mating Flange", "Outer Ribs", "Oil Sump Port"],
            "defect_classes": [
                {"name": "Surface Deformation", "code": "AUTO-DEFORM", "default_severity": "CRITICAL", "permitted_limit": 0, "description": "Casting shrinkage or contour deviation"},
                {"name": "Missing Fastener Stud", "code": "AUTO-STUD", "default_severity": "CRITICAL", "permitted_limit": 0, "description": "Omitted threaded stud"},
                {"name": "Flange Porosity", "code": "AUTO-POROSITY", "default_severity": "MAJOR", "permitted_limit": 0, "description": "Gas entrapment porosity on sealing face"}
            ],
            "quality_rules": {
                "max_minor_defects": 1,
                "max_major_defects": 0,
                "allow_critical": False,
                "min_confidence_threshold": 0.65,
                "max_defect_rate_percent": 10.0,
                "auto_hold_on_critical": True
            }
        },
        {
            "name": "Polymer Enclosure Housing",
            "category": "Plastic",
            "code": "PLAS-ENC-02",
            "description": "Injection molded ABS flame-retardant electrical housing case.",
            "regions": ["Front Bezel", "Snap Latch Left", "Snap Latch Right", "Internal Ribs", "Cable Gland Port"],
            "defect_classes": [
                {"name": "Flash / Excess Rim", "code": "PLAS-FLASH", "default_severity": "MINOR", "permitted_limit": 2, "description": "Thin plastic film at parting line"},
                {"name": "Sink Mark", "code": "PLAS-SINK", "default_severity": "MAJOR", "permitted_limit": 0, "description": "Surface depression over thick ribs"},
                {"name": "Short Shot", "code": "PLAS-SHORTSHOT", "default_severity": "CRITICAL", "permitted_limit": 0, "description": "Incomplete mold filling"}
            ],
            "quality_rules": {
                "max_minor_defects": 2,
                "max_major_defects": 0,
                "allow_critical": False,
                "min_confidence_threshold": 0.60,
                "max_defect_rate_percent": 12.0,
                "auto_hold_on_critical": True
            }
        }
    ]

    product_models = []
    for p_info in products_data:
        p = Product(
            name=p_info["name"],
            category=p_info["category"],
            code=p_info["code"],
            description=p_info["description"],
            regions=p_info["regions"],
            created_at=datetime.datetime.utcnow() - datetime.timedelta(days=15)
        )
        db.add(p)
        db.flush()

        # Defect classes
        for dc_info in p_info["defect_classes"]:
            dc = DefectClass(
                product_id=p.id,
                name=dc_info["name"],
                code=dc_info["code"],
                default_severity=dc_info["default_severity"],
                permitted_limit=dc_info["permitted_limit"],
                description=dc_info["description"],
                inspection_method="Visual AI / Optical Camera",
                is_image_verifiable=True
            )
            db.add(dc)

        # Quality rule
        qr_info = p_info["quality_rules"]
        qrule = QualityRule(
            product_id=p.id,
            max_minor_defects=qr_info["max_minor_defects"],
            max_major_defects=qr_info["max_major_defects"],
            allow_critical=qr_info["allow_critical"],
            min_confidence_threshold=qr_info["min_confidence_threshold"],
            max_defect_rate_percent=qr_info["max_defect_rate_percent"],
            auto_hold_on_critical=qr_info["auto_hold_on_critical"]
        )
        db.add(qrule)
        product_models.append(p)

    db.commit()

    # 2. Seed Sample Batches
    batch_seeds = [
        {
            "batch_id": "WG-MET-2026-001",
            "product_index": 0,
            "batch_name": "Shift-A Aerospace Bracket Run #001",
            "quantity": 150,
            "status": "IN_INSPECTION",
            "inspector_name": "R. Sharma (Senior QA)",
            "notes": "High precision batch for Tier-1 robotics client. Strict crack tolerance.",
            "days_ago": 2
        },
        {
            "batch_id": "WG-PCB-2026-002",
            "product_index": 1,
            "batch_name": "IoT Controller SMD Assembly Run #04",
            "quantity": 500,
            "status": "COMPLETED",
            "inspector_name": "A. Chen (SMT Lead)",
            "notes": "Passed line inspection with zero solder bridging.",
            "days_ago": 5
        },
        {
            "batch_id": "WG-TEX-2026-003",
            "product_index": 2,
            "batch_name": "Ballistic Weave Nylon Lot #103",
            "quantity": 250,
            "status": "ON_HOLD",
            "inspector_name": "M. Patel (Textile Inspector)",
            "notes": "Held due to recurring yarn knot cluster on loom #4.",
            "days_ago": 1
        }
    ]

    seeded_batches = []
    for b_data in batch_seeds:
        prod = product_models[b_data["product_index"]]
        qr_path = generate_batch_qr(b_data["batch_id"], b_data["batch_name"])
        batch = Batch(
            batch_id=b_data["batch_id"],
            product_id=prod.id,
            batch_name=b_data["batch_name"],
            quantity=b_data["quantity"],
            status=b_data["status"],
            qr_code_path=qr_path,
            qr_payload=f"http://localhost:5173/batches/{b_data['batch_id']}",
            production_date=datetime.datetime.utcnow() - datetime.timedelta(days=b_data["days_ago"]),
            inspector_name=b_data["inspector_name"],
            notes=b_data["notes"],
            created_at=datetime.datetime.utcnow() - datetime.timedelta(days=b_data["days_ago"])
        )
        db.add(batch)
        db.flush()
        seeded_batches.append((batch, prod))

    db.commit()

    # 3. Seed Realistic Inspections for WG-MET-2026-001
    batch_met, prod_met = seeded_batches[0]
    
    # Inspection 1: Passed (Perfect)
    img_path1 = create_sample_part_image("insp_met_01.jpg", "Metal", None)
    insp1 = Inspection(
        inspection_code=f"INSP-{batch_met.batch_id}-001",
        batch_id=batch_met.id,
        product_id=prod_met.id,
        item_serial="SN-MET-9011",
        image_path=img_path1,
        annotated_image_path=img_path1,
        ai_confidence=0.98,
        quality_score=100.0,
        status="PASSED",
        decision_reason="Zero defects identified. Flawless surface geometry and assembly verified.",
        model_version="WeaveGuard-Vision-v1.4",
        inspected_at=datetime.datetime.utcnow() - datetime.timedelta(hours=28),
        feedback_status="CONFIRMED",
        reviewed_by="R. Sharma"
    )
    db.add(insp1)

    # Inspection 2: Passed with 1 minor scratch
    img_path2 = create_sample_part_image("insp_met_02.jpg", "Metal", "Surface Scratch")
    full_path2 = INSPECTION_DIR / "insp_met_02.jpg"
    det_res2 = run_ai_defect_detection(str(full_path2), prod_met.category, prod_met.regions)
    insp2 = Inspection(
        inspection_code=f"INSP-{batch_met.batch_id}-002",
        batch_id=batch_met.id,
        product_id=prod_met.id,
        item_serial="SN-MET-9012",
        image_path=img_path2,
        annotated_image_path=det_res2["annotated_image_path"],
        ai_confidence=0.94,
        quality_score=94.0,
        status="PASSED",
        decision_reason="Minor defect within permitted tolerance (1/2 allowed). Product approved.",
        model_version="WeaveGuard-Vision-v1.4",
        inspected_at=datetime.datetime.utcnow() - datetime.timedelta(hours=22)
    )
    db.add(insp2)
    db.flush()

    for d in det_res2["detections"][:1]:
        det = Detection(
            inspection_id=insp2.id,
            defect_name="Surface Scratch",
            confidence=0.94,
            bbox_x1=d["bbox_x1"],
            bbox_y1=d["bbox_y1"],
            bbox_x2=d["bbox_x2"],
            bbox_y2=d["bbox_y2"],
            image_region="Top Surface",
            severity="MINOR",
            physical_approx_size_mm="8.2 x 2.1 mm"
        )
        db.add(det)

    # Inspection 3: Failed with Critical Crack
    img_path3 = create_sample_part_image("insp_met_03.jpg", "Metal", "Crack")
    full_path3 = INSPECTION_DIR / "insp_met_03.jpg"
    det_res3 = run_ai_defect_detection(str(full_path3), prod_met.category, prod_met.regions)
    insp3 = Inspection(
        inspection_code=f"INSP-{batch_met.batch_id}-003",
        batch_id=batch_met.id,
        product_id=prod_met.id,
        item_serial="SN-MET-9013",
        image_path=img_path3,
        annotated_image_path=det_res3["annotated_image_path"],
        ai_confidence=0.97,
        quality_score=20.0,
        status="FAILED",
        decision_reason="Critical defect detected: [Stress Crack]. Immediate rejection per safety and quality protocol.",
        model_version="WeaveGuard-Vision-v1.4",
        inspected_at=datetime.datetime.utcnow() - datetime.timedelta(hours=14)
    )
    db.add(insp3)
    db.flush()

    for d in det_res3["detections"]:
        det = Detection(
            inspection_id=insp3.id,
            defect_name="Stress Crack",
            confidence=0.97,
            bbox_x1=d["bbox_x1"],
            bbox_y1=d["bbox_y1"],
            bbox_x2=d["bbox_x2"],
            bbox_y2=d["bbox_y2"],
            image_region="Center Flange",
            severity="CRITICAL",
            physical_approx_size_mm="14.5 x 3.2 mm"
        )
        db.add(det)

    # Inspection 4: Manual Review
    img_path4 = create_sample_part_image("insp_met_04.jpg", "Metal", None)
    insp4 = Inspection(
        inspection_code=f"INSP-{batch_met.batch_id}-004",
        batch_id=batch_met.id,
        product_id=prod_met.id,
        item_serial="SN-MET-9014",
        image_path=img_path4,
        annotated_image_path=img_path4,
        ai_confidence=0.58,
        quality_score=65.0,
        status="MANUAL_REVIEW",
        decision_reason="Low AI confidence (58% < required 65%). Inspector manual verification required.",
        model_version="WeaveGuard-Vision-v1.4",
        inspected_at=datetime.datetime.utcnow() - datetime.timedelta(hours=6)
    )
    db.add(insp4)

    db.commit()

    # 4. Seed Alert for Critical Defect
    alert1 = Alert(
        alert_code=f"ALT-CRIT-{batch_met.batch_id}-001",
        batch_id=batch_met.id,
        product_id=prod_met.id,
        inspection_id=insp3.id,
        alert_type="CRITICAL_DEFECT",
        priority="CRITICAL",
        title="CRITICAL DEFECT: Stress Crack",
        message=f"Critical flaw 'Stress Crack' detected on item {insp3.inspection_code} at Center Flange. Batch placed on hold.",
        defect_type="Stress Crack",
        defect_location="Center Flange",
        status="IN_PROGRESS",
        assigned_to="Quality Lead / Safety Manager",
        triggered_at=datetime.datetime.utcnow() - datetime.timedelta(hours=14)
    )
    db.add(alert1)
    db.flush()

    # 5. Seed Corrective Action for Alert 1
    ca1 = CorrectiveAction(
        action_code=f"CA-ACT-{batch_met.batch_id}-01",
        alert_id=alert1.id,
        batch_id=batch_met.id,
        assigned_person="Dr. M. Weber (Materials Metallurgist)",
        root_cause_analysis="Rapid cooling cycle during quenching caused localized thermal stress gradient on flange section.",
        action_taken="Adjusted furnace cool-down ramp timer by +15 minutes. Segregated 10 adjacent serial units for non-destructive eddy current testing.",
        status="PENDING_REINSPECTION",
        requires_reinspection=True,
        reinspection_notes="Re-inspect serials 9010 through 9020 after annealing cycle.",
        recorded_at=datetime.datetime.utcnow() - datetime.timedelta(hours=8)
    )
    db.add(ca1)

    # 6. Seed Audit Log
    audit = AuditLog(
        entity_type="BATCH",
        entity_id=batch_met.batch_id,
        action="BATCH_INITIALIZED",
        performed_by="System Admin",
        timestamp=datetime.datetime.utcnow() - datetime.timedelta(days=2),
        details={"quantity": batch_met.quantity, "product": prod_met.name}
    )
    db.add(audit)

    db.commit()
    print("[Seed] Seed data successfully generated!")

if __name__ == "__main__":
    db = SessionLocal()
    seed_database(db)
    db.close()
