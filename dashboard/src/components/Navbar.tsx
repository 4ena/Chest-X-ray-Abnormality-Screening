"use client";

import {
  LayoutGrid, List, GitCompareArrows, Upload, Bell, Clock,
} from "lucide-react";

const navItems = [
  { id: "dashboard", icon: LayoutGrid, label: "Dashboard" },
  { id: "triage", icon: List, label: "Triage" },
  { id: "compare", icon: GitCompareArrows, label: "Compare" },
  { id: "upload", icon: Upload, label: "Upload" },
] as const;

interface NavbarProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

export default function Navbar({ activeView, onViewChange }: NavbarProps) {
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between px-6 py-3 bg-white border-b border-border">
      {/* Brand */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-card-dark flex items-center justify-center">
          <svg width="18" height="18" viewBox="0 0 28 28" fill="none">
            <path
              d="M14 6v16M8 10l6-4 6 4M8 18l6 4 6-4"
              stroke="#4A6CF7"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <span className="text-lg font-bold tracking-tight text-foreground">
          Pneumanosis
        </span>
      </div>

      {/* Center Nav Icons */}
      <div className="flex items-center gap-1 bg-background rounded-xl p-1">
        {navItems.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => onViewChange(id)}
            title={label}
            className={`p-2.5 rounded-lg transition-all duration-200 ${
              activeView === id
                ? "bg-accent text-white shadow-sm"
                : "text-muted hover:text-foreground hover:bg-white"
            }`}
          >
            <Icon size={18} strokeWidth={activeView === id ? 2.2 : 1.8} />
          </button>
        ))}
      </div>

      {/* Right */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm text-muted">
          <Clock size={15} />
          <span>{dateStr}</span>
        </div>
        <div className="relative">
          <Bell size={18} className="text-muted" />
          <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-critical text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            3
          </span>
        </div>
        <div className="w-8 h-8 rounded-full bg-accent text-white text-xs font-bold flex items-center justify-center">
          DR
        </div>
      </div>
    </nav>
  );
}
