import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer } from "recharts";
import { Star } from "lucide-react";
import { SectionCard } from "../common/SectionCard";
import { M } from "../../theme/tokens";
import type { MaturityPoint } from "../../types/dashboard";

export function MaturityRadar({ maturity, accent }: { maturity: MaturityPoint[]; accent: string }) {
  const avg = Math.round(maturity.reduce((s, m) => s + m.A, 0) / maturity.length);
  return (
    <SectionCard title="Maturity Dashboard" sub={`Average index: ${avg}/100`} icon={<Star size={16} />}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
        <span style={{ fontSize: 24, fontWeight: 800, fontFamily: "DM Mono, monospace", color: accent }}>{avg}</span>
        <span style={{ fontSize: 12, color: M.textSec }}>/100</span>
      </div>
      <div style={{ height: 160 }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={maturity} margin={{ top: 6, right: 24, bottom: 6, left: 24 }}>
            <PolarGrid stroke={M.border} />
            <PolarAngleAxis dataKey="subject" tick={{ fill: M.textSec, fontSize: 10, fontFamily: "DM Mono, monospace" }} />
            <Radar name="Maturity" dataKey="A" stroke={accent} fill={accent} fillOpacity={0.18} strokeWidth={2} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
        {maturity.map((m) => (
          <div key={m.subject} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", flexShrink: 0, background: accent }} />
            <span style={{ fontSize: 11, color: M.textSec }}>{m.subject}</span>
            <span style={{ fontSize: 11, fontFamily: "DM Mono, monospace", fontWeight: 600, marginLeft: "auto", color: M.textPrimary }}>{m.A}</span>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
