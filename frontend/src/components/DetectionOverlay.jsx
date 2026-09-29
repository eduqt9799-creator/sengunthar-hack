import React, { useState } from 'react';
import { Eye, Layers, Maximize2, ShieldAlert, CheckCircle, AlertTriangle, Crosshair } from 'lucide-react';

export default function DetectionOverlay({
  originalImageUrl,
  annotatedImageUrl,
  detections = [],
  qualityScore = 100,
  decisionStatus = 'PASSED',
  decisionReason = ''
}) {
  const [showAnnotations, setShowAnnotations] = useState(true);
  const [selectedDefectIdx, setSelectedDefectIdx] = useState(null);

  const statusConfig = {
    PASSED: {
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/15',
      border: 'border-emerald-500/40',
      icon: CheckCircle,
      label: 'ELIGIBLE TO PASS'
    },
    FAILED: {
      color: 'text-rose-400',
      bg: 'bg-rose-500/15',
      border: 'border-rose-500/40',
      icon: ShieldAlert,
      label: 'PRODUCT REJECTED'
    },
    MANUAL_REVIEW: {
      color: 'text-amber-400',
      bg: 'bg-amber-500/15',
      border: 'border-amber-500/40',
      icon: AlertTriangle,
      label: 'HOLD / MANUAL REVIEW'
    }
  };

  const statusObj = statusConfig[decisionStatus] || statusConfig.PASSED;
  const StatusIcon = statusObj.icon;

  const currentImage = showAnnotations && annotatedImageUrl ? annotatedImageUrl : originalImageUrl;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Visual Canvas Viewer */}
      <div className="lg:col-span-2 glass-panel p-5 rounded-2xl border border-slate-700/80 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Crosshair className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold text-slate-200">AI Visual Localization Canvas</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAnnotations(!showAnnotations)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold border transition ${
                showAnnotations
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{showAnnotations ? 'Annotations: ON' : 'Raw Capture'}</span>
            </button>
          </div>
        </div>

        {/* Display Image Container */}
        <div className="relative aspect-video max-h-[440px] bg-slate-950 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center">
          {currentImage ? (
            <img
              src={currentImage}
              alt="Inspection Localization Canvas"
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="text-center p-8 text-slate-500 text-xs">
              No inspection image available
            </div>
          )}

          {/* Quick HUD Overlay Stats */}
          <div className="absolute top-3 left-3 bg-slate-950/85 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800 flex items-center gap-3 text-[11px] font-mono">
            <span className="text-slate-400">Detections: <b className="text-white">{detections.length}</b></span>
            <span className="text-slate-400">Score: <b className="text-cyan-300">{qualityScore}%</b></span>
          </div>
        </div>

        {/* Decision reason callout banner */}
        <div className={`p-3.5 rounded-xl border flex items-start gap-3 ${statusObj.bg} ${statusObj.border}`}>
          <StatusIcon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${statusObj.color}`} />
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-black tracking-wide ${statusObj.color}`}>
                {statusObj.label}
              </span>
              <span className="text-[10px] bg-slate-900/80 px-2 py-0.5 rounded font-mono text-slate-300 border border-slate-700">
                Score: {qualityScore}/100
              </span>
            </div>
            <p className="text-xs text-slate-200 mt-1 font-medium leading-relaxed">
              {decisionReason || 'Inspection compliant with configured acceptance criteria.'}
            </p>
          </div>
        </div>
      </div>

      {/* Structured Defects & Localization Table */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-700/80 space-y-4 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Detected Anomalies ({detections.length})
            </h4>
            <span className="text-[10px] text-slate-400 font-mono">Region Mapping</span>
          </div>

          {detections.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto" />
              <p className="text-xs font-bold text-emerald-300">Flawless Specimen</p>
              <p className="text-[11px] text-slate-400">No surface or geometric deviations found.</p>
            </div>
          ) : (
            <div className="space-y-2.5 mt-3 max-h-[380px] overflow-y-auto pr-1">
              {detections.map((det, idx) => {
                const isCrit = det.severity === 'CRITICAL';
                const isMaj = det.severity === 'MAJOR';
                const sevBadge = isCrit
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  : isMaj
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-blue-500/20 text-blue-300 border-blue-500/40';

                return (
                  <div
                    key={idx}
                    onMouseEnter={() => setSelectedDefectIdx(idx)}
                    onMouseLeave={() => setSelectedDefectIdx(null)}
                    className={`p-3 rounded-xl border transition-all duration-150 cursor-pointer ${
                      selectedDefectIdx === idx
                        ? 'bg-slate-800/90 border-cyan-500/50 shadow-md shadow-cyan-500/10 scale-[1.01]'
                        : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">{det.defect_name}</span>
                      <span className={`px-2 py-0.5 text-[10px] font-black rounded border ${sevBadge}`}>
                        {det.severity}
                      </span>
                    </div>

                    <div className="mt-2 text-[11px] text-slate-400 space-y-1">
                      <div className="flex items-center justify-between">
                        <span>Target Region:</span>
                        <span className="font-semibold text-slate-200">{det.image_region}</span>
                      </div>
                      <div className="flex items-center justify-between font-mono">
                        <span>AI Confidence:</span>
                        <span className="text-cyan-400 font-bold">{Math.round(det.confidence * 100)}%</span>
                      </div>
                      {det.physical_approx_size_mm && (
                        <div className="flex items-center justify-between font-mono text-[10px]">
                          <span>Estimated Size:</span>
                          <span className="text-slate-300">{det.physical_approx_size_mm}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                        <span>Bounding Box:</span>
                        <span>[{Math.round(det.bbox_x1)}, {Math.round(det.bbox_y1)}, {Math.round(det.bbox_x2)}, {Math.round(det.bbox_y2)}]</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-[11px] text-slate-400">
          <p className="flex items-center justify-between">
            <span>Model Engine:</span>
            <span className="text-slate-200 font-mono font-semibold">WeaveGuard-Vision-v1.4</span>
          </p>
        </div>
      </div>
    </div>
  );
}
