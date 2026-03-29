"use client";

import { useState, useRef } from "react";
import { Upload, FileImage, Loader2, AlertTriangle, Activity, Check, ArrowRight } from "lucide-react";
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
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(file: File) {
    setFileName(file.name);
    setAnalyzing(true);
    setResults(null);
    setInserted(false);
    setTimeout(() => {
      setAnalyzing(false);
      setResults(MOCK_RESULTS);
      // Simulate insertion into triage queue
      setTimeout(() => setInserted(true), 800);
    }, 2000);
  }

  const highestTier = results ? Math.min(...results.filter(r => r.confidence >= 0.3).map(r => r.tier)) as 2 | 3 | 4 : 4;
  const detectedCount = results ? results.filter(r => r.confidence >= 0.3).length : 0;

  return (
    <div className="p-6 max-w-xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold tracking-tight">Upload X-ray</h1>
        <p className="text-sm text-muted mt-1">Analyze a new chest radiograph</p>
      </div>

      <div
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); }}
        onClick={() => inputRef.current?.click()}
        className={`rounded-2xl border-2 border-dashed p-12 text-center cursor-pointer transition-all ${
          dragging ? "border-accent bg-accent-light scale-[1.01]" : "border-border hover:border-muted bg-white"
        }`}
      >
        <Upload size={36} className="mx-auto mb-3 text-muted/40" />
        <h3 className="text-base font-semibold mb-1">Drop chest X-ray here</h3>
        <p className="text-sm text-muted">or click to browse (PNG, JPG, DICOM)</p>
        <input ref={inputRef} type="file" accept=".png,.jpg,.jpeg,.dcm" hidden onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} />
      </div>

      {/* Analyzing spinner */}
      <AnimatePresence>
        {analyzing && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-6 bg-white rounded-2xl border border-border p-6 text-center"
          >
            <Loader2 size={24} className="mx-auto mb-2 animate-spin text-accent" />
            <p className="text-sm font-medium text-foreground">Analyzing {fileName}...</p>
            <p className="text-xs text-muted mt-1">Running DenseNet-121 inference on 5 conditions</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results */}
      <AnimatePresence>
        {results && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 space-y-4"
          >
            {/* Summary card with pulse */}
            <motion.div
              className="bg-white rounded-2xl border p-4 flex items-center justify-between"
              style={{ borderColor: TIER_COLORS[highestTier] + "40" }}
              animate={inserted ? {} : { boxShadow: [`0 0 0 0px ${TIER_COLORS[highestTier]}30`, `0 0 0 8px ${TIER_COLORS[highestTier]}00`] }}
              transition={{ duration: 1.2, repeat: inserted ? 0 : Infinity }}
            >
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
                  <p className="text-sm font-semibold text-foreground">
                    {detectedCount} finding{detectedCount !== 1 ? "s" : ""} detected
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[9px] font-bold tracking-wide px-1.5 py-0.5 rounded"
                      style={{ color: TIER_COLORS[highestTier], backgroundColor: `${TIER_COLORS[highestTier]}12` }}>
                      TIER {highestTier} — {TIER_LABELS[highestTier]}
                    </span>
                    {inserted && (
                      <motion.span
                        initial={{ opacity: 0, x: -5 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-[10px] text-green-600 font-medium flex items-center gap-0.5"
                      >
                        <Check size={10} /> Added to triage queue
                      </motion.span>
                    )}
                  </div>
                </div>
              </div>

              {inserted && onViewTriage && (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onClick={onViewTriage}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-foreground text-white text-xs font-medium hover:bg-foreground/90 transition-colors"
                >
                  View in Queue <ArrowRight size={12} />
                </motion.button>
              )}
            </motion.div>

            {/* Condition bars */}
            <div className="bg-white rounded-2xl border border-border p-5">
              <div className="flex items-center gap-2 mb-4">
                <FileImage size={16} className="text-accent" />
                <h3 className="text-sm font-semibold">Analysis Results</h3>
                <span className="text-xs text-muted ml-auto">{fileName}</span>
              </div>
              <div className="space-y-3">
                {results.map((r, i) => {
                  const pct = Math.round(r.confidence * 100);
                  const color = TIER_COLORS[r.tier];
                  const detected = pct >= 30;

                  return (
                    <div key={r.pathology} className={`flex items-center gap-3 ${!detected ? "opacity-40" : ""}`}>
                      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: detected ? color : "#e2e8f0" }} />
                      <span className={`text-sm flex-1 ${detected ? "font-medium text-foreground" : "text-muted"}`}>{r.pathology}</span>
                      {detected && (
                        <span className="text-[8px] font-bold tracking-wide px-1 py-0.5 rounded"
                          style={{ color, backgroundColor: `${color}12` }}>
                          {TIER_LABELS[r.tier]}
                        </span>
                      )}
                      <div className="w-24 h-2 rounded-full bg-gray-100 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.6, delay: i * 0.1 }}
                          className="h-full rounded-full"
                          style={{ backgroundColor: detected ? color : "#e2e8f0" }}
                        />
                      </div>
                      <span className="text-xs font-bold w-8 text-right" style={{ color: detected ? color : "#cbd5e1" }}>{pct}%</span>
                    </div>
                  );
                })}
              </div>
              <p className="text-[11px] text-muted mt-4 pt-3 border-t border-border">
                Demo results — connect the ML backend for real inference.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
