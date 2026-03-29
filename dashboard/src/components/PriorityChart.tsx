"use client";

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { useTheme } from "@/components/ThemeProvider";

interface PriorityChartProps {
  stat: number;
  priority: number;
  routine: number;
}

const COLORS_LIGHT = ["#1f2937", "#6b7280", "#d1d5db"];
const COLORS_DARK = ["#e5e7eb", "#9ca3af", "#4b5563"];

export default function PriorityChart({ stat, priority, routine }: PriorityChartProps) {
  const { theme } = useTheme();
  const COLORS = theme === "dark" ? COLORS_DARK : COLORS_LIGHT;

  const data = [
    { name: "STAT", value: stat },
    { name: "PRIORITY", value: priority },
    { name: "ROUTINE", value: routine },
  ];

  const total = stat + priority + routine;

  return (
    <div className="bg-card rounded-2xl border border-border p-5 flex flex-col">
      <div className="mb-1">
        <h3 className="text-sm font-semibold text-foreground">Priority Distribution</h3>
        <p className="text-xs text-muted mt-0.5">By triage tier</p>
      </div>

      <div className="flex-1 flex items-center justify-center">
        <div className="w-[140px] h-[140px] relative">
          <ResponsiveContainer width="100%" height="100%" minWidth={100} minHeight={100}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={42}
                outerRadius={62}
                paddingAngle={3}
                dataKey="value"
                strokeWidth={0}
              >
                {data.map((_, i) => (
                  <Cell key={i} fill={COLORS[i]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-xl font-bold text-foreground">{total}</span>
            <span className="text-[10px] text-muted">Total</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-5 mt-2">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[0] }} />
          <span className="text-[11px] text-muted">STAT: {stat}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[1] }} />
          <span className="text-[11px] text-muted">Priority: {priority}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[2] }} />
          <span className="text-[11px] text-muted">Routine: {routine}</span>
        </div>
      </div>
    </div>
  );
}
