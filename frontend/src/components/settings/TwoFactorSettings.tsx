import { useState, useEffect } from "react";
import { Mail, Smartphone, CheckCircle, ShieldAlert, X } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { M } from "../../theme/tokens";
import {
    getTwoFactorStatus,
    enableEmailTwoFactor,
    enableGoogleTwoFactor,
    verifyTwoFactorSetup,
    disableTwoFactor,
    TwoFactorStatus
} from "../../api/twoFactorApi";
import axios from "axios";

export default function TwoFactorSettings() {
    const employeeId = Number(localStorage.getItem("employeeId"));
    const [status, setStatus] = useState<TwoFactorStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Setup state
    const [setupMode, setSetupMode] = useState<"email" | "google" | null>(null);
    const [setupStep, setSetupStep] = useState<"select" | "verify">("select");
    const [selectedProvider, setSelectedProvider] = useState<"Email" | "GoogleAuthenticator">("Email");
    
    // Verification state
    const [otpCode, setOtpCode] = useState("");
    const [googleSecret, setGoogleSecret] = useState("");
    const [googleUri, setGoogleUri] = useState("");

    const fetchStatus = async () => {
        try {
            setLoading(true);
            if (employeeId) {
                const res = await getTwoFactorStatus(employeeId);
                setStatus(res);
            }
        } catch (err) {
            console.error("Failed to fetch 2FA status", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStatus();
    }, [employeeId]);

    const handleEnable = async () => {
        if (!employeeId) return;
        setActionLoading(true);
        setError("");
        setSuccess("");
        try {
            if (selectedProvider === "Email") {
                await enableEmailTwoFactor(employeeId);
                setSetupMode("email");
                setSetupStep("verify");
            } else {
                const res = await enableGoogleTwoFactor(employeeId);
                setGoogleSecret(res.secretKey);
                setGoogleUri(res.qrCodeUri);
                setSetupMode("google");
                setSetupStep("verify");
            }
        } catch (err) {
            if (axios.isAxiosError(err)) {
                setError(err.response?.data?.message || "Failed to initiate setup");
            } else {
                setError("Failed to initiate setup");
            }
        } finally {
            setActionLoading(false);
        }
    };

    const handleVerify = async () => {
        if (!employeeId || !otpCode.trim()) return;
        setActionLoading(true);
        setError("");
        setSuccess("");
        try {
            const newStatus = await verifyTwoFactorSetup(employeeId, otpCode.trim());
            setStatus(newStatus);
            setSuccess("Two-Factor Authentication has been successfully enabled.");
            setSetupMode(null);
            setSetupStep("select");
            setOtpCode("");
        } catch (err) {
            if (axios.isAxiosError(err)) {
                setError(err.response?.data?.message || "Verification failed");
            } else {
                setError("Verification failed");
            }
        } finally {
            setActionLoading(false);
        }
    };

    const handleDisable = async () => {
        if (!employeeId) return;
        if (!window.confirm("Are you sure you want to disable Two-Factor Authentication? This will make your account less secure.")) return;
        
        setActionLoading(true);
        setError("");
        setSuccess("");
        try {
            await disableTwoFactor(employeeId);
            setStatus({ isEnabled: false, provider: "" });
            setSuccess("Two-Factor Authentication disabled.");
        } catch (err) {
            if (axios.isAxiosError(err)) {
                setError(err.response?.data?.message || "Failed to disable 2FA");
            } else {
                setError("Failed to disable 2FA");
            }
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) {
        return <div style={{ padding: 28, background: M.white, borderRadius: 22 }}>Loading settings...</div>;
    }

    return (
        <div style={{ background: M.white, borderRadius: 22, padding: 28, border: `1px solid ${M.border}`, boxShadow: "0 12px 35px rgba(0,0,0,.08)", maxWidth: 520 }}>
            <h2 style={{ marginTop: 0, color: M.textPrimary, fontSize: 22, marginBottom: 8 }}>Two-Factor Authentication</h2>
            
            {status?.isEnabled ? (
                <div style={{ marginBottom: 24, padding: 16, background: `${M.teal}15`, borderRadius: 12, border: `1px solid ${M.teal}`, display: "flex", alignItems: "center", gap: 12 }}>
                    <CheckCircle color={M.tealDeep} size={24} />
                    <div>
                        <p style={{ margin: 0, fontWeight: 700, color: M.tealDeep }}>2FA is currently enabled</p>
                        <p style={{ margin: 0, fontSize: 13, color: M.textSec }}>Using {status.provider === "Email" ? "Email Verification" : "Google Authenticator"}</p>
                    </div>
                </div>
            ) : (
                <p style={{ color: M.textSec, marginBottom: 24, fontSize: 14 }}>
                    Add an extra layer of security to your account by enabling Two-Factor Authentication.
                </p>
            )}

            {error && <div style={{ marginBottom: 16, padding: 12, background: "#ffebee", color: "#c62828", borderRadius: 8, fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}><ShieldAlert size={16} />{error}</div>}
            {success && <div style={{ marginBottom: 16, padding: 12, background: "#e8f5e9", color: "#2e7d32", borderRadius: 8, fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}><CheckCircle size={16} />{success}</div>}

            {status?.isEnabled ? (
                <div>
                    <button
                        onClick={handleDisable}
                        disabled={actionLoading}
                        style={{ width: "100%", height: 48, border: `1px solid ${M.danger}`, borderRadius: 14, background: "transparent", color: M.danger, fontWeight: 600, cursor: "pointer", fontSize: 14 }}
                    >
                        {actionLoading ? "Processing..." : "Disable Two-Factor Authentication"}
                    </button>
                </div>
            ) : setupStep === "select" ? (
                <div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                        <label style={{ display: "flex", alignItems: "center", gap: 14, padding: 18, borderRadius: 16, cursor: "pointer", border: selectedProvider === "Email" ? `2px solid ${M.teal}` : `1px solid ${M.border}`, background: selectedProvider === "Email" ? M.bgTeal : "#fff", transition: ".2s" }}>
                            <input type="radio" name="twoFactor" checked={selectedProvider === "Email"} onChange={() => setSelectedProvider("Email")} style={{ accentColor: M.teal }} />
                            <Mail color={selectedProvider === "Email" ? M.teal : M.textSec} />
                            <div>
                                <div style={{ fontWeight: 700, color: M.textPrimary }}>Email</div>
                                <div style={{ fontSize: 13, color: M.textSec }}>Receive a verification code by email.</div>
                            </div>
                        </label>

                        <label style={{ display: "flex", alignItems: "center", gap: 14, padding: 18, borderRadius: 16, cursor: "pointer", border: selectedProvider === "GoogleAuthenticator" ? `2px solid ${M.teal}` : `1px solid ${M.border}`, background: selectedProvider === "GoogleAuthenticator" ? M.bgTeal : "#fff", transition: ".2s" }}>
                            <input type="radio" name="twoFactor" checked={selectedProvider === "GoogleAuthenticator"} onChange={() => setSelectedProvider("GoogleAuthenticator")} style={{ accentColor: M.teal }} />
                            <Smartphone color={selectedProvider === "GoogleAuthenticator" ? M.teal : M.textSec} />
                            <div>
                                <div style={{ fontWeight: 700, color: M.textPrimary }}>Google Authenticator</div>
                                <div style={{ fontSize: 13, color: M.textSec }}>Generate secure codes using an app.</div>
                            </div>
                        </label>
                    </div>

                    <button
                        onClick={handleEnable}
                        disabled={actionLoading}
                        style={{ marginTop: 28, width: "100%", height: 48, border: "none", borderRadius: 14, background: M.teal, color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: 15, boxShadow: "0 8px 20px rgba(0,153,168,.25)" }}
                    >
                        {actionLoading ? "Configuring..." : "Enable 2FA"}
                    </button>
                </div>
            ) : (
                <div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                        <h3 style={{ margin: 0, fontSize: 16, color: M.textPrimary }}>Complete Setup</h3>
                        <button onClick={() => { setSetupStep("select"); setSetupMode(null); }} style={{ background: "none", border: "none", cursor: "pointer", color: M.textSec }}><X size={20} /></button>
                    </div>
                    
                    {setupMode === "google" && (
                        <div style={{ marginBottom: 20, padding: 16, background: M.bgTeal, borderRadius: 12 }}>
                            <p style={{ margin: "0 0 8px", fontSize: 13, color: M.textPrimary, fontWeight: 600 }}>1. Add to Authenticator App</p>
                            <p style={{ margin: "0 0 12px", fontSize: 13, color: M.textSec }}>Scan the QR code or enter the key into your authenticator app to link your account:</p>
                            
                            {googleUri && (
                                <div style={{ display: "flex", justifyContent: "center", marginBottom: 16, padding: 12, background: "#fff", borderRadius: 8, border: `1px solid ${M.border}` }}>
                                    <QRCodeSVG value={googleUri} size={150} />
                                </div>
                            )}

                            <div style={{ padding: 12, background: M.white, border: `1px solid ${M.border}`, borderRadius: 8, fontFamily: "monospace", fontSize: 14, fontWeight: "bold", textAlign: "center", letterSpacing: 2 }}>
                                {googleSecret}
                            </div>
                        </div>
                    )}

                    {setupMode === "email" && (
                        <div style={{ marginBottom: 20 }}>
                            <p style={{ margin: "0 0 8px", fontSize: 13, color: M.textSec }}>We've sent a 6-digit verification code to your email address.</p>
                        </div>
                    )}

                    <div style={{ marginBottom: 24 }}>
                        <label htmlFor="verificationCode" style={{ display: "block", fontSize: 13, fontWeight: 600, color: M.textPrimary, marginBottom: 8 }}>Enter Verification Code</label>
                        <input
                            id="verificationCode"
                            name="verificationCode"
                            type="text"
                            autoComplete="one-time-code"
                            placeholder="000000"
                            value={otpCode}
                            onChange={(e) => setOtpCode(e.target.value)}
                            style={{ width: "100%", padding: "14px", borderRadius: 12, border: `1px solid ${M.border}`, outline: "none", fontSize: 18, letterSpacing: 4, textAlign: "center", fontFamily: "monospace" }}
                            maxLength={6}
                        />
                    </div>

                    <button
                        onClick={handleVerify}
                        disabled={actionLoading || otpCode.length < 6}
                        style={{ width: "100%", height: 48, border: "none", borderRadius: 14, background: M.teal, color: "#fff", fontWeight: 700, cursor: actionLoading || otpCode.length < 6 ? "not-allowed" : "pointer", fontSize: 15, opacity: actionLoading || otpCode.length < 6 ? 0.6 : 1 }}
                    >
                        {actionLoading ? "Verifying..." : "Verify & Enable"}
                    </button>
                </div>
            )}
        </div>
    );
}