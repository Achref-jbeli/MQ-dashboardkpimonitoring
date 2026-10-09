export interface Employee {
    id: number;
    firstName: string;
    lastName: string;
    email?: string;
    professionalDomain?: string;
    position?: string;
    role?: string;
    isActive?: boolean;
    teamId?: number;
    photo?: string;
}

export type TeamLeaderOption = {
    id: number;
    firstName: string;
    lastName: string;
    professionalDomain?: string;
    position?: string;
    isAssigned: boolean;
    assignedTeamId: number | null;
    assignedTeamName: string | null;
};

export interface TeamDto {
    id: number;
    name: string;
    description?: string;

    departmentId: number;
    departmentName: string;

    teamLeaderId: number;
    teamLeaderName: string;

    employees: Employee[];
}

export interface AddTeamDto {
    name: string;
    description?: string;
    departmentId: number;
    teamLeaderId: number;
}