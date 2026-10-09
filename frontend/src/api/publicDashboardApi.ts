import api from "./client";
import type { PepMilestoneDistribution, RealizationStatus } from "../types/milestone";

export interface PublicDepartment {
  id: number;
  name: string;
  businessUnitName?: string;
}


export interface PublicInternationalBusiness {
  id: number;
  name?: string;
  country?: string;
  partnerName?: string;
  description?: string;
  photos: string[];
  isNewBusiness?: boolean;
  projectInfo?: string;
  volumeLifetime?: string;
  salesLifetime?: string;
  sop?: string;
  productionLocation?: string;
  updatedAtUtc?: string;
}


export interface PublicPerformanceSummary {
  totalProjects: number;
  completedProjects: number;
  activeProjects: number;
  delayedProjects: number;
  averageProjectProgress: number;
  scheduleAdherence: number;
  overallKpiAchievement: number;
  overallMaturity: number;
  projectHealth: number;
  deliveryPerformance: number;
}

export interface PublicChartSlice {
  name: string;
  value: number;
}

export interface PublicEmployeePerformance {
  label: string;
  assignedTasks: number;
  completedTasks: number;
  averageProgress: number;
  performanceScore: number;
}

export interface PublicTrendPoint {
  label: string;
  createdTasks: number;
  completedTasks: number;
}

export interface PublicPerformanceCharts {
  taskStatus: PublicChartSlice[];
  employeePerformance: PublicEmployeePerformance[];
  completionTrend: PublicTrendPoint[];
}

export interface PublicProject {
  id: number;
  name: string;
  status: "On Track" | "Delayed" | "Risk";
  progress: number;
  bu: "HMI" | "HIS" | "Performance" | string;
  budget: string;
  deadline?: string;
  health: number;
}

export interface PublicEvent {
  id: number;
  title: string;
  description?: string;
  date?: string;
  location?: string;
  type?: string;
  imageUrl?: string;
}

export interface PublicEmployee {
  id: number;
  firstName: string;
  lastName: string;
  professionalDomain?: string;
  seniority?: string;
  department?: string;
  role?: string;
  birthDate?: string;
  isActive: boolean;
  position?: string;
  hireDate?: string;
  teamId?: number;
  photo?: string;
}

export interface PublicDepartmentDashboard {
  department: PublicDepartment;
  performance: PublicPerformanceSummary;
  projects: PublicProject[];
  events: PublicEvent[];
  employees: PublicEmployee[];
  charts?: PublicPerformanceCharts;
}

function normalizeCharts(charts?: Partial<PublicPerformanceCharts>): PublicPerformanceCharts {
  return {
    taskStatus: Array.isArray(charts?.taskStatus) ? charts.taskStatus : [],
    employeePerformance: Array.isArray(charts?.employeePerformance) ? charts.employeePerformance : [],
    completionTrend: Array.isArray(charts?.completionTrend) ? charts.completionTrend : [],
  };
}

function normalizeDashboard(data: PublicDepartmentDashboard): PublicDepartmentDashboard & { charts: PublicPerformanceCharts } {
  return {
    ...data,
    charts: normalizeCharts(data.charts),
    projects: Array.isArray(data.projects)
      ? data.projects.map((project) => ({
          ...project,
          bu: project.bu ?? "-",
        }))
      : [],
    events: Array.isArray(data.events) ? data.events : [],
    employees: Array.isArray(data.employees) ? data.employees : [],
  };
}

export async function getPublicDepartments() {
  const response = await api.get<PublicDepartment[]>("/public-dashboard/departments");
  return response.data;
}

export async function getPublicDepartmentDashboard(departmentId: number) {
  const response = await api.get<PublicDepartmentDashboard>(`/public-dashboard/departments/${departmentId}`);
  return normalizeDashboard(response.data);
}

export async function getPublicBusinessUnitsDashboard(departmentId: number) {
  const response = await api.get(`/public-dashboard/departments/${departmentId}/business-units`);
  return response.data;
}


export async function getPublicInternationalBusinesses(departmentId: number) {
  const response = await api.get<PublicInternationalBusiness[]>(
    `/public-dashboard/departments/${departmentId}/international-business`
  );
  return Array.isArray(response.data) ? response.data : [];
}

export async function getPublicDepartmentAdherence(
  departmentId: number,
  filters?: {
    projectId?: number;
    businessUnit?: string;
    year?: number;
    responsibleDepartments?: string;
  }
) {
  const response = await api.get(
    `/public-dashboard/departments/${departmentId}/adherence`,
    { params: filters }
  );
  return Array.isArray(response.data) ? response.data : [];
}

export async function getPublicPepMilestones(
  departmentId: number,
  projectId?: number
): Promise<PepMilestoneDistribution> {
  const response = await api.get<PepMilestoneDistribution>(
    `/public-dashboard/departments/${departmentId}/pep-milestones`,
    { params: { projectId } }
  );
  return response.data;
}

export async function getPublicRealizationStatus(
  departmentId: number,
  year?: number
): Promise<RealizationStatus> {
  const response = await api.get<RealizationStatus>(
    `/public-dashboard/departments/${departmentId}/realization`,
    { params: { year } }
  );
  return response.data;
}