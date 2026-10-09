import { useState, useEffect } from "react";
import { Globe2, MapPin, Building2, ImageOff, TrendingUp, CalendarCheck2, Activity, ChevronLeft, ChevronRight, CalendarDays, Tag } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { getMilestones } from "../../api/milestoneApi";
import type { Milestone } from "../../types/milestone";
import { M } from "../../theme/tokens";
import { Card } from "../common/Card";
import { AdherenceToScheduleChart } from "../charts/AdherenceToScheduleChart";
import { getInternationalBusinesses } from "../../api/internationalBusinessApi";
import type { InternationalBusiness } from "../../types/internationalBusiness";
import type { OverviewStats, BusinessUnitDashboard } from "../../api/dashboardApi";
import type { Employee } from "../../types/employee";
import { getEvents } from "../../api/eventApi";
import type { Event } from "../../types/event";


const BASE = "http://localhost:5189";

const PIE_COLORS: Record<string, string> = {
  Completed:    "#16A34A",
  "In Progress": "#0891B2",
  Open:         "#9CA3AF",
  Delayed:      "#DC2626",
};

function PepMilestonesPanel() {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMilestones()
      .then((data) => setMilestones(Array.isArray(data) ? data : []))
      .catch(() => setMilestones([]))
      .finally(() => setLoading(false));
  }, []);

  // Aggregate by status for pie slices
  const counts: Record<string, number> = { Completed: 0, "In Progress": 0, Open: 0, Delayed: 0 };
  milestones.forEach((m) => {
    const s = m.status;
    if (s in counts) counts[s]++;
    else counts["Open"]++;
  });
  const pieData = Object.entries(counts)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name, value }));

  const total = milestones.length;

  return (
    <Card style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(0,142,149,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <CalendarCheck2 size={18} color={M.teal} />
          </div>
          <div>
            <p style={{ margin: 0, fontWeight: 700, fontSize: 15, color: M.textPrimary }}>PEP Milestones</p>
            <p style={{ margin: 0, fontSize: 11, color: M.textSec }}>{total} milestone{total !== 1 ? "s" : ""} · status breakdown</p>
          </div>
        </div>
        {/* summary badges */}
        <div style={{ display: "flex", gap: 8 }}>
          {Object.entries(counts).map(([label, val]) => (
            <div key={label} style={{ textAlign: "center", padding: "6px 12px", borderRadius: 10, background: "var(--surface-secondary,#EEF4F7)", border: `1px solid ${M.border}` }}>
              <p style={{ margin: 0, fontSize: 16, fontWeight: 800, color: PIE_COLORS[label] }}>{val}</p>
              <p style={{ margin: 0, fontSize: 10, fontWeight: 600, color: M.textSec }}>{label}</p>
            </div>
          ))}
        </div>
      </div>

      <div style={{ height: 300 }}>
        {loading ? (
          <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: M.textSec, fontSize: 13 }}>Loading…</div>
        ) : pieData.length === 0 ? (
          <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: M.textSec, fontSize: 13 }}>No milestone data yet</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={80}
                outerRadius={130}
                paddingAngle={3}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={true}
              >
                {pieData.map((entry) => (
                  <Cell key={entry.name} fill={PIE_COLORS[entry.name] ?? "#9CA3AF"} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: "var(--card,#fff)", border: `1px solid ${M.border}`, borderRadius: 12, fontSize: 12 }}
                formatter={(value: number, name: string) => [`${value} (${total > 0 ? ((value / total) * 100).toFixed(1) : 0}%)`, name]}
              />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 12, fontWeight: 600, paddingTop: 8 }} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
}

