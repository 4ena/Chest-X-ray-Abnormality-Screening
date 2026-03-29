/**
 * Shared design constants for Pneumanosis dashboard.
 * Single source of truth — import from here, not hardcode hex values.
 */

// Tier colors — maps to Model_Hospital_Ranking.md
export const TIER_COLORS: Record<number, string> = {
  2: "#ef4444",   // Urgent — red
  3: "#f59e0b",   // Semi-urgent — amber
  4: "#3b82f6",   // Moderate — blue
};

export const TIER_LABELS: Record<number, string> = {
  2: "STAT",
  3: "PRIORITY",
  4: "ROUTINE",
};

export const TIER_STYLES: Record<number, { badge: string; dot: string; row: string }> = {
  2: { badge: "bg-red-50 text-red-600 border border-red-100", dot: "bg-red-500", row: "hover:bg-red-50/40" },
  3: { badge: "bg-amber-50 text-amber-600 border border-amber-100", dot: "bg-amber-500", row: "hover:bg-amber-50/40" },
  4: { badge: "bg-blue-50 text-blue-600 border border-blue-100", dot: "bg-blue-500", row: "hover:bg-blue-50/40" },
};

// Detection threshold — findings below this % are grayed out
// Matches backend api/main.py threshold (conf >= 0.5)
export const DETECTION_THRESHOLD = 0.5;

// App
export const APP_NAME = "Pneumanosis";
export const APP_TAGLINE = "AI Triage Co-Pilot";
