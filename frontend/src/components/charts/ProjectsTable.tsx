import { Card } from "../common/Card";
import { StatusBadge } from "../common/StatusBadge";
import { M } from "../../theme/tokens";
import type { Project } from "../../types/dashboard";

interface ProjectsTableProps {
  projects: Project[];
  showBU?: boolean;
  actionLabel?: string;
  onAction?: (project: Project) => void;
}

export function ProjectsTable({ projects, showBU = true, actionLabel, onAction }: ProjectsTableProps) {
  const headers = ["Project", ...(showBU ? ["BU"] : []), "Status", "Progress", "Budget", "Deadline", "Health", ...(actionLabel ? [actionLabel] : [])];

  return (
    <Card style={{ overflow: "hidden" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: `1px solid ${M.border}` }}>
            {headers.map((h) => (
              <th key={h} style={{ textAlign: "left", fontSize: 11, fontWeight: 600, padding: "12px 20px", color: M.textSec }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {projects.map((p, i) => (
            <tr key={p.name} style={{ borderBottom: i < projects.length - 1 ? `1px solid ${M.border}` : "none" }}>
              <td style={{ padding: "14px 20px", fontSize: 13, fontWeight: 600, color: M.textPrimary }}>{p.name}</td>
              {showBU && (
                <td style={{ padding: "14px 20px" }}>
                  <span style={{ padding: "3px 10px", borderRadius: 10, fontSize: 11, fontWeight: 600, background: `${M.teal}12`, color: M.tealDeep }}>
                    {p.bu}
                  </span>
                </td>
              )}
              <td style={{ padding: "14px 20px" }}>
                <StatusBadge status={p.status} />
              </td>
              <td style={{ padding: "14px 20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ height: 5, borderRadius: 999, overflow: "hidden", background: M.bgTeal, width: 70 }}>
                    <div
                      style={{
                        height: "100%",
                        borderRadius: 999,
                        width: `${p.progress}%`,
                        background: `linear-gradient(90deg,${M.teal},${M.tealDeep})`,
                      }}
                    />
                  </div>
                  <span style={{ fontSize: 11, fontFamily: "DM Mono, monospace", color: M.textSec }}>{p.progress}%</span>
                </div>
              </td>
              <td style={{ padding: "14px 20px", fontSize: 13, fontFamily: "DM Mono, monospace", color: M.teal }}>{p.budget}</td>
              <td style={{ padding: "14px 20px", fontSize: 11, fontFamily: "DM Mono, monospace", color: M.textSec }}>{p.deadline}</td>
              <td style={{ padding: "14px 20px" }}>
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    fontFamily: "DM Mono, monospace",
                    color: p.health >= 80 ? M.success : p.health >= 60 ? M.warning : M.danger,
                  }}
                >
                  {p.health}%
                </span>
              </td>
              {actionLabel && (
                <td style={{ padding: "14px 20px" }}>
                  <button
                    onClick={() => onAction?.(p)}
                    style={{
                      fontSize: 12,
                      padding: "5px 14px",
                      borderRadius: 10,
                      fontWeight: 600,
                      cursor: "pointer",
                      color: "#fff",
                      border: "none",
                      background: `linear-gradient(135deg,${M.teal},${M.tealDeep})`,
                    }}
                  >
                    {actionLabel}
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
