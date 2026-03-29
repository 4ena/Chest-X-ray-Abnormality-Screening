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

const PAGE_SIZE = 8;

export default function TriageView({ onSelectPatient }: TriageViewProps) {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

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

  // Stats
  const stat = patients.filter(p => getHighestTier(p.findings) === 2).length;
  const priority = patients.filter(p => getHighestTier(p.findings) === 3).length;
  const routine = patients.filter(p => getHighestTier(p.findings) === 4).length;

  return (
    <div className="max-w-[1280px] mx-auto px-6 py-8">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Triage Queue</h1>
        <p className="text-sm text-gray-400 mt-1">Manage and prioritize patient X-ray readings</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {/* Total */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-gray-400">Total Patients</p>
            <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center">
              <Shield size={16} className="text-gray-400" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{patients.length}</p>
          <div className="flex items-center gap-1 mt-2">
            <TrendingUp size={12} className="text-emerald-500" />
            <span className="text-xs text-emerald-500 font-medium">12%</span>
            <span className="text-xs text-gray-400 ml-1">From Last Shift</span>
          </div>
        </div>

        {/* STAT */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-gray-400">STAT Cases</p>
            <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
              <AlertTriangle size={16} className="text-red-500" />
            </div>
          </div>
          <p className="text-3xl font-bold text-red-600">{stat}</p>
          <div className="flex items-center gap-1 mt-2">
            <TrendingUp size={12} className="text-red-400" />
            <span className="text-xs text-red-400 font-medium">{Math.round((stat / patients.length) * 100)}%</span>
            <span className="text-xs text-gray-400 ml-1">of Total Patients</span>
          </div>
        </div>

        {/* Priority */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-gray-400">Priority Cases</p>
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
              <Activity size={16} className="text-amber-500" />
            </div>
          </div>
          <p className="text-3xl font-bold text-amber-600">{priority}</p>
          <div className="flex items-center gap-1 mt-2">
            <TrendingDown size={12} className="text-amber-400" />
            <span className="text-xs text-amber-400 font-medium">{Math.round((priority / patients.length) * 100)}%</span>
            <span className="text-xs text-gray-400 ml-1">of Total Patients</span>
          </div>
        </div>

        {/* Donut chart */}
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
            <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
              <SlidersHorizontal size={14} />
              Filter
            </button>
            <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
              <Download size={14} />
              Export
            </button>
          </div>
        </div>

        {/* Filter pills */}
        <div className="flex gap-2 px-6 py-3 border-b border-gray-50">
          {filters.map(f => (
            <button
              key={f.key}
              onClick={() => { setFilter(f.key); setPage(1); }}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                filter === f.key
                  ? "bg-gray-900 text-white"
                  : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

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
                          style={{
                            width: `${topConf}%`,
                            backgroundColor: TIER_COLORS[patient.findings[0]?.tier || 4],
                          }}
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
                    <button onClick={(e) => e.stopPropagation()} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                      <MoreHorizontal size={16} />
                    </button>
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
