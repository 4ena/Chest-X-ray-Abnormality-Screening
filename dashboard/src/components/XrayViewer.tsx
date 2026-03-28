"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import {
  ZoomIn, ZoomOut, RotateCw, Layers, Eye, EyeOff,
  Lightbulb, Stethoscope, ImageIcon, MoreHorizontal,
} from "lucide-react";
import type { Patient, Finding } from "@/data/mock";
import { PATHOLOGY_REGIONS } from "@/data/mock";

interface XrayViewerProps {
  patient: Patient;
  selectedFinding: Finding | null;
  onSelectFinding: (f: Finding) => void;
}

const SEVERITY_COLORS: Record<string, string> = {
  critical: "#ef4444",
  moderate: "#f59e0b",
  mild: "#eab308",
  normal: "#22c55e",
};

const SEVERITY_LINE_COLORS: Record<string, string> = {
  critical: "#ef4444",
  moderate: "#f59e0b",
  mild: "#d97706",
  normal: "#16a34a",
};

export default function XrayViewer({ patient, selectedFinding, onSelectFinding }: XrayViewerProps) {
  const viewerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [viewMode, setViewMode] = useState<"xray" | "data">("xray");
  const [heatmapOpacity, setHeatmapOpacity] = useState(0.55);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [viewerSize, setViewerSize] = useState({ w: 1000, h: 700 });

  // The image area is the central portion of the viewer
  // Left/right margins are reserved for annotation cards
  const cardWidth = 220;
  const cardMargin = 16;
  const imgAreaLeft = cardWidth + cardMargin * 2;
  const imgAreaRight = viewerSize.w - cardWidth - cardMargin * 2;
  const imgAreaWidth = imgAreaRight - imgAreaLeft;
  const imgAreaCx = imgAreaLeft + imgAreaWidth / 2;
  const imgAreaTop = 80;
  const imgAreaBottom = viewerSize.h - 60;
  const imgAreaHeight = imgAreaBottom - imgAreaTop;

  // Track viewer dimensions
  useEffect(() => {
    const el = viewerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setViewerSize({
          w: entry.contentRect.width,
          h: entry.contentRect.height,
        });
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Reset image state when patient changes
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
      const color = SEVERITY_COLORS[finding.severity];
      const isSelected = selectedFinding?.pathology === finding.pathology;
      const alpha = heatmapOpacity * (isSelected ? 1.3 : 0.7);

      // Outer glow
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(radiusX, radiusY) * 2);
      grad.addColorStop(0, `${color}${Math.round(alpha * 50).toString(16).padStart(2, "0")}`);
      grad.addColorStop(0.4, `${color}${Math.round(alpha * 25).toString(16).padStart(2, "0")}`);
      grad.addColorStop(1, `${color}00`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(cx, cy, radiusX * 2, radiusY * 2, 0, 0, Math.PI * 2);
      ctx.fill();

      // Core region
      ctx.beginPath();
      ctx.ellipse(cx, cy, radiusX, radiusY, 0, 0, Math.PI * 2);
      ctx.fillStyle = `${color}${Math.round(alpha * 35).toString(16).padStart(2, "0")}`;
      ctx.fill();
      ctx.strokeStyle = isSelected ? color : `${color}66`;
      ctx.lineWidth = isSelected ? 2.5 : 1;
      ctx.setLineDash(isSelected ? [] : [5, 4]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Center dot
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

  // Split findings into left/right for annotation positioning
  const leftFindings = patient.findings.filter(f => {
    const r = PATHOLOGY_REGIONS[f.pathology];
    return r && r.side === "left";
  });
  const rightFindings = patient.findings.filter(f => {
    const r = PATHOLOGY_REGIONS[f.pathology];
    return r && r.side === "right";
  });

  // Calculate card Y positions (spread evenly, anchored near their pathology region)
  function getCardPositions(findings: Finding[], containerHeight: number) {
    const minY = 100;
    const maxY = containerHeight - 200;
    const cardH = 140;
    const gap = 12;

    if (findings.length === 0) return [];

    // Sort by pathology y-position
    const sorted = [...findings].sort((a, b) => {
      const ra = PATHOLOGY_REGIONS[a.pathology];
      const rb = PATHOLOGY_REGIONS[b.pathology];
      return (ra?.y || 0) - (rb?.y || 0);
    });

    // Calculate ideal y based on pathology position, then resolve overlaps
    const positions = sorted.map(f => {
      const r = PATHOLOGY_REGIONS[f.pathology];
      const idealY = imgAreaTop + (r?.y || 0.5) * imgAreaHeight - cardH / 2;
      return { finding: f, y: Math.max(minY, Math.min(maxY - cardH, idealY)) };
    });

    // Resolve overlaps
    for (let i = 1; i < positions.length; i++) {
      const prev = positions[i - 1];
      const curr = positions[i];
      if (curr.y < prev.y + cardH + gap) {
        curr.y = prev.y + cardH + gap;
      }
    }

    return positions;
  }

  const leftPositions = getCardPositions(leftFindings, viewerSize.h);
  const rightPositions = getCardPositions(rightFindings, viewerSize.h);

  if (viewMode === "data") {
    return (
      <div className="flex flex-col h-full bg-white">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <p className="text-[11px] text-muted uppercase tracking-wider">Scan Analysis</p>
            <h2 className="text-xl font-bold text-foreground mt-0.5">Patient&apos;s Overview</h2>
          </div>
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
      style={{
        background: "linear-gradient(135deg, #f5f7fc 0%, #eef1f8 40%, #e8ecf5 100%)",
      }}
    >
      {/* ── X-ray image fills center ── */}
      <div
        className="absolute flex items-center justify-center"
        style={{
          left: imgAreaLeft,
          top: imgAreaTop,
          width: imgAreaWidth,
          height: imgAreaHeight,
        }}
      >
        {!imageError ? (
          <img
            src={patient.xrayImageUrl}
            alt={`Chest X-ray for ${patient.name}`}
            className={`max-w-full max-h-full object-contain rounded-2xl transition-opacity duration-700 ${
              imageLoaded ? "opacity-100" : "opacity-0"
            }`}
            style={{
              filter: "brightness(1.1) contrast(1.05)",
              boxShadow: "0 8px 40px rgba(0,0,0,0.12)",
            }}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-white/60 rounded-2xl border border-border">
            <ImageIcon size={56} className="text-gray-300 mb-3" />
            <p className="text-sm text-muted">X-ray image unavailable</p>
            <p className="text-xs text-muted mt-1">Upload or select another patient</p>
          </div>
        )}

        {/* Loading spinner */}
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-10 h-10 border-3 border-accent/30 border-t-accent rounded-full animate-spin" />
          </div>
        )}

        {/* Image info badge */}
        {imageLoaded && (
          <div className="absolute top-4 left-4 bg-white/80 backdrop-blur-sm text-foreground text-[11px] font-medium px-3 py-1.5 rounded-lg flex items-center gap-2 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            {patient.view} &middot; {patient.apPa}
          </div>
        )}
      </div>

      {/* ── Heatmap canvas overlay ── */}
      <canvas
        ref={canvasRef}
        style={{ width: viewerSize.w, height: viewerSize.h }}
        className="absolute inset-0 pointer-events-none z-10"
      />

      {/* ── SVG annotation lines ── */}
      <svg
        className="absolute inset-0 pointer-events-none z-20"
        width={viewerSize.w}
        height={viewerSize.h}
        viewBox={`0 0 ${viewerSize.w} ${viewerSize.h}`}
      >
        {showHeatmap && leftPositions.map(({ finding, y }) => {
          const region = PATHOLOGY_REGIONS[finding.pathology];
          if (!region) return null;
          const markerX = imgAreaLeft + region.x * imgAreaWidth;
          const markerY = imgAreaTop + region.y * imgAreaHeight;
          const cardEdgeX = cardWidth + cardMargin;
          const cardCenterY = y + 70;
          const color = SEVERITY_LINE_COLORS[finding.severity];
          const isSelected = selectedFinding?.pathology === finding.pathology;

          return (
            <g key={finding.pathology} opacity={isSelected ? 1 : 0.5}>
              {/* Line from marker to card */}
              <path
                d={`M ${markerX} ${markerY} C ${markerX - 60} ${markerY}, ${cardEdgeX + 60} ${cardCenterY}, ${cardEdgeX} ${cardCenterY}`}
                fill="none"
                stroke={color}
                strokeWidth={isSelected ? 2 : 1.2}
                strokeDasharray={isSelected ? "none" : "6 4"}
              />
              {/* Endpoint circles */}
              <circle cx={markerX} cy={markerY} r={isSelected ? 5 : 3.5} fill={color} stroke="#fff" strokeWidth={2} />
              <circle cx={cardEdgeX} cy={cardCenterY} r={4} fill={color} opacity={0.7} />
            </g>
          );
        })}
        {showHeatmap && rightPositions.map(({ finding, y }) => {
          const region = PATHOLOGY_REGIONS[finding.pathology];
          if (!region) return null;
          const markerX = imgAreaLeft + region.x * imgAreaWidth;
          const markerY = imgAreaTop + region.y * imgAreaHeight;
          const cardEdgeX = viewerSize.w - cardWidth - cardMargin;
          const cardCenterY = y + 70;
          const color = SEVERITY_LINE_COLORS[finding.severity];
          const isSelected = selectedFinding?.pathology === finding.pathology;

          return (
            <g key={finding.pathology} opacity={isSelected ? 1 : 0.5}>
              <path
                d={`M ${markerX} ${markerY} C ${markerX + 60} ${markerY}, ${cardEdgeX - 60} ${cardCenterY}, ${cardEdgeX} ${cardCenterY}`}
                fill="none"
                stroke={color}
                strokeWidth={isSelected ? 2 : 1.2}
                strokeDasharray={isSelected ? "none" : "6 4"}
              />
              <circle cx={markerX} cy={markerY} r={isSelected ? 5 : 3.5} fill={color} stroke="#fff" strokeWidth={2} />
              <circle cx={cardEdgeX} cy={cardCenterY} r={4} fill={color} opacity={0.7} />
            </g>
          );
        })}
      </svg>

      {/* ── Left annotation cards ── */}
      {leftPositions.map(({ finding, y }) => (
        <div
          key={finding.pathology}
          className="absolute z-30"
          style={{ left: cardMargin, top: y, width: cardWidth }}
        >
          <AnnotationCard
            finding={finding}
            isSelected={selectedFinding?.pathology === finding.pathology}
            onClick={() => onSelectFinding(finding)}
          />
        </div>
      ))}

      {/* ── Right annotation cards ── */}
      {rightPositions.map(({ finding, y }) => (
        <div
          key={finding.pathology}
          className="absolute z-30"
          style={{ right: cardMargin, top: y, width: cardWidth }}
        >
          <AnnotationCard
            finding={finding}
            isSelected={selectedFinding?.pathology === finding.pathology}
            onClick={() => onSelectFinding(finding)}
          />
        </div>
      ))}

      {/* ── Overlaid header ── */}
      <div className="absolute top-0 left-0 right-0 z-30 flex items-start justify-between px-6 pt-5 pointer-events-none">
        <div>
          <p className="text-[11px] text-muted uppercase tracking-wider font-medium">Scan Analysis</p>
          <h2 className="text-xl font-bold text-foreground mt-0.5">Patient&apos;s Overview</h2>
        </div>
        <div className="pointer-events-auto">
          <ViewToggle viewMode={viewMode} setViewMode={setViewMode} />
        </div>
      </div>

      {/* ── Overlaid bottom toolbar ── */}
      <div className="absolute bottom-0 left-0 right-0 z-30 flex items-center justify-center gap-3 py-4">
        <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-2xl px-4 py-2.5 shadow-lg shadow-black/5 border border-border/50">
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
            <input
              type="range"
              min={0.15}
              max={1}
              step={0.05}
              value={heatmapOpacity}
              onChange={(e) => setHeatmapOpacity(parseFloat(e.target.value))}
              className="w-16 accent-accent"
            />
          )}
          <div className="w-px h-5 bg-border" />
          <button className="p-2 rounded-xl text-muted hover:text-foreground hover:bg-panel-bg transition-colors" title="Layers">
            <Layers size={14} />
          </button>
          <button className="p-2 rounded-xl text-muted hover:text-foreground hover:bg-panel-bg transition-colors" title="Rotate">
            <RotateCw size={14} />
          </button>
          <button className="p-2 rounded-xl text-muted hover:text-foreground hover:bg-panel-bg transition-colors" title="Zoom In">
            <ZoomIn size={14} />
          </button>
          <button className="p-2 rounded-xl text-muted hover:text-foreground hover:bg-panel-bg transition-colors" title="Zoom Out">
            <ZoomOut size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── View Toggle ── */
function ViewToggle({ viewMode, setViewMode }: { viewMode: string; setViewMode: (v: "xray" | "data") => void }) {
  return (
    <div className="flex items-center gap-1 bg-white/90 backdrop-blur-sm rounded-xl p-1 shadow-sm border border-border/50">
      <button
        onClick={() => setViewMode("xray")}
        className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
          viewMode === "xray" ? "bg-foreground text-white shadow-sm" : "text-muted hover:text-foreground"
        }`}
      >
        X-ray View
      </button>
      <button
        onClick={() => setViewMode("data")}
        className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
          viewMode === "data" ? "bg-foreground text-white shadow-sm" : "text-muted hover:text-foreground"
        }`}
      >
        Data View
      </button>
    </div>
  );
}

