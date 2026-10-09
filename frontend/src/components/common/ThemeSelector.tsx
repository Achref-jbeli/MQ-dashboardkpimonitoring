import React from "react";
import { useTheme, type ThemeMode } from "../../context/ThemeContext";

interface ThemeSelectorProps {
  compact?: boolean;
}

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({ compact = false }) => {
  const { theme, setTheme, schedule, undoSchedule } = useTheme();

  const options: { mode: ThemeMode; label: string; icon: string }[] = [
    { mode: "light", label: "Light", icon: "☀" },
    { mode: "dark", label: "Dark", icon: "🌙" },
    { mode: "teal", label: "Marquardt Teal", icon: "🌊" },
  ];

  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
      <div
        className="theme-selector-container"
        style={{
          display: "inline-flex",
          alignItems: "center",
          backgroundColor: "var(--secondary, rgba(0, 0, 0, 0.06))",
          borderRadius: "9999px",
          padding: "3px",
          border: "1px solid var(--border, rgba(255, 255, 255, 0.15))",
        }}
        role="radiogroup"
        aria-label="Theme selector"
      >
        {options.map(opt => {
          const isActive = theme === opt.mode;
          return (
            <button
              key={opt.mode}
              type="button"
              role="radio"
              aria-checked={isActive}
              onClick={() => setTheme(opt.mode)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: compact ? "4px 8px" : "6px 12px",
                borderRadius: "9999px",
                fontSize: compact ? "0.80rem" : "0.875rem",
                fontWeight: isActive ? 600 : 500,
                color: isActive ? "var(--primary-foreground, #ffffff)" : "var(--foreground, #1F2937)",
                backgroundColor: isActive ? "var(--primary, #087F86)" : "transparent",
                border: "none",
                cursor: "pointer",
                transition: "all 0.2s ease",
                boxShadow: isActive ? "0 2px 6px rgba(0,0,0,0.15)" : "none",
              }}
              title={`Switch to ${opt.label} theme`}
            >
              <span>{opt.icon}</span>
              {!compact && <span>{opt.label}</span>}
            </button>
          );
        })}
      </div>

      {schedule.enabled && (
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "4px 10px",
            borderRadius: "9999px",
            background: "rgba(0, 168, 168, 0.12)",
            border: "1px solid rgba(0, 168, 168, 0.25)",
            fontSize: "0.78rem",
            color: "var(--foreground, #1F2937)",
            fontWeight: 600,
          }}
        >
          <span>⏰ {schedule.lightStart}–{schedule.lightEnd}</span>
          <button
            type="button"
            onClick={undoSchedule}
            style={{
              background: "transparent",
              border: "none",
              color: "#EF4444",
              fontWeight: 700,
              fontSize: "0.75rem",
              cursor: "pointer",
              padding: "0 2px",
            }}
            title="Undo / disable theme timer"
          >
            ✕ Undo
          </button>
        </div>
      )}
    </div>
  );
};
