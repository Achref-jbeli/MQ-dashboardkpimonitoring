export interface Team {
    id: number;
    name: string;
    department: string;
    leadId: number;
    memberIds: number[];
}