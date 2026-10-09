import { PieChart, Pie, Cell } from "recharts";
import type { PieSlice } from "../../types/dashboard";

export function MiniDonut({ data }: { data: PieSlice[] }) {
  return (
    <PieChart width={60} height={60}>
      <Pie data={data} cx={26} cy={26} innerRadius={15} outerRadius={27} dataKey="value" strokeWidth={0}>
        {data.map((e, i) => (
          <Cell key={i} fill={e.color} />
        ))}
      </Pie>
    </PieChart>
  );
}
