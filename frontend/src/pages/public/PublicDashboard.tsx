import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Home, ArrowLeft } from "lucide-react";

import { M } from "../../theme/tokens";
import { MarquardtLogo } from "../../components/common/Logo";
import { ThemeSelector } from "../../components/common/ThemeSelector";
import { Card } from "../../components/common/Card";
import { PresentationLoop } from "../../components/presentation/PresentationLoop";

import {
  getPublicDepartments,
  getPublicDepartmentDashboard,
  getPublicBusinessUnitsDashboard,
  getPublicInternationalBusinesses,
  type PublicDepartment,
  type PublicDepartmentDashboard,
  type PublicInternationalBusiness
} from "../../api/publicDashboardApi";

import type { Page } from "../../types/dashboard";

export function PublicDashboard({ onNavigate }: { onNavigate: (p: Page) => void }) {
  const { departmentId } = useParams<{ departmentId?: string }>();
  const navigate = useNavigate();

  const [departments, setDepartments] = useState<PublicDepartment[]>([]);
  const [dashboardData, setDashboardData] = useState<PublicDepartmentDashboard | null>(null);
  const [buDashboards, setBuDashboards] = useState<any[]>([]);
  const [newBusiness, setNewBusiness] = useState<PublicInternationalBusiness[]>([]);

  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [loadingDashboard, setLoadingDashboard] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedDepartmentId = departmentId ? parseInt(departmentId, 10) : null;

  // ============================================================
  // LOAD DEPARTMENTS (When browsing /public department selection)
  // ============================================================
  useEffect(() => {
    if (selectedDepartmentId) return;

    const loadDepartments = async () => {
      setLoadingDepartments(true);
      setError(null);

      try {
        const list = await getPublicDepartments();
        setDepartments(list);
      } catch (err) {
        console.error("Department Load Error:", err);
        setError("Failed to load departments.");
      } finally {
        setLoadingDepartments(false);
      }
    };

    loadDepartments();
  }, [selectedDepartmentId]);

  // ============================================================
  // LOAD DEPARTMENT DASHBOARD (When departmentId in URL changes)
  // ============================================================
  useEffect(() => {
    if (!departmentId) {
      setDashboardData(null);
      setBuDashboards([]);
      setNewBusiness([]);
      setError(null);
      return;
    }

    const deptId = parseInt(departmentId, 10);
    if (isNaN(deptId)) {
      setError("Invalid department ID.");
      setDashboardData(null);
      return;
    }

    const loadDashboard = async () => {
      setLoadingDashboard(true);
      setError(null);

      try {
        const [data, buData, nbData] = await Promise.all([
          getPublicDepartmentDashboard(deptId),
          getPublicBusinessUnitsDashboard(deptId),
          getPublicInternationalBusinesses(deptId),
        ]);

        setDashboardData(data);
        setBuDashboards(buData);
        setNewBusiness(nbData);
      } catch (err) {
        console.error("Dashboard Load Error:", err);
        setError("Failed to load department dashboard data.");
      } finally {
        setLoadingDashboard(false);
      }
    };

    loadDashboard();
  }, [departmentId]);

  // Select department -> Update URL to /public/:id
  const handleSelectDepartment = (deptId: number) => {
    navigate(`/public/${deptId}`);
  };

  // Exit presentation -> Update URL back to /public
  const handleExitPresentation = () => {
    navigate("/public");
  };

  // ============================================================
  // PRESENTATION VIEW (when valid department is loaded)
  // ============================================================
  if (selectedDepartmentId && !loadingDashboard && dashboardData) {
    return (
      <PresentationLoop 
         dashboardData={dashboardData}
         buDashboards={buDashboards}
         newBusiness={newBusiness}
         onExit={handleExitPresentation}
      />
    );
  }

  // ============================================================
  // LOADING PRESENTATION VIEW
  // ============================================================
  if (selectedDepartmentId && loadingDashboard) {
    return (
      <div style={{
        fontFamily: "Inter, sans-serif",
        background: M.bgTeal,
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "36px 28px",
        gap: 16
      }}>
        <MarquardtLogo height={60} clickable={false} />
        <p style={{ color: M.textSec, fontSize: 16, fontWeight: 600 }}>Loading presentation data...</p>
      </div>
    );
  }

  // ============================================================
  // ERROR VIEW (when specific department failed to load)
  // ============================================================
  if (selectedDepartmentId && error) {
    return (
      <div style={{
        fontFamily: "Inter, sans-serif",
        background: M.bgTeal,
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "36px 28px",
        gap: 20
      }}>
        <MarquardtLogo height={60} clickable={false} />
        <Card style={{ padding: 32, maxWidth: 460, textAlign: "center" }}>
          <h2 style={{ margin: "0 0 12px", fontSize: 20, color: M.danger }}>Dashboard Unavailable</h2>
          <p style={{ margin: "0 0 24px", color: M.textSec, fontSize: 14 }}>{error}</p>
          <button
            onClick={handleExitPresentation}
            style={{
              padding: "10px 20px",
              borderRadius: 12,
              border: "none",
              background: `linear-gradient(135deg, ${M.teal}, ${M.tealDeep})`,
              color: "#fff",
              fontWeight: 700,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 8
            }}
          >
            <ArrowLeft size={16} /> Back to Department Selection
          </button>
        </Card>
      </div>
    );
  }

  // ============================================================
  // DEPARTMENT SELECTION SCREEN (/public)
  // ============================================================
  return (
    <div style={{ fontFamily: "Inter, sans-serif", background: M.bgTeal, minHeight: "100vh", padding: "36px 28px" }}>
      <div style={{ maxWidth: 980, margin: "0 auto" }}>
        
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 36, flexWrap: "wrap", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <MarquardtLogo height="clamp(52px, 6vw, 72px)" />
            <div>
              <h1 style={{ fontSize: "clamp(24px, 3.5vw, 32px)", fontWeight: 800, color: M.textPrimary, margin: 0, letterSpacing: "-0.02em" }}>
                Select Department
              </h1>
              <p style={{ fontSize: 14, color: M.textSec, margin: "4px 0 0" }}>
                Choose a department to start the live KPI presentation dashboard.
              </p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <ThemeSelector compact />
            <button
              onClick={() => onNavigate("home")}
              title="Return to Home"
              style={{ width: 42, height: 42, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--card, #FFFFFF)", border: "1px solid var(--border, #E0EEEE)", cursor: "pointer", transition: "all 0.2s" }}
            >
              <Home size={18} style={{ color: "var(--muted-foreground, #6B7C87)" }} />
            </button>
          </div>
        </div>

        {loadingDepartments && <p style={{ color: M.textSec }}>Loading departments...</p>}
        {error && <p style={{ color: M.danger }}>{error}</p>}
        
        {!loadingDepartments && departments.length === 0 && !error && (
          <p style={{ color: M.textSec }}>No departments found.</p>
        )}

        {/* Department Cards — only RD shown */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 16 }}>
          {departments.filter(d => d.name === "RD" || d.id === 6).map((department) => (
            <Card key={department.id} style={{ padding: 24 }}>
              <h2 style={{ margin: "0 0 12px", fontSize: 20, color: M.textPrimary }}>{department.name}</h2>
              <p style={{ margin: "0 0 18px", color: M.textSec, fontSize: 13 }}>
                Launch KPI presentation dashboard.
              </p>
              <button
                onClick={() => handleSelectDepartment(department.id)}
                style={{ width: "100%", padding: "10px 14px", borderRadius: 12, border: "none", background: `linear-gradient(135deg, ${M.teal}, ${M.tealDeep})`, color: "#fff", fontWeight: 700, cursor: "pointer" }}
              >
                Start Presentation
              </button>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
