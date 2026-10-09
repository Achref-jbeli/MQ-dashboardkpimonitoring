import { useEffect, useState } from "react";
import axios from "axios";
import {
  ChevronLeft,
  Mail,
  Lock,
  Eye,
  EyeOff,
  UserCircle,
  Shield,
  Building2,
  X,
  KeyRound,
  CheckCircle2,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import { M, G } from "../theme/tokens";
import { MarquardtLogo } from "../components/common/Logo";
import { ThemeSelector } from "../components/common/ThemeSelector";
import {
  login,
  registerAccountRequest,
  verifyTwoFactor,
  requestPasswordReset,
  verifyResetCode,
  resetPassword,
} from "../api/authApi";
import type { LoginTarget, Page } from "../types/dashboard";
import { getPublicDepartments } from "../api/departmentApi";
import type { Department } from "../types/department";

const ROLES: {
  id: LoginTarget;
  label: string;
  desc: string;
  icon: React.ReactNode;
  dest: Page;
}[] = [
  {
    id: "superadmin",
    label: "Super Admin",
    desc: "Global company access",
    icon: <Shield size={22} />,
    dest: "admin",
  },
  {
    id: "teamleader",
    label: "Team Leader",
    desc: "Manage your team and projects",
    icon: <UserCircle size={22} />,
    dest: "teamleader",
  },
  {
    id: "admin",
    label: "Administrator",
    desc: "Full system configuration",
    icon: <Shield size={22} />,
    dest: "admin",
  },
  {
    id: "manager",
    label: "Manager",
    desc: "Company-wide oversight",
    icon: <Building2 size={22} />,
    dest: "manager",
  },
];

export function LoginPage({ onNavigate }: { onNavigate: (p: Page) => void }) {
  const [role, setRole] = useState<LoginTarget>("teamleader");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [authEmployeeId, setAuthEmployeeId] = useState<number | null>(null);
  const [requiresTwoFactorSetup, setRequiresTwoFactorSetup] = useState(false);
  const [twoFactorSetupProvider, setTwoFactorSetupProvider] = useState<"email" | "google" | null>(null);
  const [googleSetupSecret, setGoogleSetupSecret] = useState("");
  const [googleSetupUri, setGoogleSetupUri] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ============================================================
  // FORGOT PASSWORD & 2FA RESET STATE
  // ============================================================
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState<"email" | "2fa" | "newPassword" | "success">("email");
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotEmployeeId, setForgotEmployeeId] = useState<number | null>(null);
  const [forgotProvider, setForgotProvider] = useState<"email" | "google">("email");
  const [forgotCode, setForgotCode] = useState("");
  const [forgotResetToken, setForgotResetToken] = useState("");
  const [forgotNewPass, setForgotNewPass] = useState("");
  const [forgotConfirmPass, setForgotConfirmPass] = useState("");
  const [forgotShowPass, setForgotShowPass] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState("");
  const [forgotSuccess, setForgotSuccess] = useState("");

  const resetForgotFlow = () => {
    setShowForgotModal(false);
    setForgotStep("email");
    setForgotEmail("");
    setForgotEmployeeId(null);
    setForgotProvider("email");
    setForgotCode("");
    setForgotResetToken("");
    setForgotNewPass("");
    setForgotConfirmPass("");
    setForgotShowPass(false);
    setForgotLoading(false);
    setForgotError("");
    setForgotSuccess("");
  };

  const clearTwoFactorFlow = () => {
    setAuthEmployeeId(null);
    setRequiresTwoFactorSetup(false);
    setTwoFactorSetupProvider(null);
    setGoogleSetupSecret("");
    setGoogleSetupUri("");
    setOtpCode("");
  };

  const selected = ROLES.find((r) => r.id === role)!;

  useEffect(() => {
    if (!showCreateModal) {
      return;
    }

    const loadDepartments = async () => {
      try {
        const result = await getPublicDepartments();
        setDepartments(result);
        if (!selectedDepartmentId && result.length > 0) {
          setSelectedDepartmentId(String(result[0].id));
        }
      } catch {
        setDepartments([]);
      }
    };

    void loadDepartments();
  }, [showCreateModal]);

  const roleToPage = (resolvedRole: string): Page | null => {
    switch (resolvedRole) {
      case "Administrator":
        return "admin";
      case "SuperAdmin":
        return "admin";
      case "Manager":
        return "manager";
      case "TeamLeader":
        return "teamleader";
      default:
        return null;
    }
  };

  const handleLogin = async () => {
    if (!email.trim() || !pass) {
      setError("Email and password are required.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await login(email.trim(), pass);

      if (response.requiresTwoFactorSetup && response.employeeId) {
        setRequiresTwoFactorSetup(true);
        const provider = (response.twoFactorSetupProvider ?? "email").toLowerCase();
        setTwoFactorSetupProvider(provider === "google" ? "google" : "email");
        setAuthEmployeeId(response.employeeId);
        setGoogleSetupSecret(response.googleAuthenticatorSecret ?? "");
        setGoogleSetupUri(response.googleOtpAuthUri ?? "");
        setSuccess(response.message ?? "Two-factor setup is required before your first login.");
        return;
      }

      if (response.requiresTwoFactor && response.employeeId) {
        setRequiresTwoFactorSetup(false);
        setTwoFactorSetupProvider(null);
        setAuthEmployeeId(response.employeeId);
        setSuccess(response.message ?? "Verification required.");
        return;
      }

      const destination = roleToPage(response.role);

      if (!destination) {
        setError(`Unsupported role returned by server: ${response.role}`);
        return;
      }

      localStorage.setItem("token", response.token);
      localStorage.setItem("role", response.role);
      localStorage.setItem("employeeId", String(response.employeeId));
      localStorage.setItem("fullName", response.fullName);
      localStorage.setItem("department", response.department ?? "");
      localStorage.setItem(
        "departmentId",
        response.departmentId != null ? String(response.departmentId) : ""
      );
      clearTwoFactorFlow();
      onNavigate(destination);
    } catch (caughtError) {
      if (axios.isAxiosError(caughtError)) {
        setError(caughtError.response?.data?.message ?? "Login failed.");
      } else {
        setError("Login failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!authEmployeeId) {
      setError("No pending challenge. Login again.");
      return;
    }

    if (!otpCode.trim()) {
      setError("Verification code is required.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await verifyTwoFactor(authEmployeeId, otpCode.trim());
      const destination = roleToPage(response.role);

      if (!destination) {
        setError(`Unsupported role returned by server: ${response.role}`);
        return;
      }

      localStorage.setItem("token", response.token);
      localStorage.setItem("role", response.role);
      localStorage.setItem("employeeId", String(response.employeeId));
      localStorage.setItem("fullName", response.fullName);
      localStorage.setItem("department", response.department ?? "");
      localStorage.setItem(
        "departmentId",
        response.departmentId != null ? String(response.departmentId) : ""
      );
      clearTwoFactorFlow();
      onNavigate(destination);
    } catch (caughtError) {
      if (axios.isAxiosError(caughtError)) {
        setError(caughtError.response?.data?.message ?? "Verification failed.");
      } else {
        setError("Verification failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccountRequest = async () => {
    if (!email.trim() || !pass) {
      setError("Email and password are required.");
      return;
    }

    if (pass !== confirmPass) {
      setError("Password and confirm password do not match.");
      return;
    }

    if (!selectedDepartmentId) {
      setError("Please choose a department.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const accountType =
        selected.id === "superadmin"
          ? "SuperAdmin"
          : selected.dest === "admin"
          ? "Administrator"
          : selected.dest === "manager"
          ? "Manager"
          : "TeamLeader";

      const result = await registerAccountRequest({
        email: email.trim(),
        password: pass,
        accountType,
        departmentId: Number(selectedDepartmentId),
      });

      setSuccess(result.message);
      setPass("");
      setConfirmPass("");
    } catch (caughtError) {
      if (axios.isAxiosError(caughtError)) {
        setError(caughtError.response?.data?.message ?? "Request creation failed.");
      } else {
        setError("Request creation failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // FORGOT PASSWORD HANDLERS
  // ============================================================
  const handleRequestPasswordReset = async () => {
    if (!forgotEmail.trim()) {
      setForgotError("Please enter your registered email address.");
      return;
    }

    setForgotLoading(true);
    setForgotError("");
    setForgotSuccess("");

    try {
      const res = await requestPasswordReset(forgotEmail.trim());
      setForgotEmployeeId(res.employeeId);
      setForgotProvider(res.provider);
      setForgotSuccess(res.message);
      setForgotStep("2fa");
    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 404 && !err.response.data?.message) {
          setForgotError(
            "The forgot-password endpoint is not active on the running backend instance. Please restart the backend server (dotnet run) to load newly compiled routes."
          );
        } else {
          setForgotError(err.response?.data?.message ?? "Failed to request password reset.");
        }
      } else {
        setForgotError("Failed to request password reset.");
      }
    } finally {
      setForgotLoading(false);
    }
  };

  const handleVerifyResetCode = async () => {
    if (!forgotEmployeeId || !forgotCode.trim()) {
      setForgotError("Please enter the 6-digit verification code.");
      return;
    }

    setForgotLoading(true);
    setForgotError("");
    setForgotSuccess("");

    try {
      const res = await verifyResetCode(forgotEmployeeId, forgotCode.trim());
      setForgotResetToken(res.resetToken);
      setForgotSuccess(res.message);
      setForgotStep("newPassword");
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setForgotError(err.response?.data?.message ?? "Invalid or expired verification code.");
      } else {
        setForgotError("Invalid verification code.");
      }
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!forgotNewPass) {
      setForgotError("Please enter a new password.");
      return;
    }

    if (forgotNewPass.length < 6) {
      setForgotError("Password must be at least 6 characters long.");
      return;
    }

    if (forgotNewPass !== forgotConfirmPass) {
      setForgotError("New passwords do not match.");
      return;
    }

    if (!forgotEmployeeId) {
      setForgotError("Session expired. Please start over.");
      return;
    }

    setForgotLoading(true);
    setForgotError("");
    setForgotSuccess("");

    try {
      const res = await resetPassword(forgotEmployeeId, forgotResetToken, forgotNewPass);
      setForgotSuccess(res.message);
      setForgotStep("success");
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setForgotError(err.response?.data?.message ?? "Failed to reset password.");
      } else {
        setForgotError("Failed to reset password.");
      }
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", fontFamily: "Inter, sans-serif" }}>
      {/* Left hero banner */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 24,
          width: "52%",
          position: "relative",
          overflow: "hidden",
          background: G.hero,
        }}
      >
        <div
          style={{
            position: "absolute",
            width: 600,
            height: 600,
            borderRadius: "50%",
            border: "1px solid rgba(255,255,255,0.06)",
            top: -200,
            right: -100,
          }}
        />
        <div
          style={{
            position: "absolute",
            width: 400,
            height: 400,
            borderRadius: "50%",
            border: "1px solid rgba(255,255,255,0.05)",
            bottom: -100,
            left: -80,
          }}
        />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginBottom: 32,
            position: "relative",
            zIndex: 10,
            marginTop: 0,
            marginLeft: 24,
          }}
        >
          <MarquardtLogo height={80} light />
        </div>
        <div style={{ position: "relative", zIndex: 10 }}>
          <h1
            style={{
              fontSize: 38,
              fontWeight: 800,
              color: "#fff",
              margin: "0 0 12px",
              letterSpacing: "-0.03em",
            }}
          >
            Access your
            <br />
            workspace
          </h1>
          <p
            style={{
              fontSize: 15,
              color: "rgba(255,255,255,0.55)",
              lineHeight: 1.7,
              margin: 0,
            }}
          >
            Sign in to update R&D teams KPIs for Marquardt Tunisia projects.
          </p>
        </div>
        <p
          style={{
            position: "relative",
            zIndex: 10,
            fontSize: 11,
            fontFamily: "DM Mono, monospace",
            color: "rgba(255,255,255,0.25)",
            margin: 0,
          }}
        >
          © 2026 Marquardt GmbH
        </p>
      </div>

      {/* Right form section */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 40,
          background: M.bgTeal,
        }}
      >
        <div style={{ width: "100%", maxWidth: 420 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32 }}>
            <button
              onClick={() => onNavigate("home")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 13,
                cursor: "pointer",
                background: "none",
                border: "none",
                color: M.textSec,
              }}
            >
              <ChevronLeft size={16} />
              Back to Home
            </button>
            <ThemeSelector compact />
          </div>
          <h2
            style={{
              fontSize: 30,
              fontWeight: 800,
              color: M.textPrimary,
              margin: "0 0 8px",
              letterSpacing: "-0.025em",
            }}
          >
            Welcome back
          </h2>
          <p style={{ fontSize: 13, color: M.textSec, margin: "0 0 18px" }}>
            Sign in with your email and password — your dashboard is chosen automatically based on your account role.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {error && <p style={{ fontSize: 12, color: M.danger, margin: 0 }}>{error}</p>}
            {success && <p style={{ fontSize: 12, color: M.tealDeep, margin: 0 }}>{success}</p>}
            <div>
              <label
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: M.textPrimary,
                  display: "block",
                  marginBottom: 6,
                }}
              >
                Email Address
              </label>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "0 16px",
                  borderRadius: 18,
                  background: M.white,
                  border: `1.5px solid ${email ? M.teal : M.border}`,
                  boxShadow: email ? `0 0 0 3px ${M.teal}18` : "0 2px 8px rgba(22,55,74,0.06)",
                  transition: "all .2s",
                }}
              >
                <Mail size={16} style={{ color: M.textSec }} />
                <input
                  type="email"
                  placeholder="you@marquardt.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    flex: 1,
                    padding: "14px 0",
                    fontSize: 14,
                    outline: "none",
                    background: "transparent",
                    color: M.textPrimary,
                    border: "none",
                  }}
                />
              </div>
            </div>
            <div>
              <label
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: M.textPrimary,
                  display: "block",
                  marginBottom: 6,
                }}
              >
                Password
              </label>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "0 16px",
                  borderRadius: 18,
                  background: M.white,
                  border: `1.5px solid ${pass ? M.teal : M.border}`,
                  boxShadow: pass ? `0 0 0 3px ${M.teal}18` : "0 2px 8px rgba(22,55,74,0.06)",
                  transition: "all .2s",
                }}
              >
                <Lock size={16} style={{ color: M.textSec }} />
                <input
                  type={showPass ? "text" : "password"}
                  placeholder="••••••••"
                  value={pass}
                  onChange={(e) => setPass(e.target.value)}
                  style={{
                    flex: 1,
                    padding: "14px 0",
                    fontSize: 14,
                    outline: "none",
                    background: "transparent",
                    color: M.textPrimary,
                    border: "none",
                  }}
                />
                <button
                  onClick={() => setShowPass((s) => !s)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: M.textSec }}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div
              onClick={() => {
                setShowCreateModal(true);
                setError("");
                setSuccess("");
              }}
              style={{
                borderRadius: 18,
                border: `1px solid ${M.border}`,
                background: M.white,
                padding: 14,
                boxShadow: "0 2px 8px rgba(22,55,74,0.06)",
                transition: "all .2s",
                cursor: "pointer",
              }}
            >
              <div>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: M.textPrimary }}>
                  Create account request
                </p>
                <p style={{ margin: "4px 0 0", fontSize: 11, color: M.textSec }}>
                  Use your company email. Your request will be sent to admins for approval.
                </p>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 12, color: M.textSec }}>
                Sign in
              </span>
              <button
                type="button"
                onClick={() => {
                  setShowForgotModal(true);
                  setForgotEmail(email || "");
                  setForgotError("");
                  setForgotSuccess("");
                  setForgotStep("email");
                }}
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: M.teal,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Forgot password?
              </button>
            </div>

            {authEmployeeId && (
              <div>
                <label
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: M.textPrimary,
                    display: "block",
                    marginBottom: 6,
                  }}
                >
                  {requiresTwoFactorSetup ? "2FA Setup Code" : "2FA Code"}
                </label>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "0 16px",
                    borderRadius: 18,
                    background: M.white,
                    border: `1.5px solid ${otpCode ? M.teal : M.border}`,
                    boxShadow: otpCode ? `0 0 0 3px ${M.teal}18` : "0 2px 8px rgba(22,55,74,0.06)",
                    transition: "all .2s",
                  }}
                >
                  <Mail size={16} style={{ color: M.textSec }} />
                  <input
                    type="text"
                    placeholder="6-digit code"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    style={{
                      flex: 1,
                      padding: "14px 0",
                      fontSize: 14,
                      outline: "none",
                      background: "transparent",
                      color: M.textPrimary,
                      border: "none",
                    }}
                  />
                </div>
              </div>
            )}

            {requiresTwoFactorSetup && twoFactorSetupProvider === "google" && (
              <div
                style={{
                  borderRadius: 16,
                  border: `1px dashed ${M.teal}`,
                  background: `${M.teal}10`,
                  padding: 12,
                }}
              >
                <p style={{ margin: 0, fontSize: 12, color: M.textPrimary, fontWeight: 700 }}>
                  Google Authenticator setup required
                </p>
                <p style={{ margin: "6px 0 0", fontSize: 11, color: M.textSec }}>
                  Add this secret manually in Google Authenticator, then enter the current 6-digit code above.
                </p>
                {googleSetupSecret && (
                  <p
                    style={{
                      margin: "8px 0 0",
                      fontSize: 12,
                      color: M.textPrimary,
                      fontWeight: 700,
                      wordBreak: "break-all",
                    }}
                  >
                    {googleSetupSecret}
                  </p>
                )}
                {googleSetupUri && (
                  <p
                    style={{
                      margin: "8px 0 0",
                      fontSize: 10,
                      color: M.textSec,
                      wordBreak: "break-all",
                    }}
                  >
                    {googleSetupUri}
                  </p>
                )}
              </div>
            )}

            {requiresTwoFactorSetup && twoFactorSetupProvider === "email" && (
              <div
                style={{
                  borderRadius: 16,
                  border: `1px dashed ${M.teal}`,
                  background: `${M.teal}10`,
                  padding: 12,
                }}
              >
                <p style={{ margin: 0, fontSize: 12, color: M.textPrimary, fontWeight: 700 }}>
                  Email verification required
                </p>
                <p style={{ margin: "6px 0 0", fontSize: 11, color: M.textSec }}>
                  Use the one-time code sent to your email to finish first-time 2FA setup.
                </p>
              </div>
            )}

            {!authEmployeeId && (
              <button
                onClick={handleLogin}
                disabled={loading}
                style={{
                  width: "100%",
                  padding: "15px",
                  borderRadius: 18,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                  color: "#fff",
                  background: `linear-gradient(135deg, ${M.teal}, ${M.darkBlue})`,
                  border: "none",
                  boxShadow: `0 6px 24px ${M.teal}45`,
                  transition: "all .2s",
                }}
              >
                {loading ? "Signing In..." : "Sign In"}
              </button>
            )}

            {authEmployeeId && (
              <button
                onClick={handleVerify}
                disabled={loading}
                style={{
                  width: "100%",
                  padding: "15px",
                  borderRadius: 18,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                  color: "#fff",
                  background: `linear-gradient(135deg, ${M.teal}, ${M.darkBlue})`,
                  border: "none",
                  boxShadow: `0 6px 24px ${M.teal}45`,
                  transition: "all .2s",
                }}
              >
                {loading
                  ? "Verifying..."
                  : requiresTwoFactorSetup
                  ? "Complete 2FA Setup"
                  : "Verify 2FA"}
              </button>
            )}

            {authEmployeeId && (
              <button
                onClick={() => {
                  clearTwoFactorFlow();
                  setError("");
                  setSuccess("");
                }}
                style={{
                  width: "100%",
                  padding: "11px",
                  borderRadius: 14,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  color: M.textSec,
                  background: "transparent",
                  border: `1px solid ${M.border}`,
                }}
              >
                Cancel 2FA step
              </button>
            )}

            <button
              onClick={() => onNavigate("public")}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: 18,
                fontSize: 13,
                fontWeight: 500,
                cursor: "pointer",
                color: M.textSec,
                background: "transparent",
                border: `1px solid ${M.border}`,
                transition: "all .2s",
              }}
            >
              Continue as Public Visitor →
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* FORGOT PASSWORD & 2FA RESET MODAL */}
      {/* ============================================================ */}
      {showForgotModal && (
        <div
          onClick={resetForgotFlow}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 70,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            background: "rgba(7,44,70,0.65)",
            backdropFilter: "blur(10px)",
          }}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 460,
              borderRadius: 24,
              background: M.white,
              border: `1px solid ${M.border}`,
              boxShadow: "0 24px 60px rgba(7,44,70,0.25)",
              padding: 26,
            }}
          >
            {/* Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 18,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 12,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: `${M.teal}15`,
                    color: M.teal,
                  }}
                >
                  <KeyRound size={20} />
                </div>
                <div>
                  <h3
                    style={{
                      margin: 0,
                      fontSize: 18,
                      fontWeight: 800,
                      color: M.textPrimary,
                    }}
                  >
                    {forgotStep === "email" && "Forgot Password"}
                    {forgotStep === "2fa" && "2FA Verification"}
                    {forgotStep === "newPassword" && "Set New Password"}
                    {forgotStep === "success" && "Password Reset Complete"}
                  </h3>
                  <p style={{ margin: "2px 0 0", fontSize: 12, color: M.textSec }}>
                    {forgotStep === "email" && "Enter your email to verify your identity"}
                    {forgotStep === "2fa" &&
                      (forgotProvider === "google"
                        ? "Google Authenticator code required"
                        : "Email verification code required")}
                    {forgotStep === "newPassword" && "Create a new strong password"}
                    {forgotStep === "success" && "Your account is secured and ready"}
                  </p>
                </div>
              </div>
              <button
                onClick={resetForgotFlow}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: `1px solid ${M.border}`,
                  background: M.bgTeal,
                  color: M.textSec,
                  cursor: "pointer",
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Alert Messages */}
            {forgotError && (
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: 12,
                  background: "#FEF2F2",
                  border: "1px solid #FECACA",
                  color: "#B91C1C",
                  fontSize: 12,
                  marginBottom: 14,
                }}
              >
                {forgotError}
              </div>
            )}
            {forgotSuccess && forgotStep !== "success" && (
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: 12,
                  background: `${M.teal}15`,
                  border: `1px solid ${M.teal}40`,
                  color: M.tealDeep,
                  fontSize: 12,
                  marginBottom: 14,
                }}
              >
                {forgotSuccess}
              </div>
            )}

            {/* STEP 1: Email Address */}
            {forgotStep === "email" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <label
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: M.textPrimary,
                      display: "block",
                      marginBottom: 6,
                    }}
                  >
                    Registered Corporate Email Address
                  </label>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "0 16px",
                      borderRadius: 16,
                      background: M.white,
                      border: `1.5px solid ${forgotEmail ? M.teal : M.border}`,
                      boxShadow: forgotEmail
                        ? `0 0 0 3px ${M.teal}18`
                        : "0 2px 8px rgba(22,55,74,0.06)",
                    }}
                  >
                    <Mail size={16} style={{ color: M.textSec }} />
                    <input
                      type="email"
                      placeholder="you@marquardt.com"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleRequestPasswordReset()}
                      style={{
                        flex: 1,
                        padding: "13px 0",
                        fontSize: 14,
                        outline: "none",
                        background: "transparent",
                        color: M.textPrimary,
                        border: "none",
                      }}
                    />
                  </div>
                </div>

                <p style={{ margin: 0, fontSize: 11, color: M.textSec, lineHeight: 1.5 }}>
                  We will check if your account has two-factor authentication enabled (Email OTP or
                  Google Authenticator) and initiate verification.
                </p>

                <button
                  onClick={handleRequestPasswordReset}
                  disabled={forgotLoading}
                  style={{
                    width: "100%",
                    padding: "14px",
                    borderRadius: 16,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: "pointer",
                    color: "#fff",
                    background: `linear-gradient(135deg, ${M.teal}, ${M.darkBlue})`,
                    border: "none",
                    boxShadow: `0 6px 20px ${M.teal}40`,
                    transition: "all .2s",
                    marginTop: 4,
                  }}
                >
                  {forgotLoading ? "Verifying Account..." : "Continue to 2FA Verification"}
                </button>
              </div>
            )}

            {/* STEP 2: 2FA Validation */}
            {forgotStep === "2fa" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div
                  style={{
                    padding: "12px 14px",
                    borderRadius: 14,
                    background: `${M.teal}10`,
                    border: `1px dashed ${M.teal}`,
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <ShieldCheck size={20} color={M.teal} />
                  <p style={{ margin: 0, fontSize: 12, color: M.textPrimary, lineHeight: 1.4 }}>
                    {forgotProvider === "google"
                      ? "Enter the current 6-digit TOTP code from your Google Authenticator app."
                      : `A 6-digit reset code has been sent to ${forgotEmail}.`}
                  </p>
                </div>

                <div>
                  <label
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: M.textPrimary,
                      display: "block",
                      marginBottom: 6,
                    }}
                  >
                    6-Digit 2FA Verification Code
                  </label>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "0 16px",
                      borderRadius: 16,
                      background: M.white,
                      border: `1.5px solid ${forgotCode ? M.teal : M.border}`,
                      boxShadow: forgotCode
                        ? `0 0 0 3px ${M.teal}18`
                        : "0 2px 8px rgba(22,55,74,0.06)",
                    }}
                  >
                    <Lock size={16} style={{ color: M.textSec }} />
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="123456"
                      value={forgotCode}
                      onChange={(e) => setForgotCode(e.target.value.replace(/\D/g, ""))}
                      onKeyDown={(e) => e.key === "Enter" && handleVerifyResetCode()}
                      style={{
                        flex: 1,
                        padding: "13px 0",
                        fontSize: 18,
                        fontWeight: 700,
                        letterSpacing: "0.2em",
                        outline: "none",
                        background: "transparent",
                        color: M.textPrimary,
                        border: "none",
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                  <button
                    onClick={() => setForgotStep("email")}
                    style={{
                      flex: 1,
                      padding: "13px",
                      borderRadius: 16,
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                      color: M.textSec,
                      background: "transparent",
                      border: `1px solid ${M.border}`,
                    }}
                  >
                    Back
                  </button>
                  <button
                    onClick={handleVerifyResetCode}
                    disabled={forgotLoading || forgotCode.length < 6}
                    style={{
                      flex: 2,
                      padding: "13px",
                      borderRadius: 16,
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: "pointer",
                      color: "#fff",
                      background: `linear-gradient(135deg, ${M.teal}, ${M.darkBlue})`,
                      border: "none",
                      boxShadow: `0 6px 20px ${M.teal}40`,
                      opacity: forgotCode.length < 6 ? 0.6 : 1,
                    }}
                  >
                    {forgotLoading ? "Validating 2FA..." : "Verify & Continue"}
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Write New Password */}
            {forgotStep === "newPassword" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <p style={{ margin: 0, fontSize: 12, color: M.textSec }}>
                  Identity verified. Enter your new password below (minimum 6 characters).
                </p>

                <div>
                  <label
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: M.textPrimary,
                      display: "block",
                      marginBottom: 6,
                    }}
                  >
                    New Password
                  </label>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "0 16px",
                      borderRadius: 16,
                      background: M.white,
                      border: `1.5px solid ${forgotNewPass ? M.teal : M.border}`,
                      boxShadow: forgotNewPass
                        ? `0 0 0 3px ${M.teal}18`
                        : "0 2px 8px rgba(22,55,74,0.06)",
                    }}
                  >
                    <Lock size={16} style={{ color: M.textSec }} />
                    <input
                      type={forgotShowPass ? "text" : "password"}
                      placeholder="••••••••"
                      value={forgotNewPass}
                      onChange={(e) => setForgotNewPass(e.target.value)}
                      style={{
                        flex: 1,
                        padding: "13px 0",
                        fontSize: 14,
                        outline: "none",
                        background: "transparent",
                        color: M.textPrimary,
                        border: "none",
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setForgotShowPass((s) => !s)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: M.textSec,
                      }}
                    >
                      {forgotShowPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: M.textPrimary,
                      display: "block",
                      marginBottom: 6,
                    }}
                  >
                    Confirm New Password
                  </label>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "0 16px",
                      borderRadius: 16,
                      background: M.white,
                      border: `1.5px solid ${forgotConfirmPass ? M.teal : M.border}`,
                      boxShadow: forgotConfirmPass
                        ? `0 0 0 3px ${M.teal}18`
                        : "0 2px 8px rgba(22,55,74,0.06)",
                    }}
                  >
                    <Lock size={16} style={{ color: M.textSec }} />
                    <input
                      type={forgotShowPass ? "text" : "password"}
                      placeholder="••••••••"
                      value={forgotConfirmPass}
                      onChange={(e) => setForgotConfirmPass(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleResetPassword()}
                      style={{
                        flex: 1,
                        padding: "13px 0",
                        fontSize: 14,
                        outline: "none",
                        background: "transparent",
                        color: M.textPrimary,
                        border: "none",
                      }}
                    />
                  </div>
                </div>

                <button
                  onClick={handleResetPassword}
                  disabled={forgotLoading}
                  style={{
                    width: "100%",
                    padding: "14px",
                    borderRadius: 16,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: "pointer",
                    color: "#fff",
                    background: `linear-gradient(135deg, ${M.teal}, ${M.darkBlue})`,
                    border: "none",
                    boxShadow: `0 6px 20px ${M.teal}40`,
                    transition: "all .2s",
                    marginTop: 4,
                  }}
                >
                  {forgotLoading ? "Resetting Password..." : "Save New Password"}
                </button>
              </div>
            )}

            {/* STEP 4: Success confirmation */}
            {forgotStep === "success" && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  textAlign: "center",
                  gap: 16,
                  padding: "16px 0",
                }}
              >
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: "50%",
                    background: `${M.success}15`,
                    color: M.success,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <CheckCircle2 size={32} />
                </div>

                <div>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 14,
                      fontWeight: 700,
                      color: M.textPrimary,
                    }}
                  >
                    Password Successfully Reset
                  </p>
                  <p
                    style={{
                      margin: "6px 0 0",
                      fontSize: 12,
                      color: M.textSec,
                      lineHeight: 1.5,
                    }}
                  >
                    Your new credentials are now active. You can sign in to your dashboard immediately.
                  </p>
                </div>

                <button
                  onClick={() => {
                    setEmail(forgotEmail);
                    setPass("");
                    resetForgotFlow();
                  }}
                  style={{
                    width: "100%",
                    padding: "14px",
                    borderRadius: 16,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: "pointer",
                    color: "#fff",
                    background: `linear-gradient(135deg, ${M.teal}, ${M.darkBlue})`,
                    border: "none",
                    boxShadow: `0 6px 20px ${M.teal}40`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                  }}
                >
                  Proceed to Sign In <ArrowRight size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CREATE ACCOUNT REQUEST MODAL */}
      {showCreateModal && (
        <div
          onClick={() => {
            setShowCreateModal(false);
            setError("");
            setSuccess("");
          }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 60,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            background: "rgba(7,44,70,0.55)",
            backdropFilter: "blur(8px)",
          }}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 460,
              borderRadius: 22,
              background: M.white,
              border: `1px solid ${M.border}`,
              boxShadow: "0 24px 60px rgba(7,44,70,0.22)",
              padding: 20,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 14,
              }}
            >
              <div>
                <p style={{ margin: 0, fontSize: 17, fontWeight: 800, color: M.textPrimary }}>
                  Create account request
                </p>
                <p style={{ margin: "4px 0 0", fontSize: 12, color: M.textSec }}>
                  Request a {selected.label} account with your company email.
                </p>
              </div>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setError("");
                  setSuccess("");
                }}
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 10,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: `1px solid ${M.border}`,
                  background: M.bgTeal,
                  color: M.textSec,
                  cursor: "pointer",
                }}
              >
                <X size={14} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {error && <p style={{ fontSize: 12, color: M.danger, margin: 0 }}>{error}</p>}
              {success && <p style={{ fontSize: 12, color: M.tealDeep, margin: 0 }}>{success}</p>}

              <div>
                <label
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: M.textPrimary,
                    display: "block",
                    marginBottom: 6,
                  }}
                >
                  Account Type
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }}>
                  {ROLES.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => setRole(r.id)}
                      style={{
                        padding: "10px 6px",
                        borderRadius: 14,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 4,
                        textAlign: "center",
                        cursor: "pointer",
                        background: role === r.id ? M.teal : M.white,
                        color: role === r.id ? "#fff" : M.textSec,
                        border: `1px solid ${role === r.id ? M.teal : M.border}`,
                        transition: "all .15s",
                      }}
                    >
                      {r.icon}
                      <span style={{ fontSize: 10, fontWeight: 600 }}>{r.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div>
                  <label
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: M.textPrimary,
                      display: "block",
                      marginBottom: 6,
                    }}
                  >
                    Email Address
                  </label>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "0 16px",
                      borderRadius: 18,
                      background: M.white,
                      border: `1.5px solid ${email ? M.teal : M.border}`,
                      boxShadow: email ? `0 0 0 3px ${M.teal}18` : "0 2px 8px rgba(22,55,74,0.06)",
                      transition: "all .2s",
                    }}
                  >
                    <Mail size={16} style={{ color: M.textSec }} />
                    <input
                      type="email"
                      placeholder="you@marquardt.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      style={{
                        flex: 1,
                        padding: "14px 0",
                        fontSize: 14,
                        outline: "none",
                        background: "transparent",
                        color: M.textPrimary,
                        border: "none",
                      }}
                    />
                  </div>
                </div>
                <div>
                  <label
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: M.textPrimary,
                      display: "block",
                      marginBottom: 6,
                    }}
                  >
                    Password
                  </label>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "0 16px",
                      borderRadius: 18,
                      background: M.white,
                      border: `1.5px solid ${pass ? M.teal : M.border}`,
                      boxShadow: pass ? `0 0 0 3px ${M.teal}18` : "0 2px 8px rgba(22,55,74,0.06)",
                      transition: "all .2s",
                    }}
                  >
                    <Lock size={16} style={{ color: M.textSec }} />
                    <input
                      type={showPass ? "text" : "password"}
                      placeholder="••••••••"
                      value={pass}
                      onChange={(e) => setPass(e.target.value)}
                      style={{
                        flex: 1,
                        padding: "14px 0",
                        fontSize: 14,
                        outline: "none",
                        background: "transparent",
                        color: M.textPrimary,
                        border: "none",
                      }}
                    />
                    <button
                      onClick={() => setShowPass((s) => !s)}
                      style={{ background: "none", border: "none", cursor: "pointer", color: M.textSec }}
                    >
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <label
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: M.textPrimary,
                    display: "block",
                    marginBottom: 6,
                  }}
                >
                  Confirm Password
                </label>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "0 16px",
                    borderRadius: 18,
                    background: M.white,
                    border: `1.5px solid ${confirmPass ? M.teal : M.border}`,
                    boxShadow: confirmPass
                      ? `0 0 0 3px ${M.teal}18`
                      : "0 2px 8px rgba(22,55,74,0.06)",
                    transition: "all .2s",
                  }}
                >
                  <Lock size={16} style={{ color: M.textSec }} />
                  <input
                    type={showPass ? "text" : "password"}
                    placeholder="••••••••"
                    value={confirmPass}
                    onChange={(e) => setConfirmPass(e.target.value)}
                    style={{
                      flex: 1,
                      padding: "14px 0",
                      fontSize: 14,
                      outline: "none",
                      background: "transparent",
                      color: M.textPrimary,
                      border: "none",
                    }}
                  />
                </div>
              </div>

              <div>
                <label
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: M.textPrimary,
                    display: "block",
                    marginBottom: 6,
                  }}
                >
                  Department
                </label>
                <select
                  value={selectedDepartmentId}
                  onChange={(event) => setSelectedDepartmentId(event.target.value)}
                  style={{
                    width: "100%",
                    padding: "14px 16px",
                    borderRadius: 18,
                    background: M.white,
                    border: `1.5px solid ${selectedDepartmentId ? M.teal : M.border}`,
                    boxShadow: selectedDepartmentId
                      ? `0 0 0 3px ${M.teal}18`
                      : "0 2px 8px rgba(22,55,74,0.06)",
                    fontSize: 14,
                    color: M.textPrimary,
                  }}
                >
                  {departments.length === 0 && (
                    <option value="">No departments available</option>
                  )}
                  {departments.map((department) => (
                    <option key={department.id} value={department.id}>
                      {department.name}
                    </option>
                  ))}
                </select>
              </div>

              <p style={{ margin: 0, fontSize: 11, color: M.textSec }}>
                Two-factor authentication is off by default. You can enable it from Settings after your account is approved.
              </p>

              <button
                onClick={handleCreateAccountRequest}
                disabled={loading}
                style={{
                  width: "100%",
                  padding: "15px",
                  borderRadius: 18,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                  color: "#fff",
                  background: `linear-gradient(135deg, ${M.teal}, ${M.darkBlue})`,
                  border: "none",
                  boxShadow: `0 6px 24px ${M.teal}45`,
                  transition: "all .2s",
                }}
              >
                {loading ? "Submitting..." : `Request ${selected.label} Account`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
