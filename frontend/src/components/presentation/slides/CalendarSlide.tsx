import React, { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { M, isBirthday } from "../../../theme/tokens";
import type { Event as CalendarEvent } from "../../../types/event";
import type { Employee } from "../../../types/employee";
import { getEvents } from "../../../api/eventApi";
import { getEmployees } from "../../../api/employeeApi";
import { SlideHeader } from "../SlideHeader";
import { resolveImageUrl, FALLBACK_IMAGE } from "../../../utils/imageUrl";

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

const typeColor = (type?: string) => TYPE_COLORS[type?.toLowerCase() ?? ""] ?? M.teal;

const toDateKey = (date?: string) => (date ? date.slice(0, 10) : "");
const monthDayOf = (date?: string) => (date ? date.slice(5, 10) : "");
const formatDateKey = (key: string) =>
  key ? new Date(`${key}T00:00:00`).toLocaleDateString("en-GB", { weekday: "long", month: "long", day: "numeric" }) : "";

export function CalendarSlide() {
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
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
       <SlideHeader title="CALENDAR & EVENTS" />

       <div style={{ flex: 1, display: "flex", gap: "2vw", overflow: "hidden" }}>
          
          {/* Calendar Grid */}
          <div style={{ flex: 2, background: M.white, borderRadius: "2vh", padding: "4vh", boxShadow: "0 1vh 3vh rgba(0,0,0,0.15)", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "3vh" }}>
              <button
                onClick={() => (month === 0 ? (setMonth(11), setYear((y) => y - 1)) : setMonth((m) => m - 1))}
                style={{ width: "4vh", height: "4vh", borderRadius: "1vh", display: "flex", alignItems: "center", justifyContent: "center", background: M.bgTeal, border: "none", cursor: "pointer", color: M.teal }}
              >
                <ChevronLeft size={"2.5vh"} />
              </button>
              <p style={{ fontWeight: 800, color: M.textPrimary, fontSize: "3vh", margin: 0 }}>
                {MONTHS[month]} {year}
              </p>
              <button
                onClick={() => (month === 11 ? (setMonth(0), setYear((y) => y + 1)) : setMonth((m) => m + 1))}
                style={{ width: "4vh", height: "4vh", borderRadius: "1vh", display: "flex", alignItems: "center", justifyContent: "center", background: M.bgTeal, border: "none", cursor: "pointer", color: M.teal }}
              >
                <ChevronRight size={"2.5vh"} />
              </button>
            </div>
            
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", marginBottom: "2vh" }}>
              {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((d) => (
                <div key={d} style={{ textAlign: "center", fontSize: "2vh", fontWeight: 700, padding: "1vh 0", color: M.textSec }}>
                  {d}
                </div>
              ))}
            </div>
            
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "1vh", flex: 1 }}>
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
                      padding: "1vh 0.5vw",
                      borderRadius: "1.5vh",
                      background: isToday ? M.teal : "transparent",
                      border: isSelected && !isToday ? `2px solid ${M.teal}` : "2px solid transparent",
                      cursor: "pointer",
                      font: "inherit",
                    }}
                  >
                    <span style={{ fontSize: "2.5vh", fontWeight: 700, color: isToday ? "#fff" : M.textPrimary }}>{day}</span>
                    <div style={{ display: "flex", gap: "0.2vw", marginTop: "0.5vh" }}>
                      {evts.slice(0, 3).map((e, i) => (
                        <div key={i} style={{ width: "0.8vh", height: "0.8vh", borderRadius: "50%", background: isToday ? "#fff" : typeColor(e.type) }} />
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
              style={{ marginTop: "2vh", alignSelf: "center", fontSize: "1.8vh", fontWeight: 700, padding: "1vh 2vw", borderRadius: "1vh", background: M.bgTeal, color: M.teal, border: "none", cursor: "pointer" }}
            >
              Jump to Today
            </button>
          </div>

          {/* Events Sidebar */}
          <div style={{ flex: 1, background: M.white, borderRadius: "2vh", padding: "4vh", boxShadow: "0 1vh 3vh rgba(0,0,0,0.15)", display: "flex", flexDirection: "column", gap: "3vh", overflowY: "auto" }}>
            
            {loading && <p style={{ fontSize: "2vh", color: M.textSec, margin: 0 }}>Loading calendar...</p>}
            
            <div>
              <p style={{ fontSize: "1.6vh", fontWeight: 800, letterSpacing: "0.1em", color: M.teal, marginBottom: "1.5vh" }}>
                {selectedDate === TODAY_KEY ? "TODAY" : "SELECTED DAY"} — {formatDateKey(selectedDate).toUpperCase()}
              </p>
              {selectedEvts.length === 0 && !loading && (
                <p style={{ fontSize: "1.8vh", color: M.textSec, margin: 0 }}>No events on this day.</p>
              )}
              {selectedEvts.map((e) => (
                <div key={e.id} style={{ display: "flex", alignItems: "flex-start", gap: "1vw", padding: "2vh", borderRadius: "1vh", marginBottom: "1vh", background: "#F9FAFB", border: `1px solid ${M.border}` }}>
                  {e.imageUrl ? (
                    <img
                      src={resolveImageUrl(e.imageUrl, FALLBACK_IMAGE)}
                      alt={e.title}
                      onError={(ev) => { ev.currentTarget.src = FALLBACK_IMAGE; }}
                      style={{ width: "4vh", height: "4vh", borderRadius: "0.8vh", objectFit: "cover", flexShrink: 0 }}
                    />
                  ) : (
                    <div style={{ width: "1.2vh", height: "1.2vh", borderRadius: "50%", flexShrink: 0, marginTop: "0.8vh", background: typeColor(e.type) }} />
                  )}
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: "2vh", fontWeight: 700, color: M.textPrimary, margin: 0 }}>{e.title}</p>
                    {e.location && <p style={{ fontSize: "1.6vh", color: M.textSec, margin: "0.5vh 0 0" }}>{e.location}</p>}
                    {e.description && <p style={{ fontSize: "1.6vh", color: M.textSec, margin: "0.5vh 0 0" }}>{e.description}</p>}
                  </div>
                </div>
              ))}
            </div>

            <div>
              <p style={{ fontSize: "1.6vh", fontWeight: 800, letterSpacing: "0.1em", color: M.textSec, marginBottom: "1.5vh" }}>UPCOMING EVENTS</p>
              {upcoming.length === 0 && !loading && <p style={{ fontSize: "1.8vh", color: M.textSec, margin: 0 }}>No upcoming events.</p>}
              {upcoming.map((e) => (
                <div
                  key={e.id}
                  onClick={() => jumpToDate(toDateKey(e.date))}
                  style={{ display: "flex", alignItems: "center", gap: "1vw", padding: "1.5vh 2vh", borderRadius: "1vh", marginBottom: "1vh", background: "#F9FAFB", border: `1px solid ${M.border}`, cursor: "pointer" }}
                >
                  {e.imageUrl ? (
                    <img
                      src={resolveImageUrl(e.imageUrl, FALLBACK_IMAGE)}
                      alt={e.title}
                      onError={(ev) => { ev.currentTarget.src = FALLBACK_IMAGE; }}
                      style={{ width: "3.5vh", height: "3.5vh", borderRadius: "0.8vh", objectFit: "cover", flexShrink: 0 }}
                    />
                  ) : (
                    <div style={{ width: "1vh", height: "1vh", borderRadius: "50%", flexShrink: 0, background: typeColor(e.type) }} />
                  )}
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: "1.8vh", fontWeight: 700, color: M.textPrimary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", margin: 0 }}>{e.title}</p>
                    <p style={{ fontSize: "1.4vh", fontFamily: "DM Mono, monospace", color: M.textSec, margin: "0.5vh 0 0" }}>
                      {new Date(`${toDateKey(e.date)}T00:00:00`).toLocaleDateString("en-GB", { month: "short", day: "numeric" })}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div>
              <p style={{ fontSize: "1.6vh", fontWeight: 800, letterSpacing: "0.1em", color: M.textSec, marginBottom: "1.5vh" }}>🎂 {MONTHS[month].toUpperCase()} BIRTHDAYS</p>
              {monthBirthdays.length === 0 && !loading && <p style={{ fontSize: "1.8vh", color: M.textSec, margin: 0 }}>No birthdays this month.</p>}
              {monthBirthdays.map((emp) => (
                <div key={emp.id} style={{ display: "flex", alignItems: "center", gap: "1vw", padding: "1.5vh 2vh", borderRadius: "1vh", marginBottom: "1vh", background: "#F9FAFB", border: `1px solid ${M.border}` }}>
                  <img
                    src={resolveImageUrl(emp.photo, FALLBACK_IMAGE)}
                    alt={emp.firstName + " " + emp.lastName}
                    onError={(e) => { e.currentTarget.src = FALLBACK_IMAGE; }}
                    style={{ width: "4vh", height: "4vh", borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
                  />
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: "1.8vh", fontWeight: 700, color: M.textPrimary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", margin: 0 }}>{emp.firstName} {emp.lastName}</p>
                    <p style={{ fontSize: "1.4vh", color: M.textSec, margin: "0.5vh 0 0" }}>{MONTHS[month]} {monthDayOf(emp.birthDate).slice(3, 5)}</p>
                  </div>
                  {isBirthday(monthDayOf(emp.birthDate)) && <span style={{ marginLeft: "auto", fontSize: "2.5vh" }}>🎂</span>}
                </div>
              ))}
            </div>

          </div>
       </div>

    </div>
  );
}
