import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FileText,
  FileDown,
  QrCode,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ScanEye,
  ShieldCheck,
  ExternalLink,
  Layers,
  TrendingDown,
  Printer,
  ChevronRight
} from 'lucide-react';
import StatCard from '../components/StatCard';
import DefectChart from '../components/DefectChart';
import { BatchService } from '../services/api';

export default function BatchReportPage() {
  const { batchId } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedInspection, setSelectedInspection] = useState(null);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const res = await BatchService.getReport(batchId);
      setReport(res.data);
      if (res.data.inspections?.length > 0) {
        setSelectedInspection(res.data.inspections[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [batchId]);

  if (loading) {
    return (
      <div className="py-24 text-center space-y-3">
        <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-slate-400 font-mono">Retrieving digital batch quality report for {batchId}...</p>
      </div>
    );
  }

  if (!report || !report.batch) {
    return (
      <div className="glass-panel p-12 rounded-3xl border border-slate-800 text-center max-w-md mx-auto space-y-4">
        <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto" />
        <h2 className="text-base font-bold text-white">Batch Quality Record Not Found</h2>
        <p className="text-xs text-slate-400">
          No batch matching ID "{batchId}" exists in the quality database.
        </p>
        <button
          onClick={() => navigate('/batches')}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition"
        >
          Return to Batches
        </button>
      </div>
    );
  }

  const { batch, total_inspected, total_passed, total_failed, total_review, pass_rate, defect_rate, defect_breakdown, severity_breakdown, inspections, alerts, corrective_actions } = report;

  const defectChartData = Object.entries(defect_breakdown || {}).map(([name, count]) => ({ name, count }));
  const severityChartData = Object.entries(severity_breakdown || {}).map(([name, count]) => ({ name, count }));

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Report Header Card with QR & Download Actions */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 z-10 relative">
          <div className="flex items-start gap-4">
            {/* Batch QR Preview Thumbnail */}
            {batch.qr_code_path && (
              <div className="bg-white p-2 rounded-xl border border-slate-700 flex-shrink-0 shadow-lg">
                <img
                  src={batch.qr_code_path}
                  alt={`QR for ${batch.batch_id}`}
                  className="w-20 h-24 object-contain"
                />
              </div>
            )}

            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  DIGITAL QUALITY CERTIFICATE
                </span>
                <span className="text-xs text-slate-400 font-mono">{report.report_version}</span>
              </div>
              <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
                <span>{batch.batch_id}</span>
                <span className="text-sm font-semibold text-slate-400 font-sans">
                  • {batch.batch_name}
                </span>
              </h1>
              <p className="text-xs text-slate-300 mt-1">
                Product: <b className="text-white">{batch.product?.name}</b> [{batch.product?.category}] • Lot Qty: <b className="text-white">{batch.quantity} units</b>
              </p>
              <div className="flex items-center gap-4 text-[11px] text-slate-400 mt-2 font-medium">
                <span>Production Date: {new Date(batch.production_date).toLocaleDateString()}</span>
                <span>Inspector: <b className="text-slate-200">{batch.inspector_name || 'QA System'}</b></span>
              </div>
            </div>
          </div>

          {/* Action Buttons: PDF & Excel Downloads */}
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <a
              href={BatchService.getPdfUrl(batch.batch_id)}
              download
              className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/20 transition"
            >
              <FileDown className="w-4 h-4" />
              <span>Download PDF Certificate</span>
            </a>
            <a
              href={BatchService.getExcelUrl(batch.batch_id)}
              download
              className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 transition"
            >
              <FileDown className="w-4 h-4" />
              <span>Export Excel Log</span>
            </a>
            <button
              onClick={() => navigate(`/inspect?batch=${batch.batch_id}`)}
              className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs transition"
            >
              <ScanEye className="w-4 h-4" />
              <span>Inspect Item</span>
            </button>
          </div>
        </div>

        {/* Ambient subtle glow */}
        <div className="absolute -bottom-10 -right-10 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          title="Total Inspected"
          value={`${total_inspected} / ${batch.quantity}`}
          subtitle={`${Math.round((total_inspected / (batch.quantity || 1)) * 100)}% Lot Completion`}
          icon={Layers}
          color="blue"
        />
        <StatCard
          title="Pass Rate"
          value={`${pass_rate}%`}
          subtitle={`${total_passed} units accepted`}
          icon={CheckCircle2}
          color="emerald"
          glow={true}
        />
        <StatCard
          title="Defect Rate"
          value={`${defect_rate}%`}
          subtitle={`${total_failed} units rejected`}
          icon={TrendingDown}
          color="rose"
        />
        <StatCard
          title="Manual Review"
          value={total_review}
          subtitle="Low confidence / edge cases"
          icon={AlertTriangle}
          color="amber"
        />
      </div>

      {/* Visual Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Defect Frequency breakdown */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Batch Defect Occurrence Frequency
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">Count by Class</span>
          </div>
          <DefectChart type="defects_bar" data={defectChartData} />
        </div>

        {/* Severity Distribution */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Severity Distribution
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">Minor / Major / Critical</span>
          </div>
          <DefectChart type="severity" data={severityChartData} />
        </div>
      </div>

      {/* Inspections Gallery & Interactive Viewer */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <ScanEye className="w-5 h-5 text-cyan-400" />
            <h3 className="text-sm font-bold text-white">
              Product Inspection Evidence Log ({inspections?.length || 0})
            </h3>
          </div>
          <span className="text-xs text-slate-400">Click item to inspect visual localization</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {inspections?.map((insp) => {
            const isPassed = insp.status === 'PASSED';
            const isFailed = insp.status === 'FAILED';
            return (
              <div
                key={insp.id}
                onClick={() => setSelectedInspection(insp)}
                className={`p-3 rounded-xl border transition-all cursor-pointer ${
                  selectedInspection?.id === insp.id
                    ? 'bg-slate-800 border-cyan-500/70 shadow-lg shadow-cyan-500/10 scale-[1.02]'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="aspect-video bg-black rounded-lg overflow-hidden border border-slate-800 mb-2 relative">
                  <img
                    src={insp.annotated_image_path || insp.image_path}
                    alt={insp.inspection_code}
                    className="w-full h-full object-contain"
                  />
                  <span
                    className={`absolute top-1.5 right-1.5 px-2 py-0.5 text-[9px] font-black rounded-full shadow ${
                      isPassed
                        ? 'bg-emerald-500 text-slate-950'
                        : isFailed
                        ? 'bg-rose-500 text-white'
                        : 'bg-amber-500 text-slate-950'
                    }`}
                  >
                    {insp.status}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono font-bold text-slate-200">{insp.inspection_code}</span>
                  <span className="font-mono text-[10px] text-cyan-400 font-bold">
                    {Math.round(insp.ai_confidence * 100)}% Conf
                  </span>
                </div>

                <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">
                  {insp.decision_reason || 'Compliant'}
                </p>
              </div>
            );
          })}
        </div>

        {/* Selected Inspection Expanded Canvas */}
        {selectedInspection && (
          <div className="mt-6 pt-6 border-t border-slate-800 space-y-4">
            <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
              Selected Inspection Focus: {selectedInspection.inspection_code}
            </h4>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
              <div className="lg:col-span-2 aspect-video bg-slate-900 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center">
                <img
                  src={selectedInspection.annotated_image_path || selectedInspection.image_path}
                  alt="Focus Inspection"
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">Item Metadata</span>
                    <span className="text-[10px] font-mono text-slate-400">
                      Score: {selectedInspection.quality_score}%
                    </span>
                  </div>

                  <div className="mt-3 space-y-2 text-xs text-slate-300">
                    <div className="flex justify-between py-1 border-b border-slate-800">
                      <span className="text-slate-500">Serial ID:</span>
                      <span className="font-mono font-semibold">{selectedInspection.item_serial || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800">
                      <span className="text-slate-500">Verdict:</span>
                      <span className="font-bold text-emerald-400">{selectedInspection.status}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800">
                      <span className="text-slate-500">AI Confidence:</span>
                      <span className="font-mono text-cyan-300">{Math.round(selectedInspection.ai_confidence * 100)}%</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800">
                      <span className="text-slate-500">Model Version:</span>
                      <span className="font-mono text-[10px]">{selectedInspection.model_version}</span>
                    </div>
                  </div>

                  <div className="mt-3 p-3 bg-slate-900 rounded-xl border border-slate-800 text-[11px] text-slate-300">
                    <b>Decision Reason:</b>
                    <p className="mt-0.5 text-slate-400">{selectedInspection.decision_reason}</p>
                  </div>
                </div>

                <div className="text-[10px] text-slate-500 font-mono">
                  Timestamp: {new Date(selectedInspection.inspected_at).toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Smart Alerts & Corrective Actions History */}
      {(alerts?.length > 0 || corrective_actions?.length > 0) && (
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Batch Quality Alerts & Corrective Action Trail
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">ISO / Traceability Log</span>
          </div>

          <div className="space-y-3">
            {alerts?.map((a) => (
              <div key={a.id} className="p-3.5 bg-slate-900/60 rounded-xl border border-slate-800 flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-rose-400">{a.alert_code}</span>
                    <span className="px-2 py-0.5 text-[9px] font-bold rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      {a.alert_type}
                    </span>
                  </div>
                  <p className="text-xs text-white font-medium mt-1">{a.title}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{a.message}</p>
                </div>
                <span className="px-2 py-1 text-[10px] font-bold rounded-full bg-slate-800 border border-slate-700 text-slate-300">
                  {a.status}
                </span>
              </div>
            ))}

            {corrective_actions?.map((ca) => (
              <div key={ca.id} className="p-3.5 bg-cyan-950/20 rounded-xl border border-cyan-800/40 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-cyan-300">{ca.action_code}</span>
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/50">
                    CAPA {ca.status}
                  </span>
                </div>
                <p className="text-xs text-slate-200 font-medium">
                  <b className="text-cyan-400">Action:</b> {ca.action_taken}
                </p>
                {ca.root_cause_analysis && (
                  <p className="text-[11px] text-slate-400">
                    <b className="text-slate-300">Root Cause:</b> {ca.root_cause_analysis}
                  </p>
                )}
                <div className="text-[10px] text-slate-500 flex justify-between pt-1">
                  <span>Assigned: {ca.assigned_person}</span>
                  <span>Recorded: {new Date(ca.recorded_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
