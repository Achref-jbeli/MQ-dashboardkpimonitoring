import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  BarChart3,
  Calendar,
  FileBarChart2,
  Shield,
  CalendarCheck2,
  Globe2,
  Settings,
} from "lucide-react";
import { M } from "../../theme/tokens";
import { ProtectedSidebar } from "../../components/layout/ProtectedSidebar";
import { DashboardHeader } from "../../components/layout/DashboardHeader";
import { OverviewPage } from "./OverviewPage";
import { ProjectsPage } from "./ProjectsPage";
import { TeamPage } from "./TeamPage";
import { KpisPage } from "./KpisPage";
import { ReportsPage } from "./ReportsPage";
import { AdminManagementPage } from "./AdminManagementPage";
import { CalendarPage } from "./CalendarPage";
import { MilestonesPage } from "../admin/MilestonesPage";
import { InternationalBusinessPage } from "../admin/InternationalBusinessPage";
import SettingsPage from "../admin/SettingsPage";
import type { Page } from "../../types/dashboard";
import { useSectionHash } from "../../hooks/useSectionHash";
import { getDepartments } from "../../api/departmentApi";
import { getActiveDepartmentId, syncOwnDepartmentCache } from "../../utils/departmentScope";
import { getAuthenticatedSafeUser } from "../../utils/safeUser";

const MGR_NAV = [
  { id: "overview", icon: <LayoutDashboard size={19} />, label: "Overview" },
  { id: "projects", icon: <FolderKanban size={19} />, label: "All Projects" },
  { id: "milestones", icon: <CalendarCheck2 size={19} />, label: "Milestones" },
  { id: "international-business", icon: <Globe2 size={19} />, label: "International Business" },
  { id: "team", icon: <Users size={19} />, label: "All Teams" },
  { id: "kpis", icon: <BarChart3 size={19} />, label: "KPI Overview" },
  { id: "calendar", icon: <Calendar size={19} />, label: "Calendar" },
  { id: "reports", icon: <FileBarChart2 size={19} />, label: "Reports" },
  { id: "admins", icon: <Shield size={19} />, label: "Admin Mgmt" },
  { id: "settings", icon: <Settings size={19} />, label: "Settings" },
];

export function ManagerDashboard({ onNavigate }: { onNavigate: (p: Page) => void }) {
  const [sec, setSec] = useSectionHash({
    defaultSection: "overview",
    validSections: [
      "overview",
      "projects",
      "milestones",
      "international-business",
      "team",
      "kpis",
      "calendar",
      "reports",
      "admins",
      "settings",
    ],
  });

  const [showCal, setShowCal] = useState(false);
  const [department, setDepartment] = useState(localStorage.getItem("department") || "Department");

  useEffect(() => {
    // Own department may have changed server-side since login — pull the live value.
    getDepartments()
      .then((departments) => {
        const own = departments[0];
        if (own) {
          syncOwnDepartmentCache(own);
          setDepartment(own.name);
        }
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (sec === "calendar") {
      setShowCal(true);
    }
  }, [sec]);

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
        title="Manager Portal"
        role="Manager"
        nav={MGR_NAV}
        active={sec}
        onSelect={(s) => {
          setSec(s);
          if (s === "calendar") setShowCal(true);
        }}
        onNavigate={onNavigate}
      />
      <main style={{ padding: "32px 32px 48px" }}>
        <DashboardHeader
          title={MGR_NAV.find((n) => n.id === sec)?.label || "Manager"}
          subtitle={`${department} · Manager`}
        />

        {sec === "overview" && <OverviewPage />}
        {sec === "projects" && <ProjectsPage />}
        {sec === "milestones" && <MilestonesPage departmentId={getActiveDepartmentId() ?? getAuthenticatedSafeUser().departmentId} />}
        {sec === "international-business" && <InternationalBusinessPage />}
        {sec === "team" && <TeamPage />}
        {sec === "kpis" && <KpisPage />}
        {sec === "reports" && <ReportsPage />}
        {sec === "admins" && <AdminManagementPage />}
        {sec === "settings" && <SettingsPage />}
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
