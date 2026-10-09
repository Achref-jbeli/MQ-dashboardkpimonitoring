import { M } from "../../theme/tokens";
import { MarquardtLogo } from "../../components/common/Logo";
import { Card } from "../../components/common/Card";

export function AboutPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 640 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 8 }}>
        <MarquardtLogo height={32} />
      </div>
      <Card style={{ padding: 28 }}>
        <p style={{ fontSize: 14, lineHeight: 1.8, color: M.textSec, margin: "0 0 16px" }}>
          The Marquardt KPI Monitoring Dashboard provides real-time visibility into HMI and HIS project performance, team metrics, and business
          intelligence for global manufacturing operations.
        </p>
        <p style={{ fontSize: 13, color: M.textSec, margin: 0, fontFamily: "DM Mono, monospace" }}>Version 4.0 · Marquardt Enterprise KPI Platform</p>
      </Card>
    </div>
  );
}
