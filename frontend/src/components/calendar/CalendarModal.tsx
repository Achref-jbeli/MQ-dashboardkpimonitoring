import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { M, isBirthday } from "../../theme/tokens";
import type { Event as CalendarEvent } from "../../types/event";
import type { Employee } from "../../types/employee";
import { getEvents } from "../../api/eventApi";
import { getEmployees } from "../../api/employeeApi";
import { resolveImageUrl, FALLBACK_IMAGE } from "../../utils/imageUrl";

const now = new Date();
const TODAY_YEAR = now.getFullYear();
const TODAY_MONTH = now.getMonth();
const TODAY_KEY = `${TODAY_YEAR}-${String(TODAY_MONTH + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

const TYPE_COLORS: Record<string, string> = {
  meeting: M.teal,
  birthday: M.warning,
  event: M.success,
  milestone: M.tealDeep,
  holiday: M.danger,
};

const typeColor = (type?: string) => TYPE_COLORS[type ?? ""] ?? M.teal;

// Normalizes any ISO date/date-time string to a plain "YYYY-MM-DD" key without
// going through the Date object (avoids local-timezone off-by-one shifts).
const toDateKey = (date?: string) => (date ? date.slice(0, 10) : "");
const monthDayOf = (date?: string) => (date ? date.slice(5, 10) : "");
const formatDateKey = (key: string) =>
  key ? new Date(`${key}T00:00:00`).toLocaleDateString("en-GB", { weekday: "long", month: "long", day: "numeric" }) : "";

export function CalendarModal({ onClose }: { onClose: () => void }) {
  const [year, setYear] = useState(TODAY_YEAR);
  const [month, setMonth] = useState(TODAY_MONTH);
  const [selectedDate, setSelectedDate] = useState(TODAY_KEY);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.allSettled([getEvents(), getEmployees()])
      .then(([eventsResult, employeesResult]) => {
        if (cancelled) return;

        if (eventsResult.status === "fulfilled") {
          setEvents(eventsResult.value);
        } else {
          console.error("Error loading calendar events:", eventsResult.reason);
          setEvents([]);
        }

        if (employeesResult.status === "fulfilled") {
          setEmployees(employeesResult.value);
        } else {
          console.error("Error loading calendar employees:", employeesResult.reason);
          setEmployees([]);
        }
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  const totalDays = new Date(year, month + 1, 0).getDate();
  const firstDay = (() => {
    const d = new Date(year, month, 1).getDay();
    return d === 0 ? 6 : d - 1;
  })();
  const dayKey = (day: number) => `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const getEvts = (day: number) => events.filter((e) => toDateKey(e.date) === dayKey(day));
  const selectedEvts = events
    .filter((e) => toDateKey(e.date) === selectedDate)
    .sort((a, b) => (a.title ?? "").localeCompare(b.title ?? ""));
  const upcoming = events
    .filter((e) => {
      const key = toDateKey(e.date);
      return key !== "" && key >= TODAY_KEY;
    })
    .sort((a, b) => toDateKey(a.date).localeCompare(toDateKey(b.date)))
    .slice(0, 5);
  const monthBirthdays = employees.filter((e) => monthDayOf(e.birthDate) && monthDayOf(e.birthDate).slice(0, 2) === String(month + 1).padStart(2, "0"));

  const goToMonth = (y: number, m: number) => {
    setYear(y);
    setMonth(m);
  };

  const jumpToDate = (key: string) => {
    if (!key) return;
    const [y, m] = key.split("-").map(Number);
    goToMonth(y, m - 1);
    setSelectedDate(key);
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(7,44,70,0.7)", backdropFilter: "blur(16px)" }} onClick={onClose} />
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 740,
          borderRadius: 28,
          overflow: "hidden",
          display: "flex",
          boxShadow: "0 32px 80px rgba(0,0,0,0.3)",
          maxHeight: "90vh",
          background: M.white,
        }}
      >
        {/* Calendar grid */}
        <div style={{ flex: 1, padding: 28, display: "flex", flexDirection: "column", borderRight: `1px solid ${M.border}` }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <button
              onClick={() => (month === 0 ? (setMonth(11), setYear((y) => y - 1)) : setMonth((m) => m - 1))}
              style={{ width: 32, height: 32, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", background: M.bgTeal, border: "none", cursor: "pointer", color: M.teal }}
            >
              <ChevronLeft size={16} />
            </button>
            <p style={{ fontWeight: 700, color: M.textPrimary, fontSize: 15 }}>
              {MONTHS[month]} {year}
            </p>
            <button
              onClick={() => (month === 11 ? (setMonth(0), setYear((y) => y + 1)) : setMonth((m) => m + 1))}
              style={{ width: 32, height: 32, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", background: M.bgTeal, border: "none", cursor: "pointer", color: M.teal }}
            >
              <ChevronRight size={16} />
            </button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", marginBottom: 8 }}>
            {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((d) => (
              <div key={d} style={{ textAlign: "center", fontSize: 11, fontWeight: 600, padding: "4px 0", color: M.textSec }}>
                {d}
              </div>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, flex: 1 }}>
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`e${i}`} />
            ))}
            {Array.from({ length: totalDays }, (_, i) => i + 1).map((day) => {
              const key = dayKey(day);
              const isToday = key === TODAY_KEY;
              const isSelected = key === selectedDate;
              const evts = getEvts(day);
              return (
                <button
                  key={day}
                  onClick={() => setSelectedDate(key)}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    padding: "6px 2px",
                    borderRadius: 14,
                    background: isToday ? M.teal : "transparent",
                    border: isSelected && !isToday ? `1px solid ${M.teal}` : "1px solid transparent",
                    cursor: "pointer",
                    font: "inherit",
                  }}
                >
                  <span style={{ fontSize: 13, fontWeight: 500, color: isToday ? "#fff" : M.textPrimary }}>{day}</span>
                  <div style={{ display: "flex", gap: 2, marginTop: 2 }}>
                    {evts.slice(0, 3).map((e, i) => (
                      <div key={i} style={{ width: 5, height: 5, borderRadius: "50%", background: isToday ? "#fff" : typeColor(e.type) }} />
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
          <button
            onClick={() => {
              goToMonth(TODAY_YEAR, TODAY_MONTH);
              setSelectedDate(TODAY_KEY);
            }}
            style={{ marginTop: 16, alignSelf: "center", fontSize: 12, fontWeight: 600, padding: "6px 16px", borderRadius: 12, background: M.bgTeal, color: M.teal, border: "none", cursor: "pointer" }}
          >
            Today
          </button>
        </div>
        {/* Events panel */}
        <div style={{ width: 280, padding: 24, display: "flex", flexDirection: "column", gap: 16, overflowY: "auto", background: M.bgTeal }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: M.textPrimary }}>Events</p>
            <button
              onClick={onClose}
              style={{ width: 28, height: 28, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", background: M.border, color: M.textSec, border: "none", cursor: "pointer" }}
            >
              <X size={14} />
            </button>
          </div>
          {loading && <p style={{ fontSize: 12, color: M.textSec, margin: 0 }}>Loading events...</p>}
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: M.teal, marginBottom: 8 }}>
              {selectedDate === TODAY_KEY ? "TODAY" : "SELECTED DAY"} — {formatDateKey(selectedDate).toUpperCase()}
            </p>
            {selectedEvts.length === 0 && !loading && (
              <p style={{ fontSize: 12, color: M.textSec, margin: 0 }}>No events on this day.</p>
            )}
            {selectedEvts.map((e) => (
              <div key={e.id} style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "10px 12px", borderRadius: 14, marginBottom: 6, background: M.white, border: `1px solid ${M.border}` }}>
                {e.imageUrl ? (
                  <img
                    src={resolveImageUrl(e.imageUrl, FALLBACK_IMAGE)}
                    alt={e.title}
                    onError={(ev) => { ev.currentTarget.src = FALLBACK_IMAGE; }}
                    style={{ width: 32, height: 32, borderRadius: 8, objectFit: "cover", flexShrink: 0 }}
                  />
                ) : (
                  <div style={{ width: 8, height: 8, borderRadius: "50%", flexShrink: 0, marginTop: 4, background: typeColor(e.type) }} />
                )}
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: 12, fontWeight: 500, color: M.textPrimary, margin: 0 }}>{e.title}</p>
                  {e.location && <p style={{ fontSize: 10, color: M.textSec, margin: "2px 0 0" }}>{e.location}</p>}
                  {e.description && <p style={{ fontSize: 10, color: M.textSec, margin: "2px 0 0" }}>{e.description}</p>}
                </div>
              </div>
            ))}
          </div>
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: M.textSec, marginBottom: 8 }}>UPCOMING</p>
            {upcoming.length === 0 && !loading && <p style={{ fontSize: 12, color: M.textSec, margin: 0 }}>No upcoming events.</p>}
            {upcoming.map((e) => (
              <div
                key={e.id}
                onClick={() => jumpToDate(toDateKey(e.date))}
                style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderRadius: 14, marginBottom: 6, background: M.white, border: `1px solid ${M.border}`, cursor: "pointer" }}
              >
                {e.imageUrl ? (
                  <img
                    src={resolveImageUrl(e.imageUrl, FALLBACK_IMAGE)}
                    alt={e.title}
                    onError={(ev) => { ev.currentTarget.src = FALLBACK_IMAGE; }}
                    style={{ width: 28, height: 28, borderRadius: 8, objectFit: "cover", flexShrink: 0 }}
                  />
                ) : (
                  <div style={{ width: 8, height: 8, borderRadius: "50%", flexShrink: 0, background: typeColor(e.type) }} />
                )}
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: 12, fontWeight: 500, color: M.textPrimary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.title}</p>
                  <p style={{ fontSize: 10, fontFamily: "DM Mono, monospace", color: M.textSec }}>
                    {new Date(`${toDateKey(e.date)}T00:00:00`).toLocaleDateString("en-GB", { month: "short", day: "numeric" })}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: M.textSec, marginBottom: 8 }}>🎂 {MONTHS[month].toUpperCase()} BIRTHDAYS</p>
            {monthBirthdays.length === 0 && !loading && <p style={{ fontSize: 12, color: M.textSec, margin: 0 }}>No birthdays this month.</p>}
            {monthBirthdays.map((emp) => (
              <div key={emp.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderRadius: 14, marginBottom: 6, background: M.white, border: `1px solid ${M.border}` }}>
                <img
                  src={resolveImageUrl(emp.photo, FALLBACK_IMAGE)}
                  alt={`${emp.firstName} ${emp.lastName}`}
                  onError={(ev) => { ev.currentTarget.src = FALLBACK_IMAGE; }}
                  style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
                />
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: 12, fontWeight: 500, color: M.textPrimary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{emp.firstName} {emp.lastName}</p>
                  <p style={{ fontSize: 10, color: M.textSec }}>{MONTHS[month]} {monthDayOf(emp.birthDate).slice(3, 5)}</p>
                </div>
                {isBirthday(monthDayOf(emp.birthDate)) && <span style={{ marginLeft: "auto", fontSize: 16 }}>🎂</span>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

