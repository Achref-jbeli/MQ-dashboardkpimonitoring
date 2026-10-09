import api from "./client";
import type { Project } from "../types/project";

export interface CreateProjectRequest {
  title: string;
  businessUnitId?: number;
  status: string;
  apiKey?: string;
  startDate?: string;
  endDate?: string;
  departmentId?: number;
}

export interface UpdateProjectRequest {
  title?: string;
  businessUnitId?: number;
  status?: string;
  apiKey?: string;
  startDate?: string;
  endDate?: string;
  departmentId?: number;
}

export const getProjects = async (params?: { departmentId?: number }): Promise<Project[]> => {
  return (await api.get<Project[]>("/Project", { params })).data;
};

export const getProjectById = async (id: number): Promise<Project> => {
  return (await api.get<Project>(`/Project/${id}`)).data;
};

export const createProject = async (
  project: CreateProjectRequest
): Promise<Project> => {
  return (await api.post<Project>("/Project", project)).data;
};

export const updateProject = async (
  id: number,
  project: UpdateProjectRequest
): Promise<Project> => {
  return (await api.put<Project>(`/Project/${id}`, project)).data;
};

export const deleteProject = async (id: number): Promise<void> => {
  await api.delete(`/Project/${id}`);
};

export const getBusinessUnits = async (): Promise<
  { id: number; name: string }[]
> => {
  return (
    await api.get<{ id: number; name: string }[]>("/BusinessUnit")
  ).data;
};