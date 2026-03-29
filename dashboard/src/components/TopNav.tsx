"use client";

import { Search, Bell, Settings, Moon, Sun } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { useTheme } from "@/components/ThemeProvider";

const navItems = [
  { id: "triage", label: "Triage" },
  { id: "dashboard", label: "Patients" },
  { id: "upload", label: "Upload" },
  { id: "compare", label: "Compare" },
] as const;

interface TopNavProps {
  activeView: string;
  onViewChange: (view: string) => void;
  globalSearch: string;
  onGlobalSearchChange: (q: string) => void;
  apiConnected?: boolean;
}

export default function TopNav({ activeView, onViewChange, globalSearch, onGlobalSearchChange, apiConnected }: TopNavProps) {
  const { theme, toggle } = useTheme();

  return (
    <nav className="sticky top-0 z-50 bg-card border-b border-border">
      <div className="max-w-screen-2xl mx-auto px-8 flex items-center justify-between h-16">
        {/* Brand */}
        <div className="flex items-center gap-8">
          <button onClick={() => onViewChange("triage")} className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M12 2C8 2 4 6 4 10c0 2.5 1.5 5 4 6.5V20a1 1 0 001 1h6a1 1 0 001-1v-3.5c2.5-1.5 4-4 4-6.5 0-4-4-8-8-8z" stroke="var(--background)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M9 21h6M10 17h4" stroke="var(--background)" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <span className="text-lg font-bold text-foreground tracking-tight">{APP_NAME}</span>
          </button>

          {/* Nav tabs */}
          <div className="flex items-center gap-1">
            {navItems.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => onViewChange(id)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  activeView === id
                    ? "bg-accent text-background"
                    : "text-muted hover:text-foreground hover:bg-panel-bg"
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
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              placeholder="Search patients..."
              value={globalSearch}
              onChange={(e) => { onGlobalSearchChange(e.target.value); if (activeView !== "triage") onViewChange("triage"); }}
              className="pl-10 pr-4 py-2 text-sm rounded-lg border border-border bg-card text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/10 focus:border-border w-52"
            />
          </div>
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-panel-bg text-[10px] font-medium">
            <span className={`w-1.5 h-1.5 rounded-full ${apiConnected ? "bg-emerald-500" : "bg-muted"}`} />
            <span className={apiConnected ? "text-status-emerald" : "text-muted"}>{apiConnected ? "API Live" : "Mock"}</span>
          </div>
          <button
            onClick={toggle}
            className="p-2 rounded-lg text-muted hover:text-foreground hover:bg-panel-bg transition-colors"
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button className="relative p-2 rounded-lg text-muted hover:text-foreground hover:bg-panel-bg transition-colors">
            <Bell size={18} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
          </button>
          <button className="p-2 rounded-lg text-muted hover:text-foreground hover:bg-panel-bg transition-colors">
            <Settings size={18} />
          </button>
          <div className="flex items-center gap-2 ml-2 pl-3 border-l border-border">
            <div className="w-8 h-8 rounded-full bg-accent text-background text-xs font-bold flex items-center justify-center">DR</div>
            <div className="hidden lg:block">
              <p className="text-sm font-medium text-foreground leading-tight">Dr. Radiologist</p>
              <p className="text-[11px] text-muted">radiologist@hospital.org</p>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
