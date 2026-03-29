"use client";

import { useState } from "react";
import { Search, SlidersHorizontal, Download, MoreHorizontal, TrendingUp, TrendingDown, ChevronLeft, ChevronRight, AlertTriangle, Activity, Shield } from "lucide-react";
import { patients, ACTIVE_CONDITIONS } from "@/data/mock";
import { TIER_COLORS, TIER_LABELS } from "@/lib/constants";
import PriorityChart from "@/components/PriorityChart";

interface TriageViewProps {
  onSelectPatient: (id: number) => void;
}

function getHighestTier(findings: { tier: number }[]): 2 | 3 | 4 {
  let highest = 4;
  for (const f of findings) if (f.tier < highest) highest = f.tier;
  return highest as 2 | 3 | 4;
}

function timeSinceAdmission(dateStr: string): string {
  const now = new Date("2026-03-28");
  const admitted = new Date(dateStr);
  const diffMs = now.getTime() - admitted.getTime();
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  if (hours < 1) return "< 1h";
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

const PAGE_SIZE = 10;

function exportCSV() {
  const headers = ["ID", "Name", "Age", "Sex", "Tier", "Top Finding", "Confidence", "Admitted"];
  const rows = patients.map(p => [
    `P${String(p.id).padStart(3, "0")}`,
    p.name,
    p.age,
    p.sex,
    TIER_LABELS[getHighestTier(p.findings)],
    p.topFinding,
    `${Math.round((p.findings[0]?.confidence || 0) * 100)}%`,
    p.admissionDate,
  ]);
  const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `pneumanosis_triage_${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function TriageView({ onSelectPatient }: TriageViewProps) {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [actionMenu, setActionMenu] = useState<number | null>(null);

  const filters = [
    { key: "all", label: "All Patients" },
    { key: "2", label: "STAT" },
    { key: "3", label: "Priority" },
    { key: "4", label: "Routine" },
  ];

  let filtered = filter === "all"
    ? patients
    : patients.filter(p => getHighestTier(p.findings) === Number(filter));

  if (search.trim()) {
    const q = search.toLowerCase();
    filtered = filtered.filter(p =>
      p.name.toLowerCase().includes(q) ||
      String(p.id).padStart(5, "0").includes(q) ||
      p.topFinding.toLowerCase().includes(q)
    );
  }

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const stat = patients.filter(p => getHighestTier(p.findings) === 2).length;
  const priority = patients.filter(p => getHighestTier(p.findings) === 3).length;
  const routine = patients.filter(p => getHighestTier(p.findings) === 4).length;

  return (
    <div className="px-8 py-8">
      {/* Stats row: title+3 cards on left, chart card on right */}
      <div className="grid grid-cols-[1fr_280px] gap-4 mb-8">
        {/* Left: title + 3 stat cards */}
        <div className="flex flex-col">
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-gray-900">Triage Queue</h1>
            <p className="text-sm text-gray-400 mt-1">Manage and prioritize patient X-ray readings</p>
          </div>
          <div className="grid grid-cols-3 gap-4 flex-1">
            {/* Total */}
            <div className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-400">Total Patients</p>
                <div className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center">
                  <Shield size={14} className="text-gray-400" />
                </div>
              </div>
              <p className="text-4xl font-bold text-gray-900">{patients.length}</p>
              <div className="flex items-center gap-1 mt-1">
                <TrendingUp size={11} className="text-emerald-500" />
                <span className="text-[11px] text-emerald-500 font-medium">12%</span>
                <span className="text-[11px] text-gray-400 ml-0.5">From Last Shift</span>
              </div>
            </div>

            {/* STAT */}
            <div className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-400">STAT Cases</p>
                <div className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center">
                  <AlertTriangle size={14} className="text-red-500" />
                </div>
              </div>
              <p className="text-4xl font-bold text-red-600">{stat}</p>
              <div className="flex items-center gap-1 mt-1">
                <TrendingUp size={11} className="text-red-400" />
                <span className="text-[11px] text-red-400 font-medium">{Math.round((stat / patients.length) * 100)}%</span>
                <span className="text-[11px] text-gray-400 ml-0.5">of Total</span>
              </div>
            </div>

            {/* Priority */}
            <div className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-400">Priority Cases</p>
                <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center">
                  <Activity size={14} className="text-amber-500" />
                </div>
              </div>
              <p className="text-4xl font-bold text-amber-600">{priority}</p>
              <div className="flex items-center gap-1 mt-1">
                <TrendingDown size={11} className="text-amber-400" />
                <span className="text-[11px] text-amber-400 font-medium">{Math.round((priority / patients.length) * 100)}%</span>
                <span className="text-[11px] text-gray-400 ml-0.5">of Total</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: donut chart (full height) */}
        <PriorityChart stat={stat} priority={priority} routine={routine} />
      </div>

      {/* Table section */}
      <div className="bg-white rounded-2xl border border-gray-100">
        {/* Table header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
          <h2 className="text-base font-semibold text-gray-900">All Patients</h2>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search here..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 w-48"
              />
            </div>
            {/* Filter button */}
            <div className="relative">
              <button
                onClick={() => setShowFilterPanel(!showFilterPanel)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm transition-colors ${
                  showFilterPanel ? "border-gray-900 text-gray-900 bg-gray-50" : "border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                <SlidersHorizontal size={14} />
                Filter
              </button>
              {showFilterPanel && (
                <div className="absolute right-0 top-11 bg-white rounded-xl border border-gray-200 shadow-lg p-3 z-20 w-44">
                  <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider mb-2">Filter by Tier</p>
                  {filters.map(f => (
                    <button
                      key={f.key}
                      onClick={() => { setFilter(f.key); setPage(1); setShowFilterPanel(false); }}
                      className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors ${
                        filter === f.key ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {/* Export button */}
            <button
              onClick={exportCSV}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <Download size={14} />
              Export
            </button>
          </div>
        </div>

        {/* Active filter indicator */}
        {filter !== "all" && (
          <div className="flex items-center gap-2 px-6 py-2 bg-gray-50/50 border-b border-gray-50">
            <span className="text-xs text-gray-400">Filtered:</span>
            <span className="text-xs font-medium text-gray-700 bg-white px-2 py-0.5 rounded border border-gray-200">
              {filters.find(f => f.key === filter)?.label}
            </span>
            <button onClick={() => { setFilter("all"); setPage(1); }} className="text-xs text-gray-400 hover:text-gray-600 ml-1">Clear</button>
          </div>
        )}

        {/* Table */}
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-50">
              <th className="text-left text-[11px] uppercase tracking-wider text-gray-400 font-medium px-6 py-3 w-16">ID No.</th>
              <th className="text-left text-[11px] uppercase tracking-wider text-gray-400 font-medium px-6 py-3">Patient Name</th>
              <th className="text-left text-[11px] uppercase tracking-wider text-gray-400 font-medium px-6 py-3">Status</th>
              <th className="text-left text-[11px] uppercase tracking-wider text-gray-400 font-medium px-6 py-3">Top Finding</th>
              <th className="text-left text-[11px] uppercase tracking-wider text-gray-400 font-medium px-6 py-3">Confidence</th>
              <th className="text-left text-[11px] uppercase tracking-wider text-gray-400 font-medium px-6 py-3">Age</th>
              <th className="text-left text-[11px] uppercase tracking-wider text-gray-400 font-medium px-6 py-3">Wait Time</th>
              <th className="text-left text-[11px] uppercase tracking-wider text-gray-400 font-medium px-6 py-3 w-16">Action</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((patient) => {
              const tier = getHighestTier(patient.findings);
              const topConf = Math.round((patient.findings[0]?.confidence || 0) * 100);
              const initials = patient.name.split(" ").map(n => n[0]).join("").toUpperCase();
              const tierLabel = TIER_LABELS[tier];
              const statusColor = tier === 2 ? "bg-red-50 text-red-600" : tier === 3 ? "bg-amber-50 text-amber-600" : "bg-blue-50 text-blue-600";

              return (
                <tr
                  key={patient.id}
                  onClick={() => onSelectPatient(patient.id)}
                  className="border-b border-gray-50/80 cursor-pointer hover:bg-gray-50/50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-400 font-mono">P{String(patient.id).padStart(3, "0")}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 text-xs font-semibold flex items-center justify-center">
                        {initials}
                      </div>
                      <span className="text-sm font-medium text-gray-900">{patient.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold ${statusColor}`}>
                      {tierLabel}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-900">{patient.topFinding}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${topConf}%`, backgroundColor: TIER_COLORS[patient.findings[0]?.tier || 4] }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-600">{topConf}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-500">{patient.age}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-500">{timeSinceAdmission(patient.admissionDate)}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="relative">
                      <button
                        onClick={(e) => { e.stopPropagation(); setActionMenu(actionMenu === patient.id ? null : patient.id); }}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                      >
                        <MoreHorizontal size={16} />
                      </button>
                      {actionMenu === patient.id && (
                        <div className="absolute right-0 top-9 bg-white rounded-xl border border-gray-200 shadow-lg py-1.5 z-20 w-40">
                          <button
                            onClick={(e) => { e.stopPropagation(); onSelectPatient(patient.id); setActionMenu(null); }}
                            className="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            View Details
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setActionMenu(null); }}
                            className="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            Flag for Review
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setActionMenu(null); }}
                            className="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            Mark as Read
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Empty state */}
        {paginated.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Search size={32} className="mb-3 opacity-30" />
            <p className="text-sm font-medium">No patients found</p>
            <p className="text-xs mt-1">Try a different search or filter</p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-50">
            <p className="text-sm text-gray-400">
              Showing {((page - 1) * PAGE_SIZE) + 1}-{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} results
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={14} /> Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                    page === p ? "bg-gray-900 text-white" : "text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
