# WeaveGuard AI — Multi-Product AI Quality Inspection & Traceability Platform

WeaveGuard AI is an industrial-grade quality intelligence platform engineered to detect and localize manufacturing defects, enforce multi-tier quality acceptance criteria, generate unique Batch QR codes for digital traceability, trigger smart escalation alerts, and export PDF/Excel compliance certificates.

---

## 🌟 Key Capabilities

1. **Multi-Product Quality Standards**: Pre-configured & customizable quality definitions for **Metal components**, **Electronic PCB/SMD**, **Technical Weaving Fabrics**, **Automotive Castings**, and **Injection-Molded Plastics**.
2. **AI Defect Detection & Localization**: Exact visual bounding box identification (`[x1, y1, x2, y2]`), defect classification, confidence scoring, and spatial region mapping (e.g., *Center Flange*, *Top Selvedge*, *MCU Grid*).
3. **Quality Decision Engine**: Product-specific acceptance matrices evaluating Defect Severity (*Minor*, *Major*, *Critical*), allowed tolerance thresholds, and calculating a composite 0–100 Quality Score to output `PASSED`, `FAILED`, or `MANUAL_REVIEW`.
4. **Batch QR Code Traceability**: Auto-generates unique Batch IDs (e.g., `WG-MET-2026-001`) and branded, high-resolution QR codes linking to digital quality reports.
5. **Smart Alerts & CAPA Engine**: Automated notifications for critical defects, repeated defect patterns (tooling wear), and excessive defect rates (>15%), with 5-Why root cause analysis logging and re-inspection verification.
6. **Executive PDF & Excel Reporting**: One-click generation of styled ReportLab PDF compliance certificates and multi-sheet openpyxl Excel workbooks.
7. **Interactive Validation Checklist**: Built-in 15-point roadmap verification checklist with celebration confetti.

---

## 🏗️ Technology Architecture

| Layer | Technology | Function |
|---|---|---|
| **Frontend** | React 19 + Vite | High-performance SPA with modern dark industrial aesthetics |
| **Styling** | Tailwind CSS v4 | Glassmorphism, glow effects, responsive UI |
| **Icons & Charts** | Lucide React + Recharts | Real-time analytics, Pareto & severity donut charts |
| **Backend** | Python + FastAPI | High-throughput REST API with automatic docs (`/docs`) |
| **Vision Inference** | YOLOv11 / OpenCV / PIL | Bounding box detection, spatial mapping, annotated overlays |
| **Database** | SQLAlchemy + SQLite / PostgreSQL | Multi-tenant schema for products, batches, inspections & alerts |
| **Reporting** | ReportLab + openpyxl | Formatted PDF compliance certificates and Excel logs |
| **QR Code Engine** | Python `qrcode[pil]` | Vector/raster QR generation with batch metadata stamps |

---

## 🚀 Getting Started

### 1. Backend Setup

```powershell
cd backend
python -m pip install -r requirements.txt
python seed_data.py
python -m uvicorn main:app --host 127.0.0.1 --port 8001 --reload
```

* Backend API runs on: `http://localhost:8001`
* Interactive API Documentation (Swagger): `http://localhost:8001/docs`

### 2. Frontend Setup

```powershell
cd frontend
npm install
npm run dev
```

* Frontend Application runs on: `http://localhost:5173`

---

## 📱 Application Modules

- **01. Dashboard** (`/`): Overview metrics, defect severity distribution, defect frequencies, active batches.
- **02. Product Management** (`/products`): Define products, spatial geometry zones, defect classes, and quality acceptance rules.
- **03. Batch Management** (`/batches`): Create production lots, auto-generate Batch IDs, and preview/print QR labels.
- **04. New Inspection** (`/inspect`): Upload images or capture frames via live camera feed, run AI detection, inspect bounding boxes, and submit inspector feedback.
- **06. Batch Quality Report** (`/batches/:batchId`): View live digital certificates, inspection galleries, download PDF and Excel reports.
- **07. Alerts Center** (`/alerts`): Manage open alerts, assign responsible engineers, and record CAPA root causes.
- **08. Quality Analytics** (`/analytics`): Cross-batch comparisons, spatial defect heatmaps, Pareto frequency analysis, and immutable audit trails.
- **09. Corrective Actions** (`/corrective-actions`): Track CAPA records and schedule serial re-inspections.
- **10. QR / Batch Search** (`/scan`): Optical camera QR scanner and instant Batch ID lookup.

---

## ✅ Product Validation Matrix (15/15 Complete)

- [x] 1. Create a product and configure its defect classes
- [x] 2. Create a batch and generate a unique QR code
- [x] 3. Inspect an image and show the detected defect region
- [x] 4. Show the correct defect type and confidence score
- [x] 5. Apply severity rules and produce a product decision
- [x] 6. Link every inspection to the correct Batch ID
- [x] 7. Generate a batch report with accurate totals
- [x] 8. Scan the QR code and retrieve the correct report
- [x] 9. Search for a batch manually by Batch ID
- [x] 10. Trigger a critical-defect alert
- [x] 11. Trigger a repeated-defect or high-defect-rate alert
- [x] 12. Send low-confidence cases for manual review
- [x] 13. Download and verify PDF and Excel reports
- [x] 14. Record corrective actions and re-inspection
- [x] 15. Verify user permissions and audit history
