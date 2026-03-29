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
  2: { badge: "bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/30", dot: "bg-red-500", row: "hover:bg-red-50/40 dark:hover:bg-red-950/20" },
  3: { badge: "bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30", dot: "bg-amber-500", row: "hover:bg-amber-50/40 dark:hover:bg-amber-950/20" },
  4: { badge: "bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30", dot: "bg-blue-500", row: "hover:bg-blue-50/40 dark:hover:bg-blue-950/20" },
  5: { badge: "bg-panel-bg text-muted border border-border", dot: "bg-muted", row: "hover:bg-panel-bg/40" },
};

// Detection threshold — findings below this % are grayed out
// Matches backend api/main.py threshold (conf >= 0.5)
export const DETECTION_THRESHOLD = 0.5;

// App
export const APP_NAME = "Pneumanosis";
export const APP_TAGLINE = "AI Triage Co-Pilot";
