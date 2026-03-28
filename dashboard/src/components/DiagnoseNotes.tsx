"use client";

import { useState } from "react";
import { MoreHorizontal, AlertTriangle, Info, ChevronDown, ChevronUp } from "lucide-react";
import type { Finding } from "@/data/mock";

interface DiagnoseNotesProps {
  findings: Finding[];
  onSelectFinding: (f: Finding) => void;
  selectedFinding: Finding | null;
}

export default function DiagnoseNotes({ findings, onSelectFinding, selectedFinding }: DiagnoseNotesProps) {
  const [expanded, setExpanded] = useState<string | null>(null);

  const topFinding = findings[0];

  const severityColor = (s: string) => {
    switch (s) {
      case "critical": return "border-critical bg-critical-bg";
      case "moderate": return "border-moderate bg-moderate-bg";
      case "mild": return "border-mild bg-mild-bg";
      default: return "border-normal bg-normal-bg";
    }
  };

  const severityTextColor = (s: string) => {
    switch (s) {
      case "critical": return "text-critical";
      case "moderate": return "text-moderate";
      case "mild": return "text-mild";
      default: return "text-normal";
    }
  };

  const severityBorderLeft = (s: string) => {
    switch (s) {
      case "critical": return "border-l-critical";
      case "moderate": return "border-l-moderate";
      case "mild": return "border-l-mild";
      default: return "border-l-normal";
    }
  };

  return (
    <div className="bg-white rounded-2xl p-5 border border-border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground">Diagnose Notes</h3>
        <button className="text-muted hover:text-foreground"><MoreHorizontal size={14} /></button>
      </div>

      {/* Top finding highlight */}
      {topFinding && (
        <div className="mb-4 pb-4 border-b border-border">
          <p className="text-xs text-muted mb-1">Primary Finding</p>
          <p className="text-lg font-bold text-foreground">{topFinding.pathology}</p>
        </div>
      )}

      {/* Finding list */}
      <div className="space-y-2">
        {findings.map((f) => {
          const isSelected = selectedFinding?.pathology === f.pathology;
          const isExpanded = expanded === f.pathology;

          return (
            <div
              key={f.pathology}
              className={`border-l-[3px] ${severityBorderLeft(f.severity)} rounded-lg p-3 cursor-pointer transition-all duration-200 ${
                isSelected ? "bg-accent-light ring-1 ring-accent/20" : "bg-panel-bg hover:bg-accent-light/50"
              }`}
              onClick={() => onSelectFinding(f)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {f.severity === "critical" ? (
                    <AlertTriangle size={13} className="text-critical" />
                  ) : (
                    <Info size={13} className={severityTextColor(f.severity)} />
                  )}
                  <span className="text-xs font-semibold text-foreground">{f.pathology}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${severityColor(f.severity)} ${severityTextColor(f.severity)}`}>
                    {Math.round(f.confidence * 100)}%
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpanded(isExpanded ? null : f.pathology);
                    }}
                    className="text-muted hover:text-foreground"
                  >
                    {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  </button>
                </div>
              </div>
              {isExpanded && (
                <p className="text-[11px] text-muted mt-2 leading-relaxed">{f.clinicalNote}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
