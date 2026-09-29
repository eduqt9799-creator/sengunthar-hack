import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Boxes,
  Layers,
  ScanEye,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ExternalLink,
  Plus
} from 'lucide-react';
import StatCard from '../components/StatCard';
import BatchTable from '../components/BatchTable';
import DefectChart from '../components/DefectChart';
import { AnalyticsService, BatchService, AlertService } from '../services/api';

export default function DashboardPage() {
  const navigate = useNavigate();
  const [overview, setOverview] = useState(null);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [ovRes, bRes] = await Promise.all([
        AnalyticsService.getOverview(),
        BatchService.getAll()
      ]);
      setOverview(ovRes.data);
      setBatches(bRes.data);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Hero Welcome Banner */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative overflow-hidden">
        <div className="z-10">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              INDUSTRIAL QUALITY OS
            </span>
            <span className="text-xs text-slate-400 font-mono">Build 2026.09</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-black text-white tracking-tight">
            WeaveGuard <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Quality Intelligence</span>
          </h1>
          <p className="text-xs lg:text-sm text-slate-400 mt-1 max-w-xl">
            Real-time AI defect detection, exact image localization, batch QR digital traceability, and smart quality alerts.
          </p>
        </div>

        <div className="flex items-center gap-3 z-10 w-full md:w-auto">
          <button
            onClick={() => navigate('/inspect')}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs shadow-lg shadow-cyan-500/25 transition"
          >
            <ScanEye className="w-4 h-4" />
            <span>New AI Inspection</span>
          </button>
          <button
            onClick={() => navigate('/batches')}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition"
          >
            <Plus className="w-4 h-4 text-cyan-400" />
            <span>Create Batch</span>
          </button>
        </div>

        {/* Decorative background radial gradient */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Batches"
          value={overview?.total_batches || batches.length || '3'}
          subtitle="Tracked with unique QR codes"
          icon={Layers}
          color="blue"
        />
        <StatCard
          title="Items Inspected"
          value={overview?.total_inspections || '0'}
          subtitle={`Pass Rate: ${overview?.overall_pass_rate || 0}%`}
          icon={ScanEye}
          color="emerald"
          glow={true}
        />
        <StatCard
          title="Defect Rate"
          value={`${overview?.overall_defect_rate || 0}%`}
          subtitle="Across production lots"
          icon={TrendingDown}
          color="rose"
        />
        <StatCard
          title="Active Alerts"
          value={overview?.active_alerts || '0'}
          subtitle="Pending QA Review / CAPA"
          icon={AlertTriangle}
          color="amber"
        />
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Severity Distribution */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Defect Severity Breakdown
              </h3>
              <p className="text-[11px] text-slate-400 font-medium">Minor vs Major vs Critical</p>
            </div>
          </div>
          <DefectChart type="severity" data={overview?.severity_breakdown || []} />
        </div>

        {/* Defect Frequency */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Top Identified Defect Classes
              </h3>
              <p className="text-[11px] text-slate-400 font-medium">Frequency count by category</p>
            </div>
          </div>
          <DefectChart type="defects_bar" data={overview?.defect_breakdown || []} />
        </div>

        {/* Batch-to-Batch Defect Comparison */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Batch Defect Rate Comparison
              </h3>
              <p className="text-[11px] text-slate-400 font-medium">% Defective items per batch</p>
            </div>
          </div>
          <DefectChart type="batch_comparison" data={overview?.batch_comparison || []} />
        </div>
      </div>

      {/* Production Batches List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">Active Production Batches</h2>
            <p className="text-xs text-slate-400">Manage batch registers, QR access, and digital reports</p>
          </div>
          <button
            onClick={() => navigate('/batches')}
            className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1"
          >
            <span>View All Batches</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>

        <BatchTable batches={batches} onRefresh={fetchDashboardData} />
      </div>
    </div>
  );
}
