from typing import List, Optional, Any, Dict
from pydantic import BaseModel, Field
import datetime

class DefectClassBase(BaseModel):
    name: str
    code: str
    description: Optional[str] = None
    default_severity: str = "MAJOR"
    permitted_limit: int = 0
    inspection_method: str = "Visual AI / Optical Camera"
    is_image_verifiable: bool = True

class DefectClassCreate(DefectClassBase):
    pass

class DefectClassOut(DefectClassBase):
    id: int
    product_id: int

    class Config:
        from_attributes = True

class QualityRuleBase(BaseModel):
    max_minor_defects: int = 2
    max_major_defects: int = 0
    allow_critical: bool = False
    min_confidence_threshold: float = 0.60
    max_defect_rate_percent: float = 15.0
    auto_hold_on_critical: bool = True

class QualityRuleCreate(QualityRuleBase):
    pass

class QualityRuleOut(QualityRuleBase):
    id: int
    product_id: int

    class Config:
        from_attributes = True

class ProductBase(BaseModel):
    name: str
    category: str
    code: str
    description: Optional[str] = None
    regions: List[str] = []

class ProductCreate(ProductBase):
    defect_classes: Optional[List[DefectClassCreate]] = None
    quality_rules: Optional[QualityRuleCreate] = None

class ProductOut(ProductBase):
    id: int
    created_at: datetime.datetime
    defect_classes: List[DefectClassOut] = []
    quality_rules: Optional[QualityRuleOut] = None

    class Config:
        from_attributes = True

class BatchCreate(BaseModel):
    product_id: int
    batch_name: str
    quantity: int = 100
    inspector_name: Optional[str] = "Senior QA Inspector"
    notes: Optional[str] = None

class BatchOut(BaseModel):
    id: int
    batch_id: str
    product_id: int
    batch_name: str
    quantity: int
    status: str
    qr_code_path: Optional[str] = None
    qr_payload: Optional[str] = None
    production_date: datetime.datetime
    inspector_name: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime.datetime
    updated_at: Optional[datetime.datetime] = None
    product: Optional[ProductOut] = None

    class Config:
        from_attributes = True

class DetectionOut(BaseModel):
    id: Optional[int] = None
    defect_name: str
    confidence: float
    bbox_x1: float
    bbox_y1: float
    bbox_x2: float
    bbox_y2: float
    image_region: str
    severity: str
    physical_approx_size_mm: Optional[str] = None

    class Config:
        from_attributes = True

class InspectionOut(BaseModel):
    id: int
    inspection_code: str
    batch_id: int
    product_id: int
    item_serial: Optional[str] = None
    image_path: str
    annotated_image_path: Optional[str] = None
    ai_confidence: float
    quality_score: float
    status: str
    decision_reason: Optional[str] = None
    model_version: str
    inspected_at: datetime.datetime
    inspector_notes: Optional[str] = None
    feedback_status: str
    reviewed_by: Optional[str] = None
    feedback_notes: Optional[str] = None
    detections: List[DetectionOut] = []

    class Config:
        from_attributes = True

class AlertOut(BaseModel):
    id: int
    alert_code: str
    batch_id: int
    product_id: Optional[int] = None
    inspection_id: Optional[int] = None
    alert_type: str
    priority: str
    title: str
    message: str
    defect_type: Optional[str] = None
    defect_location: Optional[str] = None
    status: str
    assigned_to: Optional[str] = None
    triggered_at: datetime.datetime
    resolved_at: Optional[datetime.datetime] = None
    resolution_notes: Optional[str] = None

    class Config:
        from_attributes = True

class AlertUpdate(BaseModel):
    status: Optional[str] = None
    assigned_to: Optional[str] = None
    resolution_notes: Optional[str] = None

class CorrectiveActionCreate(BaseModel):
    assigned_person: str
    root_cause_analysis: Optional[str] = None
    action_taken: str
    requires_reinspection: bool = False
    reinspection_notes: Optional[str] = None

class CorrectiveActionOut(BaseModel):
    id: int
    action_code: str
    alert_id: int
    batch_id: int
    assigned_person: str
    root_cause_analysis: Optional[str] = None
    action_taken: str
    status: str
    requires_reinspection: bool
    reinspection_notes: Optional[str] = None
    recorded_at: datetime.datetime
    closed_at: Optional[datetime.datetime] = None

    class Config:
        from_attributes = True

class FeedbackSubmit(BaseModel):
    feedback_status: str # CONFIRMED, OVERRIDDEN
    reviewed_by: str
    feedback_notes: Optional[str] = None
    override_status: Optional[str] = None # If changing decision from FAILED to PASSED or vice versa

class BatchSummaryReport(BaseModel):
    batch: BatchOut
    total_inspected: int
    total_passed: int
    total_failed: int
    total_review: int
    pass_rate: float
    defect_rate: float
    defect_breakdown: Dict[str, int]
    severity_breakdown: Dict[str, int]
    region_breakdown: Dict[str, int]
    alerts_summary: Dict[str, int]
    inspections: List[InspectionOut]
    alerts: List[AlertOut]
    corrective_actions: List[CorrectiveActionOut]
    report_version: str
    generated_at: datetime.datetime
