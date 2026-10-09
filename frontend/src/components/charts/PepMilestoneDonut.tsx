import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { M } from "../../theme/tokens";
import type { PepMilestoneDistribution } from "../../types/milestone";
import { CheckCircle, AlertTriangle, AlertCircle, Clock, CalendarCheck2 } from "lucide-react";

interface PepMilestoneDonutProps {
  data?: PepMilestoneDistribution | null;
  loading?: boolean;
  isPresentationMode?: boolean;
}

const PEP_CATEGORIES = [
  { key: "onTime", label: "On time / ≤ 2w", color: "#10B981", icon: CheckCircle },
  { key: "delay2To4w", label: "Delay 2–4w", color: "#F59E0B", icon: AlertTriangle },
  { key: "delayMoreThan4w", label: "Delay > 4w", color: "#EF4444", icon: AlertCircle },
  { key: "open", label: "Open", color: "#00B8C2", icon: Clock },
];

export function PepMilestoneDonut({
  data,
  loading = false,
  isPresentationMode = false,
}: PepMilestoneDonutProps) {
  if (loading) {
    return (
      <div
        style={{
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: M.textSec,
          fontSize: isPresentationMode ? "1.8vh" : 14,
        }}
      >
        Loading PEP Milestones...
      </div>
    );
  }

  const totalCount = data?.totalCount ?? 0;

  if (totalCount === 0) {
    return (
      <div
        style={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          color: M.textSec,
          fontSize: isPresentationMode ? "1.6vh" : 14,
          gap: 8,
        }}
      >
        <CalendarCheck2 size={isPresentationMode ? "3vh" : 24} />
        <span>No PEP milestones recorded for this period.</span>
      </div>
    );
  }

  const pieData = [
    {
      name: "On time / ≤ 2w",
      value: data?.onTimeCount ?? 0,
      percentage: data?.onTimePercentage ?? 0,
      color: "#10B981",
    },
    {
      name: "Delay 2–4w",
      value: data?.delay2To4WeeksCount ?? 0,
      percentage: data?.delay2To4WeeksPercentage ?? 0,
      color: "#F59E0B",
    },
    {
      name: "Delay > 4w",
      value: data?.delayMoreThan4WeeksCount ?? 0,
      percentage: data?.delayMoreThan4WeeksPercentage ?? 0,
      color: "#EF4444",
    },
    {
      name: "Open",
      value: data?.openCount ?? 0,
      percentage: data?.openPercentage ?? 0,
      color: "#00B8C2",
    },
  ].filter((slice) => slice.value > 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div
          style={{
            background: "var(--card, #FFFFFF)",
            border: "1px solid var(--border, #E0EEEE)",
            borderRadius: 8,
            padding: "8px 12px",
            boxShadow: "0 4px 14px rgba(0,0,0,0.15)",
            fontSize: isPresentationMode ? "1.4vh" : 12,
            color: "var(--text-primary, #0B192C)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: item.color,
                display: "inline-block",
              }}
            />
            <span style={{ fontWeight: 800 }}>{item.name}</span>
          </div>
          <div style={{ marginTop: 4, fontWeight: 600, color: M.textSec }}>
            {item.value} milestones ({item.percentage}%)
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        width: "100%",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: isPresentationMode ? "0.8vh" : 8,
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <CalendarCheck2 size={isPresentationMode ? "2vh" : 18} color={M.teal} />
          <h4
            style={{
              margin: 0,
              fontSize: isPresentationMode ? "1.8vh" : 15,
              fontWeight: 800,
              color: "var(--text-primary, #0B192C)",
              letterSpacing: "-0.01em",
            }}
          >
            PEP Milestone Status Distribution
          </h4>
        </div>
        <span
          style={{
            fontSize: isPresentationMode ? "1.4vh" : 12,
            fontWeight: 700,
            color: M.teal,
            background: "rgba(0, 181, 200, 0.12)",
            padding: "2px 8px",
            borderRadius: 6,
          }}
        >
          {totalCount} Total Milestones
        </span>
      </div>

      {/* Middle Layout: Donut Chart + Legend */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: "grid",
          gridTemplateColumns: "1fr 1.1fr",
          alignItems: "center",
          gap: isPresentationMode ? "1vw" : 12,
          overflow: "hidden",
        }}
      >
        {/* Donut Chart with Center Text */}
        <div
          style={{
            height: "100%",
            width: "100%",
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip content={<CustomTooltip />} />
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                innerRadius="58%"
                outerRadius="88%"
                paddingAngle={3}
                stroke="none"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>

          <div
            style={{
              position: "absolute",
              textAlign: "center",
              pointerEvents: "none",
            }}
          >
            <div
              style={{
                fontSize: isPresentationMode ? "2.2vh" : 18,
                fontWeight: 900,
                color: "var(--text-primary, #0B192C)",
                lineHeight: 1,
              }}
            >
              {data?.completionRate ?? 0}%
            </div>
            <div
              style={{
                fontSize: isPresentationMode ? "1.1vh" : 10,
                fontWeight: 600,
                color: M.textSec,
                marginTop: 2,
              }}
            >
              Completed
            </div>
          </div>
        </div>

        {/* Legend with Counts and Percentages */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: isPresentationMode ? "0.8vh" : 6,
            justifyContent: "center",
          }}
        >
          {PEP_CATEGORIES.map((cat) => {
            const count =
              cat.key === "onTime"
                ? data?.onTimeCount ?? 0
                : cat.key === "delay2To4w"
                ? data?.delay2To4WeeksCount ?? 0
                : cat.key === "delayMoreThan4w"
                ? data?.delayMoreThan4WeeksCount ?? 0
                : data?.openCount ?? 0;

            const percentage =
              cat.key === "onTime"
                ? data?.onTimePercentage ?? 0
                : cat.key === "delay2To4w"
                ? data?.delay2To4WeeksPercentage ?? 0
                : cat.key === "delayMoreThan4w"
                ? data?.delayMoreThan4WeeksPercentage ?? 0
                : data?.openPercentage ?? 0;

            return (
              <div
                key={cat.key}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: isPresentationMode ? "0.6vh 1vh" : "4px 8px",
                  borderRadius: "0.8vh",
                  background: "var(--surface-secondary, #F8FAFC)",
                  border: `1px solid var(--border, #E0EEEE)`,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span
                    style={{
                      width: isPresentationMode ? "1.2vh" : 10,
                      height: isPresentationMode ? "1.2vh" : 10,
                      borderRadius: "50%",
                      background: cat.color,
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      fontSize: isPresentationMode ? "1.3vh" : 12,
                      fontWeight: 600,
                      color: "var(--text-primary, #0B192C)",
                    }}
                  >
                    {cat.label}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span
                    style={{
                      fontSize: isPresentationMode ? "1.4vh" : 12,
                      fontWeight: 800,
                      color: cat.color,
                    }}
                  >
                    {count}
                  </span>
                  <span
                    style={{
                      fontSize: isPresentationMode ? "1.2vh" : 11,
                      color: M.textSec,
                      fontFamily: "DM Mono, monospace",
                    }}
                  >
                    ({percentage}%)
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: isPresentationMode ? "0.8vh" : 6,
          marginTop: isPresentationMode ? "0.8vh" : 8,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            background: "var(--surface-secondary, #F1F5F9)",
            padding: isPresentationMode ? "0.6vh 0.8vh" : "4px 8px",
            borderRadius: "0.8vh",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: isPresentationMode ? "1.1vh" : 10, color: M.textSec, fontWeight: 600 }}>
            Projects
          </div>
          <div style={{ fontSize: isPresentationMode ? "1.6vh" : 13, fontWeight: 800, color: "var(--text-primary, #0B192C)" }}>
            {data?.totalProjects ?? 0}
          </div>
        </div>

        <div
          style={{
            background: "var(--surface-secondary, #F1F5F9)",
            padding: isPresentationMode ? "0.6vh 0.8vh" : "4px 8px",
            borderRadius: "0.8vh",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: isPresentationMode ? "1.1vh" : 10, color: M.textSec, fontWeight: 600 }}>
            Completed
          </div>
          <div style={{ fontSize: isPresentationMode ? "1.6vh" : 13, fontWeight: 800, color: M.success }}>
            {data?.completedMilestones ?? 0}
          </div>
        </div>

        <div
          style={{
            background: "var(--surface-secondary, #F1F5F9)",
            padding: isPresentationMode ? "0.6vh 0.8vh" : "4px 8px",
            borderRadius: "0.8vh",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: isPresentationMode ? "1.1vh" : 10, color: M.textSec, fontWeight: 600 }}>
            Open Gates
          </div>
          <div style={{ fontSize: isPresentationMode ? "1.6vh" : 13, fontWeight: 800, color: M.teal }}>
            {data?.openMilestones ?? 0}
          </div>
        </div>

        <div
          style={{
            background: "var(--surface-secondary, #F1F5F9)",
            padding: isPresentationMode ? "0.6vh 0.8vh" : "4px 8px",
            borderRadius: "0.8vh",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: isPresentationMode ? "1.1vh" : 10, color: M.textSec, fontWeight: 600 }}>
            Avg Delay
          </div>
          <div
            style={{
              fontSize: isPresentationMode ? "1.6vh" : 13,
              fontWeight: 800,
              color: (data?.averageDelayDays ?? 0) <= 14 ? M.success : M.danger,
            }}
          >
            {data?.averageDelayDays ?? 0}d
          </div>
        </div>
      </div>
    </div>
  );
}
