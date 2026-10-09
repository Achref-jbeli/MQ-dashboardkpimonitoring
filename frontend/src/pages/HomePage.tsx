import { Monitor, BarChart3, CalendarDays, ArrowRight, LogIn } from "lucide-react";
import { M, G } from "../theme/tokens";
import { MarquardtLogo } from "../components/common/Logo";
import { ThemeSelector } from "../components/common/ThemeSelector";
import type { Page } from "../types/dashboard";

const FEATURES = [
{ icon: <Monitor size={28} />, title: "Project Monitoring", desc: "RFQ, VAVE and PEP milestones tracked in real-time with live KPI updates and automated alerts." },
{ icon: <BarChart3 size={28} />, title: "KPI Visualization", desc: "Deadlines, adherence, performance and internal delivery — all in one interactive dashboard." },
{ icon: <CalendarDays size={28} />, title: "Calendar & Events", desc: "Department & company events, audits, visits, birthdays, new employees, hero of the month, and employee spotlight." },
];


export function HomePage({ onNavigate }: { onNavigate: (p: Page) => void }) {
return (
<div style={{ fontFamily: "Inter, sans-serif", background: M.white }}>
    <section style={{ minHeight: "100vh", background: G.hero, position: "relative", overflow: "hidden", display: "flex", flexDirection: "column" }}>
    <div style={{ position: "absolute", width: 700, height: 700, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.07)", top: -200, right: -100, pointerEvents: "none" }} />
    <div style={{ position: "absolute", width: 400, height: 400, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.05)", bottom: -80, left: "38%", pointerEvents: "none" }} />

    <div style={{ position: "relative", zIndex: 10, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "24px 48px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <MarquardtLogo height={80} light />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <ThemeSelector compact />
        <button
            onClick={() => onNavigate("public")}
            style={{ padding: "10px 22px", borderRadius: 18, fontSize: 13, fontWeight: 600, cursor: "pointer", color: "#fff", background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.22)", backdropFilter: "blur(12px)", transition: "all .2s" }}
        >
            Public Dashboard
        </button>
        <button
            onClick={() => onNavigate("login")}
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 22px", borderRadius: 18, fontSize: 13, fontWeight: 600, cursor: "pointer", color: "#fff", background: "rgba(255,255,255,0.18)", border: "1px solid rgba(255,255,255,0.28)", backdropFilter: "blur(16px)" }}
        >
            <LogIn size={15} />Login
        </button>
        </div>
    </div>

    <div style={{ position: "relative", zIndex: 10, flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "0 24px 40px", animation: "mqdFadeUp 0.7s ease-out" }}>
        <div style={{ marginBottom: 40, animation: "mqdFloat 4s ease-in-out infinite" }}>
        <div style={{ width: 120, height: 100, margin: "0 auto 12px", borderRadius: 28, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.12)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.2)", boxShadow: "0 8px 40px rgba(0,0,0,0.2)", padding: "2px 4px" }}>
            <MarquardtLogo height={80} light />
        </div>
        </div>
        <h1 style={{ fontSize: 54, fontWeight: 800, color: "#fff", marginBottom: 20, lineHeight: 1.1, letterSpacing: "-0.03em", maxWidth: 700 }}>
        Real-time KPI Monitoring
        <br />
        <span style={{ color: "rgba(255,255,255,0.6)" }}>Dashboard</span>
        </h1>
        <p style={{ fontSize: 17, color: "rgba(255,255,255,0.6)", marginBottom: 40, maxWidth: 520, lineHeight: 1.7 }}>
        for HMI and HIS Projects — Live analytics and team insights.
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <button
            onClick={() => onNavigate("public")}
            style={{ display: "flex", alignItems: "center", gap: 10, padding: "16px 32px", borderRadius: 20, fontSize: 15, fontWeight: 700, cursor: "pointer", color: M.teal, background: M.white, border: "none", boxShadow: "0 8px 32px rgba(0,0,0,0.2)", transition: "all .2s" }}
        >
            Enter Public Dashboard <ArrowRight size={18} />
        </button>
        <button
            onClick={() => onNavigate("login")}
            style={{ display: "flex", alignItems: "center", gap: 10, padding: "16px 32px", borderRadius: 20, fontSize: 15, fontWeight: 600, cursor: "pointer", color: "#fff", background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.22)", backdropFilter: "blur(16px)" }}
        >
            <LogIn size={18} />Staff Login
        </button>
        </div>
    </div>

    </section>

    <section style={{ padding: "88px 32px", background: M.bgTeal }}>
    <div style={{ maxWidth: 1080, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 60 }}>
        <span style={{ display: "inline-block", fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: M.teal, background: `${M.teal}14`, padding: "5px 14px", borderRadius: 999, marginBottom: 16 }}>Platform Features</span>
        <h2 style={{ fontSize: 34, fontWeight: 800, color: M.textPrimary, margin: "0 0 14px", letterSpacing: "-0.03em" }}>Everything you need</h2>
        <p style={{ fontSize: 15, color: M.textSec, margin: 0, maxWidth: 560, marginLeft: "auto", marginRight: "auto", lineHeight: 1.7 }}>A comprehensive department dashboard platform built for real-time visibility, smarter decisions, and continuous performance improvement</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 24 }}>
        {FEATURES.map((f, i) => {
            const accents = [
            { from: "#00B8C2", to: "#33CDD5" },
            { from: "#0F7A6B", to: "#14A88F" },
            { from: "#1A5FA8", to: "#2E7DD1" },
            ];
            const a = accents[i % accents.length];
            return (
            <div
                key={i}
                style={{
                background: "var(--card, #fff)",
                borderRadius: 20,
                padding: "32px 28px 28px",
                display: "flex",
                flexDirection: "column",
                gap: 0,
                boxShadow: "0 2px 20px rgba(0,0,0,0.06)",
                border: "1px solid var(--border, #E0EEEE)",
                position: "relative",
                overflow: "hidden",
                transition: "transform 0.2s, box-shadow 0.2s",
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(-4px)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 12px 36px rgba(0,0,0,0.12)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 2px 20px rgba(0,0,0,0.06)"; }}
            >
                {/* Top gradient accent bar */}
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: `linear-gradient(90deg, ${a.from}, ${a.to})`, borderRadius: "20px 20px 0 0" }} />

                {/* Icon */}
                <div style={{
                width: 52, height: 52, borderRadius: 16, marginBottom: 20,
                background: `linear-gradient(135deg, ${a.from}22, ${a.to}11)`,
                border: `1px solid ${a.from}33`,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: a.from,
                }}>
                {f.icon}
                </div>

                <h3 style={{ fontSize: 16, fontWeight: 700, color: M.textPrimary, margin: "0 0 10px", letterSpacing: "-0.01em" }}>{f.title}</h3>
                <p style={{ fontSize: 13, color: M.textSec, lineHeight: 1.75, margin: 0 }}>{f.desc}</p>
            </div>
            );
        })}
        </div>
    </div>
    </section>

    <section style={{ padding: "72px 32px", textAlign: "center", background: G.hero }}>
    <h2 style={{ fontSize: 32, fontWeight: 800, color: "#fff", marginBottom: 12 }}>Ready to get started?</h2>
    <p style={{ fontSize: 15, color: "rgba(255,255,255,0.55)", marginBottom: 32 }}>Access the public dashboard or sign in to your role-based workspace</p>
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16 }}>
        <button onClick={() => onNavigate("public")} style={{ padding: "14px 32px", borderRadius: 18, fontSize: 14, fontWeight: 700, cursor: "pointer", color: M.teal, background: M.white, border: "none" }}>
        Enter Dashboard
        </button>
        <button onClick={() => onNavigate("login")} style={{ padding: "14px 32px", borderRadius: 18, fontSize: 14, fontWeight: 600, cursor: "pointer", color: "#fff", background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.22)" }}>
        Staff Login
        </button>
    </div>
    <div style={{ marginTop: 40, display: "flex", alignItems: "center", justifyContent: "center", gap: 16 }}>
        <MarquardtLogo height={80} light />
        <p style={{ fontSize: 11, fontFamily: "DM Mono, monospace", color: "rgba(255,255,255,0.25)", margin: 0 }}>© 2026 Marquardt GmbH · Enterprise KPI Platform v4.0</p>
    </div>
    </section>
</div>
);
}
