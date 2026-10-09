import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { M } from "../../../theme/tokens";
import type { PublicDepartmentDashboard, PublicChartSlice } from "../../../api/publicDashboardApi";
import type { BusinessUnitDashboard } from "../../../api/dashboardApi";
import { SlideHeader } from "../SlideHeader";

interface PerformanceSlideProps {
  dashboardData: PublicDepartmentDashboard;
  buDashboards: BusinessUnitDashboard[];
}

const TASK_COLORS: Record<string, string> = {
  Done: "#10B981",
  Completed: "#10B981",
  "In Progress": "#3B82F6",
  Active: "#3B82F6",
  "On Hold": "#64748B",
  Open: "#64748B",
  Delayed: "#EF4444",
  Risk: "#F59E0B",
  "On Track": "#10B981",
};

function TaskPie({ slices }: { slices: PublicChartSlice[] }) {
  const data = slices
    .filter((d) => d.value > 0)
    .map((d) => ({ ...d, color: TASK_COLORS[d.name] ?? "#006D75" }));

  const total = data.reduce((s, d) => s + d.value, 0);

  if (data.length === 0) {
    return (
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: M.textSec, fontSize: "1.6vh" }}>
        No task data available.
      </div>
    );
  }

  return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "2vw", minHeight: 0, overflow: "hidden" }}>
      {/* Donut */}
      <div style={{ position: "relative", flex: "0 0 42%", height: "100%", maxHeight: "22vh" }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius="35%"
              outerRadius="60%"
              dataKey="value"
              stroke="var(--card, #FFFFFF)"
              strokeWidth={2}
              paddingAngle={3}
            >
              {data.map((s) => (
                <Cell key={s.name} fill={s.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: "var(--card, #FFFFFF)",
                border: `1px solid ${M.border}`,
                borderRadius: 8,
                fontSize: "1.2vh",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        {/* Centre label */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
          }}
        >
          <span style={{ fontSize: "2.4vh", fontWeight: 800, color: M.textPrimary, fontFamily: "DM Mono, monospace" }}>{total}</span>
          <span style={{ fontSize: "1.1vh", color: M.textSec }}>tasks</span>
        </div>
      </div>

      {/* Legend */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.9vh" }}>
        {data.map((s) => (
          <div key={s.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <div style={{ width: "1.1vh", height: "1.1vh", borderRadius: "50%", background: s.color, flexShrink: 0 }} />
              <span style={{ fontSize: "1.5vh", color: M.textSec }}>{s.name}</span>
            </div>
            <span style={{ fontSize: "1.6vh", fontWeight: 800, color: s.color, fontFamily: "DM Mono, monospace" }}>{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function PerformanceSlide({ dashboardData, buDashboards }: PerformanceSlideProps) {
  const { performance, charts } = dashboardData;
  const taskStatus = charts?.taskStatus ?? [];

  const hmiData = buDashboards.find(bu => bu.name === "HMI");
  const hisData = buDashboards.find(bu => bu.name === "HIS");

  const combinedTotal = (hmiData?.summary.totalProjects || 0) + (hisData?.summary.totalProjects || 0);
  const combinedOnTrack = (hmiData?.summary.onTrackProjects || 0) + (hisData?.summary.onTrackProjects || 0);
  const combinedProgress = combinedTotal > 0
    ? Math.round(((hmiData?.summary.averageProgress || 0) + (hisData?.summary.averageProgress || 0)) / ((hmiData && hisData) ? 2 : 1))
    : 0;

  const Th = ({ children }: { children: React.ReactNode }) => (
    <div style={{ background: "var(--sidebar, #08475E)", color: "#FFFFFF", padding: "1vh", textAlign: "center", fontWeight: 700, fontSize: "1.8vh", border: `1px solid var(--border, rgba(255,255,255,0.15))` }}>
      {children}
    </div>
  );

  const Td = ({ children, bg, color }: { children: React.ReactNode; bg?: string; color?: string }) => (
    <div style={{ background: bg || "var(--surface-secondary, #EEF4F7)", padding: "1.5vh", textAlign: "center", fontWeight: 800, fontSize: "2.5vh", border: `1px solid ${M.border}`, color: color || M.textPrimary }}>
      {children}
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <SlideHeader title="PERFORMANCE DASHBOARD" />

      <div
        style={{
          flex: 1,
          background: "var(--card, #FFFFFF)",
          borderRadius: "2vh",
          padding: "3vh",
          boxShadow: "var(--shadow-md, 0 1vh 3vh rgba(0,0,0,0.15))",
          border: `1px solid ${M.border}`,
          display: "flex",
          flexDirection: "column",
          gap: "2.5vh",
          overflow: "hidden",
        }}
      >
        <div>
          <h3 style={{ fontSize: "2.2vh", fontWeight: 700, color: M.textPrimary, margin: "0 0 1vh 0" }}>Task Performance (Global)</h3>
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(taskStatus.length + 2, 6)}, 1fr)`, overflow: "hidden", borderRadius: "1vh", border: `2px solid var(--sidebar, #08475E)` }}>
            {/* Static headers */}
            <Th>Total Tasks</Th>
            {taskStatus.map(s => <Th key={s.name}>{s.name}</Th>)}
            <Th>Avg Progress</Th>
            {/* Static values */}
            <Td bg="var(--surface-secondary, #EEF4F7)" color={M.textPrimary}>{performance.totalProjects}</Td>
            {taskStatus.map(s => {
              const isDone = s.name === "Done" || s.name === "Completed";
              const color = TASK_COLORS[s.name] ?? "#00B8C2";
              return (
                <Td key={s.name}
                  bg={isDone ? M.successBg : s.name === "Delayed" ? M.dangerBg : s.name === "In Progress" ? "#EFF6FF" : "var(--surface-secondary, #EEF4F7)"}
                  color={isDone ? M.successText : s.name === "Delayed" ? M.dangerText : color}
                >{s.value}</Td>
              );
            })}
            <Td bg="var(--surface-secondary, #EEF4F7)" color={M.textPrimary}>{performance.averageProjectProgress}%</Td>
          </div>
        </div>

        {/* ── Row 2: Task Pie  |  Combined HMI+HIS ── */}
        <div style={{ flex: 1, display: "flex", gap: "4vw", minHeight: 0, overflow: "hidden" }}>

          {/* Task Status Pie — replaces Team Performance */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <h3 style={{ fontSize: "2.2vh", fontWeight: 700, color: M.textPrimary, margin: "0 0 1vh 0", flexShrink: 0 }}>
              Task Status Breakdown
            </h3>
            <TaskPie slices={taskStatus} />
          </div>

          {/* Combined HMI + HIS Maturity */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <h3 style={{ fontSize: "2.2vh", fontWeight: 700, color: M.textPrimary, margin: "0 0 1vh 0" }}>Combined HMI + HIS Maturity</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", overflow: "hidden", borderRadius: "1vh", border: `2px solid var(--sidebar, #08475E)` }}>
              <Th>Total Combined Projects</Th>
              <Th>Combined Avg Progress</Th>
              <Td bg="var(--surface-secondary, #EEF4F7)" color={M.textPrimary}>{combinedTotal}</Td>
              <Td bg="var(--surface-secondary, #EEF4F7)" color={M.textPrimary}>{combinedProgress}%</Td>
              <Th>Combined On Track</Th>
              <Th>Global Delivery Perf.</Th>
              <Td bg={M.successBg} color={M.successText}>{combinedOnTrack}</Td>
              <Td bg={M.successBg} color={M.successText}>{performance.deliveryPerformance}%</Td>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
