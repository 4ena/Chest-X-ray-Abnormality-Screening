"use client";

import { useState, useRef } from "react";
import { Upload, FileImage, Loader2, AlertTriangle, Activity, Check, ArrowRight, ImageIcon, User, ChevronDown, Save } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { TIER_COLORS, TIER_LABELS } from "@/lib/constants";
import type { Patient, Finding } from "@/data/mock";

interface UploadViewProps {
  onViewTriage?: () => void;
  onPredict: (file: File) => Promise<{ predictions: Finding[]; usingMock: boolean }>;
  onSave: (data: { file: File; name: string; age: number; sex: "Male" | "Female"; reasonForExam: string; findings: Finding[] }) => Promise<string>;
  existingPatients: Patient[];
}

export default function UploadView({ onViewTriage, onPredict, onSave, existingPatients }: UploadViewProps) {
  const [dragging, setDragging] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState<Finding[] | null>(null);
  const [fileName, setFileName] = useState("");
  const [savedId, setSavedId] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<string>("");
  const [patientName, setPatientName] = useState("");
  const [patientAge, setPatientAge] = useState("");
  const [patientSex, setPatientSex] = useState<"Male" | "Female">("Male");
  const [reasonForExam, setReasonForExam] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [usingMock, setUsingMock] = useState(false);
  const [analysisTime, setAnalysisTime] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Step 1: Upload and predict only (no save)
  async function handleFile(file: File) {
    setError(null);
    setFileName(file.name);
    setPreviewUrl(URL.createObjectURL(file));
    setUploadedFile(file);
    setAnalyzing(true);
    setResults(null);
    setSavedId(null);

    const startTime = performance.now();
    try {
      const { predictions, usingMock: mock } = await onPredict(file);
      setResults(predictions);
      setUsingMock(mock);
      setAnalysisTime(Math.round(performance.now() - startTime));
    } catch {
      setError("Analysis failed. Please try again.");
    }
    setAnalyzing(false);
  }

  // Step 2: Save (user clicks Save button)
  async function handleSave() {
    if (!patientName.trim() || !patientAge.trim()) {
      setError("Please fill in patient name and age to save.");
      return;
    }
    if (!uploadedFile || !results) return;
    setError(null);
    setSaving(true);

    try {
      const patientId = await onSave({
        file: uploadedFile,
        name: patientName.trim(),
        age: parseInt(patientAge),
        sex: patientSex,
        reasonForExam,
        findings: results,
      });
      setSavedId(patientId);
    } catch {
      setError("Failed to save patient. Please try again.");
    }
    setSaving(false);
  }

  const hasResults = results !== null;
  const detectedFindings = results?.filter(f => f.confidence >= 0.5) || [];
  const highestTier = detectedFindings.length > 0
    ? Math.min(...detectedFindings.map(f => f.tier)) as 2 | 3 | 4
    : 4;

  function reset() {
    setResults(null);
    setPreviewUrl(null);
    setSavedId(null);
    setFileName("");
    setUploadedFile(null);
    setError(null);
    setUsingMock(false);
    setAnalysisTime(null);
    setSaving(false);
  }

  return (
    <div className="max-w-screen-2xl mx-auto px-8 py-8 h-[calc(100vh-64px)] overflow-y-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Upload X-ray</h1>
        <p className="text-sm text-muted mt-1">Analyze a new chest radiograph</p>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-status-red-subtle border border-status-red/20 text-sm text-status-red">
          {error}
        </div>
      )}

      {!hasResults ? (
        <div className="grid grid-cols-[1fr_320px] gap-6">
          {/* Upload area */}
          <div>
            <div
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={e => { e.preventDefault(); setDragging(false); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); }}
              onClick={() => inputRef.current?.click()}
              className={`rounded-2xl border-2 border-dashed p-16 text-center cursor-pointer transition-all ${
                dragging ? "border-accent bg-panel-bg scale-[1.01]" : "border-border hover:border-muted bg-card"
              }`}
            >
              <Upload size={40} className="mx-auto mb-4 text-muted/50" />
              <h3 className="text-base font-semibold text-foreground mb-1">Drop chest X-ray here</h3>
              <p className="text-sm text-muted">or click to browse (PNG, JPG, DICOM)</p>
              <input ref={inputRef} type="file" accept=".png,.jpg,.jpeg,.dcm" hidden onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} />
            </div>

            <AnimatePresence>
              {analyzing && (
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="mt-6 bg-card rounded-2xl border border-border p-6 text-center">
                  <Loader2 size={24} className="mx-auto mb-2 animate-spin text-muted" />
                  <p className="text-sm font-medium text-foreground">Analyzing {fileName}...</p>
                  <p className="text-xs text-muted mt-1">Sending to API for inference</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Patient info form */}
          <div className="bg-card rounded-2xl border border-border p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <User size={14} className="text-muted" />
              Patient Information
            </h3>

            <div className="mb-4">
              <label className="text-xs text-muted block mb-1.5">Assign to Existing Patient</label>
              <div className="relative">
                <select value={selectedPatient}
                  onChange={(e) => {
                    setSelectedPatient(e.target.value);
                    if (e.target.value) {
                      const p = existingPatients.find(pt => pt.id === Number(e.target.value));
                      if (p) { setPatientName(p.name); setPatientAge(String(p.age)); setPatientSex(p.sex); }
                    }
                  }}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-accent/10 appearance-none">
                  <option value="">— New Patient —</option>
                  {existingPatients.map(p => (
                    <option key={p.id} value={p.id}>{p.name} (P{String(p.id).padStart(3, "0")})</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
              </div>
            </div>

            <div className="border-t border-border pt-4 space-y-3">
              <div>
                <label className="text-xs text-muted block mb-1">Full Name <span className="text-red-400">*</span></label>
                <input type="text" value={patientName} onChange={e => setPatientName(e.target.value)} placeholder="Enter patient name"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-card text-foreground placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent/10" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted block mb-1">Age <span className="text-red-400">*</span></label>
                  <input type="number" value={patientAge} onChange={e => setPatientAge(e.target.value)} placeholder="Age"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-card text-foreground placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent/10" />
                </div>
                <div>
                  <label className="text-xs text-muted block mb-1">Sex <span className="text-red-400">*</span></label>
                  <select value={patientSex} onChange={e => setPatientSex(e.target.value as "Male" | "Female")}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-accent/10">
                    <option>Male</option>
                    <option>Female</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-muted block mb-1">Reason for Exam</label>
                <input type="text" value={reasonForExam} onChange={e => setReasonForExam(e.target.value)} placeholder="e.g., Shortness of breath, r/o CHF"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-card text-foreground placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent/10" />
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ── Results ── */
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-[1fr_1fr] gap-6" style={{ height: "calc(100vh - 180px)" }}>

          {/* Left: X-ray preview */}
          <div className="bg-gray-950 rounded-2xl overflow-hidden relative flex items-center justify-center">
            {previewUrl && (
              <img src={previewUrl} alt="Uploaded X-ray" className="max-w-full max-h-full object-contain"
                style={{ filter: "brightness(1.1) contrast(1.1)" }} />
            )}
            <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm text-white text-[11px] font-medium px-3 py-1.5 rounded-lg">
              {fileName}
            </div>
            {savedId && (
              <div className="absolute top-4 right-4 bg-emerald-500/90 text-white text-[11px] font-medium px-3 py-1.5 rounded-lg flex items-center gap-1">
                <Check size={12} /> Saved as {savedId}
              </div>
            )}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/60 text-xs">Results</p>
                  <p className="text-white text-2xl font-bold">{detectedFindings.length} findings</p>
                </div>
                <span className="text-[10px] font-bold tracking-wide px-2.5 py-1 rounded"
                  style={{ color: TIER_COLORS[highestTier], backgroundColor: `${TIER_COLORS[highestTier]}25` }}>
                  TIER {highestTier} — {TIER_LABELS[highestTier]}
                </span>
              </div>
            </div>
          </div>

          {/* Right: results + patient info + save */}
          <div className="overflow-y-auto space-y-4">
            {/* Summary */}
            <div className="bg-card rounded-2xl border border-border p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {highestTier === 2 ? (
                  <div className="w-9 h-9 rounded-xl bg-status-red-subtle flex items-center justify-center"><AlertTriangle size={16} className="text-status-red" /></div>
                ) : (
                  <div className="w-9 h-9 rounded-xl bg-status-amber-subtle flex items-center justify-center"><Activity size={16} className="text-status-amber" /></div>
                )}
                <div>
                  <p className="text-sm font-semibold text-foreground">{detectedFindings.length} finding{detectedFindings.length !== 1 ? "s" : ""} detected</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-[10px] font-medium ${usingMock ? "text-status-amber" : "text-status-emerald"}`}>
                      {usingMock ? "Mock predictions (no model loaded)" : "Real model inference"}
                    </span>
                    {analysisTime && <span className="text-[10px] text-muted">{analysisTime}ms</span>}
                  </div>
                </div>
              </div>
              {savedId && onViewTriage && (
                <button onClick={onViewTriage}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent text-background text-xs font-medium hover:opacity-90 transition-colors">
                  View in Queue <ArrowRight size={12} />
                </button>
              )}
            </div>

            {/* Condition bars */}
            <div className="bg-card rounded-2xl border border-border p-5">
              <div className="flex items-center gap-2 mb-4">
                <FileImage size={14} className="text-muted" />
                <h3 className="text-sm font-semibold text-foreground">Analysis Results</h3>
              </div>
              <div className="space-y-2.5">
                {results.map((r, i) => {
                  const pct = Math.round(r.confidence * 100);
                  const color = TIER_COLORS[r.tier];
                  const detected = pct >= 50;
                  return (
                    <div key={r.pathology} className={`flex items-center gap-3 ${!detected ? "opacity-40" : ""}`}>
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: detected ? color : "var(--border)" }} />
                      <span className={`text-sm w-28 ${detected ? "font-medium text-foreground" : "text-muted"}`}>{r.pathology}</span>
                      {detected ? (
                        <span className="text-[9px] font-bold tracking-wide px-1.5 py-0.5 rounded w-16 text-center"
                          style={{ color, backgroundColor: `${color}12` }}>{TIER_LABELS[r.tier]}</span>
                      ) : <span className="w-16" />}
                      <div className="flex-1 h-2 rounded-full bg-accent-light overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.6, delay: i * 0.1 }}
                          className="h-full rounded-full" style={{ backgroundColor: detected ? color : "var(--border)" }} />
                      </div>
                      <span className="text-sm font-semibold w-10 text-right" style={{ color: detected ? color : "var(--muted)" }}>{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Patient details — editable before save */}
            <div className="bg-card rounded-2xl border border-border p-5">
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <User size={14} className="text-muted" /> Patient Details
              </h3>
              {!savedId ? (
                <>
                  <div className="space-y-3 mb-4">
                    <div>
                      <label className="text-xs text-muted block mb-1">Name <span className="text-red-400">*</span></label>
                      <input type="text" value={patientName} onChange={e => setPatientName(e.target.value)} placeholder="Patient name"
                        className="w-full px-3 py-1.5 text-sm rounded-lg border border-border bg-card text-foreground placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent/10" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-muted block mb-1">Age <span className="text-red-400">*</span></label>
                        <input type="number" value={patientAge} onChange={e => setPatientAge(e.target.value)}
                          className="w-full px-3 py-1.5 text-sm rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-accent/10" />
                      </div>
                      <div>
                        <label className="text-xs text-muted block mb-1">Sex <span className="text-red-400">*</span></label>
                        <select value={patientSex} onChange={e => setPatientSex(e.target.value as "Male" | "Female")}
                          className="w-full px-3 py-1.5 text-sm rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-accent/10">
                          <option>Male</option>
                          <option>Female</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-muted block mb-1">Reason for Exam</label>
                      <input type="text" value={reasonForExam} onChange={e => setReasonForExam(e.target.value)} placeholder="Clinical indication"
                        className="w-full px-3 py-1.5 text-sm rounded-lg border border-border bg-card text-foreground placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent/10" />
                    </div>
                  </div>
                  <button
                    onClick={handleSave}
                    disabled={saving || !patientName.trim() || !patientAge.trim()}
                    className="w-full py-2.5 rounded-xl bg-accent text-background text-sm font-medium hover:opacity-90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                    {saving ? "Saving..." : "Save Patient Record"}
                  </button>
                </>
              ) : (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted">Name</span><span className="font-medium text-foreground">{patientName}</span></div>
                  <div className="flex justify-between"><span className="text-muted">Age</span><span className="font-medium text-foreground">{patientAge}</span></div>
                  <div className="flex justify-between"><span className="text-muted">Sex</span><span className="font-medium text-foreground">{patientSex}</span></div>
                  {reasonForExam && <div className="flex justify-between"><span className="text-muted">Reason</span><span className="font-medium text-foreground text-right max-w-48">{reasonForExam}</span></div>}
                  <div className="flex justify-between"><span className="text-muted">Patient ID</span><span className="font-medium text-status-emerald">{savedId}</span></div>
                  <div className="mt-3 p-2 rounded-lg bg-status-emerald-subtle text-status-emerald text-xs font-medium flex items-center gap-1.5">
                    <Check size={12} /> Patient saved successfully
                  </div>
                </div>
              )}
            </div>

            <button onClick={reset}
              className="w-full py-2.5 rounded-xl border border-border text-sm font-medium text-muted hover:bg-panel-bg transition-colors">
              Upload Another X-ray
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
