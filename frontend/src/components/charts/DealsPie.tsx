import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { Globe } from "lucide-react";
import { SectionCard } from "../common/SectionCard";
import { M, CHART_PAL } from "../../theme/tokens";
import type { Deal } from "../../types/dashboard";

export function DealsPie({ deals }: { deals: Deal[]; accent?: string }) {
  const pd = deals.map((d, i) => ({ name: d.country, flag: d.flag, value: d.numericValue, color: CHART_PAL[i % CHART_PAL.length] }));
  return (
    <SectionCard title="International Pipeline" sub="Deal value by country (M$)" icon={<Globe size={16} />}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 120, height: 120, flexShrink: 0 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={pd} cx="50%" cy="50%" outerRadius={54} dataKey="value" strokeWidth={2} stroke={M.white} paddingAngle={2}>
                {pd.map((e, i) => (
                  <Cell key={i} fill={e.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: M.white, border: `1px solid ${M.border}`, borderRadius: 10, fontSize: 11, color: M.textPrimary }}
                formatter={(v: number) => [`$${v}M`, ""]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
          {pd.map((d) => (
            <div key={d.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 10, height: 10, borderRadius: 3, background: d.color, flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: M.textSec }}>
                  {d.flag} {d.name}
                </span>
              </div>
              <span style={{ fontSize: 12, fontFamily: "DM Mono, monospace", color: M.textPrimary }}>${d.value}M</span>
            </div>
          ))}
        </div>
      </div>
    </SectionCard>
  );
}