"use client";

import { useRef, useEffect } from "react";
import { MoreHorizontal, TrendingUp, TrendingDown, Activity, Wind, Flame } from "lucide-react";
import type { Patient } from "@/data/mock";
import { useTheme } from "@/components/ThemeProvider";

interface MetricCardsProps {
  patient: Patient;
}

/* ── Severity Score Card with donut ── */
function SeverityCard({ score, level }: { score: number; level: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { theme } = useTheme();
  const isDark = theme === "dark";

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = 72 * dpr;
    canvas.height = 72 * dpr;
    ctx.scale(dpr, dpr);

    const cx = 36, cy = 36, r = 27, lw = 5;
    const color =
      level === "critical" ? (isDark ? "#f87171" : "#ef4444") :
      level === "moderate" ? (isDark ? "#fbbf24" : "#f59e0b") :
      level === "mild" ? (isDark ? "#facc15" : "#eab308") : (isDark ? "#4ade80" : "#22c55e");

    // Background ring
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = isDark ? "#1e2231" : "#f1f3f8";
    ctx.lineWidth = lw;
    ctx.stroke();

    // Score arc
    const start = -Math.PI / 2;
    const end = start + (Math.PI * 2 * score) / 100;
    ctx.beginPath();
    ctx.arc(cx, cy, r, start, end);
    ctx.strokeStyle = color;
    ctx.lineWidth = lw;
    ctx.lineCap = "round";
    ctx.stroke();

    // Center text
    ctx.fillStyle = isDark ? "#e5e7eb" : "#1a1f36";
    ctx.font = "bold 15px system-ui";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`${score}`, cx, cy - 3);
    ctx.fillStyle = isDark ? "#6b7280" : "#8b8fa3";
    ctx.font = "8px system-ui";
    ctx.fillText("Score", cx, cy + 11);
  }, [score, level, isDark]);

  const color =
    level === "critical" ? "text-critical" :
    level === "moderate" ? "text-moderate" :
    level === "mild" ? "text-mild" : "text-normal";

  return (
    <div className="bg-card rounded-2xl p-4 border border-border">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-muted font-medium">Severity Score</p>
        <button className="text-muted hover:text-foreground"><MoreHorizontal size={14} /></button>
      </div>
      <div className="flex items-center gap-3">
        <canvas ref={canvasRef} className="w-[72px] h-[72px] flex-shrink-0" />
        <div>
          <p className={`text-2xl font-bold ${color}`}>{score}%</p>
          <p className="text-[10px] text-muted capitalize">{level} Priority</p>
        </div>
      </div>
    </div>
  );
}

/* ── Lung Index Card ── */
function LungIndexCard({ value, inflammation }: { value: number; inflammation: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { theme } = useTheme();
  const isDark = theme === "dark";

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = 100 * dpr;
    canvas.height = 40 * dpr;
    ctx.scale(dpr, dpr);

    const barW = 7, gap = 3, bars = 8;
    const startX = 0;

    for (let i = 0; i < bars; i++) {
      const h = 8 + Math.random() * 26;
      const x = startX + i * (barW + gap);
      const y = 38 - h;
      ctx.fillStyle = i < Math.round(value / 14) ? "#4a6cf7" : (isDark ? "#1e2231" : "#e8ecf4");
      ctx.beginPath();
      ctx.roundRect(x, y, barW, h, 2);
      ctx.fill();
    }
  }, [value, isDark]);

  const infColor =
    inflammation === "High" ? "text-critical bg-critical-bg" :
    inflammation === "Medium" ? "text-moderate bg-moderate-bg" : "text-normal bg-normal-bg";

  return (
    <div className="bg-card rounded-2xl p-3.5 border border-border">
      <div className="flex items-center justify-between mb-1">
        <p className="text-[10px] text-muted font-medium flex items-center gap-1"><Activity size={10} /> Lung Index</p>
        <button className="text-muted hover:text-foreground"><MoreHorizontal size={12} /></button>
      </div>
      <p className="text-xl font-bold text-foreground">{value}%</p>
      <canvas ref={canvasRef} className="w-[100px] h-[40px] mt-1" />
      <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full mt-1.5 inline-block ${infColor}`}>
        <Flame size={8} className="inline mr-0.5 -mt-px" />{inflammation}
      </span>
    </div>
  );
}

/* ── Ventilation Card ── */
function VentilationCard({ status }: { status: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { theme } = useTheme();
  const isDark = theme === "dark";

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = 100 * dpr;
    canvas.height = 35 * dpr;
    ctx.scale(dpr, dpr);

    const points = [18, 22, 16, 28, 20, 32, 25, 30, 34, 27, 32, 35];
    ctx.beginPath();
    ctx.moveTo(0, 35 - points[0]);
    for (let i = 1; i < points.length; i++) {
      const x = (i / (points.length - 1)) * 100;
      const y = 35 - points[i];
      if (i === 1) {
        ctx.lineTo(x, y);
      } else {
        const prevX = ((i - 1) / (points.length - 1)) * 100;
        const prevY = 35 - points[i - 1];
        ctx.quadraticCurveTo(prevX + (x - prevX) / 2, prevY, x, y);
      }
    }
    const baseColor = status === "Compromised" ? "239,68,68" : status === "Impaired" ? "245,158,11" : "34,197,94";
    ctx.strokeStyle = `rgb(${baseColor})`;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Fill under
    ctx.lineTo(100, 35);
    ctx.lineTo(0, 35);
    ctx.closePath();
    const grad = ctx.createLinearGradient(0, 0, 0, 35);
    grad.addColorStop(0, `rgba(${baseColor},${isDark ? 0.2 : 0.12})`);
    grad.addColorStop(1, `rgba(${baseColor},0)`);
    ctx.fillStyle = grad;
    ctx.fill();

    // End dot
    const lastX = 100;
    const lastY = 35 - points[points.length - 1];
    ctx.beginPath();
    ctx.arc(lastX - 2, lastY, 3, 0, Math.PI * 2);
    ctx.fillStyle = `rgb(${baseColor})`;
    ctx.fill();
    ctx.strokeStyle = isDark ? "#151821" : "#fff";
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }, [status, isDark]);

  const statusColor =
    status === "Compromised" ? "text-critical" :
    status === "Impaired" ? "text-moderate" : "text-normal";

  const trending = status === "Healthy";

  return (
    <div className="bg-card rounded-2xl p-3.5 border border-border">
      <div className="flex items-center justify-between mb-1">
        <p className="text-[10px] text-muted font-medium flex items-center gap-1"><Wind size={10} /> Ventilation</p>
        <button className="text-muted hover:text-foreground"><MoreHorizontal size={12} /></button>
      </div>
      <div className="flex items-center gap-1.5">
        <p className={`text-base font-bold ${statusColor}`}>{status}</p>
        {trending ? (
          <TrendingUp size={12} className="text-normal" />
        ) : (
          <TrendingDown size={12} className="text-critical" />
        )}
      </div>
      <canvas ref={canvasRef} className="w-[100px] h-[35px] mt-1" />
      <p className="text-[9px] text-muted mt-1">Airflow capacity</p>
    </div>
  );
}

export default function MetricCards({ patient }: MetricCardsProps) {
  const severityPct = Math.round(patient.severityScore * 100);

  return (
    <div className="space-y-3">
      <SeverityCard score={severityPct} level={patient.severityLevel} />
      <div className="grid grid-cols-2 gap-3">
        <LungIndexCard value={patient.lungIndex} inflammation={patient.inflammation} />
        <VentilationCard status={patient.ventilation} />
      </div>
    </div>
  );
}
