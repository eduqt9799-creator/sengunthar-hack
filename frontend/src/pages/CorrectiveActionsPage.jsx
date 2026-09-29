import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wrench, CheckCircle2, Clock, AlertCircle, ScanEye, User, ShieldCheck } from 'lucide-react';
import { CorrectiveActionService } from '../services/api';

export default function CorrectiveActionsPage() {
  const navigate = useNavigate();
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchActions = async () => {
    try {
      setLoading(true);
      const res = await CorrectiveActionService.getAll();
      setActions(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActions();
  }, []);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'VERIFIED_CLOSED':
        return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40';
      case 'PENDING_REINSPECTION':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/40 animate-pulse';
      default:
        return 'bg-rose-500/15 text-rose-300 border-rose-500/40';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-mono font-bold text-cyan-400">MODULE 09</span>
          <span className="text-slate-500">•</span>
          <span className="text-xs text-slate-400">CAPA & Issue Closure</span>
        </div>
        <h1 className="text-2xl font-black text-white tracking-tight">Corrective Actions & Re-inspection</h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Track root cause investigations (5-Why), tooling adjustments, re-inspection verification, and formal alert closure.
        </p>
      </div>

      {/* Actions List */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 text-xs font-mono">
          Loading corrective action logs...
        </div>
      ) : actions.length === 0 ? (
        <div className="glass-panel p-12 rounded-3xl border border-slate-800 text-center space-y-3">
          <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
          <h3 className="text-base font-bold text-white">Zero Pending Corrective Actions</h3>
          <p className="text-xs text-slate-400">
            All manufacturing quality alerts have been addressed and closed.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {actions.map((act) => (
            <div
              key={act.id}
              className="glass-panel p-6 rounded-2xl border border-slate-800 hover:border-slate-700 transition space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    <Wrench className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-cyan-400">{act.action_code}</span>
                      <span className={`px-2.5 py-0.5 text-[10px] font-black rounded-full border ${getStatusBadge(act.status)}`}>
                        {act.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Responsible: <b className="text-slate-200">{act.assigned_person}</b>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono">
                  <span>Logged: {new Date(act.recorded_at).toLocaleDateString()}</span>
                  {act.closed_at && (
                    <span className="text-emerald-400">
                      Closed: {new Date(act.closed_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>

              {/* RCA and Action Taken content */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {act.root_cause_analysis && (
                  <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-1">
                    <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                      Root Cause Analysis (RCA)
                    </span>
                    <p className="text-slate-300 leading-relaxed">{act.root_cause_analysis}</p>
                  </div>
                )}

                <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-cyan-400 tracking-wider">
                    Corrective & Preventive Action Taken
                  </span>
                  <p className="text-slate-200 leading-relaxed font-medium">{act.action_taken}</p>
                </div>
              </div>

              {/* Re-inspection Requirement Banner */}
              {act.requires_reinspection && (
                <div className="p-3.5 bg-amber-950/25 border border-amber-800/50 rounded-xl flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2.5">
                    <Clock className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <div>
                      <span className="text-xs font-bold text-amber-200">
                        Physical Re-inspection Required
                      </span>
                      <p className="text-[11px] text-amber-300/80 mt-0.5">
                        {act.reinspection_notes || 'Re-inspect subsequent production lot items for verification.'}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => navigate('/inspect')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition shadow"
                  >
                    <ScanEye className="w-3.5 h-3.5" />
                    <span>Run Re-inspection</span>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
