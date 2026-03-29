"use client";

import {
  LayoutGrid, List, GitCompareArrows, Upload, Settings, HelpCircle,
} from "lucide-react";
import { APP_NAME } from "@/lib/constants";

const navItems = [
  { id: "dashboard", icon: LayoutGrid, label: "Dashboard" },
  { id: "triage", icon: List, label: "Triage Queue" },
  { id: "compare", icon: GitCompareArrows, label: "Compare" },
  { id: "upload", icon: Upload, label: "Upload" },
] as const;

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

export default function Sidebar({ activeView, onViewChange }: SidebarProps) {
  return (
    <aside className="fixed left-0 top-0 bottom-0 w-14 bg-white border-r border-border flex flex-col items-center py-4 z-50">
      {/* Logo */}
      <button
        onClick={() => onViewChange("triage")}
        title={APP_NAME}
        className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center mb-1 hover:scale-105 transition-transform"
      >
        <svg width="20" height="20" viewBox="0 0 28 28" fill="none">
          <path
            d="M14 6v16M8 10l6-4 6 4M8 18l6 4 6-4"
            stroke="#ffffff"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      <span className="text-[7px] font-bold text-accent tracking-tight mb-6">{APP_NAME}</span>

      {/* Nav Icons */}
      <nav className="flex flex-col items-center gap-1.5 flex-1">
        {navItems.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => onViewChange(id)}
            title={label}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 ${
              activeView === id
                ? "bg-accent text-white shadow-md shadow-accent/25"
                : "text-muted hover:text-foreground hover:bg-panel-bg"
            }`}
          >
            <Icon size={18} strokeWidth={activeView === id ? 2.2 : 1.6} />
          </button>
        ))}
      </nav>

      {/* Bottom */}
      <div className="flex flex-col items-center gap-1.5">
        <button title="Help" className="w-10 h-10 rounded-xl flex items-center justify-center text-muted hover:text-foreground hover:bg-panel-bg transition-colors">
          <HelpCircle size={18} strokeWidth={1.6} />
        </button>
        <button title="Settings" className="w-10 h-10 rounded-xl flex items-center justify-center text-muted hover:text-foreground hover:bg-panel-bg transition-colors">
          <Settings size={18} strokeWidth={1.6} />
        </button>
        <div className="w-8 h-8 rounded-full bg-accent text-white text-[11px] font-bold flex items-center justify-center mt-2">
          DR
        </div>
      </div>
    </aside>
  );
}
