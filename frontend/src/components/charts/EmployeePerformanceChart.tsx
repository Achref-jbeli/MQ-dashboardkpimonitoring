import { BarChart3 } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { SectionCard } from "../common/SectionCard";
import { M } from "../../theme/tokens";
import type { PublicEmployeePerformance } from "../../api/publicDashboardApi";

export function EmployeePerformanceChart({ data }: { data: PublicEmployeePerformance[] }) {
  return (
    <SectionCard title="Employee Performance" sub="Task-based performance by assignee" icon={<BarChart3 size={16} />}>
      <div style={{ height: 260 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 10, left: -18, bottom: 12 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={M.border} />
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: M.textSec }} interval={0} angle={-18} textAnchor="end" height={56} />
            <YAxis tick={{ fontSize: 10, fill: M.textSec }} />
            <Tooltip contentStyle={{ background: M.white, border: `1px solid ${M.border}`, borderRadius: 12, fontSize: 11 }} />
            <Bar dataKey="performanceScore" fill={M.teal} radius={[8, 8, 0, 0]} name="Performance" />
            <Bar dataKey="averageProgress" fill={M.tealDeep} radius={[8, 8, 0, 0]} name="Progress" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </SectionCard>
  );
}