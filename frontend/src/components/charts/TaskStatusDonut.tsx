import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { FolderKanban, TrendingUp } from "lucide-react";
import { SectionCard } from "../common/SectionCard";
import { M } from "../../theme/tokens";

interface TaskStatusDonutProps {
  total: number;
  completed: number;
  active: number;
  delayed: number;
  averageProgress: number;
}

export function TaskStatusDonut({ total, completed, active, delayed, averageProgress }: TaskStatusDonutProps) {
  const data = [
    { name: "Completed", value: completed, color: "var(--status-green, #16A34A)" },
    { name: "In Progress", value: active, color: "var(--primary, #00B8C2)" },
    { name: "Delayed", value: delayed, color: "var(--status-yellow, #CA8A04)" },
  ].filter((item) => item.value > 0);

  const percentage = (value: number) => (total === 0 ? 0 : Math.round((value / total) * 100));

  return (
    <SectionCard title="Task Status Overview" sub={`${total} total tasks`} icon={<FolderKanban size={16} />} style={{ height: "100%" }}>
      <div style={{ display: "flex", flexDirection: "column", height: "100%", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 16 }}>
          {/* ---------------- DONUT CHART ---------------- */}
          <div style={{ position: "relative", width: 140, height: 140, flexShrink: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data} dataKey="value" cx="50%" cy="50%" innerRadius={45} outerRadius={65} stroke={M.white} strokeWidth={3} paddingAngle={3}>
                  {data.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number, name: string) => [`${value} tasks (${percentage(Number(value))}%)`, name]}
                  contentStyle={{ background: M.white, border: `1px solid ${M.border}`, borderRadius: 12, fontSize: 12, color: M.textPrimary }}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Center label */}
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
              <span style={{ fontSize: 24, fontWeight: 800, fontFamily: "DM Mono, monospace", color: M.textPrimary }}>{total}</span>
              <span style={{ fontSize: 10, color: M.textSec, fontWeight: 600 }}>TASKS</span>
            </div>
          </div>

          {/* ---------------- STATUS LEGEND ---------------- */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
            {data.map((item) => (
              <div key={item.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 10px", borderRadius: 10, background: `${item.color}10` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: item.color }} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: M.textPrimary }}>{item.name}</span>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: item.color, fontFamily: "DM Mono, monospace" }}>{item.value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ---------------- AVERAGE PROGRESS ---------------- */}
        <div style={{ padding: "12px 16px", borderRadius: 12, background: `${M.teal}10`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: M.white, display: "flex", alignItems: "center", justifyContent: "center", color: M.teal }}>
              <TrendingUp size={16} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: M.textPrimary }}>Average Task Progress</p>
              <p style={{ margin: 0, fontSize: 11, color: M.textSec }}>Across all department tasks</p>
            </div>
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, fontFamily: "DM Mono, monospace", color: M.teal }}>{averageProgress}%</div>
        </div>
      </div>
    </SectionCard>
  );
}
