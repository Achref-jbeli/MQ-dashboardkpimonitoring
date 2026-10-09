import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { HomePage } from "../pages/HomePage";
import { LoginPage } from "../pages/LoginPage";
import { PublicDashboard } from "../pages/public/PublicDashboard";
import { AdminDashboard } from "../pages/admin/AdminDashboard";
import { ManagerDashboard } from "../pages/manager/ManagerDashboard";
import { TeamLeaderDashboard } from "../pages/teamleader/TeamLeaderDashboard";
import type { Page } from "../types/dashboard";
import ProtectedRoute from "../components/routes/ProtectedRoute";
import SettingsLayout from "../components/layout/SettingsLayout";
import ProfileSettings from "../components/settings/ProfileSettings";
import SecuritySettings from "../components/settings/SecuritySettings";
import SettingsPage from "../pages/admin/SettingsPage";



export default function App() {
  const routerNavigate = useNavigate();

  // Keep the same API your pages already expect: onNavigate(Page)
  const navigate = (p: Page) => {
    const routes: Record<Page, string> = {
      home: "/",
      public: "/public",
      login: "/login",
      admin: "/admin",
      manager: "/manager",
      teamleader: "/teamleader",
    };

    routerNavigate(routes[p]);
  };

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; padding: 0; }
        input, button { font-family: inherit; }
        table { border-collapse: collapse; }
      `}</style>

      <Routes>
        <Route path="/" element={<HomePage onNavigate={navigate} />} />
        <Route path="/public" element={<PublicDashboard onNavigate={navigate} />} />
        <Route path="/public/:departmentId" element={<PublicDashboard onNavigate={navigate} />} />
        <Route path="/login" element={<LoginPage onNavigate={navigate} />} />
        
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={["Administrator", "SuperAdmin"]}>
            <AdminDashboard onNavigate={navigate} />
          </ProtectedRoute>
        }
      />


    <Route
      path="/manager"
      element={
        <ProtectedRoute allowedRoles={["Manager"]}>
          <ManagerDashboard onNavigate={navigate} />
        </ProtectedRoute>
      }
    />


    <Route
      path="/teamleader"
      element={
        <ProtectedRoute allowedRoles={["TeamLeader"]}>
          <TeamLeaderDashboard onNavigate={navigate} />
        </ProtectedRoute>
      }
    />

    <Route
    path="/settings"
    element={
        <ProtectedRoute allowedRoles={[
          "SuperAdmin",
            "Administrator",
            "Manager",
            "TeamLeader"
        ]}>
        <SettingsPage />
        </ProtectedRoute>
    }
>
    <Route index element={<ProfileSettings />} />
    <Route path="security" element={<SecuritySettings />} />
</Route>

        {/* redirect unknown URLs */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}