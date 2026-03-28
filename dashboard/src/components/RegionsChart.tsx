"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from "recharts";
import { regionData } from "@/data/mock";

export default function RegionsChart() {
  return (
    <div className="bg-card rounded-2xl p-5 border border-border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground">Indicators for lung areas</h3>
        <div className="flex items-center gap-3 text-xs text-muted">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-accent"></span>
            Ventilation
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-200"></span>
            Inflammation
          </span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={regionData} barGap={4}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f5" vertical={false} />
          <XAxis
            dataKey="region"
            tick={{ fontSize: 11, fill: "#8b8fa3" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#8b8fa3" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={v => `${v}%`}
          />
          <Bar dataKey="ventilation" fill="#4A6CF7" radius={[4, 4, 0, 0]} barSize={20} />
          <Bar dataKey="inflammation" fill="#B8D4FF" radius={[4, 4, 0, 0]} barSize={20} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