function MaturityPhotoPanel() {
  const [photos, setPhotos] = useState<string[]>([]);
  const [index, setIndex] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  useEffect(() => {
    fetch(`${BASE}/api/photo/list/maturity`)
      .then((r) => r.json())
      .then((d) => setPhotos(d.urls ?? []))
      .catch(() => setPhotos([]));
  }, []);

  const prev = () => setIndex((i) => (i - 1 + photos.length) % photos.length);
  const next = () => setIndex((i) => (i + 1) % photos.length);

  return (
    <Card style={{ padding: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: `1px solid var(--border,#E0EEEE)` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(0,142,149,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Activity size={15} color={M.teal} />
          </div>
          <div>
            <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: M.textPrimary }}>Maturity Gallery</p>
            <p style={{ margin: 0, fontSize: 10, color: M.textSec }}>{photos.length} photo{photos.length !== 1 ? "s" : ""}</p>
          </div>
        </div>
        {photos.length > 1 && (
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={prev} style={{ width: 26, height: 26, borderRadius: 7, border: `1px solid var(--border,#E0EEEE)`, background: "var(--card,#fff)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ChevronLeft size={13} color={M.textSec} />
            </button>
            <button onClick={next} style={{ width: 26, height: 26, borderRadius: 7, border: `1px solid var(--border,#E0EEEE)`, background: "var(--card,#fff)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ChevronRight size={13} color={M.textSec} />
            </button>
          </div>
        )}
      </div>

      <div
        style={{ flex: 1, height: 220, background: "var(--surface-secondary,#EEF4F7)", position: "relative", cursor: photos.length ? "zoom-in" : "default" }}
        onClick={() => photos.length && setLightbox(true)}
      >
        {photos.length === 0 ? (
          <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, color: M.textSec }}>
            <ImageOff size={28} style={{ opacity: 0.35, color: M.teal }} />
            <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: M.textPrimary }}>No photos yet</p>
            <p style={{ margin: 0, fontSize: 11 }}>Upload in the Maturity section</p>
          </div>
        ) : (
          <>
            <img
              src={`${BASE}${photos[index]}`}
              alt="Maturity"
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", transition: "opacity 0.3s" }}
            />
            {photos.length > 1 && (
              <div style={{ position: "absolute", bottom: 8, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 4 }}>
                {photos.map((_, i) => (
                  <div key={i} onClick={(e) => { e.stopPropagation(); setIndex(i); }} style={{ width: i === index ? 16 : 6, height: 6, borderRadius: 3, background: i === index ? "#fff" : "rgba(255,255,255,0.5)", cursor: "pointer", transition: "all 0.2s" }} />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {lightbox && photos.length > 0 && (
        <div onClick={() => setLightbox(false)} style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.88)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <img src={`${BASE}${photos[index]}`} alt="Maturity" style={{ maxWidth: "90vw", maxHeight: "90vh", borderRadius: 12, boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }} />
        </div>
      )}
    </Card>
  );
}

function VavePhotoPanel() {
  const [photos, setPhotos] = useState<string[]>([]);
  const [index, setIndex] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  useEffect(() => {
    fetch(`${BASE}/api/photo/list/vave`)
      .then((r) => r.json())
      .then((d) => setPhotos(d.urls ?? []))
      .catch(() => setPhotos([]));
  }, []);

  const prev = () => setIndex((i) => (i - 1 + photos.length) % photos.length);
  const next = () => setIndex((i) => (i + 1) % photos.length);

  return (
    <Card style={{ padding: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}>
      {/* header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: `1px solid var(--border,#E0EEEE)` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(0,142,149,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <TrendingUp size={15} color={M.teal} />
          </div>
          <div>
            <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: M.textPrimary }}>VAVE Gallery</p>
            <p style={{ margin: 0, fontSize: 10, color: M.textSec }}>{photos.length} photo{photos.length !== 1 ? "s" : ""}</p>
          </div>
        </div>
        {photos.length > 1 && (
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={prev} style={{ width: 26, height: 26, borderRadius: 7, border: `1px solid var(--border,#E0EEEE)`, background: "var(--card,#fff)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ChevronLeft size={13} color={M.textSec} />
            </button>
            <button onClick={next} style={{ width: 26, height: 26, borderRadius: 7, border: `1px solid var(--border,#E0EEEE)`, background: "var(--card,#fff)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ChevronRight size={13} color={M.textSec} />
            </button>
          </div>
        )}
      </div>

      {/* photo area */}
      <div
        style={{ flex: 1, height: 220, background: "var(--surface-secondary,#EEF4F7)", position: "relative", cursor: photos.length ? "zoom-in" : "default" }}
        onClick={() => photos.length && setLightbox(true)}
      >
        {photos.length === 0 ? (
          <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, color: M.textSec }}>
            <ImageOff size={28} style={{ opacity: 0.35, color: M.teal }} />
            <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: M.textPrimary }}>No photos yet</p>
            <p style={{ margin: 0, fontSize: 11 }}>Upload in the VAVE section</p>
          </div>
        ) : (
          <>
            <img
              src={`${BASE}${photos[index]}`}
              alt="VAVE"
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", transition: "opacity 0.3s" }}
            />
            {photos.length > 1 && (
              <div style={{ position: "absolute", bottom: 8, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 4 }}>
                {photos.map((_, i) => (
                  <div key={i} onClick={(e) => { e.stopPropagation(); setIndex(i); }} style={{ width: i === index ? 16 : 6, height: 6, borderRadius: 3, background: i === index ? "#fff" : "rgba(255,255,255,0.5)", cursor: "pointer", transition: "all 0.2s" }} />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* lightbox */}
      {lightbox && photos.length > 0 && (
        <div onClick={() => setLightbox(false)} style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.88)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <img src={`${BASE}${photos[index]}`} alt="VAVE" style={{ maxWidth: "90vw", maxHeight: "90vh", borderRadius: 12, boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }} />
        </div>
      )}
    </Card>
  );
}

const EVENT_TYPE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  audit:   { bg: "#FEE2E2", text: "#991B1B", border: "#FECACA" },
  audits:  { bg: "#FEE2E2", text: "#991B1B", border: "#FECACA" },
  visit:   { bg: "#DBEAFE", text: "#1E40AF", border: "#BFDBFE" },
  visits:  { bg: "#DBEAFE", text: "#1E40AF", border: "#BFDBFE" },
  birthday:{ bg: "#FEF9C3", text: "#854D0E", border: "#FDE68A" },
};
function eventTypeStyle(type?: string) {
  const key = (type || "").toLowerCase();
  return EVENT_TYPE_COLORS[key] || { bg: "rgba(0,184,194,0.10)", text: M.teal, border: "rgba(0,184,194,0.25)" };
}

const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function UpcomingEventsPanel() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getEvents()
      .then((data) => setEvents(Array.isArray(data) ? data : []))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, []);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const upcoming = events
    .filter((ev) => {
      if (!ev.date) return false;
      const datePart = ev.date.split("T")[0];
      const [y, mo, d] = datePart.split("-").map(Number);
      return new Date(y, mo - 1, d) >= todayStart;
    })
    .sort((a, b) => {
      const da = a.date ? new Date(a.date.split("T")[0]).getTime() : 0;
      const db = b.date ? new Date(b.date.split("T")[0]).getTime() : 0;
      return da - db;
    })
    .slice(0, 5);

  return (
    <Card style={{ padding: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}>
      {/* header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", borderBottom: `1px solid ${M.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: "rgba(0,142,149,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <CalendarDays size={16} color={M.teal} />
          </div>
          <div>
            <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: M.textPrimary }}>Upcoming Events</p>
            <p style={{ margin: 0, fontSize: 11, color: M.textSec }}>{upcoming.length} upcoming · next {upcoming.length === 5 ? "5" : upcoming.length}</p>
          </div>
        </div>
      </div>

      {/* list */}
      <div style={{ flex: 1 }}>
        {loading ? (
          <div style={{ padding: "28px 18px", textAlign: "center", color: M.textSec, fontSize: 12 }}>Loading events…</div>
        ) : upcoming.length === 0 ? (
          <div style={{ padding: "28px 18px", textAlign: "center", color: M.textSec, fontSize: 12 }}>No upcoming events scheduled.</div>
        ) : (
          upcoming.map((ev, i) => {
            const datePart = ev.date ? ev.date.split("T")[0] : null;
            const [y, mo, d] = datePart ? datePart.split("-").map(Number) : [null, null, null];
            const ts = eventTypeStyle(ev.type);

            return (
              <div
                key={ev.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "12px 18px",
                  borderBottom: i < upcoming.length - 1 ? `1px solid ${M.border}` : "none",
                  background: i % 2 === 0 ? "var(--card,#fff)" : "var(--surface-secondary,#F8FAFC)",
                }}
              >
                {/* Date block */}
                <div style={{
                  minWidth: 48, height: 52, borderRadius: 10,
                  background: "var(--primary, #00B8C2)",
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <span style={{ fontSize: 18, fontWeight: 900, color: "#fff", lineHeight: 1 }}>{d ?? "?"}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.85)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    {mo != null ? MONTHS_SHORT[mo - 1] : ""}
                  </span>
                  <span style={{ fontSize: 9, fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>{y}</span>
                </div>

                {/* Title + location */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: M.textPrimary, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {ev.title}
                  </p>
                  {ev.location && (
                    <div style={{ display: "flex", alignItems: "center", gap: 3, marginTop: 3 }}>
                      <MapPin size={10} color={M.textSec} />
                      <span style={{ fontSize: 11, color: M.textSec, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{ev.location}</span>
                    </div>
                  )}
                </div>

                {/* Type badge */}
                <div style={{
                  display: "flex", alignItems: "center", gap: 4,
                  padding: "3px 8px", borderRadius: 7,
                  background: ts.bg, border: `1px solid ${ts.border}`,
                  flexShrink: 0,
                }}>
                  <Tag size={9} color={ts.text} />
                  <span style={{ fontSize: 10, fontWeight: 700, color: ts.text, textTransform: "capitalize" }}>{ev.type || "Event"}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
}

export interface DashboardOverviewProps {
  overview: OverviewStats;
  buDashboards: BusinessUnitDashboard[];
  departmentId?: number | null;
  birthdayEmployee?: Employee | null;
}

export function DashboardOverview({
  overview,
  buDashboards,
  departmentId,
  birthdayEmployee,
}: DashboardOverviewProps) {
  const [rfqs, setRfqs] = useState<InternationalBusiness[]>([]);

  useEffect(() => {
    getInternationalBusinesses().then((data) => setRfqs(Array.isArray(data) ? data : [])).catch(() => setRfqs([]));
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* ---------------- TOP OVERVIEW METRICS: WORKLOAD & MANAGEMENT KPIS ---------------- */}
      <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 16, alignItems: "stretch" }}>
        {/* RFQ List */}
        <Card style={{ padding: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", borderBottom: `1px solid ${M.border}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <div style={{ width: 32, height: 32, borderRadius: 9, background: "rgba(0,142,149,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Globe2 size={16} color={M.teal} />
              </div>
              <div>
                <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: M.textPrimary }}>RFQ List</p>
                <p style={{ margin: 0, fontSize: 11, color: M.textSec }}>{rfqs.length} request{rfqs.length !== 1 ? "s" : ""}</p>
              </div>
            </div>
          </div>
          <div style={{ flex: 1, overflowY: "auto", maxHeight: 220 }}>
            {rfqs.length === 0 ? (
              <div style={{ padding: "28px 18px", textAlign: "center", color: M.textSec, fontSize: 12 }}>
                No RFQs yet — add them in the RFQs section.
              </div>
            ) : (
              rfqs.map((rfq, i) => (
                <div
                  key={rfq.id}
                  style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "10px 18px",
                    borderBottom: i < rfqs.length - 1 ? `1px solid ${M.border}` : "none",
                    background: i % 2 === 0 ? "var(--card,#fff)" : "var(--surface-secondary,#F8FAFC)",
                  }}
                >
                  <div style={{ width: 34, height: 34, borderRadius: 10, background: rfq.isNewBusiness ? "rgba(16,185,129,0.12)" : "rgba(0,142,149,0.10)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Building2 size={15} color={rfq.isNewBusiness ? M.success : M.teal} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: M.textPrimary, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{rfq.name}</p>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
                      {rfq.country && <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 11, color: M.textSec }}><MapPin size={10} />{rfq.country}</span>}
                      {rfq.sop && <span style={{ fontSize: 11, color: M.textSec }}>SOP: {rfq.sop}</span>}
                    </div>
                  </div>
                  {rfq.isNewBusiness && (
                    <span style={{ fontSize: 10, fontWeight: 700, color: M.success, background: "rgba(16,185,129,0.12)", padding: "2px 7px", borderRadius: 6, flexShrink: 0 }}>NEW</span>
                  )}
                  {rfq.salesLifetime && (
                    <span style={{ fontSize: 11, fontWeight: 700, color: M.teal, fontFamily: "DM Mono, monospace", flexShrink: 0 }}>{rfq.salesLifetime}</span>
                  )}
                </div>
              ))
            )}
          </div>
        </Card>

        {/* VAVE Photo Gallery */}
        <VavePhotoPanel />
      </div>

      {/* ---------------- ADHERENCE — R&D ONLY ---------------- */}
      <AdherenceToScheduleChart
        departmentId={6}
        sourceDeptId={6}
        responsibleDepartments="PM1-TU,RDM-TU,PM_I-TU,RDM_M-TU,RDE-TU,RDM_I-TU"
        title="R&D — Adherence"
      />

      {/* ---------------- UPCOMING EVENTS ---------------- */}
      <UpcomingEventsPanel />

      {/* ---------------- MATURITY PHOTO GALLERY ---------------- */}
      <MaturityPhotoPanel />

      {/* ---------------- PEP MILESTONES ---------------- */}
      <PepMilestonesPanel />

    </div>
  );
}
