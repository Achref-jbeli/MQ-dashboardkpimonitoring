import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { M } from "../../theme/tokens";
import type { KpiTrendPoint } from "../../types/dashboard";

export function KPITrendChart({ data }: { data: KpiTrendPoint[] }) {
  return (
    <div style={{ height: 180 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={M.border} />
          <XAxis dataKey="month" tick={{ fontSize: 10, fill: M.textSec }} />
          <YAxis tick={{ fontSize: 10, fill: M.textSec }} />
          <Tooltip contentStyle={{ background: M.white, border: `1px solid ${M.border}`, borderRadius: 12, fontSize: 11 }} />
          <Line type="monotone" dataKey="HMI" stroke={M.teal} strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="HIS" stroke="#3B82F6" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
