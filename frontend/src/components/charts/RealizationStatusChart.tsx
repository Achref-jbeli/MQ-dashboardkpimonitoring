import React from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { M } from "../../theme/tokens";
import type { RealizationStatus } from "../../types/milestone";
import { TrendingUp, Target, CheckCircle2, Clock } from "lucide-react";

interface RealizationStatusChartProps {
  data?: RealizationStatus | null;
  loading?: boolean;
  isPresentationMode?: boolean;
}

export function RealizationStatusChart({
  data,
  loading = false,
  isPresentationMode = false,
}: RealizationStatusChartProps) {
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
        Loading Realization Status...
      </div>
    );
  }

  const periods = data?.periods || [];
  const summary = data?.summary;

  if (periods.length === 0) {
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
        No realization data available.
      </div>
    );
  }

  // Formatting chart dataset
  const chartData = periods.map((p) => ({
    name: p.periodLabel || p.month,
    Realized: p.realizedValue,
    Planned: p.plannedValue,
    Target: p.targetValue,
    Forecast: p.forecastValue ?? undefined,
    rate: p.realizationRate,
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
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
          <p style={{ fontWeight: 800, margin: "0 0 6px", color: M.teal }}>{label}</p>
          {payload.map((entry: any, index: number) => (
            <div
              key={`item-${index}`}
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                margin: "2px 0",
              }}
            >
              <span style={{ color: entry.color, fontWeight: 600 }}>{entry.name}:</span>
              <span style={{ fontWeight: 700 }}>{entry.value}</span>
            </div>
          ))}
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
      {/* Title Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: isPresentationMode ? "1vh" : 8,
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <TrendingUp size={isPresentationMode ? "2vh" : 18} color={M.teal} />
          <h4
            style={{
              margin: 0,
              fontSize: isPresentationMode ? "1.8vh" : 15,
              fontWeight: 800,
              color: "var(--text-primary, #0B192C)",
              letterSpacing: "-0.01em",
            }}
          >
            Realization Status (Cumulative)
          </h4>
        </div>
        {summary && (
          <span
            style={{
              fontSize: isPresentationMode ? "1.4vh" : 12,
              fontWeight: 700,
              color: summary.overallRealizationRate >= 90 ? M.success : M.teal,
              background: "rgba(0, 181, 200, 0.12)",
              padding: "2px 8px",
              borderRadius: 6,
            }}
          >
            Realization: {summary.overallRealizationRate}%
          </span>
        )}
      </div>

      {/* Chart Canvas */}
      <div style={{ flex: 1, minHeight: 0, width: "100%" }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={chartData}
            margin={{ top: 10, right: 15, left: -15, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(100, 116, 139, 0.2)" vertical={false} />
            <XAxis
              dataKey="name"
              stroke="var(--muted-foreground, #64748B)"
              fontSize={isPresentationMode ? "1.2vh" : 11}
              tickLine={false}
            />
            <YAxis
              stroke="var(--muted-foreground, #64748B)"
              fontSize={isPresentationMode ? "1.2vh" : 11}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{
                fontSize: isPresentationMode ? "1.3vh" : 11,
                paddingTop: 4,
              }}
            />
            <Bar
              dataKey="Planned"
              name="Planned"
              fill="#94A3B8"
              radius={[4, 4, 0, 0]}
              maxBarSize={28}
            />
            <Bar
              dataKey="Realized"
              name="Realized"
              fill={M.teal}
              radius={[4, 4, 0, 0]}
              maxBarSize={28}
            />
            <Line
              type="monotone"
              dataKey="Target"
              name="Target"
              stroke="#10B981"
              strokeWidth={2.5}
              dot={{ r: 3, fill: "#10B981" }}
              strokeDasharray="4 4"
            />
            <Line
              type="monotone"
              dataKey="Forecast"
              name="Forecast"
              stroke="#F59E0B"
              strokeWidth={2}
              dot={{ r: 3, fill: "#F59E0B" }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Bottom Summary Metric Strip */}
      {summary && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: isPresentationMode ? "0.8vh" : 6,
            marginTop: isPresentationMode ? "1vh" : 8,
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
              Realized
            </div>
            <div style={{ fontSize: isPresentationMode ? "1.6vh" : 13, fontWeight: 800, color: M.teal }}>
              {summary.totalRealized}
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
              Planned
            </div>
            <div style={{ fontSize: isPresentationMode ? "1.6vh" : 13, fontWeight: 800, color: "var(--text-primary, #0B192C)" }}>
              {summary.totalPlanned}
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
              Target
            </div>
            <div style={{ fontSize: isPresentationMode ? "1.6vh" : 13, fontWeight: 800, color: M.success }}>
              {summary.totalTarget ?? "-"}
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
              Variance
            </div>
            <div
              style={{
                fontSize: isPresentationMode ? "1.6vh" : 13,
                fontWeight: 800,
                color: summary.variance <= 0 ? M.success : M.danger,
              }}
            >
              {summary.variance > 0 ? `+${summary.variance}` : summary.variance}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
