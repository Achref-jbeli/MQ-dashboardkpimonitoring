import { Activity, Award, CheckCircle2, Clock3, Gauge, Target, Timer, TrendingUp, Truck, Workflow } from "lucide-react";
import { Card } from "../common/Card";
import { M, FADE_MS } from "../../theme/tokens";

const PERFORMANCE_KPIS = [
  { label: "Total Projects", value: "85", hint: "Portfolio size", icon: <Workflow size={18} /> },
  { label: "Completed Projects", value: "52", hint: "Delivered this cycle", icon: <CheckCircle2 size={18} /> },
  { label: "Active Projects", value: "27", hint: "Currently running", icon: <Activity size={18} /> },
  { label: "Delayed Projects", value: "6", hint: "Needs escalation", icon: <Clock3 size={18} /> },
  { label: "Average Project Progress", value: "74.8%", hint: "Cross-project progress", icon: <TrendingUp size={18} /> },
  { label: "Schedule Adherence", value: "89.4%", hint: "Milestone accuracy", icon: <Timer size={18} /> },
  { label: "Overall KPI Achievement", value: "81.6%", hint: "KPI target coverage", icon: <Target size={18} /> },
  { label: "Overall Maturity", value: "4.1/5", hint: "Process maturity", icon: <Award size={18} /> },
  { label: "Project Health", value: "86.2%", hint: "Risk-adjusted health", icon: <Gauge size={18} /> },
  { label: "Delivery Performance", value: "91.0%", hint: "On-time delivery", icon: <Truck size={18} /> },
];

export function PerformanceDashboard({ visible }: { visible: boolean }) {
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
        <div style={{ width: 4, height: 40, borderRadius: 999, background: M.success }} />
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: M.textPrimary, margin: 0, letterSpacing: "-0.02em" }}>Performance Overview</h2>
          <p style={{ fontSize: 11, color: M.textSec, margin: "2px 0 0", fontFamily: "DM Mono, monospace" }}>
            Enterprise Performance Dashboard · Live View
          </p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 16 }}>
        {PERFORMANCE_KPIS.map((item) => (
          <Card key={item.label} style={{ padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", background: M.bgTeal, color: M.teal }}>
              {item.icon}
            </div>
            <p style={{ margin: 0, fontSize: 11, color: M.textSec }}>{item.label}</p>
            <p style={{ margin: 0, fontSize: 25, fontWeight: 800, color: M.textPrimary, fontFamily: "DM Mono, monospace" }}>{item.value}</p>
            <p style={{ margin: 0, fontSize: 10, color: M.textSec }}>{item.hint}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
