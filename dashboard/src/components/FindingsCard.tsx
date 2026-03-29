"use client";

import { useState } from "react";
import { ChevronRight, AlertTriangle, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Finding } from "@/data/mock";

interface FindingsCardProps {
  findings: Finding[];
  onSelectFinding: (finding: Finding | null) => void;
  selectedFinding: Finding | null;
}

const severityColors = {
  critical: { bar: "bg-critical", text: "text-critical", bg: "bg-critical-bg" },
  moderate: { bar: "bg-moderate", text: "text-moderate", bg: "bg-moderate-bg" },
  mild: { bar: "bg-mild", text: "text-mild", bg: "bg-mild-bg" },
  normal: { bar: "bg-normal", text: "text-normal", bg: "bg-normal-bg" },
};

export default function FindingsCard({ findings, onSelectFinding, selectedFinding }: FindingsCardProps) {
  return (
    <div className="bg-card rounded-2xl p-5 border border-border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground">Classification Results</h3>
        <span className="text-xs text-muted">{findings.length} findings detected</span>
      </div>
      <div className="space-y-2">
        {findings.map((f, i) => {
          const colors = severityColors[f.severity];
          const pct = Math.round(f.confidence * 100);
          const isSelected = selectedFinding?.pathology === f.pathology;

          return (
            <button
              key={f.pathology}
              onClick={() => onSelectFinding(isSelected ? null : f)}
              className={`w-full text-left rounded-xl p-3 transition-all duration-200 border ${
                isSelected
                  ? "border-accent bg-accent-light shadow-sm"
                  : "border-transparent hover:bg-panel-bg"
              }`}
            >
              <div className="flex items-center gap-3">
                {f.severity === "critical" && (
                  <AlertTriangle size={14} className="text-critical flex-shrink-0" />
                )}
                {f.severity !== "critical" && (
                  <Info size={14} className="text-muted flex-shrink-0" />
                )}
                <span className="text-sm font-medium text-foreground flex-1">{f.pathology}</span>
                <div className="w-24 h-1.5 rounded-full bg-accent-light overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.8, delay: i * 0.1 }}
                    className={`h-full rounded-full ${colors.bar}`}
                  />
                </div>
                <span className={`text-xs font-bold min-w-[36px] text-right ${colors.text}`}>
                  {pct}%
                </span>
                <ChevronRight
                  size={14}
                  className={`text-muted transition-transform ${isSelected ? "rotate-90" : ""}`}
                />
              </div>

              <AnimatePresence>
                {isSelected && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-3 pt-3 border-t border-border">
                      <p className="text-xs text-muted leading-relaxed mb-2">
                        {f.explanation}
                      </p>
                      <div className="bg-accent-light rounded-lg p-2.5">
                        <p className="text-xs font-medium text-accent mb-1">Clinical Note</p>
                        <p className="text-xs text-foreground/70 leading-relaxed">
                          {f.clinicalNote}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          );
        })}
      </div>
    </div>
  );
}
