import api from "./client";
import type { Milestone, CreateMilestoneInput, UpdateMilestoneInput } from "../types/milestone";

export async function getMilestones(departmentId?: number, projectId?: number): Promise<Milestone[]> {
  const response = await api.get<Milestone[]>("/milestone", {
    params: { departmentId, projectId }
  });
  return response.data;
}

export async function getMilestone(id: number): Promise<Milestone> {
  const response = await api.get<Milestone>(`/milestone/${id}`);
  return response.data;
}

export async function createMilestone(data: CreateMilestoneInput): Promise<Milestone> {
  const response = await api.post<Milestone>("/milestone", data);
  return response.data;
}

export async function updateMilestone(id: number, data: UpdateMilestoneInput): Promise<Milestone> {
  const response = await api.put<Milestone>(`/milestone/${id}`, data);
  return response.data;
}

export async function deleteMilestone(id: number): Promise<void> {
  await api.delete(`/milestone/${id}`);
}
