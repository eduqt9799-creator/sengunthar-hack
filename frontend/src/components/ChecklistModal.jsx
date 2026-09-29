import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { CheckSquare, CheckCircle2, RotateCcw, Trophy, Sparkles } from 'lucide-react';

const INITIAL_CHECKLIST = [
  { id: 1, text: 'Create a product and configure its defect classes', checked: true },
  { id: 2, text: 'Create a batch and generate a unique QR code', checked: true },
  { id: 3, text: 'Inspect an image and show the detected defect region', checked: true },
  { id: 4, text: 'Show the correct defect type and confidence score', checked: true },
  { id: 5, text: 'Apply severity rules and produce a product decision', checked: true },
  { id: 6, text: 'Link every inspection to the correct Batch ID', checked: true },
  { id: 7, text: 'Generate a batch report with accurate totals', checked: true },
  { id: 8, text: 'Scan the QR code and retrieve the correct report', checked: true },
  { id: 9, text: 'Search for a batch manually by Batch ID', checked: true },
  { id: 10, text: 'Trigger a critical-defect alert', checked: true },
  { id: 11, text: 'Trigger a repeated-defect or high-defect-rate alert', checked: true },
  { id: 12, text: 'Send low-confidence cases for manual review', checked: true },
  { id: 13, text: 'Download and verify PDF and Excel reports', checked: true },
  { id: 14, text: 'Record corrective actions and re-inspection', checked: true },
  { id: 15, text: 'Verify user permissions and audit history', checked: true },
];

export default function ChecklistModal({ isOpen, onClose }) {
  const [items, setItems] = useState(() => {
    const saved = localStorage.getItem('weaveguard_checklist');
    return saved ? JSON.parse(saved) : INITIAL_CHECKLIST;
  });

  const checkedCount = items.filter((i) => i.checked).length;
  const isComplete = checkedCount === items.length;

  useEffect(() => {
    localStorage.setItem('weaveguard_checklist', JSON.stringify(items));
    if (isComplete) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  }, [items, isComplete]);

  const toggleItem = (id) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    );
  };

  const resetChecklist = () => {
    setItems(INITIAL_CHECKLIST.map((i) => ({ ...i, checked: false })));
  };

  const checkAll = () => {
    setItems(INITIAL_CHECKLIST.map((i) => ({ ...i, checked: true })));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in">
      <div className="glass-panel p-6 rounded-2xl max-w-xl w-full border border-slate-700 shadow-2xl max-h-[90vh] flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <CheckSquare className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  Product Validation Checklist
                  {isComplete && <Sparkles className="w-4 h-4 text-amber-400" />}
                </h3>
                <p className="text-[11px] text-slate-400 font-medium">
                  End-to-End Roadmap Verification Matrix
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white text-xs px-2"
            >
              ✕
            </button>
          </div>

          {/* Progress Banner */}
          <div className="my-4 p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-2xl font-black font-mono text-cyan-400">
                {checkedCount}/{items.length}
              </div>
              <div>
                <p className="text-xs font-bold text-slate-200">
                  {isComplete ? 'System Fully Verified!' : 'Validation in Progress'}
                </p>
                <p className="text-[10px] text-slate-400">
                  {Math.round((checkedCount / items.length) * 100)}% Criteria Met
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={checkAll}
                className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/25 transition"
              >
                Mark All Complete
              </button>
              <button
                onClick={resetChecklist}
                className="p-1 text-slate-400 hover:text-slate-200"
                title="Reset Checklist"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Checklist Items list */}
          <div className="space-y-1.5 overflow-y-auto max-h-[380px] pr-1">
            {items.map((item) => (
              <div
                key={item.id}
                onClick={() => toggleItem(item.id)}
                className={`flex items-start gap-3 p-2.5 rounded-xl border transition-all duration-150 cursor-pointer text-xs ${
                  item.checked
                    ? 'bg-emerald-950/20 border-emerald-800/40 text-slate-200'
                    : 'bg-slate-900/40 border-slate-800/80 text-slate-400 hover:border-slate-700'
                }`}
              >
                <input
                  type="checkbox"
                  checked={item.checked}
                  onChange={() => {}} // Handled by container
                  className="mt-0.5 rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-0 cursor-pointer"
                />
                <span className={`flex-1 font-medium ${item.checked ? 'line-through text-slate-400' : ''}`}>
                  {item.text}
                </span>
                {item.checked && <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />}
              </div>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition"
          >
            Close Checklist
          </button>
        </div>
      </div>
    </div>
  );
}
