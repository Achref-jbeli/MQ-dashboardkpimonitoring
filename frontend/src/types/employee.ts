export interface Employee {
    id: number;
    firstName: string;
    lastName: string;
    email?: string;
    professionalDomain?: string;
    seniority?: string;
    department?: string;
    departmentId?: number;
    departmentName?: string;
    role?: string;
    birthDate?: string;
    isActive: boolean;
    position?: string;
    hireDate?: string;
    teamId?: number;
    teamName?: string;
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