import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { FolderKanban } from "lucide-react";
import { SectionCard } from "../common/SectionCard";
import { M } from "../../theme/tokens";
import type { Project } from "../../types/dashboard";

export function StatusPie({
  projects,
}: {
  projects: Project[];
}) {
  // ----------------------------------------------------
  // Count projects by status
  // Supports multiple backend status names
  // ----------------------------------------------------

  const counts = projects.reduce(
    (acc, project) => {
      const status = project.status.toLowerCase();

      if (
        status.includes("completed") ||
        status.includes("terminated") ||
        status.includes("done")
      ) {
        acc.completed++;
      } else if (
        status.includes("progress") ||
        status.includes("active") ||
        status.includes("on track") ||
        status.includes("ongoing")
      ) {
        acc.progress++;
      } else if (
        status.includes("delay") ||
        status.includes("risk") ||
        status.includes("late")
      ) {
        acc.delayed++;
      } else {
        acc.progress++;
      }

      return acc;
    },
    {
      completed: 0,
      progress: 0,
      delayed: 0,
    }
  );

  const total = projects.length;

  const data = [
    {
      name: "Completed",
      value: counts.completed,
      color: "#16A34A",
    },
    {
      name: "In Progress",
      value: counts.progress,
      color: "#2563EB",
    },
    {
      name: "Delayed",
      value: counts.delayed,
      color: "#F59E0B",
    },
  ].filter((item) => item.value > 0);

  const percentage = (value: number) =>
    total === 0 ? 0 : Math.round((value / total) * 100);

  return (
    <SectionCard
      title="Task Status Overview"
      sub={`${total} total tasks`}
      icon={<FolderKanban size={16} />}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 18,
        }}
      >
        {/* ---------------- DONUT CHART ---------------- */}

        <div
          style={{
            position: "relative",
            width: 150,
            height: 150,
            flexShrink: 0,
          }}
        >
          <ResponsiveContainer
            width="100%"
            height="100%"
          >
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={65}
                stroke={M.white}
                strokeWidth={3}
                paddingAngle={3}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={index}
                    fill={entry.color}
                  />
                ))}
              </Pie>

              <Tooltip
                formatter={(
                  value: number,
                  name: string
                ) => [
                    `${value} tasks (${percentage(
                      Number(value)
                    )}%)`,
                    name,
                  ]}
                contentStyle={{
                  background: M.white,
                  border: `1px solid ${M.border}`,
                  borderRadius: 12,
                  fontSize: 12,
                  color: M.textPrimary,
                }}
              />
            </PieChart>
          </ResponsiveContainer>

          {/* Center label */}

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
            <span
              style={{
                fontSize: 26,
                fontWeight: 800,
                fontFamily: "DM Mono, monospace",
                color: M.textPrimary,
              }}
            >
              {total}
            </span>

            <span
              style={{
                fontSize: 10,
                color: M.textSec,
                fontWeight: 600,
              }}
            >
              TASKS
            </span>
          </div>
        </div>

        {/* ---------------- STATUS LEGEND ---------------- */}

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
            flex: 1,
          }}
        >
          {data.map((item) => (
            <div
              key={item.name}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "8px 10px",
                borderRadius: 10,
                background: `${item.color}10`,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <div
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: "50%",
                    background: item.color,
                  }}
                />

                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: M.textPrimary,
                  }}
                >
                  {item.name}
                </span>
              </div>

              <div
                style={{
                  textAlign: "right",
                }}
              >
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 800,
                    color: item.color,
                    fontFamily:
                      "DM Mono, monospace",
                  }}
                >
                  {item.value}
                </div>

                <div
                  style={{
                    fontSize: 10,
                    color: M.textSec,
                  }}
                >
                  {percentage(item.value)}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </SectionCard>
  );
}