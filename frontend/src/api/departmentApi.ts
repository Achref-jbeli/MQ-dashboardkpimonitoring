import api from "./client";
import type { Department } from "../types/department";

export const getDepartments = async () => {
    return (await api.get<Department[]>("/Department")).data;
};

export const getPublicDepartments = async () => {
    return (await api.get<Department[]>("/Department/public-list")).data;
};

export const createDepartment = async (department: Omit<Department,"id">) => {
    return (await api.post("/Department", department)).data;
};

export const updateDepartment = async (
    id:number,
    department:Partial<Department>
) => {
    return (await api.put(`/Department/${id}`,department)).data;
};