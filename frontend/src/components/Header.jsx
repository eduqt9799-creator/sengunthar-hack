import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, RotateCcw, ShieldCheck, QrCode, Sparkles } from 'lucide-react';
import { AnalyticsService } from '../services/api';

export default function Header({ activeAlertCount = 0, onRefresh }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isReseeding, setIsReseeding] = useState(false);
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/batches/${searchQuery.trim()}`);
      setSearchQuery('');
    }
  };

  const handleReseed = async () => {
    if (window.confirm('Reset/Reseed sample database with multi-product quality batches?')) {
      try {
        setIsReseeding(true);
        await AnalyticsService.reseed();
        if (onRefresh) onRefresh();
        alert('Database reseeded with fresh product batches and inspections!');
      } catch (err) {
        console.error(err);
      } finally {
        setIsReseeding(false);
      }
    }
  };

  return (
    <header className="h-16 bg-slate-900/80 border-b border-slate-800/80 px-6 flex items-center justify-between backdrop-blur-md sticky top-0 z-10">
      {/* Search by Batch ID or QR */}
      <form onSubmit={handleSearch} className="relative w-80">
        <input
          type="text"
          placeholder="Lookup Batch ID (e.g. WG-MET-2026-001)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-slate-950/70 border border-slate-700/80 rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
        />
        <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
      </form>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Quick QR Scanner button */}
        <button
          onClick={() => navigate('/scan')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition"
        >
          <QrCode className="w-3.5 h-3.5 text-cyan-400" />
          <span>Scan QR</span>
        </button>

        {/* Reseed Data helper */}
        <button
          onClick={handleReseed}
          disabled={isReseeding}
          title="Reseed demo data"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/70 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-xs font-medium border border-slate-700/60 transition disabled:opacity-50"
        >
          <RotateCcw className={`w-3.5 h-3.5 ${isReseeding ? 'animate-spin' : ''}`} />
          <span>Demo Data</span>
        </button>

        {/* Alerts Bell */}
        <button
          onClick={() => navigate('/alerts')}
          className="relative p-2 rounded-lg bg-slate-800/70 hover:bg-slate-700 border border-slate-700/70 text-slate-300 transition"
        >
          <Bell className="w-4 h-4 text-slate-300" />
          {activeAlertCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center animate-pulse">
              {activeAlertCount}
            </span>
          )}
        </button>

        {/* User badge */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-cyan-600 to-blue-700 flex items-center justify-center text-xs font-bold text-white shadow">
            QA
          </div>
          <div className="text-left hidden sm:block">
            <p className="text-xs font-bold text-slate-200 leading-tight">Lead Inspector</p>
            <p className="text-[10px] text-slate-400 font-mono">Shift Alpha</p>
          </div>
        </div>
      </div>
    </header>
  );
}
