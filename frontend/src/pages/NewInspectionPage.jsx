import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  ScanEye,
  Camera,
  UploadCloud,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCheck,
  Edit3
} from 'lucide-react';
import ImageUploader from '../components/ImageUploader';
import CameraCapture from '../components/CameraCapture';
import DetectionOverlay from '../components/DetectionOverlay';
import { BatchService, InspectionService } from '../services/api';

export default function NewInspectionPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialBatchId = searchParams.get('batch') || '';

  const [batches, setBatches] = useState([]);
  const [selectedBatchId, setSelectedBatchId] = useState(initialBatchId);
  const [inputMode, setInputMode] = useState('upload'); // 'upload' | 'camera'
  const [selectedImage, setSelectedImage] = useState(null);
  const [itemSerial, setItemSerial] = useState('');
  const [inspectorNotes, setInspectorNotes] = useState('');

  const [isInspecting, setIsInspecting] = useState(false);
  const [inspectionResult, setInspectionResult] = useState(null);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  useEffect(() => {
    BatchService.getAll().then((res) => {
      setBatches(res.data);
      if (!selectedBatchId && res.data.length > 0) {
        setSelectedBatchId(res.data[0].batch_id);
      }
    });
  }, []);

  const handleStartInspection = async (e) => {
    e.preventDefault();
    if (!selectedImage) {
      alert('Please upload an image or capture a frame using the camera.');
      return;
    }
    if (!selectedBatchId) {
      alert('Please select a target production batch.');
      return;
    }

    try {
      setIsInspecting(true);
      const formData = new FormData();
      formData.append('batch_id', selectedBatchId);
      formData.append('file', selectedImage);
      if (itemSerial) formData.append('item_serial', itemSerial);
      if (inspectorNotes) formData.append('inspector_notes', inspectorNotes);

      const res = await InspectionService.inspectImage(formData);
      setInspectionResult(res.data);
      setFeedbackSubmitted(false);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.detail || 'Defect inspection failed.');
    } finally {
      setIsInspecting(false);
    }
  };

  const handleFeedbackSubmit = async (statusOverride = null) => {
    if (!inspectionResult?.inspection?.id) return;
    try {
      await InspectionService.submitFeedback(inspectionResult.inspection.id, {
        feedback_status: statusOverride ? 'OVERRIDDEN' : 'CONFIRMED',
        reviewed_by: 'Senior QA Inspector',
        feedback_notes: 'Inspector verified on line.',
        override_status: statusOverride
      });
      setFeedbackSubmitted(true);
      alert('QA verification & feedback logged into permanent audit trail!');
    } catch (err) {
      console.error(err);
    }
  };

  const resetForNext = () => {
    setInspectionResult(null);
    setSelectedImage(null);
    setItemSerial('');
    setInspectorNotes('');
    setFeedbackSubmitted(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-bold text-cyan-400">MODULE 04 & 05</span>
            <span className="text-slate-500">•</span>
            <span className="text-xs text-slate-400">Computer Vision Inference</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Product Defect Inspection</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Capture or upload a high-resolution specimen to identify defect classifications, exact bounding regions, and quality decisions.
          </p>
        </div>

        {inspectionResult && (
          <button
            onClick={resetForNext}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition"
          >
            <RotateCcw className="w-4 h-4 text-cyan-400" />
            <span>Inspect Next Item</span>
          </button>
        )}
      </div>

      {!inspectionResult ? (
        /* Inspection Input Form */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Camera or File Uploader */}
          <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
            {/* Mode Switcher Tabs */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Specimen Capture Source
              </span>
              <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setInputMode('upload')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    inputMode === 'upload'
                      ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>Upload Image</span>
                </button>
                <button
                  type="button"
                  onClick={() => setInputMode('camera')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    inputMode === 'camera'
                      ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Live Camera Feed</span>
                </button>
              </div>
            </div>

            {/* Input area */}
            {inputMode === 'upload' ? (
              <ImageUploader
                onImageSelected={(file) => setSelectedImage(file)}
                selectedImage={selectedImage}
              />
            ) : (
              <CameraCapture
                onCapture={(file) => {
                  setSelectedImage(file);
                  setInputMode('upload');
                }}
                onCancel={() => setInputMode('upload')}
              />
            )}
          </div>

          {/* Right Col: Batch Assignment & Metadata */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-4">
            <form onSubmit={handleStartInspection} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Target Production Batch *
                </label>
                <select
                  required
                  value={selectedBatchId}
                  onChange={(e) => setSelectedBatchId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                >
                  {batches.map((b) => (
                    <option key={b.id || b.batch_id} value={b.batch_id}>
                      {b.batch_id} — {b.product?.name || b.batch_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Item Serial / Barcode ID (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. SN-MET-2026-9045"
                  value={itemSerial}
                  onChange={(e) => setItemSerial(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Inspector Notes / Observation
                </label>
                <textarea
                  rows="3"
                  placeholder="e.g. Routine 10-piece QA sample from machine line #4..."
                  value={inspectorNotes}
                  onChange={(e) => setInspectorNotes(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1">
                <div className="flex items-center justify-between">
                  <span>Inference Engine:</span>
                  <span className="text-cyan-400 font-mono font-bold">WeaveGuard-Vision-v1.4</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Localization Method:</span>
                  <span className="text-slate-300">Exact Geometrical BBox</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isInspecting || !selectedImage}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs shadow-lg shadow-cyan-500/25 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isInspecting ? 'Running AI Vision Analysis...' : 'Run Defect Inspection'}</span>
              </button>
            </form>
          </div>
        </div>
      ) : (
        /* Results Section (Page 05: Inspection Results) */
        <div className="space-y-6">
          {/* Top Banner with Inspection Meta & Status */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-cyan-400">
                  {inspectionResult.inspection.inspection_code}
                </span>
                <span className="text-slate-500">•</span>
                <span className="text-xs text-slate-300 font-mono">
                  Batch: {selectedBatchId}
                </span>
              </div>
              <h2 className="text-lg font-black text-white mt-0.5">
                AI Quality Assessment Verdict
              </h2>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(`/batches/${selectedBatchId}`)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 font-bold text-xs border border-cyan-500/30 transition"
              >
                <span>View Full Batch Report</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Triggered Alerts Alert Banner if any */}
          {inspectionResult.triggered_alerts?.length > 0 && (
            <div className="p-4 bg-rose-950/40 border border-rose-800/80 rounded-2xl flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0 animate-bounce" />
                <div>
                  <h4 className="text-xs font-bold text-rose-200">
                    Smart Quality Alert Triggered ({inspectionResult.triggered_alerts.length})
                  </h4>
                  <p className="text-[11px] text-rose-300/80">
                    Codes: {inspectionResult.triggered_alerts.join(', ')} • Automatically dispatched to quality supervisor.
                  </p>
                </div>
              </div>

              <button
                onClick={() => navigate('/alerts')}
                className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition"
              >
                View in Alert Center
              </button>
            </div>
          )}

          {/* Visual Localization Canvas Overlay */}
          <DetectionOverlay
            originalImageUrl={inspectionResult.inspection.image_path}
            annotatedImageUrl={inspectionResult.inspection.annotated_image_path}
            detections={inspectionResult.detections || []}
            qualityScore={inspectionResult.quality_score}
            decisionStatus={inspectionResult.status}
            decisionReason={inspectionResult.decision_reason}
          />

          {/* Human-in-the-loop Feedback / Verification Section */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h4 className="text-xs font-bold text-slate-200 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                <span>Inspector Verification & Feedback Loop</span>
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Confirm model correctness or override decision to maintain continuous model training calibration.
              </p>
            </div>

            {feedbackSubmitted ? (
              <div className="flex items-center gap-2 text-xs text-emerald-400 font-bold bg-emerald-950/30 px-4 py-2 rounded-xl border border-emerald-800/60">
                <CheckCheck className="w-4 h-4" />
                <span>Feedback Registered into Audit Trail</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleFeedbackSubmit()}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 text-xs font-bold border border-emerald-500/40 transition"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Confirm AI Prediction</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleFeedbackSubmit('PASSED')}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition"
                >
                  Override to PASS
                </button>
                <button
                  type="button"
                  onClick={() => handleFeedbackSubmit('FAILED')}
                  className="px-3 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 text-xs font-bold border border-rose-800/60 transition"
                >
                  Override to FAIL
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
