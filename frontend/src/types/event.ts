export interface Event {
  id: number;
  title: string;
  description?: string;
  date?: string;
  location?: string;
  type?: string;
  imageUrl?: string;
  departmentId?: number;
  employeeId?: number;
}
