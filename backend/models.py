import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime,
    ForeignKey, Text, JSON, Enum
)
from sqlalchemy.orm import relationship
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), unique=True, index=True, nullable=False)
    full_name = Column(String(150), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    role = Column(String(50), default="quality_inspector") # quality_inspector, quality_manager, admin
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False, unique=True)
    category = Column(String(100), nullable=False) # Metal, Electronic, Plastic, Automotive, Textile
    code = Column(String(50), unique=True, nullable=False)
    description = Column(Text, nullable=True)
    regions = Column(JSON, default=list) # e.g. ["Top Surface", "Center Grid", "Bottom Flange", "Edge 1", "Mounting Hole"]
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    defect_classes = relationship("DefectClass", back_populates="product", cascade="all, delete-orphan")
    quality_rules = relationship("QualityRule", back_populates="product", uselist=False, cascade="all, delete-orphan")
    batches = relationship("Batch", back_populates="product")
    inspections = relationship("Inspection", back_populates="product")

class DefectClass(Base):
    __tablename__ = "defect_classes"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    name = Column(String(100), nullable=False)
    code = Column(String(50), nullable=False)
    description = Column(Text, nullable=True)
    default_severity = Column(String(20), default="MAJOR") # MINOR, MAJOR, CRITICAL
    permitted_limit = Column(Integer, default=0) # 0 means 0 allowed
    inspection_method = Column(String(100), default="Visual AI / Optical Camera")
    is_image_verifiable = Column(Boolean, default=True)

    product = relationship("Product", back_populates="defect_classes")

class QualityRule(Base):
    __tablename__ = "quality_rules"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), unique=True, nullable=False)
    max_minor_defects = Column(Integer, default=2)
    max_major_defects = Column(Integer, default=0)
    allow_critical = Column(Boolean, default=False)
    min_confidence_threshold = Column(Float, default=0.60)
    max_defect_rate_percent = Column(Float, default=15.0)
    auto_hold_on_critical = Column(Boolean, default=True)

    product = relationship("Product", back_populates="quality_rules")

class Batch(Base):
    __tablename__ = "batches"

    id = Column(Integer, primary_key=True, index=True)
    batch_id = Column(String(100), unique=True, index=True, nullable=False) # e.g. WG-MET-2026-001
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    batch_name = Column(String(200), nullable=False)
    quantity = Column(Integer, default=100)
    status = Column(String(50), default="IN_INSPECTION") # PENDING, IN_INSPECTION, COMPLETED, ON_HOLD, REJECTED, PASSED
    qr_code_path = Column(String(255), nullable=True)
    qr_payload = Column(String(500), nullable=True)
    production_date = Column(DateTime, default=datetime.datetime.utcnow)
    inspector_name = Column(String(100), default="Senior QA Inspector")
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    product = relationship("Product", back_populates="batches")
    inspections = relationship("Inspection", back_populates="batch", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="batch", cascade="all, delete-orphan")
    corrective_actions = relationship("CorrectiveAction", back_populates="batch", cascade="all, delete-orphan")
    report_versions = relationship("ReportVersion", back_populates="batch", cascade="all, delete-orphan")

