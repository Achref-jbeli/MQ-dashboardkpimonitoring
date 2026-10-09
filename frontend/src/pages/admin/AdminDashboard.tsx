import { useEffect, useState } from "react";
import {
  Bell,
  LayoutDashboard,
  FolderKanban,
  Users,
  BarChart3,
  Star,
  FileBarChart2,
  Settings,
  Globe2,
  TrendingUp,
  ClipboardList,
  Activity,
} from "lucide-react";
import { M } from "../../theme/tokens";
import { ProtectedSidebar } from "../../components/layout/ProtectedSidebar";
import { DashboardHeader } from "../../components/layout/DashboardHeader";
import { OverviewPage } from "./OverviewPage";
import { EmployeesPage } from "./EmployeesPage";
import { ProjectsPage } from "./ProjectsPage";
import { EventsPage } from "./EventsPage";
import { ReportsPage } from "./ReportsPage";
import SettingsPage from "./SettingsPage";
import { KpiManagementPage } from "./KpiManagementPage";
import { CalendarPage } from "./CalendarPage";
import { TeamsPage } from "./TeamsPage";
import { MilestonesPage } from "./MilestonesPage";
import type { Page } from "../../types/dashboard";
import { getDepartments } from "../../api/departmentApi";
import type { Department } from "../../types/department";
import { InternationalBusinessPage } from "./InternationalBusinessPage";
import { RealizationPage } from "./RealizationPage";
import { TaskManagementPage } from "./TaskManagementPage";
import { AdherencePage } from "./AdherencePage";
import { MaturityPage } from "./MaturityPage";
import {
  getActiveDepartmentId,
  isSuperAdminRole,
  setActiveDepartmentId,
  syncOwnDepartmentCache,
} from "../../utils/departmentScope";
import { useSectionHash } from "../../hooks/useSectionHash";
import { CalendarCheck2 } from "lucide-react";

const ADMIN_NAV = [
  { id: "overview", icon: <LayoutDashboard size={19} />, label: "Overview" },
  { id: "international-business", icon: <Globe2 size={19} />, label: "RFQs" },
  { id: "realization", icon: <TrendingUp size={19} />, label: "VAVE" },
  { id: "adherence", icon: <Activity size={19} />, label: "Maturity" },
  { id: "kpi-management", icon: <BarChart3 size={19} />, label: "Adherence" },
  { id: "milestones", icon: <CalendarCheck2 size={19} />, label: "PEP Milestones" },
  { id: "projects", icon: <FolderKanban size={19} />, label: "Projects" },
  { id: "events", icon: <Star size={19} />, label: "Events" },
  { id: "teams", icon: <Users size={19} />, label: "Teams" },
  { id: "_settings-group", label: "Settings", divider: true },
  { id: "employees", icon: <Users size={19} />, label: "Users" },
  { id: "reports", icon: <FileBarChart2 size={19} />, label: "Reports" },
  { id: "settings", icon: <Settings size={19} />, label: "Settings" },
];

