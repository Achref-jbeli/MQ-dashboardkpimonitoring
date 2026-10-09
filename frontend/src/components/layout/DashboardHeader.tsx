import { ThemeSelector } from "../common/ThemeSelector";
import { M } from "../../theme/tokens";

export function DashboardHeader({
title,
subtitle,
right,
}: {
title: string;
subtitle: string;
right?: React.ReactNode;
}) {
return (
<div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 16 }}>
    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
    <div style={{ width: 2, height: 28, background: "var(--page-title, #16374A)", opacity: 0.5 }} />
    <div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--page-title, #16374A)", margin: 0, letterSpacing: "-0.02em" }}>{title}</h1>
        <p style={{ fontSize: 12, fontWeight: 500, color: "var(--page-subtitle, #6B7C87)", margin: "3px 0 0" }}>{subtitle}</p>
    </div>
    </div>
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <ThemeSelector compact />
        {right}
    </div>
</div>
);
}
