export type BUKey = string;

export interface BusinessUnit {
  id: number;
  name: BUKey;
}

export interface Project {
  id: number;
  apiKey?: string;
  title?: string;

  businessUnitId?: number;
  businessUnit?: BusinessUnit;

  status?: string;
  startDate?: string;
  endDate?: string;
  departmentId?: number;

  teamLeaderId?: number | null;
  teamLeaderName?: string | null;
}