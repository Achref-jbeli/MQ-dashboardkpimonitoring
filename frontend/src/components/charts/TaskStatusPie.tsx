import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { CheckCircle2 } from "lucide-react";
import { SectionCard } from "../common/SectionCard";
import { M } from "../../theme/tokens";
import type { PublicChartSlice } from "../../api/publicDashboardApi";

const COLORS: Record<string, string> = {
  Completed: M.success,
  Active: M.teal,
  Delayed: M.danger,
  Open: M.warning,
  Risk: M.warning,
  "On Track": M.success,
};

export function TaskStatusPie({ data }: { data: PublicChartSlice[] }) {
  const chartData = data.filter((item) => item.value > 0).map((item) => ({ ...item, color: COLORS[item.name] ?? M.tealDeep }));
  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  return (
    <SectionCard title="Task Status" sub={`${total} tracked items`} icon={<CheckCircle2 size={16} />}>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ position: "relative", width: 132, height: 132, flexShrink: 0 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={chartData} cx="50%" cy="50%" innerRadius={36} outerRadius={58} dataKey="value" stroke={M.white} strokeWidth={2} paddingAngle={3}>
                {chartData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: M.white, border: `1px solid ${M.border}`, borderRadius: 12, fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
            <span style={{ fontSize: 22, fontWeight: 800, color: M.textPrimary, fontFamily: "DM Mono, monospace" }}>{total}</span>
            <span style={{ fontSize: 10, color: M.textSec }}>tasks</span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
          {chartData.map((entry) => (
            <div key={entry.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: entry.color }} />
                <span style={{ fontSize: 12, color: M.textSec }}>{entry.name}</span>
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: entry.color, fontFamily: "DM Mono, monospace" }}>{entry.value}</span>
            </div>
          ))}
        </div>
      </div>
    </SectionCard>
  );
}