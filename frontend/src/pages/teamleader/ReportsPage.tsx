import { BarChart3, FolderKanban, Users, CheckSquare, TrendingUp, AlertTriangle, Download } from "lucide-react";
import { M } from "../../theme/tokens";
import { Card } from "../../components/common/Card";

const REPORTS = [
  { title: "KPI Summary Report", desc: "Current KPI metrics for HMI projects", icon: <BarChart3 size={24} /> },
  { title: "Project Progress Report", desc: "Detailed progress for all assigned projects", icon: <FolderKanban size={24} /> },
  { title: "Team Performance Report", desc: "Team productivity and workload distribution", icon: <Users size={24} /> },
  { title: "SOP Adherence Report", desc: "Schedule adherence and project status", icon: <CheckSquare size={24} /> },
  { title: "KPI Trend Analysis", desc: "Historical KPI evolution over 6 months", icon: <TrendingUp size={24} /> },
  { title: "Deadline Risk Report", desc: "Projects at risk of missing deadlines", icon: <AlertTriangle size={24} /> },
];

export function ReportsPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <p style={{ fontSize: 13, color: M.textSec, margin: 0 }}>Export reports for your team and assigned projects</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
        {REPORTS.map((r, i) => (
          <Card key={i} style={{ padding: 22, display: "flex", flexDirection: "column", gap: 16, cursor: "pointer", transition: "transform .2s, box-shadow .2s" }}>
            <div style={{ width: 48, height: 48, borderRadius: 18, display: "flex", alignItems: "center", justifyContent: "center", background: `${M.teal}14`, color: M.teal }}>{r.icon}</div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: M.textPrimary, margin: "0 0 6px" }}>{r.title}</p>
              <p style={{ fontSize: 11, color: M.textSec, lineHeight: 1.6, margin: 0 }}>{r.desc}</p>
            </div>
            <button style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: M.teal, background: "none", border: "none", cursor: "pointer", padding: 0, marginTop: "auto" }}>
              <Download size={14} />Export PDF
            </button>
          </Card>
        ))}
      </div>
    </div>
  );
}