class Inspection(Base):
    __tablename__ = "inspections"

    id = Column(Integer, primary_key=True, index=True)
    inspection_code = Column(String(100), unique=True, index=True, nullable=False) # e.g. INSP-MET-001-01
    batch_id = Column(Integer, ForeignKey("batches.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    item_serial = Column(String(100), nullable=True)
    image_path = Column(String(255), nullable=False)
    annotated_image_path = Column(String(255), nullable=True)
    ai_confidence = Column(Float, default=0.0)
    quality_score = Column(Float, default=100.0)
    status = Column(String(50), default="PASSED") # PASSED, FAILED, MANUAL_REVIEW, HOLD
    decision_reason = Column(Text, nullable=True)
    model_version = Column(String(50), default="YOLOv11-WeaveGuard-v1.0")
    inspected_at = Column(DateTime, default=datetime.datetime.utcnow)
    inspector_notes = Column(Text, nullable=True)
    feedback_status = Column(String(50), default="UNREVIEWED") # UNREVIEWED, CONFIRMED, OVERRIDDEN
    reviewed_by = Column(String(100), nullable=True)
    feedback_notes = Column(Text, nullable=True)

    batch = relationship("Batch", back_populates="inspections")
    product = relationship("Product", back_populates="inspections")
    detections = relationship("Detection", back_populates="inspection", cascade="all, delete-orphan")

class Detection(Base):
    __tablename__ = "detections"

    id = Column(Integer, primary_key=True, index=True)
    inspection_id = Column(Integer, ForeignKey("inspections.id"), nullable=False)
    defect_class_id = Column(Integer, ForeignKey("defect_classes.id"), nullable=True)
    defect_name = Column(String(100), nullable=False)
    confidence = Column(Float, nullable=False)
    bbox_x1 = Column(Float, nullable=False)
    bbox_y1 = Column(Float, nullable=False)
    bbox_x2 = Column(Float, nullable=False)
    bbox_y2 = Column(Float, nullable=False)
    image_region = Column(String(100), default="Surface Center")
    severity = Column(String(20), default="MAJOR") # MINOR, MAJOR, CRITICAL
    physical_approx_size_mm = Column(String(50), nullable=True)

    inspection = relationship("Inspection", back_populates="detections")

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    alert_code = Column(String(100), unique=True, index=True, nullable=False) # e.g. ALT-2026-001
    batch_id = Column(Integer, ForeignKey("batches.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=True)
    inspection_id = Column(Integer, ForeignKey("inspections.id"), nullable=True)
    alert_type = Column(String(50), nullable=False) # CRITICAL_DEFECT, REPEATED_DEFECT, HIGH_DEFECT_RATE, LOW_CONFIDENCE, INCOMPLETE_BATCH
    priority = Column(String(20), default="HIGH") # LOW, MEDIUM, HIGH, CRITICAL
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    defect_type = Column(String(100), nullable=True)
    defect_location = Column(String(100), nullable=True)
    status = Column(String(50), default="OPEN") # OPEN, ACKNOWLEDGED, IN_PROGRESS, RESOLVED
    assigned_to = Column(String(100), default="Quality Lead")
    triggered_at = Column(DateTime, default=datetime.datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)
    resolution_notes = Column(Text, nullable=True)

    batch = relationship("Batch", back_populates="alerts")
    corrective_actions = relationship("CorrectiveAction", back_populates="alert", cascade="all, delete-orphan")

class CorrectiveAction(Base):
    __tablename__ = "corrective_actions"

    id = Column(Integer, primary_key=True, index=True)
    action_code = Column(String(100), unique=True, index=True, nullable=False)
    alert_id = Column(Integer, ForeignKey("alerts.id"), nullable=False)
    batch_id = Column(Integer, ForeignKey("batches.id"), nullable=False)
    assigned_person = Column(String(100), nullable=False)
    root_cause_analysis = Column(Text, nullable=True)
    action_taken = Column(Text, nullable=False)
    status = Column(String(50), default="OPEN") # OPEN, PENDING_REINSPECTION, VERIFIED_CLOSED
    requires_reinspection = Column(Boolean, default=False)
    reinspection_notes = Column(Text, nullable=True)
    recorded_at = Column(DateTime, default=datetime.datetime.utcnow)
    closed_at = Column(DateTime, nullable=True)

    alert = relationship("Alert", back_populates="corrective_actions")
    batch = relationship("Batch", back_populates="corrective_actions")

class ReportVersion(Base):
    __tablename__ = "report_versions"

    id = Column(Integer, primary_key=True, index=True)
    batch_id = Column(Integer, ForeignKey("batches.id"), nullable=False)
    report_version = Column(String(50), default="v1.0")
    generated_at = Column(DateTime, default=datetime.datetime.utcnow)
    pdf_path = Column(String(255), nullable=True)
    excel_path = Column(String(255), nullable=True)
    reviewer_name = Column(String(100), default="Automated QA System")
    summary_data = Column(JSON, default=dict)

    batch = relationship("Batch", back_populates="report_versions")

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    entity_type = Column(String(50), nullable=False) # BATCH, INSPECTION, ALERT, PRODUCT
    entity_id = Column(String(100), nullable=False)
    action = Column(String(100), nullable=False) # CREATED, INSPECTED, ALERT_TRIGGERED, RESOLVED, OVERRIDDEN
    performed_by = Column(String(100), default="System")
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    details = Column(JSON, default=dict)
