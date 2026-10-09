import type { ReactNode } from "react";
import { M } from "../../theme/tokens";

export function ComingSoon({ icon, label }: { icon: ReactNode; label: string }) {
return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 0", gap: 16 }}>
    <div style={{ color: M.teal, opacity: 0.35 }}>{icon}</div>
    <p style={{ fontSize: 17, fontWeight: 600, color: M.textSec, margin: 0 }}>{label} Module</p>
    <p style={{ fontSize: 13, color: M.border, margin: 0 }}>Full implementation available in production build</p>
    </div>
);
}
