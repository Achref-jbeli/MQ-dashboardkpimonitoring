import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { BarChart3 } from "lucide-react";
import { SectionCard } from "../common/SectionCard";
import { M } from "../../theme/tokens";
import type { BudgetSlice } from "../../types/dashboard";

export function BudgetPie({ data }: { data: BudgetSlice[] }) {
  return (
    <SectionCard title="Budget Allocation" sub="Distribution by department" icon={<BarChart3 size={16} />}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 120, height: 120, flexShrink: 0 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} cx="50%" cy="50%" innerRadius={32} outerRadius={54} dataKey="value" strokeWidth={2} stroke={M.white} paddingAngle={3}>
                {data.map((e, i) => (
                  <Cell key={i} fill={e.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: M.white, border: `1px solid ${M.border}`, borderRadius: 10, fontSize: 11, color: M.textPrimary }}
                formatter={(v: number) => [`${v}%`, ""]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
          {data.map((d) => (
            <div key={d.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 10, height: 10, borderRadius: 3, background: d.color }} />
                <span style={{ fontSize: 12, color: M.textSec }}>{d.name}</span>
              </div>
              <span style={{ fontSize: 12, fontFamily: "DM Mono, monospace", fontWeight: 600, color: M.textPrimary }}>{d.value}%</span>
            </div>
          ))}
        </div>
      </div>
    </SectionCard>
  );
}