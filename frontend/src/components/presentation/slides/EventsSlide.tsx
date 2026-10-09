import React from "react";
import { M } from "../../../theme/tokens";
import type { PublicEvent } from "../../../api/publicDashboardApi";
import { SlideHeader } from "../SlideHeader";
import { MapPin, Tag } from "lucide-react";

const BASE = "http://localhost:5189";

interface EventsSlideProps {
  events: PublicEvent[];
  title?: string;
  emptyMessage?: string;
  centred?: boolean;
}

const TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  audit:   { bg: "#FEE2E2", text: "#991B1B" },
  audits:  { bg: "#FEE2E2", text: "#991B1B" },
  visit:   { bg: "#DBEAFE", text: "#1E40AF" },
  visits:  { bg: "#DBEAFE", text: "#1E40AF" },
  birthday:{ bg: "#FEF9C3", text: "#854D0E" },
};

function typeStyle(type?: string) {
  const key = (type || "").toLowerCase();
  return TYPE_COLORS[key] || { bg: "var(--primary-soft, rgba(0,184,194,0.12))", text: "var(--primary, #00B8C2)" };
}

export function EventsSlide({
  events,
  title = "UPCOMING EVENTS",
  emptyMessage = "No upcoming events scheduled.",
}: EventsSlideProps) {
  // Show upcoming events: today or in the future, sorted soonest first
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const upcomingEvents = events
    .filter((ev) => {
      if (!ev.date) return false;
      // Parse date-only part to avoid UTC→local timezone shift
      const datePart = ev.date.split("T")[0];
      const [y, m, d] = datePart.split("-").map(Number);
      const eventDay = new Date(y, m - 1, d);
      return eventDay >= todayStart;
    })
    .sort((a, b) => {
      const da = a.date ? new Date(a.date.split("T")[0]).getTime() : 0;
      const db = b.date ? new Date(b.date.split("T")[0]).getTime() : 0;
      return da - db;
    });

  const visibleEvents = upcomingEvents.slice(0, 2);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <SlideHeader title={title} />

      <div style={{ flex: 1, display: "flex", gap: "2vw", overflow: "hidden", minHeight: 0 }}>

        {visibleEvents.length === 0 ? (
          <div style={{
            flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
            color: M.textSec, fontSize: "2.4vh", background: "var(--card, rgba(255,255,255,0.05))",
            borderRadius: "2vh", border: `1px dashed ${M.border}`,
          }}>
            {emptyMessage}
          </div>
        ) : (
          visibleEvents.map((ev) => {
            const date = ev.date ? new Date(ev.date) : null;
            const dayName  = date ? date.toLocaleDateString("en-US", { weekday: "long" }) : "TBD";
            const dayNum   = date ? date.getDate() : null;
            const monthStr = date ? date.toLocaleDateString("en-US", { month: "short" }) : "";
            const yearStr  = date ? date.getFullYear() : "";
            const ts = typeStyle(ev.type);

            return (
              <div
                key={ev.id}
                style={{
                  flex: 1,
                  background: "var(--card, #FFFFFF)",
                  borderRadius: "2vh",
                  boxShadow: "0 1vh 3vh rgba(0,0,0,0.12)",
                  border: `1px solid ${M.border}`,
                  display: "flex",
                  flexDirection: "column",
                  overflow: "hidden",
                  minHeight: 0,
                }}
              >
                {/* Date banner */}
                <div style={{
                  background: "var(--primary, #00B8C2)",
                  padding: "3vh 3vw",
                  display: "flex",
                  alignItems: "center",
                  gap: "2vw",
                  flexShrink: 0,
                }}>
                  {/* Day number block */}
                  <div style={{
                    background: "rgba(255,255,255,0.2)",
                    borderRadius: "1.5vh",
                    padding: "1.2vh 2vw",
                    textAlign: "center",
                    minWidth: "6vw",
                  }}>
                    <div style={{ fontSize: "6vh", fontWeight: 900, color: "#FFFFFF", lineHeight: 1 }}>
                      {dayNum ?? "—"}
                    </div>
                    <div style={{ fontSize: "1.8vh", fontWeight: 700, color: "rgba(255,255,255,0.85)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                      {monthStr} {yearStr}
                    </div>
                  </div>

                  {/* Day name */}
                  <div>
                    <div style={{ fontSize: "3.5vh", fontWeight: 900, color: "#FFFFFF", letterSpacing: "0.04em" }}>
                      {dayName.toUpperCase()}
                    </div>
                    {/* Type badge */}
                    <div style={{
                      display: "inline-flex", alignItems: "center", gap: 6, marginTop: "0.8vh",
                      background: "rgba(255,255,255,0.25)", borderRadius: "0.8vh",
                      padding: "0.3vh 1vw", fontSize: "1.5vh", fontWeight: 700, color: "#FFFFFF",
                      textTransform: "capitalize",
                    }}>
                      <Tag size={12} />
                      {ev.type || "Event"}
                    </div>
                  </div>
                </div>

                {/* Event image */}
                {ev.imageUrl && (
                  <div style={{ width: "100%", height: "28vh", flexShrink: 0, overflow: "hidden", background: "#f0f0f0" }}>
                    <img
                      src={ev.imageUrl.startsWith("http") ? ev.imageUrl : `${BASE}${ev.imageUrl}`}
                      alt={ev.title}
                      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                    />
                  </div>
                )}

                {/* Event details */}
                <div style={{
                  flex: 1, padding: "2.5vh 3vw", display: "flex",
                  flexDirection: "column", justifyContent: "space-between", minHeight: 0,
                }}>
                  <div>
                    <h2 style={{
                      fontSize: "3vh", fontWeight: 900, color: M.textPrimary,
                      margin: "0 0 1vh", lineHeight: 1.2,
                    }}>
                      {ev.title}
                    </h2>
                    {ev.description && (
                      <p style={{
                        fontSize: "1.8vh", color: M.textSec, margin: 0,
                        lineHeight: 1.5,
                        display: "-webkit-box", WebkitLineClamp: 3,
                        WebkitBoxOrient: "vertical", overflow: "hidden",
                      }}>
                        {ev.description}
                      </p>
                    )}
                  </div>

                  <div style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    marginTop: "1.5vh", paddingTop: "1.5vh",
                    borderTop: `1px dashed ${M.border}`,
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <MapPin size={16} color={M.teal} />
                      <span style={{ fontSize: "1.8vh", fontWeight: 700, color: M.textPrimary }}>
                        {ev.location || "On-site"}
                      </span>
                    </div>
                    <div style={{
                      background: ts.bg, color: ts.text,
                      padding: "0.4vh 1.2vw", borderRadius: "0.8vh",
                      fontSize: "1.5vh", fontWeight: 800, textTransform: "capitalize",
                    }}>
                      {ev.type || "General"}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
