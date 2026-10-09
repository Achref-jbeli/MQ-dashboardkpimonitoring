import React, { useState, useEffect } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LabelList,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { TrendingUp, Calendar, RefreshCw, Layers } from "lucide-react";
import { M } from "../../theme/tokens";
import { getPublicDepartmentAdherence } from "../../api/publicDashboardApi";
import { getAdherenceToSchedule, type MonthlyAdherenceDto } from "../../api/kpiApi";

interface PublicAdherenceChartProps {
  departmentId: number;
  departmentName?: string;
  businessUnit?: string | null;
  customTitle?: string;
  fallbackKpis?: any[];
  isPresentationMode?: boolean;
  responsibleDepartments?: string | null;
  sourceDeptId?: number | null;
}

// Colors matching the traffic light reference
const COLORS = {
  green: "#22C55E",    // Vibrant Green
  yellow: "#eac308ff",   // Traffic Yellow
  orange: "#f87509ff",   // Traffic Orange
  red: "#e42424ff",      // Traffic Red
};

// Renders the individual segment percentage inside each color block.
// Uses LabelList (not label prop) so value = raw segment %, not cumulative stack %.
const renderSegmentLabel = (props: any) => {
  const { x, y, width, height, value } = props;
  if (!value || value < 5 || height < 14) return null;

  return (
    <text
      x={x + width / 2}
      y={y + height / 2}
      fill="#ffffff"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={width < 32 ? 10 : 11}
      fontWeight={800}
      style={{
        textShadow: "0 1px 3px rgba(0,0,0,0.8)",
        pointerEvents: "none",
      }}
    >
      {`${Math.round(value)}%`}
    </text>
  );
};

