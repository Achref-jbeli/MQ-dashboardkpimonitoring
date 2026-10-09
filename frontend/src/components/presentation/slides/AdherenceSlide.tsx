import React from "react";
import { M } from "../../../theme/tokens";
import type { BusinessUnitDashboard } from "../../../api/dashboardApi";
import { SlideHeader } from "../SlideHeader";
import { PublicAdherenceChart } from "../../charts/PublicAdherenceChart";

export interface AdherenceSlideProps {
  buDashboards?: BusinessUnitDashboard[];
  departmentId?: number;
  departmentName?: string;
}

export function AdherenceSlide({ buDashboards }: AdherenceSlideProps) {
  const fallbackKpis = buDashboards?.flatMap((bu) => bu.kpis || []) || [];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <SlideHeader title="ADHERENCE" />

      <div
        style={{
          flex: 1,
          display: "flex",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            flex: 1,
            background: M.white,
            borderRadius: "1.5vh",
            padding: "2vh 3vh",
            boxShadow: "0 0.5vh 2vh rgba(0,0,0,0.10)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <p style={{ margin: "0 0 0.8vh", fontWeight: 800, fontSize: "1.8vh", color: M.teal, letterSpacing: "0.05em" }}>
            R&D
          </p>
          <div style={{ flex: 1, minHeight: 0 }}>
            <PublicAdherenceChart
              departmentId={6}
              sourceDeptId={6}
              responsibleDepartments="PM1-TU,RDM-TU,PM_I-TU,RDM_M-TU,RDE-TU,RDM_I-TU"
              departmentName="R&D"
              fallbackKpis={fallbackKpis}
              isPresentationMode={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
