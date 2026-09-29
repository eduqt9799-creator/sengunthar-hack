import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5QrcodeScanner, Html5Qrcode } from 'html5-qrcode';
import { QrCode, Search, Camera, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { BatchService } from '../services/api';

export default function QRScannerPage() {
  const navigate = useNavigate();
  const [manualBatchId, setManualBatchId] = useState('');
  const [batches, setBatches] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState(null);
  const scannerRef = useRef(null);

  useEffect(() => {
    BatchService.getAll().then((res) => setBatches(res.data)).catch(console.error);
  }, []);

  const handleManualLookup = (e) => {
    e.preventDefault();
    if (manualBatchId.trim()) {
      navigate(`/batches/${manualBatchId.trim()}`);
    }
  };

  const startScanner = () => {
    setIsScanning(true);
    setScanError(null);

    setTimeout(() => {
      try {
        const html5QrCode = new Html5Qrcode('qr-reader');
        scannerRef.current = html5QrCode;

        html5QrCode.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 }
          },
          (decodedText) => {
            // On success
            html5QrCode.stop().then(() => {
              // Extract Batch ID from URL or text
              let batchId = decodedText;
              if (decodedText.includes('/batches/')) {
                batchId = decodedText.split('/batches/')[1];
              }
              navigate(`/batches/${batchId}`);
            });
          },
          (errorMessage) => {
            // parse errors ignore
          }
        ).catch((err) => {
          console.error('QR start error:', err);
          setScanError('Unable to start camera for QR scanning. Check browser camera permissions.');
          setIsScanning(false);
        });
      } catch (e) {
        console.error(e);
      }
    }, 100);
  };

  const stopScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.stop().then(() => {
        setIsScanning(false);
      }).catch(() => setIsScanning(false));
    } else {
      setIsScanning(false);
    }
  };

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        try {
          scannerRef.current.stop();
        } catch (e) {}
      }
    };
  }, []);

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-300">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-mono font-bold">
          <QrCode className="w-3.5 h-3.5" />
          <span>MODULE 10 — QR DECODER & RETRIEVAL</span>
        </div>
        <h1 className="text-2xl lg:text-3xl font-black text-white tracking-tight">
          Batch Quality Report Retrieval
        </h1>
        <p className="text-xs lg:text-sm text-slate-400 max-w-lg mx-auto">
          Scan the physical QR code label on the manufacturing lot container or search by Batch ID to view the live compliance certificate.
        </p>
      </div>

      {/* Main Scanner / Lookup Container */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Camera QR Scanner */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
              <Camera className="w-5 h-5 text-cyan-400" />
              <h3 className="text-sm font-bold text-white">Camera QR Scanner</h3>
            </div>

            <div className="my-4">
              {isScanning ? (
                <div className="space-y-3">
                  <div
                    id="qr-reader"
                    className="aspect-square w-full rounded-2xl overflow-hidden bg-black border border-slate-700"
                  />
                  <p className="text-[11px] text-center text-slate-400">
                    Align the batch QR code within the scanning box
                  </p>
                </div>
              ) : (
                <div className="aspect-square bg-slate-950/80 rounded-2xl border-2 border-dashed border-slate-800 flex flex-col items-center justify-center p-6 text-center space-y-3">
                  <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center">
                    <QrCode className="w-8 h-8" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-200">Optical QR Code Scanner</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Direct mobile / webcam scanning of container labels
                    </p>
                  </div>
                </div>
              )}

              {scanError && (
                <div className="p-3 bg-rose-950/40 border border-rose-800 rounded-xl text-xs text-rose-300 mt-3">
                  {scanError}
                </div>
              )}
            </div>
          </div>

          <div>
            {isScanning ? (
              <button
                type="button"
                onClick={stopScanner}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition"
              >
                Cancel Scanner
              </button>
            ) : (
              <button
                type="button"
                onClick={startScanner}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs shadow-lg shadow-cyan-500/20 transition"
              >
                Launch QR Camera Scanner
              </button>
            )}
          </div>
        </div>

        {/* Manual Search & Quick Access Chips */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
              <Search className="w-5 h-5 text-cyan-400" />
              <h3 className="text-sm font-bold text-white">Manual Batch ID Search</h3>
            </div>

            <form onSubmit={handleManualLookup} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Enter Batch Identification Code
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="e.g. WG-MET-2026-001"
                    value={manualBatchId}
                    onChange={(e) => setManualBatchId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-4 pr-10 py-2.5 text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                  <button
                    type="submit"
                    className="absolute right-2 top-2 p-1.5 rounded-lg bg-cyan-500 text-slate-950 hover:bg-cyan-400 transition"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </form>

            {/* Quick Demo Batch ID Chips */}
            <div className="space-y-2 pt-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Quick Select Available Batches:
              </span>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {batches.map((b) => (
                  <div
                    key={b.id || b.batch_id}
                    onClick={() => navigate(`/batches/${b.batch_id}`)}
                    className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-800/80 transition cursor-pointer flex items-center justify-between group"
                  >
                    <div>
                      <span className="font-mono text-xs font-bold text-cyan-400 group-hover:text-cyan-300">
                        {b.batch_id}
                      </span>
                      <p className="text-[11px] text-slate-300 mt-0.5">{b.batch_name}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-1 transition" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-[11px] text-slate-400">
            <p className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Real-time digital report compiled on query</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
