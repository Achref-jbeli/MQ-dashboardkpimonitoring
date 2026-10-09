import React from "react";
import { M } from "../../../theme/tokens";
import type { BusinessUnitDashboard } from "../../../api/dashboardApi";
import { SlideHeader } from "../SlideHeader";
import { PublicAdherenceChart } from "../../charts/PublicAdherenceChart";

export interface MaturitySlideProps {
  data: BusinessUnitDashboard;
  departmentId?: number;
  departmentName?: string;
}

export function MaturitySlide({
  data,
  departmentId,
  departmentName = "DEPARTMENT",
}: MaturitySlideProps) {
  const kpis = data.kpis || [];
  const kpiGreen = kpis.filter((k) => k.green).length;
  const kpiYellow = kpis.filter((k) => k.yellow).length;
  const kpiRed = kpis.filter((k) => k.red).length;

  const Th = ({ children }: { children: React.ReactNode }) => (
    <div
      style={{
        background: "var(--sidebar, #08475E)",
        color: "#FFFFFF",
        padding: "1.2vh 1vh",
        textAlign: "center",
        fontWeight: 700,
        fontSize: "1.8vh",
        border: `1px solid var(--border, rgba(255,255,255,0.15))`,
      }}
    >
      {children}
    </div>
  );

  const Td = ({ children, bg, color }: { children: React.ReactNode; bg?: string; color?: string }) => (
    <div
      style={{
        background: bg || "var(--surface-secondary, #EEF4F7)",
        padding: "1.2vh 1vh",
        textAlign: "center",
        fontWeight: 800,
        fontSize: "2.6vh",
        border: `1px solid ${M.border}`,
        color: color || M.textPrimary,
      }}
    >
      {children}
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <SlideHeader title={`${data.name} MATURITY`} />

      <div
        style={{
          flex: 1,
          background: "var(--card, #FFFFFF)",
          borderRadius: "2vh",
          padding: "2.5vh 3.5vh",
          boxShadow: "var(--shadow-md, 0 1vh 3vh rgba(0,0,0,0.15))",
          border: `1px solid ${M.border}`,
          display: "flex",
          flexDirection: "column",
          gap: "2vh",
          overflow: "hidden",
        }}
      >
        {/* 100% Stacked Adherence / Maturity Chart Scoped to this Business Unit */}
        <div style={{ flex: 1, minHeight: 0, width: "100%" }}>
          {departmentId ? (
            <PublicAdherenceChart
              departmentId={departmentId}
              departmentName={departmentName}
              businessUnit={data.name}
              customTitle={`${data.name} Maturity Schedule Adherence`}
              fallbackKpis={data.kpis}
              isPresentationMode={true}
            />
          ) : (
            <div
              style={{
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: M.textSec,
                fontSize: "2.2vh",
              }}
            >
              No Data Available
            </div>
          )}
        </div>

        {/* BU KPI Summary Highlights Table */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", overflow: "hidden", borderRadius: "1vh", border: `2px solid var(--sidebar, #08475E)` }}>
          <Th>Total Projects</Th>
          <Th>Avg Progress</Th>
          <Th>Green KPIs</Th>
          <Th>Red KPIs</Th>

          <Td bg="var(--surface-secondary, #EEF4F7)" color={M.textPrimary}>{data.summary.totalProjects}</Td>
          <Td bg="var(--surface-secondary, #EEF4F7)" color={M.textPrimary}>{data.summary.averageProgress}%</Td>
          <Td bg={M.successBg} color={M.successText}>{kpiGreen}</Td>
          <Td bg={kpiRed > 0 ? M.dangerBg : "var(--surface-secondary, #EEF4F7)"} color={kpiRed > 0 ? M.dangerText : M.textPrimary}>{kpiRed}</Td>
        </div>
      </div>
    </div>
  );
}
