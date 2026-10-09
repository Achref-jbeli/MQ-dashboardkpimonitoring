  import type { ReactNode } from "react";
import type { BUKey } from "./project";

export type ProjectStatus = "On Track" | "Delayed" | "Risk";

export interface Project {
name: string;
status: ProjectStatus;
progress: number;
bu: BUKey;
budget: string;
deadline: string;
health: number;
}

export interface CalendarEvent {
  date: string; // YYYY-MM-DD
title: string;
type: "meeting" | "birthday" | "event" | "milestone" | "holiday";
color: string;
}

export interface KpiTrendPoint {
month: string;
HMI: number;
HIS: number;
}

export interface PieSlice {
name: string;
value: number;
color: string;
}

export interface KPI {
label: string;
value: number;
unit: string;
change: number;
icon: ReactNode;
color: string;
bgLight: string;
pieData: PieSlice[];
}

export type DealStatus = "Signed" | "Negotiation";

export interface Deal {
flag: string;
country: string;
deal: string;
value: string;
numericValue: number;
status: DealStatus;
}

export interface MaturityPoint {
subject: string;
A: number;
fullMark: number;
}

export interface BudgetSlice {
name: string;
value: number;
color: string;
}

export interface BUData {
name: BUKey;
fullName: string;
accent: string;
kpis: KPI[];
sop: { adherence: number; projects: Project[] };
maturity: MaturityPoint[];
deals: Deal[];
budget: BudgetSlice[];
}

export type Page = "home" | "public" | "login" | "admin" | "manager" | "teamleader";
export type LoginTarget = "superadmin" | "admin" | "manager" | "teamleader";
export type PublicDashboardKey = "HMI" | "HIS" | "PERFORMANCE";
