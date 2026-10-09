import type { CSSProperties } from "react";

export const M = {
  teal: "var(--primary, #008E95)",
  tealDeep: "var(--primary-dark, #007A80)",
  darkBlue: "var(--sidebar, #072C46)",
  navy: "var(--sidebar-border, #072C46)",
  white: "var(--card, #FFFFFF)",
  bgTeal: "var(--background, #F4FAFA)",
  bgBlue: "var(--secondary, #EEF4F7)",
  textPrimary: "var(--card-foreground, var(--text-primary, #16374A))",
  textSec: "var(--card-muted-foreground, var(--text-secondary, #6B7C87))",
  textMuted: "var(--text-muted, #8898A2)",
  pageTitle: "var(--page-title, var(--text-primary, #16374A))",
  pageSubtitle: "var(--page-subtitle, var(--text-secondary, #6B7C87))",
  
  // Status Colors (Green, Yellow, Orange, Red)
  success: "var(--status-green, #16A34A)",
  warning: "var(--status-yellow, #CA8A04)",
  orange: "var(--status-orange, #EA580C)",
  danger: "var(--status-red, #DC2626)",

  successBg: "var(--status-green-bg, #DCFCE7)",
  warningBg: "var(--status-yellow-bg, #FEF9C3)",
  orangeBg: "var(--status-orange-bg, #FFEDD5)",
  dangerBg: "var(--status-red-bg, #FEE2E2)",

  successText: "var(--status-green-text, #166534)",
  warningText: "var(--status-yellow-text, #854D0E)",
  orangeText: "var(--status-orange-text, #9A3412)",
  dangerText: "var(--status-red-text, #991B1B)",

  border: "var(--card-border, var(--border, #E0EEEE))",
  borderDark: "var(--border-strong, #C8DEDE)",
  borderSubtle: "var(--border-subtle, #EDF4F4)",
  textPri: "var(--card-foreground, var(--text-primary, #16374A))",
};

export const G = {
  hero: "var(--gradient-hero, linear-gradient(145deg, #008E95 0%, #0A3552 55%, #072C46 100%))",
  sidebar: "var(--sidebar-gradient, linear-gradient(180deg, #008E95 0%, #0A3552 60%, #072C46 100%))",
  tealBtn: "linear-gradient(135deg, var(--primary, #008E95), var(--primary-dark, #007A80))",
};

export const CHART_PAL = [
  "#008E95", "#00A8A8", "#3B82F6", "#F59E0B", "#16A34A", "#DC2626", "#8B5CF6", "#06B6D4",
];

export const ROTATION_MS = 8000;
export const FADE_MS = 380;
const now = new Date();
export const TODAY_MMDD = `${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

export const cardBase: CSSProperties = {
  background: "var(--card, #FFFFFF)",
  color: "var(--card-foreground, var(--text-primary, #16374A))",
  border: "1px solid var(--card-border, var(--border, #E0EEEE))",
  borderRadius: 20,
  boxShadow: "var(--shadow, 0 4px 20px rgba(0,0,0,0.05))",
  transition: "background-color 0.25s ease, border-color 0.25s ease, color 0.25s ease",
};

export function isBirthday(mmdd: string) {
  if (!mmdd) {
    return false;
  }

  if (mmdd === TODAY_MMDD) {
    return true;
  }

  const date = new Date(mmdd);
  if (Number.isNaN(date.getTime())) {
    return false;
  }

  const monthDay = `${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  return monthDay === TODAY_MMDD;
}

export function msToCountdown(ms: number) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return s < 10 ? `00:0${s}` : `00:${s}`;
}
