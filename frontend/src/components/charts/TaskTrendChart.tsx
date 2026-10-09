import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Activity } from "lucide-react";
import { SectionCard } from "../common/SectionCard";
import { M } from "../../theme/tokens";
import type { PublicTrendPoint } from "../../api/publicDashboardApi";

export function TaskTrendChart({ data }: { data: PublicTrendPoint[] }) {
  return (
    <SectionCard title="June Task Flow" sub="Created vs completed tasks" icon={<Activity size={16} />}>
      <div style={{ height: 220 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 10, left: -12, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={M.border} />
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: M.textSec }} />
            <YAxis tick={{ fontSize: 10, fill: M.textSec }} />
            <Tooltip contentStyle={{ background: M.white, border: `1px solid ${M.border}`, borderRadius: 12, fontSize: 11 }} />
            <Line type="monotone" dataKey="createdTasks" name="Created" stroke={M.tealDeep} strokeWidth={2.5} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="completedTasks" name="Completed" stroke={M.success} strokeWidth={2.5} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </SectionCard>
  );
}