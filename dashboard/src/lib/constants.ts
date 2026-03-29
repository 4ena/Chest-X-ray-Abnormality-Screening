/**
 * Shared design constants for Pneumanosis dashboard.
 * Single source of truth — import from here, not hardcode hex values.
 */

// Tier colors — maps to Model_Hospital_Ranking.md
export const TIER_COLORS: Record<number, string> = {
  2: "#ef4444",   // STAT — red
  3: "#f59e0b",   // PRIORITY — amber
  4: "#3b82f6",   // ROUTINE — blue
  5: "#9ca3af",   // NO FINDINGS — gray
};

export const TIER_LABELS: Record<number, string> = {
  2: "STAT",
  3: "PRIORITY",
  4: "ROUTINE",
  5: "CLEAR",
};

export const TIER_STYLES: Record<number, { badge: string; dot: string; row: string }> = {
  2: { badge: "bg-status-red-subtle text-status-red border border-status-red/20", dot: "bg-status-red", row: "hover:bg-status-red-subtle/60" },
  3: { badge: "bg-status-amber-subtle text-status-amber border border-status-amber/20", dot: "bg-status-amber", row: "hover:bg-status-amber-subtle/60" },
  4: { badge: "bg-status-blue-subtle text-status-blue border border-status-blue/20", dot: "bg-status-blue", row: "hover:bg-status-blue-subtle/60" },
  5: { badge: "bg-panel-bg text-muted border border-border", dot: "bg-muted", row: "hover:bg-panel-bg/40" },
};

// Detection threshold — findings below this % are grayed out
// Matches backend api/main.py threshold (conf >= 0.5)
export const DETECTION_THRESHOLD = 0.5;

// App
export const APP_NAME = "Pneumanosis";
export const APP_TAGLINE = "AI Triage Co-Pilot";
