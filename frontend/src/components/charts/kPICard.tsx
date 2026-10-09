import { TrendingUp, TrendingDown } from "lucide-react";
import { Card } from "../common/Card";
import { MiniDonut } from "./MiniDonut";
import { M } from "../../theme/tokens";
import type { KPI } from "../../types/dashboard";

export function KPICard({ kpi }: { kpi: KPI }) {
  const pos = kpi.change >= 0;
  return (
    <Card
      style={{
        padding: 20,
        display: "flex",
        flexDirection: "column",
        gap: 12,
        position: "relative",
        overflow: "hidden",
        transition: "transform .2s, box-shadow .2s",
        cursor: "default",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: -16,
          right: -16,
          width: 80,
          height: 80,
          borderRadius: "50%",
          background: kpi.color,
          opacity: 0.12,
          filter: "blur(20px)",
        }}
      />
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: kpi.bgLight,
            color: kpi.color,
          }}
        >
          {kpi.icon}
        </div>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 3,
            fontSize: 11,
            fontFamily: "DM Mono, monospace",
            padding: "2px 8px",
            borderRadius: 999,
            color: pos ? "#065F46" : "#991B1B",
            background: pos ? "#D1FAE5" : "#FEE2E2",
          }}
        >
          {pos ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
          {pos ? "+" : ""}
          {kpi.change}
          {kpi.unit === "%" ? "pp" : "%"}
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 8 }}>
        <div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 4, fontFamily: "DM Mono, monospace" }}>
            <span style={{ fontSize: 32, fontWeight: 800, lineHeight: 1, color: kpi.color }}>
              {kpi.unit === "%" ? kpi.value.toFixed(1) : kpi.value % 1 === 0 ? kpi.value : kpi.value.toFixed(1)}
            </span>
            {kpi.unit && <span style={{ fontSize: 13, color: M.textSec }}>{kpi.unit}</span>}
          </div>
          <p style={{ fontSize: 11, marginTop: 4, fontWeight: 500, color: M.textSec }}>{kpi.label}</p>
        </div>
        {kpi.pieData && (
          <div style={{ opacity: 0.9, flexShrink: 0 }}>
            <MiniDonut data={kpi.pieData} />
          </div>
        )}
      </div>
      {kpi.unit === "%" && (
        <div style={{ height: 5, borderRadius: 999, overflow: "hidden", background: kpi.bgLight }}>
          <div
            style={{
              height: "100%",
              borderRadius: 999,
              width: `${kpi.value}%`,
              background: `linear-gradient(90deg,${kpi.color},${kpi.color}AA)`,
            }}
          />
        </div>
      )}
    </Card>
  );
}