export function AdminDashboard({ onNavigate }: { onNavigate: (p: Page) => void }) {
  const [sec, setSec] = useSectionHash({
    defaultSection: "overview",
    validSections: [
      "overview",
      "projects",
      "milestones",
      "realization",
      "tasks",
      "employees",
      "kpi-management",
      "kpis",
      "adherence",
      "calendar",
      "international-business",
      "internationalbusiness",
      "events",
      "teams",
      "reports",
      "settings",
    ],
    aliases: {
      kpis: "kpi-management",
      kpi: "kpi-management",
      internationalbusiness: "international-business",
    },
  });

  const [showCal, setShowCal] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [activeDepartmentId, setActiveDepartmentIdState] = useState<number | null>(
    getActiveDepartmentId()
  );
  const role = localStorage.getItem("role") || "Administrator";
  const isSuperAdmin = isSuperAdminRole(role);

  useEffect(() => {
    if (sec === "calendar") {
      setShowCal(true);
    }
  }, [sec]);

  useEffect(() => {
    const loadDepartments = async () => {
      try {
        const result = await getDepartments();
        setDepartments(result);

        if (result.length === 0) {
          return;
        }

        if (!isSuperAdmin) {
          // Own department may have changed server-side since login — pull the live value.
          const firstDepartment = result[0];
          setActiveDepartmentId(firstDepartment.id);
          setActiveDepartmentIdState(firstDepartment.id);
          syncOwnDepartmentCache(firstDepartment);
          return;
        }

        const current = getActiveDepartmentId();
        const hasCurrent =
          current != null && result.some((department) => department.id === current);
        // Prefer R&D (id=6) as the default department for SuperAdmin
        const rdDept = result.find((d) => d.id === 6 || d.name === "RD" || d.name === "R&D");
        const nextDepartmentId = hasCurrent ? current : (rdDept?.id ?? result[0].id);
        setActiveDepartmentId(nextDepartmentId);
        setActiveDepartmentIdState(nextDepartmentId);
      } catch {
        setDepartments([]);
      }
    };

    void loadDepartments();
  }, [isSuperAdmin]);

  const sectionKey = `${sec}-${activeDepartmentId ?? "none"}`;

  const currentNav = ADMIN_NAV.find(
    (n) => n.id === sec || (sec === "kpis" && n.id === "kpi-management") || (sec === "internationalbusiness" && n.id === "international-business") || (sec === "realization" && n.id === "realization")
  );

  return (
    <div
      style={{
        fontFamily: "Inter, sans-serif",
        background: M.bgTeal,
        minHeight: "100vh",
        paddingLeft: 220,
      }}
    >
      <ProtectedSidebar
        title="Admin Panel"
        role={role}
        nav={ADMIN_NAV}
        active={sec}
        onSelect={(s) => {
          setSec(s);
          if (s === "calendar") setShowCal(true);
        }}
        onNavigate={onNavigate}
      />
      <main style={{ padding: "32px 32px 48px" }}>
        <DashboardHeader
          title={currentNav?.label || "Administrator"}
          subtitle={`Marquardt Enterprise · ${role}`}
          right={
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  position: "relative",
                  width: 36,
                  height: 36,
                  borderRadius: 12,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: M.white,
                  border: `1px solid ${M.border}`,
                  cursor: "pointer",
                }}
              >
                <Bell size={17} style={{ color: M.textSec }} />
                <span
                  style={{
                    position: "absolute",
                    top: -4,
                    right: -4,
                    width: 16,
                    height: 16,
                    borderRadius: "50%",
                    fontSize: 9,
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    background: M.danger,
                  }}
                >
                  3
                </span>
              </div>
            </div>
          }
        />

        {sec === "overview" && <OverviewPage key={sectionKey} />}
        {sec === "employees" && <EmployeesPage key={sectionKey} />}
        {sec === "projects" && <ProjectsPage key={sectionKey} />}
        {sec === "milestones" && <MilestonesPage key={sectionKey} departmentId={activeDepartmentId} />}
        {sec === "realization" && <RealizationPage key={sectionKey} departmentId={activeDepartmentId} />}
        {sec === "tasks" && <TaskManagementPage key={sectionKey} departmentId={activeDepartmentId} />}
        {(sec === "international-business" || sec === "internationalbusiness") && (
          <InternationalBusinessPage key={sectionKey} />
        )}
        {(sec === "kpi-management" || sec === "kpis") && (
          <KpiManagementPage key={sectionKey} />
        )}
        {sec === "adherence" && <MaturityPage key={sectionKey} />}
        {sec === "events" && <EventsPage key={sectionKey} departmentId={activeDepartmentId} />}
        {sec === "reports" && <ReportsPage key={sectionKey} />}
        {sec === "teams" && <TeamsPage key={sectionKey} />}
        {sec === "settings" && <SettingsPage key={sectionKey} />}
      </main>
      {showCal && (
        <CalendarPage
          onClose={() => {
            setShowCal(false);
            if (sec === "calendar") {
              setSec("overview");
            }
          }}
        />
      )}
    </div>
  );
}