// Custom Rich Tooltip
function CustomAdherenceTooltip({ active, payload, label }: any) {
  if (!active || !payload || payload.length === 0) return null;

  const data: MonthlyAdherenceDto = payload[0].payload;
  const isGrandTotal = label === "TOTAL GÉNÉRAL";
  const displayTitle = isGrandTotal ? "TOTAL GÉNÉRAL" : (!isNaN(Number(label)) ? `Month ${label}` : label);

  return (
    <div
      style={{
        background: "var(--card, #FFFFFF)",
        color: M.textPrimary,
        padding: "12px 16px",
        borderRadius: 12,
        border: `1px solid ${M.border}`,
        boxShadow: "var(--shadow-md, 0 10px 25px rgba(0, 0, 0, 0.2))",
        minWidth: 220,
        fontSize: 12,
        zIndex: 1000,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 8,
          paddingBottom: 6,
          borderBottom: `1px solid ${M.border}`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Calendar size={13} color={M.teal} />
          <span style={{ fontWeight: 800, fontSize: 13, color: M.textPrimary }}>
            {displayTitle}
          </span>
        </div>
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            background: "rgba(0, 142, 149, 0.12)",
            color: M.teal,
            padding: "2px 6px",
            borderRadius: 4,
          }}
        >
          {data.totalCount} records
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 6, color: M.textSec }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: M.success }} />
            Green (On Schedule):
          </span>
          <span style={{ fontWeight: 700, color: M.success, fontFamily: "monospace" }}>
            {data.greenPercentage.toFixed(1)}% ({data.greenCount})
          </span>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 6, color: M.textSec }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: M.warning }} />
            Yellow (Minor Delay):
          </span>
          <span style={{ fontWeight: 700, color: M.warning, fontFamily: "monospace" }}>
            {data.yellowPercentage.toFixed(1)}% ({data.yellowCount})
          </span>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 6, color: M.textSec }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: M.orange }} />
            Orange (Major Delay):
          </span>
          <span style={{ fontWeight: 700, color: M.orange, fontFamily: "monospace" }}>
            {data.orangePercentage.toFixed(1)}% ({data.orangeCount})
          </span>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 6, color: M.textSec }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: M.danger }} />
            Red (Critical):
          </span>
          <span style={{ fontWeight: 700, color: M.danger, fontFamily: "monospace" }}>
            {data.redPercentage.toFixed(1)}% ({data.redCount})
          </span>
        </div>

        <div
          style={{
            marginTop: 6,
            paddingTop: 6,
            borderTop: `1px solid ${M.border}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ fontWeight: 800, color: M.textPrimary }}>Total Adherence (G+Y):</span>
          <span
            style={{
              fontWeight: 800,
              fontSize: 13,
              color: data.adherencePercentage >= 80 ? M.success : data.adherencePercentage >= 50 ? M.warning : M.danger,
              fontFamily: "monospace",
            }}
          >
            {data.adherencePercentage.toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  );
}

function buildMonthlyDataFromKpis(kpis: any[] = []): MonthlyAdherenceDto[] {
  const greenCount = kpis.filter((k) => k.green).length;
  const yellowCount = kpis.filter((k) => k.yellow).length;
  const orangeCount = kpis.filter((k) => k.orange).length;
  const redCount = kpis.filter((k) => k.red).length;
  const totalRaw = greenCount + yellowCount + orangeCount + redCount;
  const total = totalRaw > 0 ? totalRaw : kpis.length;

  const months: MonthlyAdherenceDto[] = [];
  const monthGroups: Record<string, { green: number; yellow: number; orange: number; red: number; total: number }> = {};
  let hasMonthField = false;

  for (const kpi of kpis) {
    if (kpi.month) {
      hasMonthField = true;
      const mKey = String(kpi.month).trim();
      if (!monthGroups[mKey]) {
        monthGroups[mKey] = { green: 0, yellow: 0, orange: 0, red: 0, total: 0 };
      }
      if (kpi.green) monthGroups[mKey].green++;
      if (kpi.yellow) monthGroups[mKey].yellow++;
      if (kpi.orange) monthGroups[mKey].orange++;
      if (kpi.red) monthGroups[mKey].red++;
      monthGroups[mKey].total++;
    }
  }

  for (let m = 1; m <= 12; m++) {
    const mStr = m.toString();
    let g = 0, y = 0, o = 0, r = 0, t = 0;

    if (hasMonthField && monthGroups[mStr]) {
      g = monthGroups[mStr].green;
      y = monthGroups[mStr].yellow;
      o = monthGroups[mStr].orange;
      r = monthGroups[mStr].red;
      t = g + y + o + r;
    } else if (!hasMonthField && total > 0) {
      if (m <= 5) {
        g = Math.max(1, Math.round(greenCount / 5));
        y = Math.max(1, Math.round(yellowCount / 5));
        o = Math.round(orangeCount / 5);
        r = Math.round(redCount / 5);
        t = g + y + o + r;
      }
    }

    const gPct = t > 0 ? Math.round((g / t) * 1000) / 10 : 0;
    const yPct = t > 0 ? Math.round((y / t) * 1000) / 10 : 0;
    const oPct = t > 0 ? Math.round((o / t) * 1000) / 10 : 0;
    const rPct = t > 0 ? Math.round((r / t) * 1000) / 10 : 0;

    months.push({
      month: mStr,
      greenCount: g,
      yellowCount: y,
      orangeCount: o,
      redCount: r,
      totalCount: t,
      greenPercentage: gPct,
      yellowPercentage: yPct,
      orangePercentage: oPct,
      redPercentage: rPct,
      adherencePercentage: Math.round((gPct + yPct) * 10) / 10,
      adherenceCount: g + y,
      green: g,
      yellow: y,
      orange: o,
      red: r,
      adherence: g + y,
      total: t,
    });
  }

  // TOTAL GÉNÉRAL
  const grandG = months.reduce((acc, x) => acc + x.greenCount, 0);
  const grandY = months.reduce((acc, x) => acc + x.yellowCount, 0);
  const grandO = months.reduce((acc, x) => acc + x.orangeCount, 0);
  const grandR = months.reduce((acc, x) => acc + x.redCount, 0);
  const grandT = grandG + grandY + grandO + grandR;

  const grandGPct = grandT > 0 ? Math.round((grandG / grandT) * 1000) / 10 : 0;
  const grandYPct = grandT > 0 ? Math.round((grandY / grandT) * 1000) / 10 : 0;
  const grandOPct = grandT > 0 ? Math.round((grandO / grandT) * 1000) / 10 : 0;
  const grandRPct = grandT > 0 ? Math.round((grandR / grandT) * 1000) / 10 : 0;

  months.push({
    month: "TOTAL GÉNÉRAL",
    greenCount: grandG,
    yellowCount: grandY,
    orangeCount: grandO,
    redCount: grandR,
    totalCount: grandT,
    greenPercentage: grandGPct,
    yellowPercentage: grandYPct,
    orangePercentage: grandOPct,
    redPercentage: grandRPct,
    adherencePercentage: Math.round((grandGPct + grandYPct) * 10) / 10,
    adherenceCount: grandG + grandY,
    green: grandG,
    yellow: grandY,
    orange: grandO,
    red: grandR,
    adherence: grandG + grandY,
    total: grandT,
  });

  return months;
}

export function PublicAdherenceChart({
  departmentId,
  departmentName = "DEPARTMENT",
  businessUnit,
  customTitle,
  fallbackKpis = [],
  isPresentationMode = false,
  responsibleDepartments,
  sourceDeptId,
}: PublicAdherenceChartProps) {
  const [data, setData] = useState<MonthlyAdherenceDto[]>(() => buildMonthlyDataFromKpis(fallbackKpis));
  const [loading, setLoading] = useState(true);

  // When sourceDeptId is provided, data lives in that dept (e.g. all charts read from dept=6).
  const effectiveDeptId = sourceDeptId ?? departmentId;

  const loadData = async () => {
    if (!effectiveDeptId) return;

    setLoading(true);

    try {
      const filters = {
        ...(businessUnit ? { businessUnit } : {}),
        ...(responsibleDepartments ? { responsibleDepartments } : {}),
      };
      let result = await getPublicDepartmentAdherence(effectiveDeptId, Object.keys(filters).length ? filters : undefined);
      if (!result || result.length === 0) {
        result = await getAdherenceToSchedule({
          departmentId: effectiveDeptId,
          businessUnit: businessUnit || undefined,
          responsibleDepartments: responsibleDepartments || undefined,
        });
      }

      if (result && result.length > 0 && result.some((r: any) => r.totalCount > 0)) {
        setData(result);
      } else if (fallbackKpis && fallbackKpis.length > 0) {
        setData(buildMonthlyDataFromKpis(fallbackKpis));
      } else if (result && result.length > 0) {
        setData(result);
      }
    } catch (err: any) {
      if (fallbackKpis && fallbackKpis.length > 0) {
        setData(buildMonthlyDataFromKpis(fallbackKpis));
      } else {
        setData(buildMonthlyDataFromKpis([]));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [effectiveDeptId, businessUnit, fallbackKpis?.length, responsibleDepartments]);

  const grandTotal = data.find((d) => d.month === "TOTAL GÉNÉRAL") || {
    greenPercentage: 0,
    yellowPercentage: 0,
    orangePercentage: 0,
    redPercentage: 0,
    adherencePercentage: 0,
    totalCount: 0,
  };

  const chartTitle =
    customTitle ||
    (businessUnit ? `Adherence_${businessUnit}` : "Adherence");

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        width: "100%",
        background: isPresentationMode ? "transparent" : "var(--card, #FFFFFF)",
        padding: isPresentationMode ? "0" : "16px",
        borderRadius: isPresentationMode ? "0" : "16px",
        border: isPresentationMode ? "none" : `1px solid ${M.border}`,
        boxSizing: "border-box",
        overflow: "hidden",
      }}
    >
      {/* Header with Title & Stats Badges */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 8,
          marginBottom: isPresentationMode ? 8 : 12,
          flexShrink: 0,
        }}
      >
        <div>
          <h2
            style={{
              fontSize: isPresentationMode ? "clamp(16px, 2.2vh, 22px)" : "17px",
              fontWeight: 800,
              color: M.textPrimary,
              margin: 0,
              letterSpacing: "-0.01em",
            }}
          >
            {chartTitle}
          </h2>
          <p
            style={{
              fontSize: isPresentationMode ? "clamp(11px, 1.4vh, 13px)" : "12px",
              color: M.textSec,
              margin: "2px 0 0",
              fontWeight: 500,
            }}
          >
            100% Stacked Monthly Traffic-Light Distribution &middot;{" "}
            <strong style={{ color: M.teal }}>Adherence = Green + Yellow</strong>
          </p>
        </div>

        {/* Overall Summary Pill */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: "var(--surface-secondary, #EEF4F7)",
            padding: "6px 12px",
            borderRadius: 10,
            border: `1px solid ${M.border}`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <TrendingUp size={15} color={M.teal} />
            <span style={{ fontSize: 11, color: M.textSec, fontWeight: 600 }}>Overall Adherence:</span>
            <span style={{ fontSize: 14, fontWeight: 800, color: M.teal, fontFamily: "monospace" }}>
              {grandTotal.adherencePercentage.toFixed(1)}%
            </span>
          </div>

          <div style={{ width: 1, height: 16, background: M.border }} />

          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <Layers size={14} color={M.textSec} />
            <span style={{ fontSize: 11, color: M.textSec, fontWeight: 600 }}>Records:</span>
            <span style={{ fontSize: 14, fontWeight: 800, color: M.textPrimary, fontFamily: "monospace" }}>
              {grandTotal.totalCount}
            </span>
          </div>
        </div>
      </div>

      {/* Chart Canvas Area */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          width: "100%",
          position: "relative",
        }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 12, right: 12, left: -10, bottom: 5 }}
            barCategoryGap="10%"
          >
            <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid, rgba(255,255,255,0.08))" vertical={false} />
            <XAxis
              dataKey="month"
              tick={{
                fontSize: isPresentationMode ? 11 : 10,
                fill: "var(--chart-axis, #6B7C87)",
                fontWeight: 700,
              }}
              axisLine={{ stroke: "var(--border, #E0EEEE)" }}
              tickLine={false}
              tickFormatter={(val) => {
                const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
                const n = parseInt(val, 10);
                if (!isNaN(n) && n >= 1 && n <= 12) return MONTHS[n - 1];
                if (val === "TOTAL GÉNÉRAL") return "TOTAL";
                return val;
              }}
            />
            <YAxis
              domain={[0, 100]}
              tick={{
                fontSize: isPresentationMode ? 11 : 10,
                fill: "var(--chart-axis, #6B7C87)",
                fontWeight: 600,
              }}
              tickFormatter={(val) => `${val}%`}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomAdherenceTooltip />} />
            <Legend
              verticalAlign="top"
              align="right"
              iconType="circle"
              wrapperStyle={{
                paddingBottom: 6,
                fontSize: isPresentationMode ? 12 : 11,
                fontWeight: 700,
                color: "var(--text-secondary)",
              }}
            />
            <Bar dataKey="greenPercentage" name="Green" stackId="pct" fill="var(--status-green, #16A34A)">
              <LabelList dataKey="greenPercentage" content={renderSegmentLabel} />
            </Bar>
            <Bar dataKey="yellowPercentage" name="Yellow" stackId="pct" fill="var(--status-yellow, #CA8A04)">
              <LabelList dataKey="yellowPercentage" content={renderSegmentLabel} />
            </Bar>
            <Bar dataKey="orangePercentage" name="Orange" stackId="pct" fill="var(--status-orange, #EA580C)">
              <LabelList dataKey="orangePercentage" content={renderSegmentLabel} />
            </Bar>
            <Bar dataKey="redPercentage" name="Red" stackId="pct" fill="var(--status-red, #DC2626)">
              <LabelList dataKey="redPercentage" content={renderSegmentLabel} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
