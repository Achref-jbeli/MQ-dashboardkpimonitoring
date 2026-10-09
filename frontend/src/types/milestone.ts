export interface Milestone {
  id: number;
  projectId: number;
  projectTitle?: string;
  departmentId: number;
  departmentName?: string;
  name: string;
  description?: string;
  plannedDate?: string;
  actualDate?: string;
  status: "Open" | "In Progress" | "Completed" | "Delayed" | string;
  responsible?: string;
  delayDays?: number;
  source?: string;
  sourceIdentifier?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateMilestoneInput {
  projectId: number;
  departmentId: number;
  name: string;
  description?: string;
  plannedDate?: string;
  actualDate?: string;
  status?: string;
  responsible?: string;
}

export interface UpdateMilestoneInput {
  projectId?: number;
  name?: string;
  description?: string;
  plannedDate?: string;
  actualDate?: string;
  status?: string;
  responsible?: string;
}

export interface PepMilestoneItem {
  id: number;
  name: string;
  projectId: number;
  projectTitle: string;
  plannedDate?: string;
  actualDate?: string;
  category: "On time / ≤ 2w" | "Delay 2–4w" | "Delay > 4w" | "Open" | string;
  delayDays?: number;
  status: string;
  responsible?: string;
}

export interface PepMilestoneDistribution {
  onTimeCount: number;
  delay2To4WeeksCount: number;
  delayMoreThan4WeeksCount: number;
  openCount: number;
  totalCount: number;

  onTimePercentage: number;
  delay2To4WeeksPercentage: number;
  delayMoreThan4WeeksPercentage: number;
  openPercentage: number;

  totalProjects: number;
  totalMilestones: number;
  completedMilestones: number;
  openMilestones: number;
  completionRate: number;
  averageDelayDays: number;

  items: PepMilestoneItem[];
}

export interface RealizationPeriod {
  month: string;
  monthNumber: number;
  year: number;
  periodLabel: string;
  realizedValue: number;
  plannedValue: number;
  forecastValue?: number;
  targetValue?: number;
  varianceToTarget: number;
  realizationRate: number;
}

export interface RealizationSummary {
  totalRealized: number;
  totalPlanned: number;
  totalForecast?: number;
  totalTarget?: number;
  overallRealizationRate: number;
  variance: number;
}

export interface RealizationStatus {
  periods: RealizationPeriod[];
  summary: RealizationSummary;
}
