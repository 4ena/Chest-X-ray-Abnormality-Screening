"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface PriorityChartProps {
  stat: number;
  priority: number;
  routine: number;
}

const COLORS = ["#1f2937", "#6b7280", "#d1d5db"];
const LABELS = ["STAT", "PRIORITY", "ROUTINE"];
const DESCRIPTIONS = [
  "Immediate read required — life-threatening findings",
  "Read before routine — clinically significant",
  "Standard queue — lower acuity findings",
];

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number; payload: { index: number } }> }) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  const idx = item.payload.index;

  return (
    <div className="bg-gray-900 text-white rounded-lg px-3 py-2 text-xs shadow-xl border-0 outline-0" style={{ border: "none", boxShadow: "0 8px 24px rgba(0,0,0,0.25)" }}>
      <p className="font-semibold">{LABELS[idx]}: {item.value} patients</p>
      <p className="text-gray-300 mt-0.5 leading-relaxed">{DESCRIPTIONS[idx]}</p>
    </div>
  );
}

export default function PriorityChart({ stat, priority, routine }: PriorityChartProps) {
  const data = [
    { name: "STAT", value: stat, index: 0 },
    { name: "PRIORITY", value: priority, index: 1 },
    { name: "ROUTINE", value: routine, index: 2 },
  ];

  const total = stat + priority + routine;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col">
      <div className="flex items-center justify-between mb-1">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Priority Distribution</h3>
          <p className="text-xs text-gray-400 mt-0.5">Click segments for details</p>
        </div>
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
                cursor="pointer"
              >
                {data.map((_, i) => (
                  <Cell key={i} fill={COLORS[i]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} wrapperStyle={{ outline: "none", border: "none" }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-xl font-bold text-gray-900">{total}</span>
            <span className="text-[10px] text-gray-400">Total</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-5 mt-2">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-gray-900" />
          <span className="text-[11px] text-gray-500">STAT: {stat}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-gray-400" />
          <span className="text-[11px] text-gray-500">Priority: {priority}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-gray-200" />
          <span className="text-[11px] text-gray-500">Routine: {routine}</span>
        </div>
      </div>
    </div>
  );
}
