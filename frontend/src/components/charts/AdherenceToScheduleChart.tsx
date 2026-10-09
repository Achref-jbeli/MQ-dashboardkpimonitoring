import { useState, useEffect } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { Calendar, CheckCircle2, AlertTriangle, RefreshCw, BarChart2 } from "lucide-react";
import { M, cardBase } from "../../theme/tokens";
import {
  getAdherenceToSchedule,
  getPublicAdherenceToSchedule,
  type MonthlyAdherenceDto,
} from "../../api/kpiApi";

interface AdherenceToScheduleChartProps {
  departmentId?: number | null;
  projectId?: number | null;
  businessUnit?: string | null;
  year?: number | null;
  isPublic?: boolean;
  initialData?: MonthlyAdherenceDto[];
  title?: string;
  responsibleDepartments?: string | null;
  sourceDeptId?: number | null;
}

interface TooltipPayloadItem {
  name: string;
  value: number;
  color: string;
  dataKey: string;
  payload: MonthlyAdherenceDto;
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;

  const data = payload[0].payload;
  const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const n = Number(label);
  const monthName = !isNaN(n) && n >= 1 && n <= 12 ? MONTHS[n - 1] : String(label);
  const g = data.greenCount ?? data.green ?? 0;
  const y = data.yellowCount ?? data.yellow ?? 0;
  const o = data.orangeCount ?? data.orange ?? 0;
  const r = data.redCount ?? data.red ?? 0;
  const total = g + y + o + r;

  const gPct = total > 0 ? ((g / total) * 100).toFixed(1) : "0.0";
  const yPct = total > 0 ? ((y / total) * 100).toFixed(1) : "0.0";
  const oPct = total > 0 ? ((o / total) * 100).toFixed(1) : "0.0";
  const rPct = total > 0 ? ((r / total) * 100).toFixed(1) : "0.0";
  const adhPct = total > 0 ? (((g + y) / total) * 100).toFixed(1) : "0.0";

  return (
    <div
      style={{
        background: "var(--card, #FFFFFF)",
        color: M.textPrimary,
        padding: "14px 18px",
        borderRadius: 14,
        border: `1px solid ${M.border}`,
        boxShadow: "var(--shadow-md, 0 10px 25px -5px rgba(0, 0, 0, 0.2))",
        minWidth: 220,
        fontSize: 12,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10, paddingBottom: 6, borderBottom: `1px solid ${M.border}` }}>
        <Calendar size={14} color={M.teal} />
        <span style={{ fontWeight: 700, fontSize: 13, color: M.textPrimary }}>{monthName}</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 6, color: M.textSec }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: M.success }} />
            Green:
          </span>
          <span style={{ fontWeight: 700, color: M.success, fontFamily: "monospace" }}>
            {g} ({gPct}%)
          </span>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 6, color: M.textSec }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: M.warning }} />
            Yellow:
          </span>
          <span style={{ fontWeight: 700, color: M.warning, fontFamily: "monospace" }}>
            {y} ({yPct}%)
          </span>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 6, color: M.textSec }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: M.orange }} />
            Orange:
          </span>
          <span style={{ fontWeight: 700, color: M.orange, fontFamily: "monospace" }}>
            {o} ({oPct}%)
          </span>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 6, color: M.textSec }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: M.danger }} />
            Red:
          </span>
          <span style={{ fontWeight: 700, color: M.danger, fontFamily: "monospace" }}>
            {r} ({rPct}%)
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
          <span style={{ fontWeight: 700, color: M.textPrimary }}>Adherence (G+Y):</span>
          <span
            style={{
              fontWeight: 800,
              fontSize: 13,
              color: Number(adhPct) >= 80 ? M.success : Number(adhPct) >= 50 ? M.warning : M.danger,
              fontFamily: "monospace",
            }}
          >
            {adhPct}%
          </span>
        </div>
      </div>
    </div>
  );
}

