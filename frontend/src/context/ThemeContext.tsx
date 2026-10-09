import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

export type ThemeMode = "light" | "dark" | "teal";

export interface ThemeSchedule {
  enabled: boolean;
  lightStart: string; // "HH:mm", e.g. "04:00"
  lightEnd: string;   // "HH:mm", e.g. "20:00"
}

interface ThemeContextType {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  schedule: ThemeSchedule;
  setSchedule: (schedule: ThemeSchedule | ((prev: ThemeSchedule) => ThemeSchedule)) => void;
  toggleSchedule: () => void;
  undoSchedule: () => void;
  isScheduleActive: boolean;
}

const THEME_KEY = "dashboard-theme";
const THEME_SCHEDULE_KEY = "dashboard-theme-schedule";

const DEFAULT_SCHEDULE: ThemeSchedule = {
  enabled: false,
  lightStart: "04:00",
  lightEnd: "20:00",
};

export function isLightBySchedule(lightStart: string, lightEnd: string): boolean {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const [sH = 4, sM = 0] = lightStart.split(":").map(Number);
  const [eH = 20, eM = 0] = lightEnd.split(":").map(Number);
  const startMinutes = sH * 60 + sM;
  const endMinutes = eH * 60 + eM;

  if (startMinutes <= endMinutes) {
    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  } else {
    // Overnight (e.g. 20:00 to 04:00)
    return currentMinutes >= startMinutes || currentMinutes < endMinutes;
  }
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "light",
  setTheme: () => {},
  toggleTheme: () => {},
  schedule: DEFAULT_SCHEDULE,
  setSchedule: () => {},
  toggleSchedule: () => {},
  undoSchedule: () => {},
  isScheduleActive: false,
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [schedule, setScheduleState] = useState<ThemeSchedule>(() => {
    try {
      const saved = localStorage.getItem(THEME_SCHEDULE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          enabled: Boolean(parsed.enabled),
          lightStart: parsed.lightStart || "04:00",
          lightEnd: parsed.lightEnd || "20:00",
        };
      }
    } catch { /* fallback */ }
    return DEFAULT_SCHEDULE;
  });

  const [theme, setThemeState] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem(THEME_KEY) as ThemeMode | null;
    if (saved === "light" || saved === "dark" || saved === "teal") {
      return saved;
    }
    return "light";
  });

  const applyTheme = useCallback((newTheme: ThemeMode) => {
    const root = document.documentElement;
    root.setAttribute("data-theme", newTheme);

    root.classList.remove("dark", "theme-teal", "theme-light");
    if (newTheme === "dark") {
      root.classList.add("dark");
    } else if (newTheme === "teal") {
      root.classList.add("theme-teal");
    } else {
      root.classList.add("theme-light");
    }

    localStorage.setItem(THEME_KEY, newTheme);
  }, []);

  const setTheme = useCallback((newTheme: ThemeMode) => {
    setThemeState(newTheme);
    applyTheme(newTheme);
  }, [applyTheme]);

  const setSchedule = useCallback((updater: ThemeSchedule | ((prev: ThemeSchedule) => ThemeSchedule)) => {
    setScheduleState(prev => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      try {
        localStorage.setItem(THEME_SCHEDULE_KEY, JSON.stringify(next));
      } catch { /* silent */ }

      if (next.enabled) {
        const shouldBeLight = isLightBySchedule(next.lightStart, next.lightEnd);
        const scheduledTheme: ThemeMode = shouldBeLight ? "light" : "dark";
        setThemeState(scheduledTheme);
        applyTheme(scheduledTheme);
      }
      return next;
    });
  }, [applyTheme]);

  const toggleSchedule = useCallback(() => {
    setSchedule(prev => ({ ...prev, enabled: !prev.enabled }));
  }, [setSchedule]);

  const undoSchedule = useCallback(() => {
    setSchedule({ enabled: false, lightStart: "04:00", lightEnd: "20:00" });
  }, [setSchedule]);

  // Periodic evaluation of schedule
  useEffect(() => {
    const checkSchedule = () => {
      if (!schedule.enabled) return;
      const shouldBeLight = isLightBySchedule(schedule.lightStart, schedule.lightEnd);
      const scheduledTheme: ThemeMode = shouldBeLight ? "light" : "dark";
      setThemeState(current => {
        if (current !== scheduledTheme && (current === "light" || current === "dark")) {
          applyTheme(scheduledTheme);
          return scheduledTheme;
        }
        return current;
      });
    };

    checkSchedule();
    const interval = setInterval(checkSchedule, 20000); // Check every 20s
    return () => clearInterval(interval);
  }, [schedule.enabled, schedule.lightStart, schedule.lightEnd, applyTheme]);

  useEffect(() => {
    applyTheme(theme);
  }, [theme, applyTheme]);

  const toggleTheme = () => {
    const next: ThemeMode = theme === "light" ? "dark" : theme === "dark" ? "teal" : "light";
    setTheme(next);
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        toggleTheme,
        schedule,
        setSchedule,
        toggleSchedule,
        undoSchedule,
        isScheduleActive: schedule.enabled,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
