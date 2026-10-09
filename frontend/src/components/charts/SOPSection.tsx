import { Activity } from "lucide-react";
import { SectionCard } from "../common/SectionCard";
import { StatusBadge } from "../common/StatusBadge";
import { M } from "../../theme/tokens";
import type { Project } from "../../types/dashboard";

export function SOPSection({
  sop,
  accent,
}: {
  sop: { adherence: number; projects: Project[] };
  accent: string;
}) {
  return (
    <SectionCard title="SOP Performance" sub="Adherence & project tracking" icon={<Activity size={16} />}>
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <div style={{ position: "relative", width: 80, height: 80, flexShrink: 0 }}>
          <svg viewBox="0 0 80 80" style={{ width: "100%", height: "100%", transform: "rotate(-90deg)" }}>
            <circle cx="40" cy="40" r="32" fill="none" stroke={M.bgTeal} strokeWidth="8" />
            <circle
              cx="40"
              cy="40"
              r="32"
              fill="none"
              stroke={accent}
              strokeWidth="8"
              strokeDasharray={`${(sop.adherence / 100) * 201} 201`}
              strokeLinecap="round"
              style={{ filter: `drop-shadow(0 0 4px ${accent}60)` }}
            />
          </svg>
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span style={{ fontSize: 20, fontWeight: 800, fontFamily: "DM Mono, monospace", color: accent }}>
              {sop.adherence}
            </span>
            <span style={{ fontSize: 9, color: M.textSec }}>%</span>
          </div>
        </div>
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, color: M.textPrimary }}>Schedule Adherence</p>
          <p style={{ fontSize: 11, marginTop: 4, color: M.textSec }}>
            {sop.adherence >= 90 ? "Excellent — targets met" : sop.adherence >= 75 ? "Good — monitor closely" : "Needs attention"}
          </p>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {sop.projects.map((p) => (
          <div key={p.name}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 500, color: M.textPrimary }}>{p.name}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 11, fontFamily: "DM Mono, monospace", color: M.textSec }}>{p.progress}%</span>
                <StatusBadge status={p.status} />
              </div>
            </div>
            <div style={{ height: 5, borderRadius: 999, overflow: "hidden", background: M.bgTeal }}>
              <div
                style={{
                  height: "100%",
                  borderRadius: 999,
                  width: `${p.progress}%`,
                  background:
                    p.status === "On Track"
                      ? `linear-gradient(90deg,${M.success},#16A34A)`
                      : p.status === "Delayed"
                      ? `linear-gradient(90deg,${M.danger},#DC2626)`
                      : `linear-gradient(90deg,${M.warning},#D97706)`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}