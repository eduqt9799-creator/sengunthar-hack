import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingDown, Layers, Crosshair, History, ShieldCheck, CheckCircle2 } from 'lucide-react';
import DefectChart from '../components/DefectChart';
import StatCard from '../components/StatCard';
import { AnalyticsService } from '../services/api';

export default function AnalyticsPage() {
  const [overview, setOverview] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const [ovRes, logRes] = await Promise.all([
        AnalyticsService.getOverview(),
        AnalyticsService.getAuditLogs()
      ]);
      setOverview(ovRes.data);
      setAuditLogs(logRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-mono font-bold text-cyan-400">MODULE 08</span>
          <span className="text-slate-500">•</span>
          <span className="text-xs text-slate-400">Continuous Quality Intelligence</span>
        </div>
        <h1 className="text-2xl font-black text-white tracking-tight">Quality Analytics & Traceability</h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Cross-batch comparisons, spatial defect hotspots, severity distributions, and immutable audit trails.
        </p>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Overall Pass Rate"
          value={`${overview?.overall_pass_rate || 0}%`}
          subtitle="Compliant production ratio"
          icon={CheckCircle2}
          color="emerald"
          glow={true}
        />
        <StatCard
          title="Overall Defect Rate"
          value={`${overview?.overall_defect_rate || 0}%`}
          subtitle="Non-compliant rejected parts"
          icon={TrendingDown}
          color="rose"
        />
        <StatCard
          title="Total Inspections"
          value={overview?.total_inspections || 0}
          subtitle="Digital records logged"
          icon={Layers}
          color="cyan"
        />
        <StatCard
          title="Audit Trail Records"
          value={auditLogs.length || 0}
          subtitle="Immutable system logs"
          icon={History}
          color="blue"
        />
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Batch-to-Batch Defect Comparison */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Batch Defect Rate Benchmarking (%)
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">Lot vs Lot</span>
          </div>
          <DefectChart type="batch_comparison" data={overview?.batch_comparison || []} />
        </div>

        {/* Spatial / Region Defect Hotspots */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Spatial Defect Hotspot Distribution
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">Product Regions</span>
          </div>
          <DefectChart type="region_bar" data={overview?.region_breakdown || []} />
        </div>

        {/* Defect Class Frequency */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Defect Category Frequency
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">Pareto Distribution</span>
          </div>
          <DefectChart type="defects_bar" data={overview?.defect_breakdown || []} />
        </div>

        {/* Severity Proportions */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Severity Distribution Proportions
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">Risk Profile</span>
          </div>
          <DefectChart type="severity" data={overview?.severity_breakdown || []} />
        </div>
      </div>

      {/* ISO Audit Logs Table */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-cyan-400" />
            <h3 className="text-sm font-bold text-white">
              Digital Quality Audit Trail & Event Logs
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">ISO 9001 / Traceability Standard</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 font-mono uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Entity Type</th>
                <th className="py-2.5 px-3">Entity Identifier</th>
                <th className="py-2.5 px-3">Action Recorded</th>
                <th className="py-2.5 px-3">Authorized Operator</th>
                <th className="py-2.5 px-3 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {auditLogs.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-6 text-center text-slate-500">
                    No system audit events recorded yet.
                  </td>
                </tr>
              ) : (
                auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/30 transition">
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-slate-800 text-cyan-400 border border-slate-700">
                        {log.entity_type}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-200">
                      {log.entity_id}
                    </td>
                    <td className="py-2.5 px-3 text-slate-300">
                      {log.action}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400">
                      {log.performed_by}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-[11px] text-slate-500">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