export function AdherenceToScheduleChart({
  departmentId,
  projectId,
  businessUnit,
  year,
  isPublic = false,
  initialData,
  title = "Adherence — Monthly Breakdown",
  responsibleDepartments,
  sourceDeptId,
}: AdherenceToScheduleChartProps) {
  const [data, setData] = useState<MonthlyAdherenceDto[]>(initialData || []);
  const [loading, setLoading] = useState<boolean>(!initialData);
  const [error, setError] = useState<string | null>(null);

  // When sourceDeptId is provided, data lives in that dept (all charts read from dept=6).
  const effectiveDeptId = sourceDeptId ?? departmentId;

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      let result: MonthlyAdherenceDto[];
      if (isPublic) {
        result = await getPublicAdherenceToSchedule(
          effectiveDeptId ?? 0,
          {
            projectId: projectId ?? undefined,
            businessUnit: businessUnit ?? undefined,
            year: year ?? undefined,
            responsibleDepartments: responsibleDepartments ?? undefined,
          }
        );
      } else {
        result = await getAdherenceToSchedule({
          departmentId: effectiveDeptId ?? undefined,
          projectId: projectId ?? undefined,
          businessUnit: businessUnit ?? undefined,
          year: year ?? undefined,
          responsibleDepartments: responsibleDepartments ?? undefined,
        });
      }
      setData(result);
    } catch (err: any) {
      console.error("Failed to load adherence data:", err);
      setError("Failed to load monthly KPI breakdown.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!initialData) {
      fetchData();
    } else {
      setData(initialData);
    }
  }, [departmentId, sourceDeptId, projectId, businessUnit, year, initialData, responsibleDepartments]);

  // Aggregate totals
  const totalGreen = data.reduce((sum, d) => sum + (d.greenCount ?? d.green ?? 0), 0);
  const totalYellow = data.reduce((sum, d) => sum + (d.yellowCount ?? d.yellow ?? 0), 0);
  const totalOrange = data.reduce((sum, d) => sum + (d.orangeCount ?? d.orange ?? 0), 0);
  const totalRed = data.reduce((sum, d) => sum + (d.redCount ?? d.red ?? 0), 0);
  const grandTotal = totalGreen + totalYellow + totalOrange + totalRed;
  const overallAdherence = totalGreen + totalYellow;
  const overallAdherencePct =
    grandTotal > 0 ? ((overallAdherence / grandTotal) * 100).toFixed(1) : "0.0";

  return (
    <div
      style={{
        ...cardBase,
        padding: 24,
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                background: "rgba(0, 142, 149, 0.12)",
                color: M.teal,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <BarChart2 size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: M.textPrimary }}>
                {title}
              </h3>
              <p style={{ fontSize: 12, color: M.textSec, margin: "2px 0 0" }}>
                Traffic Light Distribution: <span style={{ color: M.success, fontWeight: 700 }}>Green</span> | <span style={{ color: M.warning, fontWeight: 700 }}>Yellow</span> | <span style={{ color: M.orange, fontWeight: 700 }}>Orange</span> | <span style={{ color: M.danger, fontWeight: 700 }}>Red</span> &bull; Adherence = Green + Yellow ({overallAdherencePct}%)
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={fetchData}
          disabled={loading}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 12px",
            background: "var(--surface-secondary, #EEF4F7)",
            border: `1px solid ${M.border}`,
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 600,
            color: M.textPrimary,
            cursor: loading ? "not-allowed" : "pointer",
            transition: "all 0.2s",
          }}
          title="Refresh KPI chart data"
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} style={{ color: M.teal }} />
          Refresh
        </button>
      </div>

      {/* Summary KPI Badges: 4 Traffic Light Categories + Adherence */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: 10 }}>
        <div style={{ background: M.successBg, border: `1px solid ${M.border}`, padding: "10px 14px", borderRadius: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, color: M.successText, fontSize: 11, fontWeight: 700 }}>
            <CheckCircle2 size={13} />
            Green
          </div>
          <p style={{ fontSize: 18, fontWeight: 800, color: M.success, margin: "4px 0 0", fontFamily: "DM Mono, monospace" }}>
            {totalGreen}
          </p>
        </div>

        <div style={{ background: M.warningBg, border: `1px solid ${M.border}`, padding: "10px 14px", borderRadius: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, color: M.warningText, fontSize: 11, fontWeight: 700 }}>
            <AlertTriangle size={13} />
            Yellow
          </div>
          <p style={{ fontSize: 18, fontWeight: 800, color: M.warning, margin: "4px 0 0", fontFamily: "DM Mono, monospace" }}>
            {totalYellow}
          </p>
        </div>

        <div style={{ background: M.orangeBg, border: `1px solid ${M.border}`, padding: "10px 14px", borderRadius: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, color: M.orangeText, fontSize: 11, fontWeight: 700 }}>
            <AlertTriangle size={13} />
            Orange
          </div>
          <p style={{ fontSize: 18, fontWeight: 800, color: M.orange, margin: "4px 0 0", fontFamily: "DM Mono, monospace" }}>
            {totalOrange}
          </p>
        </div>

        <div style={{ background: M.dangerBg, border: `1px solid ${M.border}`, padding: "10px 14px", borderRadius: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, color: M.dangerText, fontSize: 11, fontWeight: 700 }}>
            <AlertTriangle size={13} />
            Red
          </div>
          <p style={{ fontSize: 18, fontWeight: 800, color: M.danger, margin: "4px 0 0", fontFamily: "DM Mono, monospace" }}>
            {totalRed}
          </p>
        </div>

        <div style={{ background: "rgba(0, 142, 149, 0.12)", border: `1px solid ${M.border}`, padding: "10px 14px", borderRadius: 12 }}>
          <div style={{ color: M.teal, fontSize: 11, fontWeight: 700 }}>
            Adherence (G+Y)
          </div>
          <p style={{ fontSize: 18, fontWeight: 800, color: M.teal, margin: "4px 0 0", fontFamily: "DM Mono, monospace" }}>
            {overallAdherence} <span style={{ fontSize: 12, fontWeight: 600 }}>({overallAdherencePct}%)</span>
          </p>
        </div>
      </div>

      {/* Chart Area */}
      <div style={{ height: 280, width: "100%", marginTop: 8 }}>
        {loading ? (
          <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: M.textSec, gap: 8 }}>
            <RefreshCw size={18} className="animate-spin" style={{ color: M.teal }} />
            <span>Loading monthly adherence data...</span>
          </div>
        ) : error ? (
          <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: M.danger, fontSize: 13, fontWeight: 600 }}>
            {error}
          </div>
        ) : data.length === 0 ? (
          <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: M.textSec, gap: 8 }}>
            <BarChart2 size={32} opacity={0.5} style={{ color: M.teal }} />
            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: M.textPrimary }}>No monthly KPI records found for the selected department.</p>
            <p style={{ margin: 0, fontSize: 11, color: M.textSec }}>Upload an Excel KPI sheet to populate monthly Green, Yellow, Orange, and Red records.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 15, bottom: 5, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid, rgba(255,255,255,0.1))" vertical={false} />
              <XAxis
                dataKey="month"
                tickFormatter={(value) => {
                  const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
                  const n = Number(value);
                  return !isNaN(n) && n >= 1 && n <= 12 ? MONTHS[n - 1] : String(value);
                }}
                tick={{ fontSize: 11, fill: "var(--chart-axis, #6B7C87)", fontWeight: 600 }}
                axisLine={{ stroke: "var(--border, #E0EEEE)" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "var(--chart-axis, #6B7C87)" }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                wrapperStyle={{ paddingBottom: 10, fontSize: 12, fontWeight: 600 }}
              />
              <Bar dataKey="greenCount" name="Green" stackId="traffic" fill="var(--status-green, #16A34A)" maxBarSize={40} />
              <Bar dataKey="yellowCount" name="Yellow" stackId="traffic" fill="var(--status-yellow, #CA8A04)" maxBarSize={40} />
              <Bar dataKey="orangeCount" name="Orange" stackId="traffic" fill="var(--status-orange, #EA580C)" maxBarSize={40} />
              <Bar dataKey="redCount" name="Red" stackId="traffic" fill="var(--status-red, #DC2626)" radius={[4, 4, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
