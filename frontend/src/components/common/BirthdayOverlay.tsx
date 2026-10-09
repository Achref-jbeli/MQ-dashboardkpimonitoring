import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { ConfettiCanvas } from "./ConfettiCanvas";
import { M } from "../../theme/tokens";
import type { Employee } from "../../types/employee";
import { resolveImageUrl, FALLBACK_IMAGE } from "../../utils/imageUrl";

export function BirthdayOverlay({ emp, onClose }: { emp: Employee; onClose: () => void }) {
const [cd, setCd] = useState(7);
useEffect(() => {
const t = setInterval(() => {
    setCd((c) => {
    if (c <= 1) {
        clearInterval(t);
        onClose();
        return 0;
    }
    return c - 1;
    });
}, 1000);
return () => clearInterval(t);
}, [onClose]);

return (
<div style={{ position: "fixed", inset: 0, zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center" }}>
    <div
    style={{
        position: "absolute",
        inset: 0,
        background: `radial-gradient(ellipse at 50% 40%, rgba(0,168,168,0.4) 0%, rgba(7,44,70,0.97) 70%)`,
        backdropFilter: "blur(20px)",
    }}
    onClick={onClose}
    />
    <ConfettiCanvas />
    <div
    style={{
        position: "relative",
        zIndex: 10,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        maxWidth: 400,
        margin: "0 16px",
        animation: "mqdFadeUp 0.5s ease-out",
    }}
    >
    <button
        onClick={onClose}
        style={{
        position: "absolute",
        top: -12,
        right: -12,
        width: 36,
        height: 36,
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(255,255,255,0.12)",
        color: "rgba(255,255,255,0.7)",
        border: "none",
        cursor: "pointer",
        }}
    >
        <X size={15} />
    </button>
    <div style={{ fontSize: 64, marginBottom: 20 }}>🎂</div>
    <div
        style={{
        width: 140,
        height: 140,
        borderRadius: 28,
        marginBottom: 20,
        overflow: "hidden",
        boxShadow: `0 0 0 4px ${M.teal}, 0 8px 48px rgba(0,168,168,0.6)`,
        }}
    >
    <img
      src={resolveImageUrl(emp.photo, FALLBACK_IMAGE)}
      alt={`${emp.firstName} ${emp.lastName}`}
      onError={(e) => { e.currentTarget.src = FALLBACK_IMAGE; }}
      style={{ width: "100%", height: "100%", objectFit: "cover" }}
    />
    </div>
    <div
        style={{
        padding: "4px 14px",
        borderRadius: 999,
        fontSize: 11,
        fontFamily: "DM Mono, monospace",
        marginBottom: 12,
        background: "rgba(0,168,168,0.2)",
        border: `1px solid rgba(0,168,168,0.45)`,
        color: "#67D7D7",
        letterSpacing: "0.09em",
        }}
    >
        {emp.department ?? "Department"} · {emp.position ?? "Team"}
    </div>
    <h2 style={{ fontSize: 36, fontWeight: 800, color: "#fff", margin: "0 0 4px", letterSpacing: "-0.03em" }}>{emp.firstName} {emp.lastName}</h2>
    <p style={{ color: "rgba(255,255,255,0.55)", margin: "0 0 8px", fontSize: 14 }}>{emp.role}</p>
    <p style={{ fontSize: 28, margin: "12px 0" }}>🎉 Happy Birthday! 🎉</p>
    <p style={{ color: "rgba(255,255,255,0.38)", fontSize: 13, marginBottom: 24 }}>
        Wishing you a wonderful day from the entire Marquardt team
    </p>
    <div style={{ width: 200, height: 6, borderRadius: 999, overflow: "hidden", background: "rgba(255,255,255,0.1)", marginBottom: 8 }}>
        <div
        style={{
            height: "100%",
            borderRadius: 999,
            width: `${(cd / 7) * 100}%`,
            background: `linear-gradient(90deg, ${M.teal}, #3B82F6)`,
            transition: "width 1s linear",
        }}
        />
    </div>
    <p style={{ color: "rgba(255,255,255,0.28)", fontSize: 11, fontFamily: "DM Mono, monospace" }}>Auto-closing in {cd}s</p>
    </div>
</div>
);
}
