import type { Employee } from "../types/employee";
import api from "./client";

export const getEmployees = async (departmentId?: number): Promise<Employee[]> => {
  const response = await api.get<Employee[]>("/Employee", {
    params: departmentId ? { departmentId } : undefined,
  });
  return Array.isArray(response.data) ? response.data : [];
};

export async function getEmployeeById(id: number, departmentId?: number): Promise<Employee | undefined> {
  const response = await api.get<Employee>(`/Employee/${id}`, {
    params: departmentId ? { departmentId } : undefined,
  });
  return response.data;
}

export async function getTodaysBirthdays(todayMMDD: string): Promise<Employee[]> {
  return api.get(`/Employee/birthdays/${todayMMDD}`).then((res) => res.data);
}

export const createEmployee = async (employee: Partial<Employee>, departmentId?: number): Promise<Employee> => {
  const response = await api.post<Employee>("/Employee", employee, {
    params: departmentId ? { departmentId } : undefined,
  });
  return response.data;
};

export const updateEmployee = async (id: number, employee: Partial<Employee>, departmentId?: number): Promise<Employee> => {
  const response = await api.put<Employee>(`/Employee/${id}`, employee, {
    params: departmentId ? { departmentId } : undefined,
  });
  return response.data;
};

export const deleteEmployee = async (id: number, departmentId?: number): Promise<void> => {
  await api.delete(`/Employee/${id}`, {
    params: departmentId ? { departmentId } : undefined,
  });
};

export async function uploadEmployeePhoto(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post<{ url: string }>("/Employee/upload-photo", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data.url;
}