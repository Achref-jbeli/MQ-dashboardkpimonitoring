import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  FolderKanban,
  BarChart3,
  Users,
  Calendar,
  Download,
  Settings,
  Wifi,
  CalendarCheck2,
  Globe2,
} from "lucide-react";

import { M } from "../../theme/tokens";
import { ProtectedSidebar } from "../../components/layout/ProtectedSidebar";
import { BirthdayOverlay } from "../../components/common/BirthdayOverlay";
import { ThemeSelector } from "../../components/common/ThemeSelector";

import { OverviewPage } from "./OverviewPage";
import { ProjectsPage } from "./ProjectsPage";
import { KpisPage } from "./KpisPage";
import { TeamPage } from "./TeamPage";
import { ReportsPage } from "./ReportsPage";
import { CalendarPage } from "./CalendarPage";
import SettingsPage from "../admin/SettingsPage";
import { MilestonesPage } from "../admin/MilestonesPage";
import { InternationalBusinessPage } from "../admin/InternationalBusinessPage";

import type { Page } from "../../types/dashboard";
import type { Employee } from "../../types/employee";
import type { TeamDto } from "../../types/TeamDto";

import { getMyTeam } from "../../api/TeamApi";
import { getDepartments } from "../../api/departmentApi";
import { useSectionHash } from "../../hooks/useSectionHash";
import { getActiveDepartmentId, syncOwnDepartmentCache } from "../../utils/departmentScope";
import { getAuthenticatedSafeUser } from "../../utils/safeUser";

const TL_NAV = [
  {
    id: "overview",
    icon: <LayoutDashboard size={19} />,
    label: "My Dashboard",
  },
  {
    id: "projects",
    icon: <FolderKanban size={19} />,
    label: "My Projects",
  },
  {
    id: "milestones",
    icon: <CalendarCheck2 size={19} />,
    label: "Milestones",
  },
  {
    id: "international-business",
    icon: <Globe2 size={19} />,
    label: "International Business",
  },
  {
    id: "kpis",
    icon: <BarChart3 size={19} />,
    label: "Project KPIs",
  },
  {
    id: "team",
    icon: <Users size={19} />,
    label: "My Team",
  },
  {
    id: "calendar",
    icon: <Calendar size={19} />,
    label: "Team Calendar",
  },
  {
    id: "reports",
    icon: <Download size={19} />,
    label: "Export Reports",
  },
  {
    id: "settings",
    icon: <Settings size={19} />,
    label: "Settings",
  },
];

export function TeamLeaderDashboard({
  onNavigate,
}: {
  onNavigate: (p: Page) => void;
}) {
  const [sec, setSec] = useSectionHash({
    defaultSection: "overview",
    validSections: [
      "overview",
      "projects",
      "milestones",
      "international-business",
      "kpis",
      "team",
      "calendar",
      "reports",
      "settings",
    ],
  });

  const [showCal, setShowCal] = useState(false);
  const [birthdayEmp, setBirthdayEmp] = useState<Employee | null>(null);

  const [team, setTeam] = useState<TeamDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (sec === "calendar") {
      setShowCal(true);
    }
  }, [sec]);

  useEffect(() => {
    async function loadTeam() {
      try {
        const data = await getMyTeam();
        setTeam(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    loadTeam();
  }, []);

  useEffect(() => {
    // Own department may have changed server-side since login — pull the live value.
    getDepartments()
      .then((departments) => syncOwnDepartmentCache(departments[0]))
      .catch(() => undefined);
  }, []);

  const teamLeader =
    team?.employees.find((e) => e.id === team.teamLeaderId) ?? null;

  const onlineMembers = team?.employees.filter((e) => e.isActive).length ?? 0;
  const totalMembers = team?.employees.length ?? 0;

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          fontSize: 18,
          color: M.textPrimary,
        }}
      >
        Loading team...
      </div>
    );
  }

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
        title="Team Leader"
        role="TeamLeader"
        nav={TL_NAV}
        active={sec}
        onSelect={(s) => {
          setSec(s);
          if (s === "calendar") {
            setShowCal(true);
          }
        }}
        onNavigate={onNavigate}
        userEmp={teamLeader}
      />

      <main
        style={{
          padding: "32px 32px 48px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 30,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
            }}
          >
            <div
              style={{
                width: 2,
                height: 32,
                background: M.border,
              }}
            />

            <div>
              <h1
                style={{
                  margin: 0,
                  fontSize: 22,
                  fontWeight: 800,
                  color: M.textPrimary,
                }}
              >
                {TL_NAV.find((n) => n.id === sec)?.label}
              </h1>

              <p
                style={{
                  margin: "4px 0 0",
                  fontSize: 12,
                  color: M.textSec,
                }}
              >
                {team?.departmentName} • TeamLeader • {team?.name}
              </p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <ThemeSelector compact />
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 18px",
                borderRadius: 16,
                background: M.white,
                border: `1px solid ${M.border}`,
              }}
            >
              <Wifi size={15} color={M.success} />

              <span
                style={{
                  fontSize: 12,
                  color: M.textSec,
                  fontWeight: 600,
                }}
              >
                {onlineMembers}/{totalMembers} Online
              </span>
            </div>
          </div>
        </div>

        {sec === "overview" && <OverviewPage />}
        {sec === "projects" && <ProjectsPage />}
        {sec === "milestones" && <MilestonesPage departmentId={getActiveDepartmentId() ?? getAuthenticatedSafeUser().departmentId} />}
        {sec === "international-business" && <InternationalBusinessPage />}
        {sec === "kpis" && <KpisPage />}
        {sec === "team" && (
          <TeamPage
            employees={team?.employees ?? []}
            onShowBirthday={setBirthdayEmp}
          />
        )}
        {sec === "reports" && <ReportsPage />}
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

      {birthdayEmp && (
        <BirthdayOverlay emp={birthdayEmp} onClose={() => setBirthdayEmp(null)} />
      )}
    </div>
  );
}