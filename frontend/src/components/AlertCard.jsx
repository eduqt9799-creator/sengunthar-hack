import React, { useState } from 'react';
import { AlertTriangle, ShieldAlert, CheckCircle2, Clock, Wrench, User, ChevronRight } from 'lucide-react';
import { AlertService } from '../services/api';

export default function AlertCard({ alert, onUpdated }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionForm, setActionForm] = useState({
    assigned_person: alert.assigned_to || 'Senior QA Engineer',
    root_cause_analysis: '',
    action_taken: '',
    requires_reinspection: false,
    reinspection_notes: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const priorityColors = {
    CRITICAL: 'bg-rose-500/20 text-rose-300 border-rose-500/40 glow-rose',
    HIGH: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    MEDIUM: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
    LOW: 'bg-slate-700/40 text-slate-300 border-slate-600'
  };

  const statusColors = {
    OPEN: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    IN_PROGRESS: 'bg-amber-500/10 text-amber-400 border-amber-500/30 animate-pulse',
    RESOLVED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
  };

  const handleCreateAction = async (e) => {
    e.preventDefault();
    if (!actionForm.action_taken.trim()) return;
    try {
      setSubmitting(true);
      await AlertService.createCorrectiveAction(alert.id, actionForm);
      setIsModalOpen(false);
      if (onUpdated) onUpdated();
    } catch (err) {
      console.error(err);
      alert('Failed to submit corrective action.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="glass-panel p-5 rounded-2xl border border-slate-800 hover:border-slate-700 transition space-y-3 relative overflow-hidden">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-xs text-cyan-400">{alert.alert_code}</span>
              <span className={`px-2 py-0.5 text-[9px] font-black rounded-full border ${priorityColors[alert.priority] || priorityColors.HIGH}`}>
                {alert.priority}
              </span>
            </div>
            <h4 className="text-sm font-bold text-white mt-0.5">{alert.title}</h4>
          </div>
        </div>

        <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full border ${statusColors[alert.status]}`}>
          {alert.status}
        </span>
      </div>

      <p className="text-xs text-slate-300 leading-relaxed font-medium bg-slate-950/40 p-3 rounded-xl border border-slate-900">
        {alert.message}
      </p>

      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <User className="w-3.5 h-3.5 text-slate-500" />
            <b className="text-slate-300">{alert.assigned_to || 'Unassigned'}</b>
          </span>
          <span>Triggered: {new Date(alert.triggered_at).toLocaleString()}</span>
        </div>

        {alert.status !== 'RESOLVED' && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 text-xs font-bold border border-cyan-500/30 transition"
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>Take Corrective Action</span>
          </button>
        )}
      </div>

      {/* Corrective Action Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="glass-panel p-6 rounded-2xl max-w-lg w-full border border-slate-700 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white">Record Corrective Action (CAPA)</h3>
                <p className="text-[11px] text-slate-400 font-mono">{alert.alert_code}</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white text-xs px-2"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAction} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Responsible Engineer / Metallurgist
                </label>
                <input
                  type="text"
                  required
                  value={actionForm.assigned_person}
                  onChange={(e) => setActionForm({ ...actionForm, assigned_person: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Root Cause Analysis (5-Why / Ishikawa)
                </label>
                <textarea
                  rows="2"
                  placeholder="e.g. Quench bath temp deviation, tool wear on milling axis 2, humidity anomaly..."
                  value={actionForm.root_cause_analysis}
                  onChange={(e) => setActionForm({ ...actionForm, root_cause_analysis: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Corrective & Preventive Action Taken *
                </label>
                <textarea
                  rows="3"
                  required
                  placeholder="Detailed engineering steps taken to eliminate the defect..."
                  value={actionForm.action_taken}
                  onChange={(e) => setActionForm({ ...actionForm, action_taken: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="req_reinspect"
                  checked={actionForm.requires_reinspection}
                  onChange={(e) => setActionForm({ ...actionForm, requires_reinspection: e.target.checked })}
                  className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-0"
                />
                <label htmlFor="req_reinspect" className="text-xs text-slate-300 font-medium cursor-pointer">
                  Require Physical Re-inspection & Serial Verification
                </label>
              </div>

              {actionForm.requires_reinspection && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Re-inspection Criteria / Scope
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Inspect serials #100 - #120 with eddy-current testing"
                    value={actionForm.reinspection_notes}
                    onChange={(e) => setActionForm({ ...actionForm, reinspection_notes: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              )}

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 text-xs font-black shadow-lg shadow-cyan-500/20 transition disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Log CAPA & Close Alert'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
