"use client";

import { Search, Bell, Settings } from "lucide-react";
import { APP_NAME } from "@/lib/constants";

const navItems = [
  { id: "triage", label: "Triage" },
  { id: "dashboard", label: "Patients" },
  { id: "upload", label: "Upload" },
  { id: "compare", label: "Compare" },
] as const;

interface TopNavProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

export default function TopNav({ activeView, onViewChange }: TopNavProps) {
  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-100">
      <div className="max-w-[1440px] mx-auto px-6 flex items-center justify-between h-16">
        {/* Brand */}
        <div className="flex items-center gap-8">
          <button onClick={() => onViewChange("triage")} className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 28 28" fill="none">
                <path d="M14 6v16M8 10l6-4 6 4M8 18l6 4 6-4" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="text-lg font-bold text-gray-900 tracking-tight">{APP_NAME}</span>
          </button>

          {/* Nav tabs */}
          <div className="flex items-center gap-1">
            {navItems.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => onViewChange(id)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  activeView === id
                    ? "bg-gray-900 text-white"
                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search here..."
              className="pl-10 pr-4 py-2 text-sm rounded-lg border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 w-52"
            />
          </div>
          <button className="relative p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors">
            <Bell size={18} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
          </button>
          <button className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors">
            <Settings size={18} />
          </button>
          <div className="flex items-center gap-2 ml-2 pl-3 border-l border-gray-100">
            <div className="w-8 h-8 rounded-full bg-gray-900 text-white text-xs font-bold flex items-center justify-center">DR</div>
            <div className="hidden lg:block">
              <p className="text-sm font-medium text-gray-900 leading-tight">Dr. Radiologist</p>
              <p className="text-[11px] text-gray-400">radiologist@hospital.org</p>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
