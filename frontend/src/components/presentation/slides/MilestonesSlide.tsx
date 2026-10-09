import { useEffect, useState } from "react";
import { M } from "../../../theme/tokens";
import { SlideHeader } from "../SlideHeader";
import { PepMilestoneDonut } from "../../charts/PepMilestoneDonut";
import { getPublicPepMilestones } from "../../../api/publicDashboardApi";
import type { PepMilestoneDistribution } from "../../../types/milestone";

export interface MilestonesSlideProps {
  departmentId?: number;
  departmentName?: string;
}

export function MilestonesSlide({
  departmentId,
  departmentName = "DEPARTMENT",
}: MilestonesSlideProps) {
  const [pepData, setPepData] = useState<PepMilestoneDistribution | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!departmentId) return;

    let cancelled = false;
    setLoading(true);

    getPublicPepMilestones(departmentId)
      .then((data) => {
        if (!cancelled) setPepData(data);
      })
      .catch(() => {
        if (!cancelled) setPepData(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [departmentId]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <SlideHeader title="PEP MILESTONES" />

      <div
        style={{
          flex: 1,
          background: "var(--card, #FFFFFF)",
          borderRadius: "2vh",
          padding: "1.8vh 2vh",
          boxShadow: "var(--shadow-md, 0 1vh 3vh rgba(0,0,0,0.15))",
          border: `1px solid var(--border, ${M.border})`,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          minHeight: 0,
        }}
      >
        {departmentId ? (
          <PepMilestoneDonut
            data={pepData}
            loading={loading}
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
            No Department Selected for Milestones
          </div>
        )}
      </div>
    </div>
  );
}