/* ── Annotation Card (matches Tahes.io style) ── */
function AnnotationCard({
  finding,
  isSelected,
  onClick,
}: {
  finding: Finding;
  isSelected: boolean;
  onClick: () => void;
}) {
  const borderColor =
    finding.severity === "critical" ? "border-l-critical" :
    finding.severity === "moderate" ? "border-l-moderate" :
    finding.severity === "mild" ? "border-l-mild" : "border-l-normal";

  const dotColor = SEVERITY_COLORS[finding.severity];

  return (
    <div
      onClick={onClick}
      className={`border-l-[3px] ${borderColor} rounded-xl p-3.5 cursor-pointer transition-all duration-200 ${
        isSelected
          ? "bg-white shadow-xl shadow-black/8 ring-1 ring-black/5 scale-[1.03]"
          : "bg-white/85 backdrop-blur-sm shadow-md shadow-black/5 hover:bg-white hover:shadow-lg hover:scale-[1.01]"
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: dotColor }} />
          <h4 className="text-[12px] font-bold text-foreground leading-tight">{finding.pathology}</h4>
        </div>
        <button className="text-muted hover:text-foreground flex-shrink-0 ml-1" onClick={(e) => e.stopPropagation()}>
          <MoreHorizontal size={14} />
        </button>
      </div>

      {/* Description */}
      <p className="text-[10.5px] text-muted leading-relaxed mb-2.5 line-clamp-3 pl-4">
        {finding.explanation.split(". ").slice(0, 2).join(". ")}.
      </p>

      {/* Footer: severity + confidence */}
      <div className="flex items-center justify-between pl-4">
        <span className="text-[9px] font-bold text-muted uppercase tracking-wide">{finding.severity}</span>
        <span className="text-[11px] font-bold" style={{ color: dotColor }}>
          {Math.round(finding.confidence * 100)}%
        </span>
      </div>
    </div>
  );
}

/* ── Data View ── */
function DataView({ patient, selectedFinding }: { patient: Patient; selectedFinding: Finding | null }) {
  const finding = selectedFinding || patient.findings[0];

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      {finding ? (
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full" style={{ background: SEVERITY_COLORS[finding.severity] }} />
            <h3 className="text-xl font-bold text-foreground">{finding.pathology}</h3>
            <span
              className="text-xs font-bold px-2.5 py-1 rounded-full"
              style={{ color: SEVERITY_COLORS[finding.severity], background: `${SEVERITY_COLORS[finding.severity]}15` }}
            >
              {Math.round(finding.confidence * 100)}% confidence
            </span>
          </div>

          <div className="bg-panel-bg rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb size={16} className="text-accent" />
              <h4 className="text-sm font-semibold text-foreground">Why AI Flagged This</h4>
            </div>
            <p className="text-sm text-muted leading-relaxed">{finding.explanation}</p>
          </div>

          <div className="bg-panel-bg rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Stethoscope size={16} className="text-accent" />
              <h4 className="text-sm font-semibold text-foreground">Clinical Recommendation</h4>
            </div>
            <p className="text-sm text-muted leading-relaxed">{finding.clinicalNote}</p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3">All Detected Findings</h4>
            <div className="space-y-2">
              {patient.findings.map((f) => (
                <div key={f.pathology} className="flex items-center justify-between p-3.5 bg-panel-bg rounded-xl">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: SEVERITY_COLORS[f.severity] }} />
                    <span className="text-sm font-medium text-foreground">{f.pathology}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-28 h-2 bg-border rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${Math.round(f.confidence * 100)}%`, background: SEVERITY_COLORS[f.severity] }}
                      />
                    </div>
                    <span className="text-xs font-bold w-10 text-right" style={{ color: SEVERITY_COLORS[f.severity] }}>
                      {Math.round(f.confidence * 100)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center h-full text-muted text-sm">
          No findings to display
        </div>
      )}
    </div>
  );
}
