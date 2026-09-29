from typing import List, Dict, Any, Tuple
from models import QualityRule, DefectClass

def evaluate_inspection_quality(
    detections: List[Dict[str, Any]],
    quality_rules: QualityRule = None,
    overall_confidence: float = 0.95
) -> Tuple[str, float, str]:
    """
    Evaluates product inspection results based on configurable quality rules.
    Returns:
        (status, quality_score, decision_reason)
        status in: ["PASSED", "FAILED", "MANUAL_REVIEW"]
        quality_score: 0.0 - 100.0
    """
    # Default rule parameters if not configured
    max_minor = quality_rules.max_minor_defects if quality_rules else 2
    max_major = quality_rules.max_major_defects if quality_rules else 0
    allow_critical = quality_rules.allow_critical if quality_rules else False
    min_confidence = quality_rules.min_confidence_threshold if quality_rules else 0.60

    # Low AI confidence check triggers manual inspection review
    if overall_confidence < min_confidence and detections:
        return (
            "MANUAL_REVIEW",
            65.0,
            f"Low AI confidence ({int(overall_confidence*100)}% < required {int(min_confidence*100)}%). Inspector manual verification required."
        )

    if not detections:
        return (
            "PASSED",
            100.0,
            "Zero defects identified. Flawless surface geometry and assembly verified."
        )

    # Count defect severities
    minor_count = sum(1 for d in detections if d.get("severity") == "MINOR")
    major_count = sum(1 for d in detections if d.get("severity") == "MAJOR")
    critical_count = sum(1 for d in detections if d.get("severity") == "CRITICAL")

    # Critical defect evaluation
    if critical_count > 0 and not allow_critical:
        critical_names = ", ".join(d["defect_name"] for d in detections if d.get("severity") == "CRITICAL")
        return (
            "FAILED",
            max(10.0, 100.0 - (critical_count * 40 + major_count * 20 + minor_count * 5)),
            f"Critical defect detected: [{critical_names}]. Immediate rejection per safety and quality protocol."
        )

    # Major defect evaluation
    if major_count > max_major:
        major_names = ", ".join(d["defect_name"] for d in detections if d.get("severity") == "MAJOR")
        return (
            "FAILED",
            max(20.0, 100.0 - (major_count * 25 + minor_count * 5)),
            f"Major defect limit exceeded ({major_count} detected > {max_major} allowed): [{major_names}]."
        )

    # Minor defect evaluation
    if minor_count > max_minor:
        return (
            "FAILED",
            max(45.0, 100.0 - (minor_count * 12)),
            f"Minor defect limit exceeded ({minor_count} detected > {max_minor} allowed)."
        )

    # Minor defects within acceptable tolerance
    score = round(100.0 - (minor_count * 6.0), 1)
    return (
        "PASSED",
        score,
        f"Minor defect within permitted tolerance ({minor_count}/{max_minor} allowed). Product approved with quality grade score {score}%."
    )
