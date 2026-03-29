"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import {
  ZoomIn, ZoomOut, RotateCw, Eye, EyeOff,
  Lightbulb, Stethoscope, ImageIcon, AlertTriangle, ChevronDown,
  Check, X, Flag, ClipboardCopy,
} from "lucide-react";
import type { Patient, Finding } from "@/data/mock";
import { PATHOLOGY_REGIONS, ACTIVE_CONDITIONS } from "@/data/mock";
import { TIER_COLORS, TIER_LABELS } from "@/lib/constants";

interface XrayViewerProps {
  patient: Patient;
  selectedFinding: Finding | null;
  onSelectFinding: (f: Finding) => void;
}

export default function XrayViewer({ patient, selectedFinding, onSelectFinding }: XrayViewerProps) {
  const viewerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [viewMode, setViewMode] = useState<"xray" | "data">("xray");
  const [heatmapOpacity, setHeatmapOpacity] = useState(0.55);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [viewerSize, setViewerSize] = useState({ w: 1000, h: 700 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  // X-ray gets 70%+ of the width — cards are compact on the sides
  const cardWidth = 185;
  const cardMargin = 12;
  const imgAreaLeft = cardWidth + cardMargin * 2;
  const imgAreaRight = viewerSize.w - cardWidth - cardMargin * 2;
  const imgAreaWidth = imgAreaRight - imgAreaLeft;
  const summaryHeight = 52;
  const imgAreaTop = 60 + summaryHeight;
  const imgAreaBottom = viewerSize.h - 56;
  const imgAreaHeight = Math.max(imgAreaBottom - imgAreaTop, 200);

  // Highest tier finding
  const highestTier = Math.min(...patient.findings.map(f => f.tier)) as 2 | 3 | 4;
  const topFinding = patient.findings[0];

  useEffect(() => {
    const el = viewerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setViewerSize({ w: entry.contentRect.width, h: entry.contentRect.height });
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    setImageLoaded(false);
    setImageError(false);
  }, [patient.id]);

  // Draw heatmap overlay
  const drawHeatmap = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = viewerSize.w * dpr;
    canvas.height = viewerSize.h * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, viewerSize.w, viewerSize.h);

    if (!showHeatmap) return;

    for (const finding of patient.findings) {
      const region = PATHOLOGY_REGIONS[finding.pathology];
      if (!region) continue;

      const cx = imgAreaLeft + region.x * imgAreaWidth;
      const cy = imgAreaTop + region.y * imgAreaHeight;
      const radiusX = region.rx * imgAreaWidth;
      const radiusY = region.ry * imgAreaHeight;
      const color = TIER_COLORS[finding.tier] || "#3b82f6";
      const isSelected = selectedFinding?.pathology === finding.pathology;
      const alpha = heatmapOpacity * (isSelected ? 1.3 : 0.7);

      // Glow
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(radiusX, radiusY) * 2);
      grad.addColorStop(0, `${color}${Math.round(alpha * 50).toString(16).padStart(2, "0")}`);
      grad.addColorStop(0.4, `${color}${Math.round(alpha * 25).toString(16).padStart(2, "0")}`);
      grad.addColorStop(1, `${color}00`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(cx, cy, radiusX * 2, radiusY * 2, 0, 0, Math.PI * 2);
      ctx.fill();

      // Core
      ctx.beginPath();
      ctx.ellipse(cx, cy, radiusX, radiusY, 0, 0, Math.PI * 2);
      ctx.fillStyle = `${color}${Math.round(alpha * 35).toString(16).padStart(2, "0")}`;
      ctx.fill();
      ctx.strokeStyle = isSelected ? color : `${color}66`;
      ctx.lineWidth = isSelected ? 2.5 : 1;
      ctx.setLineDash(isSelected ? [] : [5, 4]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Dot
      ctx.beginPath();
      ctx.arc(cx, cy, isSelected ? 6 : 4, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }, [patient.findings, showHeatmap, heatmapOpacity, selectedFinding, viewerSize, imgAreaLeft, imgAreaWidth, imgAreaTop, imgAreaHeight]);

  useEffect(() => { drawHeatmap(); }, [drawHeatmap]);

  // Split findings left/right
  const leftFindings = patient.findings.filter(f => PATHOLOGY_REGIONS[f.pathology]?.side === "left");
  const rightFindings = patient.findings.filter(f => PATHOLOGY_REGIONS[f.pathology]?.side === "right");

  function getCardPositions(findings: Finding[]) {
    const cardH = 80;
    const gap = 8;
    const sorted = [...findings].sort((a, b) => {
      const ra = PATHOLOGY_REGIONS[a.pathology];
      const rb = PATHOLOGY_REGIONS[b.pathology];
      return (ra?.y || 0) - (rb?.y || 0);
    });
    const positions = sorted.map(f => {
      const r = PATHOLOGY_REGIONS[f.pathology];
      const idealY = imgAreaTop + (r?.y || 0.5) * imgAreaHeight - cardH / 2;
      return { finding: f, y: Math.max(imgAreaTop, Math.min(viewerSize.h - 120, idealY)) };
    });
    for (let i = 1; i < positions.length; i++) {
      if (positions[i].y < positions[i - 1].y + cardH + gap) {
        positions[i].y = positions[i - 1].y + cardH + gap;
      }
    }
    return positions;
  }

  const leftPositions = getCardPositions(leftFindings);
  const rightPositions = getCardPositions(rightFindings);

  if (viewMode === "data") {
    return (
      <div className="flex flex-col h-full bg-white">
        <SummaryBar patient={patient} highestTier={highestTier} />
        <div className="flex items-center justify-end px-6 py-2 border-b border-border">
          <ViewToggle viewMode={viewMode} setViewMode={setViewMode} />
        </div>
        <DataView patient={patient} selectedFinding={selectedFinding} />
      </div>
    );
  }

  return (
    <div
      ref={viewerRef}
      className="relative flex-1 h-full overflow-hidden"
      style={{ background: "linear-gradient(135deg, #f5f7fc 0%, #eef1f8 40%, #e8ecf5 100%)" }}
    >
      {/* ── Summary bar ── */}
      <div className="absolute top-0 left-0 right-0 z-30">
        <SummaryBar patient={patient} highestTier={highestTier} />
      </div>

      {/* ── View toggle (top right, below summary) ── */}
      <div className="absolute z-30 right-4" style={{ top: summaryHeight + 8 }}>
        <ViewToggle viewMode={viewMode} setViewMode={setViewMode} />
      </div>

      {/* ── X-ray image ── */}
      <div
        className="absolute flex items-center justify-center"
        style={{ left: imgAreaLeft, top: imgAreaTop, width: imgAreaWidth, height: imgAreaHeight }}
      >
        {!imageError ? (
          <img
            src={patient.xrayImageUrl}
            alt={`Chest X-ray for ${patient.name}`}
            className={`max-w-full max-h-full object-contain rounded-2xl transition-opacity duration-700 ${
              imageLoaded ? "opacity-100" : "opacity-0"
            }`}
            style={{ filter: "brightness(1.1) contrast(1.15)", boxShadow: "0 8px 40px rgba(0,0,0,0.12)", transform: `scale(${zoom}) rotate(${rotation}deg)`, transition: "transform 0.3s ease" }}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-white/60 rounded-2xl border border-border">
            <ImageIcon size={48} className="text-gray-300 mb-3" />
            <p className="text-sm text-muted">X-ray image unavailable</p>
          </div>
        )}
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-10 h-10 border-3 border-accent/30 border-t-accent rounded-full animate-spin" />
          </div>
        )}
        {imageLoaded && (
          <div className="absolute top-3 left-3 bg-white/80 backdrop-blur-sm text-foreground text-[11px] font-medium px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
            {patient.view} &middot; {patient.apPa}
          </div>
        )}
      </div>

      {/* ── Heatmap canvas ── */}
      <canvas
        ref={canvasRef}
        style={{ width: viewerSize.w, height: viewerSize.h }}
        className="absolute inset-0 pointer-events-none z-10"
      />

      {/* ── SVG annotation lines ── */}
      <svg className="absolute inset-0 pointer-events-none z-20" width={viewerSize.w} height={viewerSize.h} viewBox={`0 0 ${viewerSize.w} ${viewerSize.h}`}>
        {showHeatmap && [...leftPositions, ...rightPositions].map(({ finding, y }) => {
          const region = PATHOLOGY_REGIONS[finding.pathology];
          if (!region) return null;
          const mx = imgAreaLeft + region.x * imgAreaWidth;
          const my = imgAreaTop + region.y * imgAreaHeight;
          const isLeft = region.side === "left";
          const cardEdgeX = isLeft ? cardWidth + cardMargin : viewerSize.w - cardWidth - cardMargin;
          const cardCenterY = y + 40;
          const color = TIER_COLORS[finding.tier] || "#3b82f6";
          const isSelected = selectedFinding?.pathology === finding.pathology;
          const cpOffset = isLeft ? -50 : 50;

          return (
            <g key={finding.pathology} opacity={isSelected ? 1 : 0.45}>
              <path
                d={`M ${mx} ${my} C ${mx + cpOffset} ${my}, ${cardEdgeX - cpOffset} ${cardCenterY}, ${cardEdgeX} ${cardCenterY}`}
                fill="none" stroke={color} strokeWidth={isSelected ? 2 : 1} strokeDasharray={isSelected ? "none" : "5 4"}
              />
              <circle cx={mx} cy={my} r={isSelected ? 5 : 3} fill={color} stroke="#fff" strokeWidth={1.5} />
              <circle cx={cardEdgeX} cy={cardCenterY} r={3} fill={color} opacity={0.6} />
            </g>
          );
        })}
      </svg>

      {/* ── Left annotation cards ── */}
      {leftPositions.map(({ finding, y }) => (
        <div key={finding.pathology} className="absolute z-30" style={{ left: cardMargin, top: y, width: cardWidth }}>
          <CompactAnnotationCard finding={finding} isSelected={selectedFinding?.pathology === finding.pathology} onClick={() => onSelectFinding(finding)} side="left" />
        </div>
      ))}

      {/* ── Right annotation cards ── */}
      {rightPositions.map(({ finding, y }) => (
        <div key={finding.pathology} className="absolute z-30" style={{ right: cardMargin, top: y, width: cardWidth }}>
          <CompactAnnotationCard finding={finding} isSelected={selectedFinding?.pathology === finding.pathology} onClick={() => onSelectFinding(finding)} side="right" />
        </div>
      ))}

      {/* ── Bottom toolbar ── */}
      <div className="absolute bottom-0 left-0 right-0 z-30 flex items-center justify-center py-3">
        <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-2xl px-4 py-2 shadow-lg shadow-black/5 border border-border/50">
          <button
            onClick={() => setShowHeatmap(!showHeatmap)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              showHeatmap ? "bg-accent text-white shadow-sm" : "bg-panel-bg text-muted hover:text-foreground"
            }`}
          >
            {showHeatmap ? <Eye size={14} /> : <EyeOff size={14} />}
            Heatmap
          </button>
          {showHeatmap && (
            <input type="range" min={0.15} max={1} step={0.05} value={heatmapOpacity}
              onChange={(e) => setHeatmapOpacity(parseFloat(e.target.value))} className="w-16 accent-accent" />
          )}
          <div className="w-px h-5 bg-border" />
          <button
            onClick={() => setRotation(r => (r + 90) % 360)}
            className="p-2 rounded-xl text-muted hover:text-foreground hover:bg-panel-bg transition-colors" title="Rotate 90°"
          ><RotateCw size={14} /></button>
          <button
            onClick={() => setZoom(z => Math.min(z + 0.2, 3))}
            className="p-2 rounded-xl text-muted hover:text-foreground hover:bg-panel-bg transition-colors" title="Zoom In"
          ><ZoomIn size={14} /></button>
          <button
            onClick={() => setZoom(z => Math.max(z - 0.2, 0.5))}
            className="p-2 rounded-xl text-muted hover:text-foreground hover:bg-panel-bg transition-colors" title="Zoom Out"
          ><ZoomOut size={14} /></button>
          {(zoom !== 1 || rotation !== 0) && (
            <button
              onClick={() => { setZoom(1); setRotation(0); }}
              className="px-2 py-1 rounded-xl text-[10px] font-medium text-accent hover:bg-accent/5 transition-colors" title="Reset view"
            >Reset</button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Summary Bar — clean single line, no truncated stats ── */
function SummaryBar({ patient, highestTier }: { patient: Patient; highestTier: 2 | 3 | 4 }) {
  const topFinding = patient.findings[0];
  const color = TIER_COLORS[highestTier];
  const label = TIER_LABELS[highestTier];
  const count = patient.findings.filter(f => f.confidence >= 0.3).length;

  return (
    <div className="flex items-center gap-3 px-5 py-2.5 bg-white/90 backdrop-blur-sm border-b border-border/50">
      {highestTier === 2 && <AlertTriangle size={14} style={{ color }} />}
      <span className="text-sm font-semibold text-foreground">
        {count} finding{count !== 1 ? "s" : ""} detected
      </span>
      <span className="text-muted">—</span>
      <span className="text-sm text-muted">
        Highest: <span className="font-semibold text-foreground">{topFinding?.pathology}</span>
        {" "}
        <span className="font-bold" style={{ color }}>{Math.round((topFinding?.confidence || 0) * 100)}%</span>
      </span>
      <span className="text-[9px] font-bold tracking-wide px-1.5 py-0.5 rounded" style={{ color, backgroundColor: `${color}12` }}>
        TIER {highestTier} — {label}
      </span>
    </div>
  );
}

/* ── Annotation Callout Card with CSS arrow pointer ── */
function CompactAnnotationCard({ finding, isSelected, onClick, side }: { finding: Finding; isSelected: boolean; onClick: () => void; side: "left" | "right" }) {
  const color = TIER_COLORS[finding.tier] || "#3b82f6";
  const [expanded, setExpanded] = useState(false);
  const [status, setStatus] = useState<"pending" | "confirmed" | "dismissed">("pending");
  const [flagged, setFlagged] = useState(false);
  const [copied, setCopied] = useState(false);

  const isDismissed = status === "dismissed";
  const activeColor = isDismissed ? "#cbd5e1" : color;

  return (
    <div className="relative" onClick={onClick}>
      {/* CSS arrow pointing toward the X-ray */}
      <div
        className="absolute top-1/2 -translate-y-1/2 w-0 h-0"
        style={{
          [side === "left" ? "right" : "left"]: -7,
          borderTop: "7px solid transparent",
          borderBottom: "7px solid transparent",
          [side === "left" ? "borderLeft" : "borderRight"]: `7px solid ${isSelected ? "#ffffff" : "rgba(255,255,255,0.88)"}`,
          filter: isSelected ? "drop-shadow(1px 0 2px rgba(0,0,0,0.06))" : "none",
        }}
      />

      {/* Card body */}
      <div
        className={`rounded-xl cursor-pointer transition-all duration-200 overflow-hidden ${
          isDismissed ? "opacity-50" : ""
        } ${
          isSelected
            ? "bg-white shadow-xl shadow-black/8 ring-1 ring-black/5 scale-[1.02]"
            : "bg-white/88 backdrop-blur-sm shadow-md shadow-black/5 hover:bg-white hover:shadow-lg"
        }`}
      >
        {/* Colored top accent bar */}
        <div className="h-[3px]" style={{ backgroundColor: activeColor }} />

        <div className="p-2.5">
          {/* Name + confidence */}
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: activeColor }} />
              <h4 className={`text-[11px] font-bold text-foreground ${isDismissed ? "line-through text-muted" : ""}`}>
                {finding.pathology}
              </h4>
              {status === "confirmed" && <Check size={9} className="text-green-500" />}
            </div>
            <span className="text-[12px] font-bold" style={{ color: activeColor }}>
              {Math.round(finding.confidence * 100)}%
            </span>
          </div>

          {/* Tier badge + expand */}
          <div className="flex items-center justify-between">
            <span
              className="text-[8px] font-bold tracking-wider px-1.5 py-0.5 rounded-sm"
              style={{ color: isDismissed ? "#94a3b8" : color, backgroundColor: isDismissed ? "#f1f5f9" : `${color}12` }}
            >
              {TIER_LABELS[finding.tier]}
            </span>
            <button
              onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
              className="text-muted hover:text-foreground p-0.5"
            >
              <ChevronDown size={10} className={`transition-transform duration-200 ${expanded ? "rotate-180" : ""}`} />
            </button>
          </div>

          {/* Expanded details + actions */}
          {expanded && (
            <div className="mt-2 pt-2 border-t border-border/40">
              <p className="text-[9px] text-muted leading-relaxed mb-2">
                {finding.explanation.split(". ")[0]}.
              </p>

              <div className="flex flex-wrap items-center gap-1">
                <button
                  onClick={(e) => { e.stopPropagation(); setStatus(status === "confirmed" ? "pending" : "confirmed"); }}
                  className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[8px] font-medium transition-all ${
                    status === "confirmed" ? "bg-green-100 text-green-700" : "bg-gray-50 text-muted hover:bg-green-50 hover:text-green-600"
                  }`}
                  title="Confirm finding"
                >
                  <Check size={8} />
                  {status === "confirmed" ? "Confirmed" : "Confirm"}
                </button>

                <button
                  onClick={(e) => { e.stopPropagation(); setStatus(status === "dismissed" ? "pending" : "dismissed"); }}
                  className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[8px] font-medium transition-all ${
                    status === "dismissed" ? "bg-gray-200 text-gray-600" : "bg-gray-50 text-muted hover:bg-gray-100"
                  }`}
                  title="Dismiss finding"
                >
                  <X size={8} />
                  Dismiss
                </button>

                <button
                  onClick={(e) => { e.stopPropagation(); setFlagged(!flagged); }}
                  className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[8px] font-medium transition-all ${
                    flagged ? "bg-amber-100 text-amber-700" : "bg-gray-50 text-muted hover:bg-amber-50 hover:text-amber-600"
                  }`}
                  title="Flag for second opinion"
                >
                  <Flag size={8} />
                  {flagged ? "Flagged" : "Flag"}
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigator.clipboard.writeText(`${finding.pathology}: ${Math.round(finding.confidence * 100)}% confidence. ${finding.clinicalNote}`);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1500);
                  }}
                  className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[8px] font-medium transition-all ${
                    copied ? "bg-accent/10 text-accent" : "bg-gray-50 text-muted hover:bg-accent/5 hover:text-accent"
                  }`}
                  title="Copy to report"
                >
                  <ClipboardCopy size={8} />
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── View Toggle ── */
function ViewToggle({ viewMode, setViewMode }: { viewMode: string; setViewMode: (v: "xray" | "data") => void }) {
  return (
    <div className="flex items-center gap-1 bg-white/90 backdrop-blur-sm rounded-xl p-1 shadow-sm border border-border/50">
      <button onClick={() => setViewMode("xray")} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${viewMode === "xray" ? "bg-foreground text-white shadow-sm" : "text-muted hover:text-foreground"}`}>X-ray View</button>
      <button onClick={() => setViewMode("data")} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${viewMode === "data" ? "bg-foreground text-white shadow-sm" : "text-muted hover:text-foreground"}`}>Data View</button>
    </div>
  );
}

/* ── Data View ── */
function DataView({ patient, selectedFinding }: { patient: Patient; selectedFinding: Finding | null }) {
  const finding = selectedFinding || patient.findings[0];

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      {finding ? (
        <div className="max-w-2xl mx-auto space-y-5">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full" style={{ background: TIER_COLORS[finding.tier] }} />
            <h3 className="text-xl font-bold text-foreground">{finding.pathology}</h3>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ color: TIER_COLORS[finding.tier], background: `${TIER_COLORS[finding.tier]}15` }}>
              {Math.round(finding.confidence * 100)}%
            </span>
            <span className="text-[9px] font-bold tracking-wide px-2 py-0.5 rounded" style={{ color: TIER_COLORS[finding.tier], background: `${TIER_COLORS[finding.tier]}12` }}>
              TIER {finding.tier} — {TIER_LABELS[finding.tier]}
            </span>
          </div>

          <div className="bg-panel-bg rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3"><Lightbulb size={16} className="text-accent" /><h4 className="text-sm font-semibold text-foreground">Why AI Flagged This</h4></div>
            <p className="text-sm text-muted leading-relaxed">{finding.explanation}</p>
          </div>

          <div className="bg-panel-bg rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3"><Stethoscope size={16} className="text-accent" /><h4 className="text-sm font-semibold text-foreground">Clinical Recommendation</h4></div>
            <p className="text-sm text-muted leading-relaxed">{finding.clinicalNote}</p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3">All Detected Findings</h4>
            <div className="space-y-2">
              {patient.findings.map((f) => (
                <div key={f.pathology} className="flex items-center justify-between p-3.5 bg-panel-bg rounded-xl">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: TIER_COLORS[f.tier] }} />
                    <span className="text-sm font-medium text-foreground">{f.pathology}</span>
                    <span className="text-[9px] font-bold tracking-wide px-1.5 py-0.5 rounded" style={{ color: TIER_COLORS[f.tier], background: `${TIER_COLORS[f.tier]}12` }}>
                      {TIER_LABELS[f.tier]}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-28 h-2 bg-border rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${Math.round(f.confidence * 100)}%`, background: TIER_COLORS[f.tier] }} />
                    </div>
                    <span className="text-xs font-bold w-10 text-right" style={{ color: TIER_COLORS[f.tier] }}>{Math.round(f.confidence * 100)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center h-full text-muted text-sm">No findings to display</div>
      )}
    </div>
  );
}
