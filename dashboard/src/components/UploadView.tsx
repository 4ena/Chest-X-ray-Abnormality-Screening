"use client";

import { useState, useRef } from "react";
import { Upload, FileImage, Loader2, AlertTriangle, Info } from "lucide-react";
import { motion } from "framer-motion";

const MOCK_RESULTS = [
  { pathology: "Lung Opacity", confidence: 0.82, severity: "critical" as const },
  { pathology: "Pleural Effusion", confidence: 0.64, severity: "moderate" as const },
  { pathology: "Atelectasis", confidence: 0.41, severity: "mild" as const },
  { pathology: "Cardiomegaly", confidence: 0.23, severity: "normal" as const },
];

export default function UploadView() {
  const [dragging, setDragging] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState<typeof MOCK_RESULTS | null>(null);
  const [fileName, setFileName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(file: File) {
    setFileName(file.name);
    setAnalyzing(true);
    setResults(null);
    setTimeout(() => {
      setAnalyzing(false);
      setResults(MOCK_RESULTS);
    }, 2000);
  }

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

      {analyzing && (
        <div className="mt-6 bg-white rounded-2xl border border-border p-6 text-center">
          <Loader2 size={24} className="mx-auto mb-2 animate-spin text-accent" />
          <p className="text-sm text-muted">Analyzing {fileName}...</p>
        </div>
      )}

      {results && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 bg-white rounded-2xl border border-border p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <FileImage size={16} className="text-accent" />
            <h3 className="text-sm font-semibold">Analysis Results</h3>
            <span className="text-xs text-muted ml-auto">{fileName}</span>
          </div>
          <div className="space-y-3">
            {results.map((r, i) => {
              const pct = Math.round(r.confidence * 100);
              return (
                <div key={r.pathology} className="flex items-center gap-3">
                  {r.severity === "critical" ? (
                    <AlertTriangle size={13} className="text-critical flex-shrink-0" />
                  ) : (
                    <Info size={13} className="text-muted flex-shrink-0" />
                  )}
                  <span className="text-sm font-medium flex-1">{r.pathology}</span>
                  <div className="w-20 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.6, delay: i * 0.1 }}
                      className={`h-full rounded-full ${
                        pct >= 70 ? "bg-critical" : pct >= 45 ? "bg-moderate" : pct >= 25 ? "bg-mild" : "bg-normal"
                      }`}
                    />
                  </div>
                  <span className={`text-xs font-bold ${
                    pct >= 70 ? "text-critical" : pct >= 45 ? "text-moderate" : "text-muted"
                  }`}>{pct}%</span>
                </div>
              );
            })}
          </div>
          <p className="text-[11px] text-muted mt-4 pt-3 border-t border-border">
            Demo results — connect the ML backend for real inference.
          </p>
        </motion.div>
      )}
    </div>
  );
}
