import React from "react";
import { Clock, Sun, Moon, RotateCcw, Check, Sparkles } from "lucide-react";
import { useTheme, isLightBySchedule } from "../../context/ThemeContext";
import { M } from "../../theme/tokens";

export const ThemeScheduleControl: React.FC = () => {
  const { schedule, setSchedule, undoSchedule } = useTheme();

  const isCurrentlyLight = isLightBySchedule(schedule.lightStart, schedule.lightEnd);

  const handleToggle = () => {
    setSchedule(prev => ({ ...prev, enabled: !prev.enabled }));
  };

  const handleStartTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSchedule(prev => ({ ...prev, lightStart: val }));
  };

  const handleEndTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSchedule(prev => ({ ...prev, lightEnd: val }));
  };

  const applyPreset = (start: string, end: string) => {
    setSchedule({ enabled: true, lightStart: start, lightEnd: end });
  };

  return (
    <div
      style={{
        borderRadius: 20,
        background: "var(--card, #ffffff)",
        border: "1px solid var(--border, #DCE5EA)",
        padding: 22,
        boxShadow: "0 4px 14px rgba(0,0,0,0.05)",
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      {/* Header with Switch */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: schedule.enabled ? "rgba(0,168,168,0.14)" : "var(--secondary, rgba(0,0,0,0.05))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: schedule.enabled ? M.teal : M.textSec,
              transition: "all 0.2s ease",
            }}
          >
            <Clock size={20} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700, color: "var(--foreground, #1F2937)" }}>
              Auto Theme Timer (Day / Night Schedule)
            </h3>
            <p style={{ margin: "2px 0 0", fontSize: "0.85rem", color: "var(--muted-foreground, #6B7280)" }}>
              Automatically switch between Light mode and Dark mode at specified times.
            </p>
          </div>
        </div>

        {/* Toggle Switch */}
        <button
          onClick={handleToggle}
          type="button"
          role="switch"
          aria-checked={schedule.enabled}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 16px",
            borderRadius: 999,
            border: schedule.enabled ? `1.5px solid ${M.teal}` : `1px solid ${M.border}`,
            background: schedule.enabled ? `linear-gradient(135deg, ${M.teal}, ${M.tealDeep})` : "var(--secondary, #F3F4F6)",
            color: schedule.enabled ? "#ffffff" : M.textPrimary,
            fontSize: "0.875rem",
            fontWeight: 700,
            cursor: "pointer",
            transition: "all 0.2s ease",
            boxShadow: schedule.enabled ? "0 4px 12px rgba(0,168,168,0.3)" : "none",
          }}
        >
          {schedule.enabled ? (
            <>
              <Check size={15} /> Timer Active
            </>
          ) : (
            <>Enable Timer</>
          )}
        </button>
      </div>

      {/* Timer Controls Body */}
      {schedule.enabled && (
        <div
          style={{
            marginTop: 4,
            paddingTop: 16,
            borderTop: "1px solid var(--border, #E5E7EB)",
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          {/* Active Status Badge */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 10,
              padding: "10px 14px",
              borderRadius: 12,
              background: isCurrentlyLight ? "rgba(245, 158, 11, 0.1)" : "rgba(99, 102, 241, 0.12)",
              border: `1px solid ${isCurrentlyLight ? "rgba(245, 158, 11, 0.3)" : "rgba(99, 102, 241, 0.3)"}`,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.875rem", fontWeight: 600, color: isCurrentlyLight ? "#B45309" : "#4F46E5" }}>
              {isCurrentlyLight ? <Sun size={18} /> : <Moon size={18} />}
              <span>
                Currently active: <strong>{isCurrentlyLight ? "Light Mode" : "Dark Mode"}</strong> (Scheduled {schedule.lightStart} – {schedule.lightEnd} for Light mode)
              </span>
            </div>
            <button
              onClick={undoSchedule}
              type="button"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                padding: "4px 10px",
                borderRadius: 8,
                border: "1px solid var(--border, #D1D5DB)",
                background: "var(--card, #fff)",
                color: M.textSec,
                fontSize: "0.80rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
              title="Turn off schedule and restore manual mode"
            >
              <RotateCcw size={12} /> Undo Timer
            </button>
          </div>

          {/* Time Pickers */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 14,
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--foreground, #374151)", display: "flex", alignItems: "center", gap: 6 }}>
                <Sun size={15} color="#F59E0B" /> Light Mode Start (e.g. 04:00 AM)
              </label>
              <input
                type="time"
                value={schedule.lightStart}
                onChange={handleStartTimeChange}
                style={{
                  padding: "9px 12px",
                  borderRadius: 10,
                  border: `1px solid ${M.border}`,
                  background: "var(--card, #fff)",
                  color: M.textPrimary,
                  fontSize: "0.95rem",
                  fontFamily: "inherit",
                  fontWeight: 600,
                  outline: "none",
                }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--foreground, #374151)", display: "flex", alignItems: "center", gap: 6 }}>
                <Moon size={15} color="#6366F1" /> Light Mode End / Dark Mode Start (e.g. 20:00 / 8 PM)
              </label>
              <input
                type="time"
                value={schedule.lightEnd}
                onChange={handleEndTimeChange}
                style={{
                  padding: "9px 12px",
                  borderRadius: 10,
                  border: `1px solid ${M.border}`,
                  background: "var(--card, #fff)",
                  color: M.textPrimary,
                  fontSize: "0.95rem",
                  fontFamily: "inherit",
                  fontWeight: 600,
                  outline: "none",
                }}
              />
            </div>
          </div>

          {/* Quick Presets */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: "0.80rem", color: M.textSec, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
              <Sparkles size={13} color={M.teal} /> Presets:
            </span>
            <button
              type="button"
              onClick={() => applyPreset("04:00", "20:00")}
              style={{
                padding: "4px 10px",
                borderRadius: 8,
                border: schedule.lightStart === "04:00" && schedule.lightEnd === "20:00" ? `1.5px solid ${M.teal}` : `1px solid ${M.border}`,
                background: schedule.lightStart === "04:00" && schedule.lightEnd === "20:00" ? "rgba(0,168,168,0.12)" : "var(--secondary, #F9FAFB)",
                color: M.textPrimary,
                fontSize: "0.80rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              4:00 AM – 20:00 PM (Requested)
            </button>
            <button
              type="button"
              onClick={() => applyPreset("06:00", "18:00")}
              style={{
                padding: "4px 10px",
                borderRadius: 8,
                border: schedule.lightStart === "06:00" && schedule.lightEnd === "18:00" ? `1.5px solid ${M.teal}` : `1px solid ${M.border}`,
                background: schedule.lightStart === "06:00" && schedule.lightEnd === "18:00" ? "rgba(0,168,168,0.12)" : "var(--secondary, #F9FAFB)",
                color: M.textPrimary,
                fontSize: "0.80rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              6:00 AM – 18:00 PM (Daylight)
            </button>
            <button
              type="button"
              onClick={() => applyPreset("08:00", "22:00")}
              style={{
                padding: "4px 10px",
                borderRadius: 8,
                border: schedule.lightStart === "08:00" && schedule.lightEnd === "22:00" ? `1.5px solid ${M.teal}` : `1px solid ${M.border}`,
                background: schedule.lightStart === "08:00" && schedule.lightEnd === "22:00" ? "rgba(0,168,168,0.12)" : "var(--secondary, #F9FAFB)",
                color: M.textPrimary,
                fontSize: "0.80rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              8:00 AM – 22:00 PM (Office Extended)
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
