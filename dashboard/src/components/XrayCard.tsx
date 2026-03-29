"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import type { Patient } from "@/data/mock";

interface XrayCardProps {
  patient: Patient;
}

export default function XrayCard({ patient }: XrayCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [heatmapOn, setHeatmapOn] = useState(true);
  const [opacity, setOpacity] = useState(50);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const w = canvas.width;
    const h = canvas.height;

    // Dark X-ray background
    ctx.fillStyle = "#080c18";
    ctx.fillRect(0, 0, w, h);

    // Chest gradient
    const grad = ctx.createRadialGradient(w / 2, h * 0.45, 30, w / 2, h * 0.45, w * 0.42);
    grad.addColorStop(0, "rgba(160,170,190,0.3)");
    grad.addColorStop(0.4, "rgba(110,120,140,0.22)");
    grad.addColorStop(0.7, "rgba(70,80,100,0.15)");
    grad.addColorStop(1, "rgba(10,15,30,0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Ribs
    ctx.strokeStyle = "rgba(140,150,170,0.12)";
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 8; i++) {
      const y = h * 0.2 + i * (h * 0.065);
      ctx.beginPath();
      ctx.ellipse(w / 2, y, w * 0.28 - i * 4, 6, 0, 0, Math.PI);
      ctx.stroke();
    }

    // Lung fields
    ctx.fillStyle = "rgba(20,25,40,0.5)";
    ctx.beginPath();
    ctx.ellipse(w * 0.35, h * 0.4, w * 0.12, h * 0.18, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(w * 0.65, h * 0.4, w * 0.12, h * 0.18, 0, 0, Math.PI * 2);
    ctx.fill();

    // Heart shadow
    const heartGrad = ctx.createRadialGradient(w * 0.44, h * 0.5, 8, w * 0.44, h * 0.5, w * 0.11);
    heartGrad.addColorStop(0, "rgba(150,155,170,0.3)");
    heartGrad.addColorStop(1, "rgba(70,80,100,0)");
    ctx.fillStyle = heartGrad;
    ctx.beginPath();
    ctx.ellipse(w * 0.44, h * 0.5, w * 0.09, h * 0.12, 0, 0, Math.PI * 2);
    ctx.fill();

    // Spine
    ctx.strokeStyle = "rgba(130,140,160,0.15)";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(w / 2, h * 0.1);
    ctx.lineTo(w / 2, h * 0.85);
    ctx.stroke();

    // Patient ID text
    ctx.fillStyle = "rgba(100,110,130,0.4)";
    ctx.font = "11px monospace";
    ctx.fillText(`ID: ${String(patient.id).padStart(5, "0")}`, 12, 20);
    ctx.fillText(`${patient.view} | ${patient.apPa}`, 12, 34);

    // Heatmap overlay
    if (heatmapOn && patient.findings.length > 0) {
      ctx.globalAlpha = opacity / 100;
      const positions: Record<string, [number, number, number]> = {
        "Cardiomegaly": [0.44, 0.5, 0.11],
        "Enlarged Cardiomediastinum": [0.44, 0.48, 0.13],
        "Pleural Effusion": [0.32, 0.7, 0.1],
        "Atelectasis": [0.36, 0.55, 0.08],
        "Edema": [0.5, 0.4, 0.14],
        "Consolidation": [0.64, 0.35, 0.09],
        "Lung Opacity": [0.6, 0.45, 0.1],
        "Pneumothorax": [0.68, 0.25, 0.08],
      };

      for (const f of patient.findings) {
        const pos = positions[f.pathology] || [0.5, 0.4, 0.1];
        const cx = w * pos[0], cy = h * pos[1], r = w * pos[2];
        const intensity = f.confidence;
        const red = Math.round(255 * intensity);
        const green = Math.round(80 * (1 - intensity));

        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
        g.addColorStop(0, `rgba(${red},${green},30,${intensity * 0.65})`);
        g.addColorStop(0.5, `rgba(${red},${green + 40},30,${intensity * 0.25})`);
        g.addColorStop(1, `rgba(${red},${green + 60},30,0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
  }, [patient, heatmapOn, opacity]);

  useEffect(() => { draw(); }, [draw]);

  // 3D parallax
  const handleMouseMove = (e: React.MouseEvent) => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;
    const rect = container.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    canvas.style.transform = `perspective(800px) rotateY(${x * 6}deg) rotateX(${-y * 6}deg)`;
  };

  const handleMouseLeave = () => {
    if (canvasRef.current) {
      canvasRef.current.style.transform = "perspective(800px) rotateY(0deg) rotateX(0deg)";
    }
  };

  const statusColor = patient.severityLevel === "critical" ? "bg-critical" :
    patient.severityLevel === "moderate" ? "bg-moderate" : "bg-normal";
  const statusText = patient.severityLevel === "critical" ? "Needs Attention" :
    patient.severityLevel === "moderate" ? "Monitor" : "Optimal";

  return (
    <div className="bg-card-dark rounded-2xl p-5 text-white col-span-2 row-span-2">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-white/90">X-ray Analysis</h2>
        <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
          patient.severityLevel === "critical" ? "bg-critical/20 text-red-300" :
          patient.severityLevel === "moderate" ? "bg-moderate/20 text-amber-300" :
          "bg-normal/20 text-green-300"
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${statusColor}`}></span>
          {statusText}
        </span>
      </div>

      <div className="flex gap-4">
        {/* Thumbnails */}
        <div className="flex flex-col gap-2">
          {[0, 1, 2].map(i => (
            <div key={i} className={`w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${
              i === 0 ? "border-accent" : "border-white/10 opacity-50"
            }`}>
              <div className="w-full h-full bg-[#0c1020]" />
            </div>
          ))}
        </div>

        {/* Main X-ray */}
        <div
          ref={containerRef}
          className="flex-1 rounded-xl overflow-hidden"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <canvas
            ref={canvasRef}
            width={420}
            height={420}
            className="w-full h-auto transition-transform duration-100"
          />
        </div>

        {/* Indicators */}
        <div className="flex flex-col gap-3 min-w-[160px] text-sm">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-400"></span>
            <span className="text-white/50 text-xs">Inflammation:</span>
            <span className="font-semibold text-white/90 text-xs">{patient.inflammation}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-400"></span>
            <span className="text-white/50 text-xs">Ventilation:</span>
            <span className="font-semibold text-white/90 text-xs">{patient.ventilation}</span>
          </div>
          <div className="flex items-center gap-2">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 9l3-3 2 1.5L10 3" stroke="#4A9EFF" strokeWidth="1.5" strokeLinecap="round"/></svg>
            <span className="text-white/50 text-xs">Lung index:</span>
            <span className="font-semibold text-white/90 text-xs">{patient.lungIndex}</span>
          </div>
          <div className="flex items-center gap-2">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 2l4.5 8H1.5L6 2z" stroke="#FF6B4A" strokeWidth="1.2" fill="none"/></svg>
            <span className="text-white/50 text-xs">Risks:</span>
            <span className={`font-semibold text-xs ${
              patient.riskLevel === "High" ? "text-red-300" :
              patient.riskLevel === "Medium" ? "text-amber-300" : "text-green-300"
            }`}>{patient.riskLevel}</span>
          </div>

          <div className="mt-auto pt-3 border-t border-white/10">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-white/50 text-xs">Heatmap</span>
              <button
                onClick={() => setHeatmapOn(!heatmapOn)}
                className={`w-9 h-5 rounded-full transition-colors ${heatmapOn ? "bg-accent" : "bg-white/20"}`}
              >
                <span className={`block w-3.5 h-3.5 rounded-full bg-white transition-transform ${
                  heatmapOn ? "translate-x-4.5" : "translate-x-0.5"
                }`} />
              </button>
            </div>
            {heatmapOn && (
              <input
                type="range"
                min={0}
                max={100}
                value={opacity}
                onChange={e => setOpacity(+e.target.value)}
                className="w-full h-1 rounded-full appearance-none bg-white/10 accent-accent"
              />
            )}
          </div>

          <button className="mt-2 px-4 py-2 bg-white/10 hover:bg-white/15 rounded-lg text-xs font-medium transition-colors">
            Needs Review
          </button>
        </div>
      </div>
    </div>
  );
}
