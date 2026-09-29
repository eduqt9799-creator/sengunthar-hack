import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  AreaChart,
  Area
} from 'recharts';

export default function DefectChart({ type = 'severity', data = [] }) {
  const SEVERITY_COLORS = {
    MINOR: '#3B82F6',    // Blue
    MAJOR: '#F59E0B',    // Amber
    CRITICAL: '#EF4444'  // Rose Red
  };

  const CUSTOM_TOOLTIP_STYLE = {
    backgroundColor: '#0F172A',
    borderColor: '#334155',
    borderRadius: '8px',
    color: '#F8FAFC',
    fontSize: '11px',
    fontWeight: '600'
  };

  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-500 text-xs">
        No defect analytics data available
      </div>
    );
  }

  if (type === 'severity') {
    return (
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={5}
              dataKey="count"
              nameKey="name"
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={SEVERITY_COLORS[entry.name] || '#06B6D4'}
                  stroke="#0F172A"
                  strokeWidth={2}
                />
              ))}
            </Pie>
            <Tooltip contentStyle={CUSTOM_TOOLTIP_STYLE} />
            <Legend
              verticalAlign="bottom"
              wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (type === 'defects_bar') {
    return (
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
            <XAxis
              dataKey="name"
              stroke="#64748B"
              fontSize={10}
              tickLine={false}
              angle={-20}
              textAnchor="end"
            />
            <YAxis stroke="#64748B" fontSize={10} tickLine={false} />
            <Tooltip contentStyle={CUSTOM_TOOLTIP_STYLE} />
            <Bar dataKey="count" fill="#38BDF8" radius={[4, 4, 0, 0]} name="Occurrences" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (type === 'batch_comparison') {
    return (
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
            <XAxis
              dataKey="batch_id"
              stroke="#64748B"
              fontSize={10}
              tickLine={false}
              angle={-15}
              textAnchor="end"
            />
            <YAxis stroke="#64748B" fontSize={10} tickLine={false} unit="%" />
            <Tooltip contentStyle={CUSTOM_TOOLTIP_STYLE} />
            <Bar dataKey="defect_rate" fill="#EF4444" radius={[4, 4, 0, 0]} name="Defect Rate %" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (type === 'region_bar') {
    return (
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 10, right: 20, left: 40, bottom: 10 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
            <XAxis type="number" stroke="#64748B" fontSize={10} tickLine={false} />
            <YAxis
              type="category"
              dataKey="region"
              stroke="#94A3B8"
              fontSize={10}
              tickLine={false}
              width={80}
            />
            <Tooltip contentStyle={CUSTOM_TOOLTIP_STYLE} />
            <Bar dataKey="count" fill="#A855F7" radius={[0, 4, 4, 0]} name="Defects in Region" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return null;
}
