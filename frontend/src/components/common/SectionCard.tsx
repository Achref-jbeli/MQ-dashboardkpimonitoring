import type { ReactNode } from "react";
import { Card } from "./Card";
import { M } from "../../theme/tokens";

export function SectionCard({
  title,
  sub,
  icon,
  children,
}: {
  title: string;
  sub?: string;
  icon?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Card style={{ padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: M.textPrimary, margin: 0 }}>{title}</h3>
          {sub && <p style={{ fontSize: 11, color: M.textSec, margin: "2px 0 0" }}>{sub}</p>}
        </div>
        {icon && (
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: M.bgTeal,
              color: M.teal,
            }}
          >
            {icon}
          </div>
        )}
      </div>
      {children}
    </Card>
  );
}