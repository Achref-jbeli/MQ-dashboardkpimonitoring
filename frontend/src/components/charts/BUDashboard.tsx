import { M, FADE_MS } from "../../theme/tokens";
import type { BusinessUnitDashboard } from "../../api/dashboardApi";
import { FolderKanban, CheckCircle2, AlertTriangle, Clock, TrendingUp } from "lucide-react";
import { Card } from "../common/Card";

function StatCard({ label, value, color, icon }: { label: string; value: string | number; color: string; icon: React.ReactNode }) {
  return (
    <Card style={{ padding: 20, display: "flex", flexDirection: "column", gap: 12, position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: -16, right: -16, width: 80, height: 80, borderRadius: "50%", background: color, opacity: 0.1, filter: "blur(20px)" }} />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ width: 40, height: 40, borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", background: `${color}15`, color }}>{icon}</div>
      </div>
      <div>
        <p style={{ fontSize: 26, fontWeight: 800, fontFamily: "DM Mono, monospace", color: M.textPrimary, margin: 0 }}>{value}</p>
        <p style={{ fontSize: 12, color: M.textSec, margin: "4px 0 0" }}>{label}</p>
      </div>
    </Card>
  );
}

export function BUDashboard({ data, visible }: { data: BusinessUnitDashboard; visible: boolean }) {
  // Use colors based on BU name if possible
  const accent = data.name === "HMI" ? M.teal : data.name === "HIS" ? "#3B82F6" : "#8B5CF6";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 20,
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(12px)",
        transition: `opacity ${FADE_MS}ms ease, transform ${FADE_MS}ms ease`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 4, height: 40, borderRadius: 999, background: accent }} />
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: M.textPrimary, margin: 0, letterSpacing: "-0.02em" }}>{data.name}</h2>
          <p style={{ fontSize: 11, color: M.textSec, margin: "2px 0 0", fontFamily: "DM Mono, monospace" }}>
            Live Dashboard · Updated just now
          </p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 16 }}>
        <StatCard label="Total Projects" value={data.summary.totalProjects} color={M.textPrimary} icon={<FolderKanban size={20} />} />
        <StatCard label="On Track" value={data.summary.onTrackProjects} color={M.success} icon={<CheckCircle2 size={20} />} />
        <StatCard label="Risk" value={data.summary.riskProjects} color={M.warning} icon={<AlertTriangle size={20} />} />
        <StatCard label="Delayed" value={data.summary.delayedProjects} color={M.danger} icon={<Clock size={20} />} />
        <StatCard label="Avg Progress" value={`${data.summary.averageProgress}%`} color={accent} icon={<TrendingUp size={20} />} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Card style={{ padding: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 16px" }}>Recent Projects</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {data.projects.slice(0, 5).map(p => (
              <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: M.bgTeal, borderRadius: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{p.title}</span>
                <span style={{ fontSize: 11, color: p.status === "On Track" ? M.success : p.status === "Risk" ? M.warning : M.danger, fontWeight: 700 }}>
                  {p.status}
                </span>
              </div>
            ))}
            {data.projects.length === 0 && <p style={{ fontSize: 12, color: M.textSec }}>No projects found for {data.name}.</p>}
          </div>
        </Card>

        <Card style={{ padding: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 16px" }}>KPI Adherence</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {data.kpis.slice(0, 5).map(k => (
              <div key={k.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: M.bgTeal, borderRadius: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{k.designation}</span>
                <span style={{ fontSize: 11, color: k.green ? M.success : k.yellow ? M.warning : k.red ? M.danger : M.textSec, fontWeight: 700 }}>
                  {k.green ? "Good" : k.yellow ? "Warning" : k.red ? "Critical" : "Unknown"}
                </span>
              </div>
            ))}
            {data.kpis.length === 0 && <p style={{ fontSize: 12, color: M.textSec }}>No KPIs found for {data.name}.</p>}
          </div>
        </Card>
      </div>
    </div>
  );
}