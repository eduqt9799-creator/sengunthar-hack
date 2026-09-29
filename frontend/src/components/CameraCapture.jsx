import React, { useRef, useState, useEffect } from 'react';
import { Camera, RefreshCw, Check, AlertCircle, VideoOff, FlipHorizontal } from 'lucide-react';

export default function CameraCapture({ onCapture, onCancel }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [error, setError] = useState(null);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [isMirrored, setIsMirrored] = useState(false);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    try {
      setError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'environment'
        },
        audio: false
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error('Camera access error:', err);
      setError('Unable to access video capture device. Please check camera permissions.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
  };

  const takeSnapshot = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;

      const ctx = canvas.getContext('2d');
      if (isMirrored) {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      canvas.toBlob((blob) => {
        const file = new File([blob], `camera_capture_${Date.now()}.jpg`, { type: 'image/jpeg' });
        const url = URL.createObjectURL(blob);
        setCapturedPhoto({ file, url });
      }, 'image/jpeg', 0.92);
    }
  };

  const retake = () => {
    setCapturedPhoto(null);
  };

  const confirmCapture = () => {
    if (capturedPhoto?.file) {
      stopCamera();
      onCapture(capturedPhoto.file);
    }
  };

  return (
    <div className="glass-panel p-6 rounded-2xl border border-slate-700 max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Camera className="w-5 h-5 text-cyan-400" />
          <h3 className="font-bold text-slate-100 text-sm">Industrial Camera Capture Feed</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsMirrored(!isMirrored)}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-xs"
            title="Mirror View"
          >
            <FlipHorizontal className="w-4 h-4" />
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={() => { stopCamera(); onCancel(); }}
              className="text-xs text-slate-400 hover:text-slate-200 px-2 py-1"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {error ? (
        <div className="p-8 text-center bg-rose-950/30 border border-rose-800/60 rounded-xl space-y-3">
          <VideoOff className="w-10 h-10 text-rose-400 mx-auto" />
          <p className="text-sm font-semibold text-rose-200">{error}</p>
          <button
            type="button"
            onClick={startCamera}
            className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition"
          >
            Retry Camera
          </button>
        </div>
      ) : (
        <div className="relative aspect-video bg-black rounded-xl overflow-hidden border border-slate-800 shadow-inner flex items-center justify-center">
          {capturedPhoto ? (
            <img
              src={capturedPhoto.url}
              alt="Captured Frame"
              className="w-full h-full object-contain"
            />
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-contain ${isMirrored ? 'scale-x-[-1]' : ''}`}
              />
              {/* Inspection Optical Grid Overlay */}
              <div className="absolute inset-0 pointer-events-none border-2 border-cyan-500/20 grid grid-cols-3 grid-rows-3">
                <div className="border-r border-b border-cyan-500/15" />
                <div className="border-r border-b border-cyan-500/15" />
                <div className="border-b border-cyan-500/15" />
                <div className="border-r border-b border-cyan-500/15" />
                <div className="border-r border-b border-cyan-500/30 flex items-center justify-center">
                  <div className="w-12 h-12 border border-cyan-400/40 rounded-full" />
                </div>
                <div className="border-b border-cyan-500/15" />
                <div className="border-r border-cyan-500/15" />
                <div className="border-r border-cyan-500/15" />
                <div />
              </div>
              {/* Scan radar line */}
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-radar pointer-events-none" />
            </>
          )}
        </div>
      )}

      {/* Hidden canvas for snapshot rasterization */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Action Controls */}
      <div className="flex items-center justify-center gap-4 pt-2">
        {capturedPhoto ? (
          <>
            <button
              type="button"
              onClick={retake}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Retake Capture</span>
            </button>
            <button
              type="button"
              onClick={confirmCapture}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 transition"
            >
              <Check className="w-4 h-4" />
              <span>Use This Image for AI Inspection</span>
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={takeSnapshot}
            disabled={!!error}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs shadow-lg shadow-cyan-500/25 transition disabled:opacity-50"
          >
            <Camera className="w-4 h-4" />
            <span>Trigger Shutter Capture</span>
          </button>
        )}
      </div>
    </div>
  );
}
