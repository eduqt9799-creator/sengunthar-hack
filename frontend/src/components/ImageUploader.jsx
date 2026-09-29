import React, { useState, useRef } from 'react';
import { UploadCloud, Image as ImageIcon, CheckCircle, FileText } from 'lucide-react';

export default function ImageUploader({ onImageSelected, selectedImage }) {
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(selectedImage ? URL.createObjectURL(selectedImage) : null);
  const fileInputRef = useRef(null);

  const handleFile = (file) => {
    if (file && file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      onImageSelected(file);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const clearSelection = (e) => {
    e.stopPropagation();
    setPreviewUrl(null);
    onImageSelected(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Preset sample test images generator for instant testing in demo
  const loadPresetSample = async (category) => {
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');
    
    // Background
    ctx.fillStyle = '#1E293B';
    ctx.fillRect(0, 0, 640, 480);

    if (category === 'metal_crack') {
      ctx.fillStyle = '#475569';
      ctx.strokeStyle = '#94A3B8';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.roundRect(80, 80, 480, 320, 20);
      ctx.fill();
      ctx.stroke();
      // Bolt holes
      ctx.fillStyle = '#0F172A';
      ctx.beginPath(); ctx.arc(160, 160, 30, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(480, 160, 30, 0, Math.PI * 2); ctx.fill();
      // Stress crack
      ctx.strokeStyle = '#DC2626';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(300, 120);
      ctx.lineTo(350, 220);
      ctx.lineTo(330, 300);
      ctx.stroke();
    } else if (category === 'pcb_bridge') {
      ctx.fillStyle = '#064E3B';
      ctx.fillRect(60, 60, 520, 360);
      ctx.strokeStyle = '#D97706';
      ctx.lineWidth = 2;
      for (let y = 100; y < 400; y += 40) {
        ctx.beginPath(); ctx.moveTo(100, y); ctx.lineTo(540, y); ctx.stroke();
      }
      ctx.fillStyle = '#1E293B';
      ctx.fillRect(220, 160, 200, 160);
      // Solder bridge defect
      ctx.fillStyle = '#E2E8F0';
      ctx.beginPath(); ctx.arc(220, 250, 16, 0, Math.PI * 2); ctx.fill();
    } else {
      // Perfect part
      ctx.fillStyle = '#475569';
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.roundRect(90, 90, 460, 300, 24);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#0F172A';
      ctx.beginPath(); ctx.arc(170, 170, 26, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(470, 170, 26, 0, Math.PI * 2); ctx.fill();
    }

    canvas.toBlob((blob) => {
      const file = new File([blob], `sample_${category}.jpg`, { type: 'image/jpeg' });
      handleFile(file);
    }, 'image/jpeg');
  };

  return (
    <div className="space-y-3">
      <div
        onClick={() => fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 relative overflow-hidden ${
          isDragging
            ? 'border-cyan-400 bg-cyan-950/30'
            : previewUrl
            ? 'border-slate-700 bg-slate-900/50'
            : 'border-slate-700/80 hover:border-slate-500 bg-slate-950/40'
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={(e) => e.target.files && handleFile(e.target.files[0])}
          accept="image/*"
          className="hidden"
        />

        {previewUrl ? (
          <div className="relative group">
            <img
              src={previewUrl}
              alt="Inspection upload preview"
              className="max-h-72 mx-auto rounded-lg object-contain border border-slate-700 shadow-md"
            />
            <div className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 rounded-lg">
              <button
                type="button"
                onClick={clearSelection}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg shadow transition"
              >
                Change Image
              </button>
            </div>
          </div>
        ) : (
          <div className="py-6 space-y-3">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-cyan-400">
              <UploadCloud className="w-7 h-7" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-200">
                Drag & drop product inspection image here
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Supports JPG, PNG, WEBP high-resolution optical captures
              </p>
            </div>
            <button
              type="button"
              className="px-4 py-1.5 rounded-lg bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 text-xs font-bold hover:bg-cyan-500/25 transition"
            >
              Browse Local Files
            </button>
          </div>
        )}
      </div>

      {/* Preset Test Images Shortcut */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900/60 border border-slate-800">
        <span className="text-xs text-slate-400 font-medium">Quick Demo Samples:</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => loadPresetSample('metal_crack')}
            className="px-2.5 py-1 text-[11px] font-semibold rounded bg-rose-500/15 text-rose-300 border border-rose-500/30 hover:bg-rose-500/25 transition"
          >
            Defective (Crack)
          </button>
          <button
            type="button"
            onClick={() => loadPresetSample('pcb_bridge')}
            className="px-2.5 py-1 text-[11px] font-semibold rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 transition"
          >
            Defective (PCB)
          </button>
          <button
            type="button"
            onClick={() => loadPresetSample('perfect')}
            className="px-2.5 py-1 text-[11px] font-semibold rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25 transition"
          >
            Passing Part
          </button>
        </div>
      </div>
    </div>
  );
}
