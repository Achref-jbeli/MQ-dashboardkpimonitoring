import { useState, useEffect } from "react";
import { M } from "../../theme/tokens";
import { DashboardOverview } from "../../components/dashboard/DashboardOverview";
import { getDashboardOverview, getBusinessUnitsDashboard, OverviewStats, BusinessUnitDashboard } from "../../api/dashboardApi";
import { getActiveDepartmentId } from "../../utils/departmentScope";

export function OverviewPage() {
  const [overview, setOverview] = useState<OverviewStats | null>(null);
  const [buDashboards, setBuDashboards] = useState<BusinessUnitDashboard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const activeDepartmentId = getActiveDepartmentId();

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const ov = await getDashboardOverview(activeDepartmentId ?? undefined);
        const bu = await getBusinessUnitsDashboard(activeDepartmentId ?? undefined);
        setOverview(ov);
        setBuDashboards(bu);
      } catch (e) {
        setError("Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    };
    
    // Invalidation strategy placeholder: We could listen to a global event here.
    loadData();
  }, [activeDepartmentId]);

  if (loading) return <p style={{ color: M.textSec }}>Loading overview...</p>;
  if (error) return <p style={{ color: M.danger }}>{error}</p>;
  if (!overview) return null;

  return <DashboardOverview overview={overview} buDashboards={buDashboards} departmentId={activeDepartmentId} />;
}
