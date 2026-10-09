import api from "./client";
import type { TeamDto, AddTeamDto, Employee, TeamLeaderOption } from "../types/TeamDto";

export async function getTeams(departmentId?: number): Promise<TeamDto[]> {
    const { data } = await api.get<TeamDto[]>("/team", {
        params: departmentId ? { departmentId } : undefined,
    });
    return Array.isArray(data) ? data : [];
}

export async function getAvailableEmployees(departmentId?: number): Promise<Employee[]> {
    const { data } = await api.get<Employee[]>("/team/available-employees", {
        params: departmentId ? { departmentId } : undefined,
    });
    return Array.isArray(data) ? data : [];
}

export async function createTeam(dto: AddTeamDto, departmentId?: number): Promise<TeamDto> {
    const { data } = await api.post<TeamDto>("/team", dto, {
        params: departmentId ? { departmentId } : undefined,
    });
    return data;
}

export async function updateTeam(id: number, dto: Partial<AddTeamDto>, departmentId?: number): Promise<TeamDto> {
    const { data } = await api.put<TeamDto>(`/team/${id}`, dto, {
        params: departmentId ? { departmentId } : undefined,
    });
    return data;
}

export async function deleteTeam(id: number, departmentId?: number): Promise<void> {
    await api.delete(`/team/${id}`, {
        params: departmentId ? { departmentId } : undefined,
    });
}

export async function assignMembers(
    teamId: number,
    employeeIds: number[],
    departmentId?: number
): Promise<void> {
    await api.post(`team/${teamId}/members`, { employeeIds }, {
        params: departmentId ? { departmentId } : undefined,
    });
}

export async function getMyTeam(): Promise<TeamDto | null> {
    const { data } = await api.get("/team/my-team");
    return data;
}

export async function getTeamLeaders(departmentId?: number): Promise<TeamLeaderOption[]> {
    const { data } = await api.get<TeamLeaderOption[]>("/team/team-leaders", {
        params: departmentId ? { departmentId } : undefined,
    });
    return Array.isArray(data) ? data : [];
}
