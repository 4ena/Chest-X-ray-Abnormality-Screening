"use client";

import { useState, useEffect } from "react";
import { MoreHorizontal, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import type { Finding } from "@/data/mock";
import { ACTIVE_CONDITIONS } from "@/data/mock";

interface DiagnoseNotesProps {
  findings: Finding[];
  onSelectFinding: (f: Finding) => void;
  selectedFinding: Finding | null;
}

const TIER_COLORS: Record<number, string> = { 2: "#ef4444", 3: "#f59e0b", 4: "#3b82f6" };
const TIER_LABELS: Record<number, string> = { 2: "URGENT", 3: "SEMI-URGENT", 4: "MODERATE" };

export default function DiagnoseNotes({ findings, onSelectFinding, selectedFinding }: DiagnoseNotesProps) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [animated, setAnimated] = useState(false);

  // Animate bars on mount / patient change
  useEffect(() => {
    setAnimated(false);
    const timer = setTimeout(() => setAnimated(true), 50);
    return () => clearTimeout(timer);
  }, [findings]);

  const topFinding = findings[0];
  const findingMap = new Map(findings.map(f => [f.pathology, f]));

  return (
    <div className="bg-white rounded-2xl p-5 border border-border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground">AI Analysis</h3>
        <button className="text-muted hover:text-foreground"><MoreHorizontal size={14} /></button>
      </div>

      {/* Top finding callout */}
      {topFinding && (
        <div className="mb-4 pb-3 border-b border-border">
          <p className="text-[10px] text-muted mb-1">Primary Finding</p>
          <div className="flex items-center gap-2">
            <p className="text-base font-bold text-foreground">{topFinding.pathology}</p>
            <span className="text-[9px] font-bold tracking-wide px-1.5 py-0.5 rounded"
              style={{ color: TIER_COLORS[topFinding.tier], backgroundColor: `${TIER_COLORS[topFinding.tier]}12` }}>
              {TIER_LABELS[topFinding.tier]}
            </span>
          </div>
        </div>
      )}

      {/* All 5 conditions — always visible, animated bars */}
      <div className="space-y-2.5 mb-4">
        <p className="text-[10px] text-muted font-medium uppercase tracking-wider">All 5 Conditions</p>
        {ACTIVE_CONDITIONS.map(name => {
          const f = findingMap.get(name);
          const conf = f ? Math.round(f.confidence * 100) : 0;
          const color = f ? TIER_COLORS[f.tier] : "#e2e8f0";
          const isSelected = selectedFinding?.pathology === name;
          const detected = conf >= 30;

          return (
            <div
              key={name}
              onClick={() => f && onSelectFinding(f)}
              className={`rounded-lg p-2 transition-all cursor-pointer ${
                isSelected ? "bg-accent-light ring-1 ring-accent/20" :
                detected ? "bg-panel-bg hover:bg-accent-light/50" : "bg-transparent hover:bg-panel-bg/50"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  {f && f.tier === 2 && conf >= 50 && (
                    <AlertTriangle size={10} className="text-red-500" />
                  )}
                  <span className={`text-xs ${detected ? "font-semibold text-foreground" : "text-muted"}`}>
                    {name}
                  </span>
                </div>
                <span className="text-[11px] font-bold" style={{ color: conf > 0 ? color : "#cbd5e1" }}>
                  {conf}%
                </span>
              </div>
              <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{
                    width: animated ? `${conf}%` : "0%",
                    backgroundColor: color,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Detected findings (expandable details) */}
      {findings.length > 0 && (
        <div className="border-t border-border pt-3">
          <p className="text-[10px] text-muted font-medium uppercase tracking-wider mb-2">Detected Findings</p>
          <div className="space-y-1.5">
            {findings.filter(f => f.confidence >= 0.25).map(f => {
              const isExpanded = expanded === f.pathology;
              const color = TIER_COLORS[f.tier];

              return (
                <div
                  key={f.pathology}
                  className="rounded-lg p-2.5 bg-panel-bg cursor-pointer transition-all hover:bg-accent-light/50"
                  onClick={() => onSelectFinding(f)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
                      <span className="text-xs font-semibold text-foreground">{f.pathology}</span>
                      <span className="text-[8px] font-bold tracking-wide px-1 py-0.5 rounded"
                        style={{ color, backgroundColor: `${color}12` }}>
                        {TIER_LABELS[f.tier]}
                      </span>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); setExpanded(isExpanded ? null : f.pathology); }}
                      className="text-muted hover:text-foreground"
                    >
                      {isExpanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                    </button>
                  </div>
                  {isExpanded && (
                    <p className="text-[10px] text-muted mt-1.5 leading-relaxed pl-3.5">{f.clinicalNote}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
