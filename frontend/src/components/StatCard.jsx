import React from 'react';

export default function StatCard({ title, value, subtitle, icon: Icon, trend, color = 'cyan', glow = false }) {
  const colorMap = {
    cyan: {
      text: 'text-cyan-400',
      bg: 'bg-cyan-500/10',
      border: 'border-cyan-500/30',
      glow: 'glow-cyan'
    },
    emerald: {
      text: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/30',
      glow: 'glow-emerald'
    },
    rose: {
      text: 'text-rose-400',
      bg: 'bg-rose-500/10',
      border: 'border-rose-500/30',
      glow: 'glow-rose'
    },
    amber: {
      text: 'text-amber-400',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/30',
      glow: ''
    },
    blue: {
      text: 'text-blue-400',
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/30',
      glow: ''
    }
  };

  const scheme = colorMap[color] || colorMap.cyan;

  return (
    <div className={`glass-panel rounded-xl p-5 border ${scheme.border} ${glow ? scheme.glow : ''} transition duration-200 relative overflow-hidden group`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{title}</p>
          <h3 className="text-2xl font-black text-white mt-1.5 tracking-tight font-mono">{value}</h3>
          {subtitle && (
            <p className="text-xs text-slate-400 mt-1 font-medium">{subtitle}</p>
          )}
        </div>
        <div className={`p-2.5 rounded-xl ${scheme.bg} ${scheme.text} border ${scheme.border}`}>
          {Icon && <Icon className="w-5 h-5" />}
        </div>
      </div>

      {trend && (
        <div className="mt-3 flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
          <span className={trend.positive ? 'text-emerald-400' : 'text-rose-400'}>
            {trend.value}
          </span>
          <span>{trend.label}</span>
        </div>
      )}

      {/* Subtle background glow circle */}
      <div className={`absolute -right-6 -bottom-6 w-24 h-24 rounded-full ${scheme.bg} blur-2xl pointer-events-none group-hover:scale-150 transition-transform duration-500`} />
    </div>
  );
}
