"use client";

import { useState, useRef } from "react";
import { Upload, FileImage, Loader2, AlertTriangle, Activity, Check, ArrowRight, ImageIcon, User, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { patients } from "@/data/mock";
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
  const [selectedPatient, setSelectedPatient] = useState<string>("");
  const [patientName, setPatientName] = useState("");
  const [patientAge, setPatientAge] = useState("");
  const [patientSex, setPatientSex] = useState("Male");
  const [reasonForExam, setReasonForExam] = useState("");
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
    <div className="px-8 py-8 h-[calc(100vh-64px)] overflow-y-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Upload X-ray</h1>
        <p className="text-sm text-gray-400 mt-1">Analyze a new chest radiograph</p>
      </div>

      {!hasResults ? (
        /* ── Upload + patient info side by side ── */
        <div className="grid grid-cols-[1fr_320px] gap-6">
          {/* Left: upload area */}
          <div>
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

          {/* Right: patient info form */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User size={14} className="text-gray-400" />
              Patient Information
            </h3>

            {/* Select existing patient */}
            <div className="mb-4">
              <label className="text-xs text-gray-400 block mb-1.5">Assign to Existing Patient</label>
              <div className="relative">
                <select
                  value={selectedPatient}
                  onChange={(e) => {
                    setSelectedPatient(e.target.value);
                    if (e.target.value) {
                      const p = patients.find(pt => pt.id === Number(e.target.value));
                      if (p) { setPatientName(p.name); setPatientAge(String(p.age)); setPatientSex(p.sex); }
                    }
                  }}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10 appearance-none"
                >
                  <option value="">— New Patient —</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>{p.name} (P{String(p.id).padStart(3, "0")})</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div className="border-t border-gray-100 pt-4 space-y-3">
              <div>
                <label className="text-xs text-gray-400 block mb-1">Full Name</label>
                <input type="text" value={patientName} onChange={e => setPatientName(e.target.value)} placeholder="Enter patient name"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 bg-white text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900/10" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Age</label>
                  <input type="number" value={patientAge} onChange={e => setPatientAge(e.target.value)} placeholder="Age"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 bg-white text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900/10" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 block mb-1">Sex</label>
                  <select value={patientSex} onChange={e => setPatientSex(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10">
                    <option>Male</option>
                    <option>Female</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Reason for Exam</label>
                <input type="text" value={reasonForExam} onChange={e => setReasonForExam(e.target.value)} placeholder="e.g., Shortness of breath, r/o CHF"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 bg-white text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900/10" />
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ── Results: X-ray preview (left) + analysis + patient info (right) ── */
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-[1fr_1fr] gap-6" style={{ height: "calc(100vh - 180px)" }}>

          {/* Left: X-ray preview (constrained to viewport) */}
          <div className="bg-gray-950 rounded-2xl overflow-hidden relative flex items-center justify-center">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Uploaded X-ray"
                className="max-w-full max-h-full object-contain"
                style={{ filter: "brightness(1.1) contrast(1.1)" }}
              />
            ) : (
              <ImageIcon size={48} className="text-gray-700" />
            )}

            <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm text-white text-[11px] font-medium px-3 py-1.5 rounded-lg">
              {fileName}
            </div>
            <div className="absolute top-4 right-4 flex items-center gap-2">
              <span className="bg-black/60 backdrop-blur-sm text-white text-[11px] font-medium px-3 py-1.5 rounded-lg">
                Frontal · AP
              </span>
              {inserted && (
                <motion.span initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                  className="bg-emerald-500/90 text-white text-[11px] font-medium px-3 py-1.5 rounded-lg flex items-center gap-1">
                  <Check size={12} /> Analyzed
                </motion.span>
              )}
            </div>

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

          {/* Right: results + patient info */}
          <div className="overflow-y-auto space-y-4">
            {/* Summary */}
            <motion.div className="bg-white rounded-2xl border p-4" style={{ borderColor: `${TIER_COLORS[highestTier]}40` }}
              animate={inserted ? {} : { boxShadow: [`0 0 0 0px ${TIER_COLORS[highestTier]}30`, `0 0 0 8px ${TIER_COLORS[highestTier]}00`] }}
              transition={{ duration: 1.2, repeat: inserted ? 0 : Infinity }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {highestTier === 2 ? (
                    <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center"><AlertTriangle size={16} className="text-red-500" /></div>
                  ) : (
                    <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center"><Activity size={16} className="text-amber-500" /></div>
                  )}
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{detectedCount} finding{detectedCount !== 1 ? "s" : ""} detected</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[9px] font-bold tracking-wide px-1.5 py-0.5 rounded"
                        style={{ color: TIER_COLORS[highestTier], backgroundColor: `${TIER_COLORS[highestTier]}12` }}>
                        {TIER_LABELS[highestTier]}
                      </span>
                      {inserted && (
                        <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[10px] text-emerald-600 font-medium flex items-center gap-0.5">
                          <Check size={10} /> Added to queue
                        </motion.span>
                      )}
                    </div>
                  </div>
                </div>
                {inserted && onViewTriage && (
                  <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={onViewTriage}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-900 text-white text-xs font-medium hover:bg-gray-800 transition-colors">
                    View in Queue <ArrowRight size={12} />
                  </motion.button>
                )}
              </div>
            </motion.div>

            {/* Condition bars */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex items-center gap-2 mb-4">
                <FileImage size={14} className="text-gray-400" />
                <h3 className="text-sm font-semibold text-gray-900">Analysis Results</h3>
              </div>
              <div className="space-y-2.5">
                {results.map((r, i) => {
                  const pct = Math.round(r.confidence * 100);
                  const color = TIER_COLORS[r.tier];
                  const detected = pct >= 30;
                  return (
                    <div key={r.pathology} className={`flex items-center gap-3 ${!detected ? "opacity-40" : ""}`}>
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: detected ? color : "#e5e7eb" }} />
                      <span className={`text-sm w-28 ${detected ? "font-medium text-gray-900" : "text-gray-400"}`}>{r.pathology}</span>
                      {detected ? (
                        <span className="text-[9px] font-bold tracking-wide px-1.5 py-0.5 rounded w-16 text-center"
                          style={{ color, backgroundColor: `${color}12` }}>{TIER_LABELS[r.tier]}</span>
                      ) : <span className="w-16" />}
                      <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.6, delay: i * 0.1 }}
                          className="h-full rounded-full" style={{ backgroundColor: detected ? color : "#e5e7eb" }} />
                      </div>
                      <span className="text-sm font-semibold w-10 text-right" style={{ color: detected ? color : "#d1d5db" }}>{pct}%</span>
                    </div>
                  );
                })}
              </div>
              <p className="text-[11px] text-gray-400 mt-4 pt-3 border-t border-gray-50">Demo results — connect the ML backend for real inference.</p>
            </div>

            {/* Patient info (filled from form or existing patient) */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <User size={14} className="text-gray-400" />
                Patient Details
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-400">Name</span><span className="font-medium text-gray-900">{patientName || "Not specified"}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Age</span><span className="font-medium text-gray-900">{patientAge || "—"}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Sex</span><span className="font-medium text-gray-900">{patientSex}</span></div>
                {reasonForExam && <div className="flex justify-between"><span className="text-gray-400">Reason</span><span className="font-medium text-gray-900 text-right max-w-48">{reasonForExam}</span></div>}
              </div>
            </div>

            <button onClick={() => { setResults(null); setPreviewUrl(null); setInserted(false); setFileName(""); }}
              className="w-full py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
              Upload Another X-ray
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
