import api from "./client";
import type { InternationalBusiness } from "../types/internationalBusiness";
import { Project } from "../types/project";

export interface CreateInternationalBusinessRequest {
  name: string;
  description?: string;
  country?: string;
  partnerName?: string;
  photos?: Array<string>;
  isPublicActive?: boolean;
  isNewBusiness?: boolean;
  projectInfo?: string;
  volumeLifetime?: string;
  salesLifetime?: string;
  sop?: string;
  productionLocation?: string;
}

export interface UpdateInternationalBusinessRequest {
  name?: string;
  description?: string;
  country?: string;
  partnerName?: string;
  photos?: Array<string>;
  isPublicActive?: boolean;
  isNewBusiness?: boolean;
  projectInfo?: string;
  volumeLifetime?: string;
  salesLifetime?: string;
  sop?: string;
  productionLocation?: string;
}



export const getInternationalBusinesses = async (
  departmentId?: number
): Promise<InternationalBusiness[]> => {
  return (
    await api.get<InternationalBusiness[]>("/InternationalBusiness", {
      params: { departmentId },
    })
  ).data;
};

export const createInternationalBusiness = async (
  internationalBusiness: CreateInternationalBusinessRequest,
  departmentId?: number
): Promise<InternationalBusiness> => {
  return (
    await api.post<InternationalBusiness>(
      "/InternationalBusiness",
      internationalBusiness,
      { params: { departmentId } }
    )
  ).data;
};

export const updateInternationalBusiness = async (
  id: number,
  internationalBusiness: UpdateInternationalBusinessRequest,
  departmentId?: number
): Promise<InternationalBusiness> => {
  return (
    await api.put<InternationalBusiness>(
      `/InternationalBusiness/${id}`,
      internationalBusiness,
      { params: { departmentId } }
    )
  ).data;
};

export const deleteInternationalBusiness = async (
  id: number,
  departmentId?: number
): Promise<void> => {
  await api.delete(`/InternationalBusiness/${id}`, {
    params: { departmentId },
  });
};

export const uploadPhoto = async (
  category: string,
  file: File
): Promise<string> => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post<{ url: string }>(
    `/Photo/upload/${category}`,
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    }
  );

  return response.data.url;
};

export const deletePhoto = async (url: string): Promise<void> => {
  await api.delete("/Photo/delete", { params: { url } });
};



