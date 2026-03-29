"use client";

import { useRef, useEffect } from "react";
import { useTheme } from "@/components/ThemeProvider";

interface SeverityDonutProps {
  score: number;
  level: "critical" | "moderate" | "mild" | "normal";
}

export default function SeverityDonut({ score, level }: SeverityDonutProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { theme } = useTheme();
  const isDark = theme === "dark";

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const size = 140;
    const center = size / 2;
    const radius = 55;
    const lineWidth = 10;

    ctx.clearRect(0, 0, size, size);

    // Background ring
    ctx.beginPath();
    ctx.arc(center, center, radius, 0, Math.PI * 2);
    ctx.strokeStyle = isDark ? "#1e2231" : "#f0f0f5";
    ctx.lineWidth = lineWidth;
    ctx.lineCap = "round";
    ctx.stroke();

    // Value ring
    const pct = score / 100;
    const startAngle = -Math.PI / 2;
    const endAngle = startAngle + pct * Math.PI * 2;

    const color = level === "critical" ? (isDark ? "#f87171" : "#ef4444") :
      level === "moderate" ? (isDark ? "#fbbf24" : "#f59e0b") :
      level === "mild" ? (isDark ? "#facc15" : "#eab308") : (isDark ? "#4ade80" : "#22c55e");

    ctx.beginPath();
    ctx.arc(center, center, radius, startAngle, endAngle);
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = "round";
    ctx.stroke();
  }, [score, level, isDark]);

  return (
    <div className="bg-card rounded-2xl p-5 border border-border">
      <h3 className="text-sm font-semibold text-foreground mb-3">Overall Severity</h3>
      <div className="flex justify-center">
        <div className="relative">
          <canvas ref={canvasRef} width={140} height={140} />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-foreground">{score}</span>
            <span className="text-[10px] text-muted uppercase tracking-wider">Score</span>
          </div>
        </div>
      </div>
    </div>
  );
}
