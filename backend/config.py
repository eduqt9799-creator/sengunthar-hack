import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
UPLOAD_DIR = BASE_DIR / "uploads"
INSPECTION_DIR = UPLOAD_DIR / "inspections"
ANNOTATED_DIR = UPLOAD_DIR / "annotated"
QR_DIR = UPLOAD_DIR / "qrcodes"
REPORT_DIR = BASE_DIR / "reports"
MODELS_DIR = BASE_DIR / "models"

# Ensure all working directories exist
for path in [UPLOAD_DIR, INSPECTION_DIR, ANNOTATED_DIR, QR_DIR, REPORT_DIR, MODELS_DIR]:
    path.mkdir(parents=True, exist_ok=True)

DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR / 'weaveguard.db'}")
FRONTEND_BASE_URL = os.getenv("FRONTEND_BASE_URL", "http://localhost:5173")
API_PREFIX = "/api"
MODEL_PATH = MODELS_DIR / "best.pt"
