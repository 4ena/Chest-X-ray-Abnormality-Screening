"use client";

import { useState, useRef } from "react";
import { Upload, FileImage, Loader2, AlertTriangle, Activity, Check, ArrowRight, ImageIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { TIER_COLORS, TIER_LABELS } from "@/lib/constants";

const MOCK_RESULTS = [
  { pathology: "Edema", confidence: 0.82, tier: 2 },
  { pathology: "Pleural Effusion", confidence: 0.64, tier: 3 },
  { pathology: "Atelectasis", confidence: 0.41, tier: 4 },
  { pathology: "Cardiomegaly", confidence: 0.23, tier: 3 },
  { pathology: "Consolidation", confidence: 0.11, tier: 2 },
];

interface UploadViewProps {
  onViewTriage?: () => void;
}

export default function UploadView({ onViewTriage }: UploadViewProps) {
  const [dragging, setDragging] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState<typeof MOCK_RESULTS | null>(null);
  const [fileName, setFileName] = useState("");
  const [inserted, setInserted] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(file: File) {
    setFileName(file.name);
    setPreviewUrl(URL.createObjectURL(file));
    setAnalyzing(true);
    setResults(null);
    setInserted(false);
    setTimeout(() => {
      setAnalyzing(false);
      setResults(MOCK_RESULTS);
      setTimeout(() => setInserted(true), 800);
    }, 2000);
  }

  const highestTier = results ? Math.min(...results.filter(r => r.confidence >= 0.3).map(r => r.tier)) as 2 | 3 | 4 : 4;
  const detectedCount = results ? results.filter(r => r.confidence >= 0.3).length : 0;
  const hasResults = results !== null;

  return (
    <div className="px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Upload X-ray</h1>
        <p className="text-sm text-gray-400 mt-1">Analyze a new chest radiograph</p>
      </div>

      {!hasResults ? (
        /* ── Upload state (no results yet) ── */
        <div className="max-w-xl">
          <div
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={e => { e.preventDefault(); setDragging(false); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); }}
            onClick={() => inputRef.current?.click()}
            className={`rounded-2xl border-2 border-dashed p-16 text-center cursor-pointer transition-all ${
              dragging ? "border-gray-900 bg-gray-50 scale-[1.01]" : "border-gray-200 hover:border-gray-400 bg-white"
            }`}
          >
            <Upload size={40} className="mx-auto mb-4 text-gray-300" />
            <h3 className="text-base font-semibold text-gray-900 mb-1">Drop chest X-ray here</h3>
            <p className="text-sm text-gray-400">or click to browse (PNG, JPG, DICOM)</p>
            <input ref={inputRef} type="file" accept=".png,.jpg,.jpeg,.dcm" hidden onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} />
          </div>

          {/* Analyzing spinner */}
          <AnimatePresence>
            {analyzing && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="mt-6 bg-white rounded-2xl border border-gray-100 p-6 text-center">
                <Loader2 size={24} className="mx-auto mb-2 animate-spin text-gray-400" />
                <p className="text-sm font-medium text-gray-900">Analyzing {fileName}...</p>
                <p className="text-xs text-gray-400 mt-1">Running inference on 5 conditions</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ) : (
        /* ── Results state: side-by-side X-ray preview + analysis ── */
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-[1fr_1fr] gap-6">

          {/* Left: X-ray preview (dark panel, inspired by radiology viewer) */}
          <div className="bg-gray-950 rounded-2xl overflow-hidden relative" style={{ minHeight: 500 }}>
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Uploaded X-ray"
                className="w-full h-full object-contain"
                style={{ filter: "brightness(1.1) contrast(1.1)" }}
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <ImageIcon size={48} className="text-gray-700" />
              </div>
            )}

            {/* Overlay badges */}
            <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm text-white text-[11px] font-medium px-3 py-1.5 rounded-lg">
              {fileName}
            </div>
            <div className="absolute top-4 right-4 flex items-center gap-2">
              <span className="bg-black/60 backdrop-blur-sm text-white text-[11px] font-medium px-3 py-1.5 rounded-lg">
                Frontal · AP
              </span>
              {inserted && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-emerald-500/90 text-white text-[11px] font-medium px-3 py-1.5 rounded-lg flex items-center gap-1"
                >
                  <Check size={12} /> Analyzed
                </motion.span>
              )}
            </div>

            {/* Severity indicator at bottom */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/60 text-xs">Severity Score</p>
                  <p className="text-white text-2xl font-bold">{detectedCount} findings</p>
                </div>
                <span className="text-[10px] font-bold tracking-wide px-2.5 py-1 rounded"
                  style={{ color: TIER_COLORS[highestTier], backgroundColor: `${TIER_COLORS[highestTier]}25` }}>
                  TIER {highestTier} — {TIER_LABELS[highestTier]}
                </span>
              </div>
            </div>
          </div>

          {/* Right: Analysis results + actions */}
          <div className="space-y-4">
            {/* Summary card */}
            <motion.div
              className="bg-white rounded-2xl border p-5"
              style={{ borderColor: `${TIER_COLORS[highestTier]}40` }}
              animate={inserted ? {} : { boxShadow: [`0 0 0 0px ${TIER_COLORS[highestTier]}30`, `0 0 0 8px ${TIER_COLORS[highestTier]}00`] }}
              transition={{ duration: 1.2, repeat: inserted ? 0 : Infinity }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {highestTier === 2 ? (
                    <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                      <AlertTriangle size={18} className="text-red-500" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                      <Activity size={18} className="text-amber-500" />
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{detectedCount} finding{detectedCount !== 1 ? "s" : ""} detected</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[9px] font-bold tracking-wide px-1.5 py-0.5 rounded"
                        style={{ color: TIER_COLORS[highestTier], backgroundColor: `${TIER_COLORS[highestTier]}12` }}>
                        {TIER_LABELS[highestTier]}
                      </span>
                      {inserted && (
                        <motion.span initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }}
                          className="text-[10px] text-emerald-600 font-medium flex items-center gap-0.5">
                          <Check size={10} /> Added to triage queue
                        </motion.span>
                      )}
                    </div>
                  </div>
                </div>
                {inserted && onViewTriage && (
                  <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={onViewTriage}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors">
                    View in Queue <ArrowRight size={14} />
                  </motion.button>
                )}
              </div>
            </motion.div>

            {/* Condition bars */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex items-center gap-2 mb-5">
                <FileImage size={16} className="text-gray-400" />
                <h3 className="text-sm font-semibold text-gray-900">Analysis Results</h3>
                <span className="text-xs text-gray-400 ml-auto">{fileName}</span>
              </div>
              <div className="space-y-3">
                {results.map((r, i) => {
                  const pct = Math.round(r.confidence * 100);
                  const color = TIER_COLORS[r.tier];
                  const detected = pct >= 30;

                  return (
                    <div key={r.pathology} className={`flex items-center gap-4 ${!detected ? "opacity-40" : ""}`}>
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: detected ? color : "#e5e7eb" }} />
                      <span className={`text-sm w-32 ${detected ? "font-medium text-gray-900" : "text-gray-400"}`}>{r.pathology}</span>
                      {detected && (
                        <span className="text-[9px] font-bold tracking-wide px-1.5 py-0.5 rounded w-16 text-center"
                          style={{ color, backgroundColor: `${color}12` }}>
                          {TIER_LABELS[r.tier]}
                        </span>
                      )}
                      {!detected && <span className="w-16" />}
                      <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.6, delay: i * 0.1 }}
                          className="h-full rounded-full"
                          style={{ backgroundColor: detected ? color : "#e5e7eb" }}
                        />
                      </div>
                      <span className="text-sm font-semibold w-10 text-right" style={{ color: detected ? color : "#d1d5db" }}>{pct}%</span>
                    </div>
                  );
                })}
              </div>
              <p className="text-[11px] text-gray-400 mt-5 pt-4 border-t border-gray-50">
                Demo results — connect the ML backend for real inference.
              </p>
            </div>

            {/* Upload another */}
            <button
              onClick={() => { setResults(null); setPreviewUrl(null); setInserted(false); setFileName(""); }}
              className="w-full py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Upload Another X-ray
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
