import api from "./client";

export interface TeamTask {
  id: number;
  title: string;
  description?: string;
  status: string;
  progress: number;
  performanceScore: number;
  departmentId: number;
  teamId?: number;
  projectId?: number;
  assigneeId?: number;
  assigneeName?: string;
  teamLeaderId?: number;
  responsibleName?: string;
  responsibleDepartment?: string;
  businessUnit?: string;
  workItem?: string;
  function?: string;
  note?: string;
  createdOn?: string;
  sendDate?: string;
  dueDate?: string;
  completedAt?: string;
}

export interface AddTeamTaskInput {
  title: string;
  description?: string;
  assigneeId: number;
  projectId?: number;
  businessUnit?: string;
  workItem?: string;
  function?: string;
  note?: string;
  dueDate?: string;
}

export interface UpdateTeamTaskInput {
  title?: string;
  description?: string;
  status?: string;
  progress?: number;
  assigneeId?: number;
  projectId?: number;
  note?: string;
  dueDate?: string;
}

export async function getMyTeamTasks(filters?: { year?: number; month?: number }) {
  const response = await api.get<TeamTask[]>("/tasks/my-team", { params: filters });
  return response.data;
}

export async function getDepartmentTasks(
  filters?: {
    departmentId?: number;
    year?: number;
    month?: number;
  }
) {
  const response = await api.get<TeamTask[]>(
    "/tasks/department",
    { params: filters }
  );

  console.log("Department task filters:", filters);
  console.log("Tasks returned from backend:", response.data);
  console.log("NUMBER OF TASKS:", response.data.length);

  return response.data;
}

export async function createTeamTask(payload: AddTeamTaskInput) {
  const response = await api.post<TeamTask>("/tasks", payload);
  return response.data;
}

export async function updateTeamTask(id: number, payload: UpdateTeamTaskInput) {
  const response = await api.put<TeamTask>(`/tasks/${id}`, payload);
  return response.data;
}

export async function deleteTeamTask(id: number) {
  await api.delete(`/tasks/${id}`);
}