import api from "./client";

export interface KpiItem {
  id: number;
  designation: string;
  calculatedValue?: number | null;
  adherenceToSchedule?: number | null;
  green: boolean;
  yellow: boolean;
  orange: boolean;
  red: boolean;
  projectId?: number | null;
  projectTitle?: string | null;
  businessUnit?: string | null;
  sourceType?: string;
  sourceIdentifier?: string | null;
  workItem?: string | null;
  month?: string | null;
  formula?: string | null;
  calculatedAtUtc?: string;
}

export interface KpiImportResult {
  projectId?: number | null;
  departmentId: number;
  performanceUnit?: string | null;
  importedCount: number;
  updatedCount: number;
  importedAtUtc: string;
  calculatedMetrics: Record<string, number>;
}

export interface MonthlyAdherenceDto {
  month: string;
  greenCount: number;
  yellowCount: number;
  orangeCount: number;
  redCount: number;
  totalCount: number;
  adherenceCount: number;
  greenPercentage: number;
  yellowPercentage: number;
  orangePercentage: number;
  redPercentage: number;
  adherencePercentage: number;
  // aliases for compatibility
  green?: number;
  yellow?: number;
  orange?: number;
  red?: number;
  total?: number;
}

export async function getDepartmentKpis(
  projectId?: number,
  businessUnit?: string
): Promise<KpiItem[]> {
  const params: Record<string, any> = {};
  if (projectId) params.projectId = projectId;
  if (businessUnit) params.businessUnit = businessUnit;

  const response = await api.get<KpiItem[]>("/Import/kpis", { params });
  return response.data;
}

export async function getAdherenceToSchedule(filters?: {
  departmentId?: number;
  projectId?: number;
  businessUnit?: string;
  year?: number;
  responsibleDepartments?: string;
}): Promise<MonthlyAdherenceDto[]> {
  const response = await api.get<MonthlyAdherenceDto[]>("/kpi/adherence-to-schedule", {
    params: filters,
  });
  return response.data;
}

export async function getPublicAdherenceToSchedule(
  departmentId: number,
  filters?: {
    projectId?: number;
    businessUnit?: string;
    year?: number;
    responsibleDepartments?: string;
  }
): Promise<MonthlyAdherenceDto[]> {
  const response = await api.get<MonthlyAdherenceDto[]>(
    `/public-dashboard/departments/${departmentId}/adherence-to-schedule`,
    { params: filters }
  );
  return response.data;
}

export async function uploadKpiFile(formData: FormData, departmentId?: number): Promise<KpiImportResult> {
  const params: Record<string, any> = {};
  if (departmentId) {
    params.departmentId = departmentId;
  }
  const response = await api.post<KpiImportResult>("/Import/kpis/file", formData, {
    params,
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
}

export async function uploadJiraKpis(payload: {
  projectId: number;
  extractionApiId: number;
  jiraJql?: string;
  departmentId?: number;
}): Promise<KpiImportResult> {
  const params: Record<string, any> = {};
  if (payload.departmentId) {
    params.departmentId = payload.departmentId;
  }
  const response = await api.post<KpiImportResult>("/Import/kpis/jira", payload, { params });
  return response.data;
}

export async function getProjectApis(projectId: number): Promise<any[]> {
  const response = await api.get<any[]>(`/Import/apis/project/${projectId}`);
  return response.data;
}

// Full KPI record — mirrors every column of the Kpi database table.
export interface KpiRecord {
  id: number;
  projectId?: number | null;
  projectTitle?: string | null;
  departmentId?: number | null;
  departmentName?: string | null;
  sourceType: string;
  sourceIdentifier?: string | null;
  calculatedValue?: number | null;
  calculatedAtUtc: string;
  formula?: string | null;
  sheetNumber?: string | null;
  designation?: string | null;
  modificationReason?: string | null;
  businessUnit?: string | null;
  mecType?: string | null;
  descriptionInZloAev?: string | null;
  division?: string | null;
  otpElement?: string | null;
  responsible?: string | null;
  responsibleDepartment?: string | null;
  createdBy?: string | null;
  createdOn?: string | null;
  workItem?: string | null;
  tasks?: string | null;
  user?: string | null;
  function?: string | null;
  sendDate?: string | null;
  endDate?: string | null;
  done?: boolean | null;
  doneDate?: string | null;
  initialDate?: string | null;
  note?: string | null;
  days?: number | null;
  sendEndDate?: number | null;
  notReceivedInTime?: boolean | null;
  backlog?: boolean | null;
  delay?: number | null;
  leadTime?: number | null;
  month?: string | null;
  initialDateUpdated?: string | null;
  adherenceToSchedule?: number | null;
  green: boolean;
  yellow: boolean;
  orange: boolean;
  red: boolean;
}

export type KpiRecordInput = Omit<
  KpiRecord,
  "id" | "projectTitle" | "departmentId" | "departmentName" | "calculatedAtUtc"
>;

export async function getKpiRecords(filters?: {
  departmentId?: number;
  projectId?: number;
  businessUnit?: string;
}): Promise<KpiRecord[]> {
  const response = await api.get<KpiRecord[]>("/Kpi/records", { params: filters });
  return response.data;
}

export async function createKpiRecord(payload: Partial<KpiRecordInput>): Promise<KpiRecord> {
  const response = await api.post<KpiRecord>("/Kpi/records", payload);
  return response.data;
}

export async function updateKpiRecord(id: number, payload: Partial<KpiRecordInput>): Promise<KpiRecord> {
  const response = await api.put<KpiRecord>(`/Kpi/records/${id}`, payload);
  return response.data;
}

export async function deleteKpiRecord(id: number): Promise<void> {
  await api.delete(`/Kpi/records/${id}`);
}
