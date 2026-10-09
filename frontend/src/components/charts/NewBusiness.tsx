import { Globe } from "lucide-react";
import { SectionCard } from "../common/SectionCard";
import { M } from "../../theme/tokens";
import type { Deal } from "../../types/dashboard";

export function NewBusiness({ deals, accent }: { deals: Deal[]; accent: string }) {
  return (
    <SectionCard title="International Business" sub="Deals gained from outside the country" icon={<Globe size={16} />}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10 }}>
        {deals.map((d) => (
          <div
            key={d.deal}
            style={{
              borderRadius: 18,
              padding: 14,
              display: "flex",
              flexDirection: "column",
              gap: 8,
              background: M.bgTeal,
              border: `1px solid ${M.border}`,
              transition: "transform .15s",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 22 }}>{d.flag}</span>
              <span style={{ fontSize: 11, fontWeight: 500, color: M.textSec }}>{d.country}</span>
            </div>
            <p style={{ fontSize: 11, fontWeight: 600, color: M.textPrimary, lineHeight: 1.4 }}>{d.deal}</p>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto" }}>
              <span style={{ fontSize: 13, fontWeight: 700, fontFamily: "DM Mono, monospace", color: accent }}>{d.value}</span>
              <span
                style={{
                  fontSize: 10,
                  padding: "2px 7px",
                  borderRadius: 999,
                  fontWeight: 600,
                  color: d.status === "Signed" ? "#065F46" : "#92400E",
                  background: d.status === "Signed" ? "#D1FAE5" : "#FEF3C7",
                }}
              >
                {d.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}