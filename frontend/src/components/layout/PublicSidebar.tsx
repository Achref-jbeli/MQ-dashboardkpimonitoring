import { LayoutDashboard, FolderKanban, Star, Users, Info, LogIn, Globe2, Eye, ClipboardCheck, Calendar } from "lucide-react";
import { M, G } from "../../theme/tokens";
import { MarquardtLogo } from "../common/Logo";
import { ThemeSelector } from "../common/ThemeSelector";
import type { Page } from "../../types/dashboard";
import type { Event } from "../../types/event";

const PUB_NAV = [
  { id: "dashboard", icon: <LayoutDashboard size={19} />, label: "Dashboard" },
  { id: "projects", icon: <FolderKanban size={19} />, label: "Projects" },
  { id: "internationalBusiness", icon: <Globe2 size={19} />, label: "International Business" },
  { id: "events", icon: <Star size={19} />, label: "Events" },
  { id: "visits", icon: <Eye size={19} />, label: "Visits" },
  { id: "audits", icon: <ClipboardCheck size={19} />, label: "Audits" },
  { id: "calendar", icon: <Calendar size={19} />, label: "Calendar" },
  { id: "team", icon: <Users size={19} />, label: "Team" },
  { id: "about", icon: <Info size={19} />, label: "About" },
];

export function PublicSidebar({
  view,
  onView,
  departmentName,
  events,
  onNavigate,
}: {
  view: string;
  onView: (v: string) => void;
  departmentName: string;
  events?: Event[];
  onNavigate: (p: Page) => void;
}) {
  const upcomingEvents = (events || [])
    .filter((e) => e.date && new Date(e.date) >= new Date(new Date().setHours(0, 0, 0, 0)))
    .sort((a, b) => new Date(a.date!).getTime() - new Date(b.date!).getTime())
    .slice(0, 4);

  return (
    <aside style={{ position: "fixed", left: 0, top: 0, bottom: 0, zIndex: 40, display: "flex", flexDirection: "column", paddingTop: 20, paddingBottom: 20, width: 240, background: G.sidebar }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 20, padding: "0 10px" }}>
        <button
          onClick={() => onNavigate("home")}
          title="Return to home"
          style={{ background: "transparent", border: "none", padding: 0, cursor: "pointer" }}
        >
          <MarquardtLogo height={80} light />
        </button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 2, padding: "0 6px", flex: 1, overflowY: "auto" }}>
        {PUB_NAV.map((item) => {
          const active = view === item.id;
          return (
            <button
              key={item.id}
              title={item.label}
              onClick={() => onView(item.id)}
              style={{ width: "100%", display: "flex", flexDirection: "row", alignItems: "center", padding: "10px 14px", gap: 10, borderRadius: 12, cursor: "pointer", border: "none", background: active ? "rgba(255,255,255,0.15)" : "transparent", color: active ? "#fff" : "rgba(255,255,255,0.45)", transition: "all .15s" }}
            >
              {item.icon}
              <span style={{ fontSize: 13, fontWeight: 500, fontFamily: "Inter, sans-serif" }}>{item.label}</span>
            </button>
          );
        })}

        <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 10, paddingTop: 10 }}>
          {upcomingEvents.length > 0 && (
            <div style={{ background: "rgba(0,0,0,0.2)", borderRadius: 12, padding: "10px 12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8, color: "rgba(255,255,255,0.55)" }}>
                <Calendar size={13} />
                <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}>Upcoming</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {upcomingEvents.map((e, i) => (
                  <div key={i} style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{e.title}</span>
                    <span style={{ fontSize: 9, color: "rgba(255,255,255,0.45)" }}>
                      {e.date ? new Date(e.date).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' }) : ''} {e.type ? `· ${e.type}` : ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ padding: "8px 10px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.06)" }}>
            <p style={{ textAlign: "center", fontSize: 8, fontFamily: "DM Mono, monospace", margin: 0, color: "rgba(255,255,255,0.55)", letterSpacing: "0.1em" }}>DEPARTMENT</p>
            <p style={{ textAlign: "center", fontSize: 11, fontWeight: 700, margin: "4px 0 0", color: "#fff" }}>{departmentName}</p>
          </div>
        </div>
      </div>

      <div style={{ padding: "0 8px", marginTop: 8 }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}>
          <ThemeSelector compact />
        </div>
        <button
          onClick={() => onNavigate("login")}
          style={{ width: "100%", display: "flex", flexDirection: "row", justifyContent: "center", alignItems: "center", padding: "10px", gap: 8, borderRadius: 12, cursor: "pointer", border: "none", background: `linear-gradient(135deg, ${M.teal}, ${M.tealDeep})`, color: "#fff", boxShadow: `0 4px 18px rgba(0,168,168,0.5)`, transition: "transform .2s" }}
        >
          <LogIn size={15} />
          <span style={{ fontSize: 13, fontWeight: 600 }}>Login</span>
        </button>
      </div>
    </aside>
  );
}
