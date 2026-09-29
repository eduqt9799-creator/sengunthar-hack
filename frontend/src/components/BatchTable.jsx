import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, FileDown, QrCode, Scan, Calendar, CheckCircle2, AlertCircle, Clock, ShieldAlert } from 'lucide-react';
import { BatchService } from '../services/api';

export default function BatchTable({ batches = [], onRefresh }) {
  const navigate = useNavigate();
  const [selectedQr, setSelectedQr] = useState(null);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PASSED':
      case 'COMPLETED':
        return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40';
      case 'ON_HOLD':
      case 'FAILED':
      case 'REJECTED':
        return 'bg-rose-500/15 text-rose-300 border-rose-500/40';
      case 'IN_INSPECTION':
        return 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40 animate-pulse';
      default:
        return 'bg-slate-700/40 text-slate-300 border-slate-600';
    }
  };

  return (
    <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950/80 text-slate-400 font-mono uppercase text-[10px] tracking-wider border-b border-slate-800">
            <tr>
              <th className="py-3.5 px-4 font-bold">Batch ID & QR</th>
              <th className="py-3.5 px-4 font-bold">Product Category</th>
              <th className="py-3.5 px-4 font-bold">Batch Run Name</th>
              <th className="py-3.5 px-4 font-bold text-center">Batch Size</th>
              <th className="py-3.5 px-4 font-bold">Status</th>
              <th className="py-3.5 px-4 font-bold">Date & Inspector</th>
              <th className="py-3.5 px-4 font-bold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-medium">
            {batches.length === 0 ? (
              <tr>
                <td colSpan="7" className="py-8 text-center text-slate-500">
                  No production batches recorded yet.
                </td>
              </tr>
            ) : (
              batches.map((b) => (
                <tr
                  key={b.id || b.batch_id}
                  className="hover:bg-slate-800/40 transition duration-150 group"
                >
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      {b.qr_code_path ? (
                        <button
                          type="button"
                          onClick={() => setSelectedQr(b)}
                          className="p-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-cyan-400 transition"
                          title="View QR Code Label"
                        >
                          <QrCode className="w-4 h-4" />
                        </button>
                      ) : (
                        <QrCode className="w-4 h-4 text-slate-600" />
                      )}
                      <div>
                        <span
                          onClick={() => navigate(`/batches/${b.batch_id}`)}
                          className="font-mono font-bold text-cyan-400 hover:text-cyan-300 cursor-pointer text-xs"
                        >
                          {b.batch_id}
                        </span>
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 border border-slate-700 text-slate-300">
                      {b.product?.category || 'General Part'}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-slate-200 font-semibold max-w-[220px] truncate">
                    {b.batch_name}
                  </td>

                  <td className="py-3.5 px-4 text-center font-mono text-slate-300">
                    {b.quantity} units
                  </td>

                  <td className="py-3.5 px-4">
                    <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full border ${getStatusBadge(b.status)}`}>
                      {b.status}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                    <div>{new Date(b.production_date || b.created_at).toLocaleDateString()}</div>
                    <div className="text-slate-500 text-[10px]">{b.inspector_name || 'QA System'}</div>
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => navigate(`/inspect?batch=${b.batch_id}`)}
                        className="p-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 transition"
                        title="New Inspection for Batch"
                      >
                        <Scan className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => navigate(`/batches/${b.batch_id}`)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
                        title="View Full Digital Quality Report"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* QR Preview & Print Modal */}
      {selectedQr && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="glass-panel p-6 rounded-2xl max-w-sm w-full border border-slate-700 text-center space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-slate-200">Official Batch QR Label</span>
              <button
                onClick={() => setSelectedQr(null)}
                className="text-slate-400 hover:text-white text-xs px-1"
              >
                ✕
              </button>
            </div>

            <div className="bg-white p-4 rounded-xl inline-block shadow-lg mx-auto">
              <img
                src={selectedQr.qr_code_path}
                alt={`QR for ${selectedQr.batch_id}`}
                className="w-48 h-56 object-contain"
              />
            </div>

            <div>
              <p className="font-mono text-sm font-bold text-white">{selectedQr.batch_id}</p>
              <p className="text-xs text-slate-400 mt-0.5">{selectedQr.batch_name}</p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700 transition"
              >
                Print Label
              </button>
              <button
                onClick={() => navigate(`/batches/${selectedQr.batch_id}`)}
                className="flex-1 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-black transition"
              >
                Open Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
