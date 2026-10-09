export interface InternationalBusiness {
  id: number;
  name: string;
  description?: string;
  country?: string;
  partnerName?: string;
  departmentId?: number;
  photos?: string[];
  isPublicActive?: boolean;
  isNewBusiness?: boolean;
  projectInfo?: string;
  volumeLifetime?: string;
  salesLifetime?: string;
  sop?: string;
  productionLocation?: string;
  createdAtUtc?: string;
  updatedAtUtc?: string;
}