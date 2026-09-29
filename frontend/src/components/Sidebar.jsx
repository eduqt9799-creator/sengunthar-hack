import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Boxes,
  Layers,
  ScanEye,
  FileCheck,
  AlertTriangle,
  BarChart3,
  Wrench,
  QrCode,
  ShieldCheck,
  CheckSquare,
  Cpu
} from 'lucide-react';

export default function Sidebar({ activeAlertCount = 0, onOpenChecklist }) {
  const navItems = [
    { to: '/', label: '01. Dashboard', icon: LayoutDashboard },
    { to: '/products', label: '02. Product Management', icon: Boxes },
    { to: '/batches', label: '03. Batch Management', icon: Layers },
    { to: '/inspect', label: '04. New Inspection', icon: ScanEye },
    { to: '/alerts', label: '07. Alerts Center', icon: AlertTriangle, badge: activeAlertCount },
    { to: '/analytics', label: '08. Quality Analytics', icon: BarChart3 },
    { to: '/corrective-actions', label: '09. Corrective Actions', icon: Wrench },
    { to: '/scan', label: '10. QR / Batch Search', icon: QrCode },
  ];

  return (
    <aside className="w-64 bg-slate-900/90 border-r border-slate-800 flex flex-col justify-between h-screen sticky top-0 backdrop-blur-xl z-20">
      <div>
        {/* Brand */}
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 text-white font-black">
              <Cpu className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <div className="font-black tracking-wider text-base text-white flex items-center gap-1.5">
                WEAVE<span className="text-cyan-400">GUARD</span>
                <span className="text-[10px] bg-cyan-950 text-cyan-400 font-bold px-1.5 py-0.5 rounded border border-cyan-800">AI</span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">Quality Intelligence OS</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-210px)]">
          <div className="px-3 py-2 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            Operational Modules
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-sm shadow-cyan-500/10'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`
                }
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </div>
                {item.badge > 0 && (
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Validation Checklist Trigger & System Status */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40 space-y-3">
        <button
          onClick={onOpenChecklist}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold hover:bg-emerald-500/30 transition shadow-sm"
        >
          <CheckSquare className="w-4 h-4 text-emerald-400" />
          <span>Product Checklist (15/15)</span>
        </button>

        <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-slate-300 font-medium">Vision Engine 1.4</span>
          </div>
          <span className="text-slate-400 font-mono">ONLINE</span>
        </div>
      </div>
    </aside>
  );
}
