  import client from "./client";

  export interface OverviewStats {
    totalEmployees: number;
    budgetUtilized: number;
    totalTasks: number;
    completedTasks: number;
    activeTasks: number;
    delayedTasks: number;
    averageTaskProgress: number;
    scheduleAdherence: number;
    overallKpiAchievement: number;
    overallMaturity: number;
    deliveryPerformance: number;
  }

  export interface BuKpiSummary {
    totalProjects: number;
    onTrackProjects: number;
    delayedProjects: number;
    riskProjects: number;
    averageProgress: number;
  }

  export interface BuProject {
    id: number;
    title: string;
    status: string;
    businessUnit: string;
  }

  export interface BuKpi {
    id: number;
    designation: string;
    green: boolean;
    yellow: boolean;
    red: boolean;
  }

  export interface BusinessUnitDashboard {
    name: string;
    summary: BuKpiSummary;
    projects: BuProject[];
    kpis: BuKpi[];
  }

  export const getDashboardOverview = async (departmentId?: number): Promise<OverviewStats> => {
    const params = departmentId ? { departmentId } : {};
    const { data } = await client.get("/Dashboard/overview", { params });
    return data;
  };

  export const getBusinessUnitsDashboard = async (departmentId?: number): Promise<BusinessUnitDashboard[]> => {
    const params = departmentId ? { departmentId } : {};
    const { data } = await client.get("/Dashboard/business-units", { params });
    return data;
  };
