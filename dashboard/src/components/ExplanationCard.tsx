"use client";

import { Lightbulb, Stethoscope } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Finding } from "@/data/mock";

interface ExplanationCardProps {
  finding: Finding | null;
}

export default function ExplanationCard({ finding }: ExplanationCardProps) {
  return (
    <div className="bg-card rounded-2xl p-5 border border-border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground">AI Explanation</h3>
        <Lightbulb size={16} className="text-accent" />
      </div>

      <AnimatePresence mode="wait">
        {finding ? (
          <motion.div
            key={finding.pathology}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center gap-2 mb-3">
              <span className={`w-2 h-2 rounded-full ${
                finding.severity === "critical" ? "bg-critical" :
                finding.severity === "moderate" ? "bg-moderate" : "bg-normal"
              }`}></span>
              <span className="text-sm font-semibold">{finding.pathology}</span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                finding.severity === "critical" ? "bg-critical-bg text-critical" :
                finding.severity === "moderate" ? "bg-moderate-bg text-moderate" :
                "bg-normal-bg text-normal"
              }`}>
                {Math.round(finding.confidence * 100)}% confidence
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-muted mb-1 flex items-center gap-1.5">
                  <Lightbulb size={11} /> Why this was flagged
                </p>
                <p className="text-xs text-foreground/70 leading-relaxed">
                  {finding.explanation}
                </p>
              </div>

              <div className="bg-accent-light rounded-xl p-3">
                <p className="text-[11px] uppercase tracking-wider text-accent mb-1 flex items-center gap-1.5">
                  <Stethoscope size={11} /> Clinical recommendation
                </p>
                <p className="text-xs text-foreground/80 leading-relaxed">
                  {finding.clinicalNote}
                </p>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-8 text-center"
          >
            <Stethoscope size={24} className="text-muted/30 mb-2" />
            <p className="text-sm text-muted">
              Select a finding to see the AI&apos;s reasoning and clinical context
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
