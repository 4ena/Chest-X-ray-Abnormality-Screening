"use client";

import { useRef, useEffect } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";

interface RiskCardProps {
  title: string;
  percentage: number;
  trend: "up" | "down";
  status: "elevated" | "normal" | "critical";
}

export default function RiskCard({ title, percentage, trend, status }: RiskCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { theme } = useTheme();
  const isDark = theme === "dark";

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Generate sparkline
    const points: number[] = [];
    let val = percentage * 0.7;
    for (let i = 0; i < 20; i++) {
      val += (Math.random() - 0.48) * 8;
      val = Math.max(5, Math.min(95, val));
      points.push(val);
    }
    points[points.length - 1] = percentage;

    const color = status === "elevated" || status === "critical" ? "#FF6B4A" : "#4A9EFF";
    const fillColor = status === "elevated" || status === "critical"
      ? `rgba(255,107,74,${isDark ? 0.15 : 0.08})`
      : `rgba(74,158,255,${isDark ? 0.15 : 0.08})`;

    // Area fill
    ctx.beginPath();
    ctx.moveTo(0, h);
    points.forEach((p, i) => {
      const x = (i / (points.length - 1)) * w;
      const y = h - (p / 100) * h * 0.8 - h * 0.1;
      if (i === 0) ctx.moveTo(x, h);
      ctx.lineTo(x, y);
    });
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fillStyle = fillColor;
    ctx.fill();

    // Line
    ctx.beginPath();
    points.forEach((p, i) => {
      const x = (i / (points.length - 1)) * w;
      const y = h - (p / 100) * h * 0.8 - h * 0.1;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.lineJoin = "round";
    ctx.stroke();

    // End dot
    const lastX = w;
    const lastY = h - (points[points.length - 1] / 100) * h * 0.8 - h * 0.1;
    ctx.beginPath();
    ctx.arc(lastX - 2, lastY, 3, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = isDark ? "#151821" : "#fff";
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }, [percentage, status, isDark]);

  const statusBadge = {
    elevated: { bg: "bg-status-red-subtle", text: "text-status-red", dot: "bg-status-red", label: "Elevated" },
    critical: { bg: "bg-status-red-subtle", text: "text-status-red", dot: "bg-status-red", label: "Critical" },
    normal: { bg: "bg-status-emerald-subtle", text: "text-status-emerald", dot: "bg-status-emerald", label: "Normal" },
  }[status];

  return (
    <div className="bg-card rounded-2xl p-5 border border-border">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <span className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${statusBadge.bg} ${statusBadge.text}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${statusBadge.dot}`}></span>
          {statusBadge.label}
        </span>
      </div>
      <div className="flex items-end justify-between">
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold tracking-tight text-foreground">{percentage}</span>
          <span className="text-sm text-muted">%</span>
          {trend === "up" ? (
            <TrendingUp size={14} className="text-red-400 ml-1" />
          ) : (
            <TrendingDown size={14} className="text-blue-400 ml-1" />
          )}
        </div>
        <canvas ref={canvasRef} width={140} height={50} className="opacity-90" />
      </div>
    </div>
  );
}
