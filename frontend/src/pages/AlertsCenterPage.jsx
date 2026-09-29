import React, { useState, useEffect } from 'react';
import { AlertTriangle, ShieldAlert, CheckCircle2, Filter, BellRing } from 'lucide-react';
import AlertCard from '../components/AlertCard';
import { AlertService } from '../services/api';

export default function AlertsCenterPage() {
  const [alerts, setAlerts] = useState([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const res = await AlertService.getAll(statusFilter);
      setAlerts(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [statusFilter]);

  const openCount = alerts.filter((a) => a.status === 'OPEN').length;
  const inProgressCount = alerts.filter((a) => a.status === 'IN_PROGRESS').length;
  const resolvedCount = alerts.filter((a) => a.status === 'RESOLVED').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-bold text-rose-400">MODULE 07</span>
            <span className="text-slate-500">•</span>
            <span className="text-xs text-slate-400">Escalation & Safety Monitoring</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Smart Alerts Center</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Automated alerts for critical defects, repeated anomalies, batch threshold violations, and unreviewed predictions.
          </p>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex bg-slate-900 p-1.5 rounded-2xl border border-slate-800">
          {[
            { id: 'ALL', label: 'All Alerts' },
            { id: 'OPEN', label: `Open (${openCount})` },
            { id: 'IN_PROGRESS', label: `In Progress (${inProgressCount})` },
            { id: 'RESOLVED', label: `Resolved (${resolvedCount})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                statusFilter === tab.id
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Alerts Grid */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 text-xs font-mono">
          Loading alerts center...
        </div>
      ) : alerts.length === 0 ? (
        <div className="glass-panel p-12 rounded-3xl border border-slate-800 text-center space-y-3">
          <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
          <h3 className="text-base font-bold text-white">All Clear — Zero Active Alerts</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            No unresolved alerts in the selected category. Manufacturing lines operating within specified tolerance thresholds.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {alerts.map((alert) => (
            <AlertCard key={alert.id} alert={alert} onUpdated={fetchAlerts} />
          ))}
        </div>
      )}
    </div>
  );
}
