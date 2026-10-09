import { Card } from "../common/Card";
import { M } from "../../theme/tokens";
import type { Project } from "../../types/project";

export function ProjectTable({
  projects,
  onEdit,
  onDelete,
}: {
  projects: Project[];
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
}) {
  return (
    <Card style={{ overflow: "hidden" }}>
      <div style={{ width: "100%", overflowX: "auto", paddingBottom: 8 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 500 }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${M.border}` }}>
              {["Title", "Business Unit", "Status", "Start Date", "End Date", "Actions"].map((h) => (
                <th key={h} style={{ textAlign: "left", fontSize: 11, fontWeight: 700, padding: "12px 20px", color: M.textSec }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {projects.map((p, i) => (
              <tr key={p.id} style={{ borderBottom: i < projects.length - 1 ? `1px solid ${M.border}` : "none" }}>
                <td style={{ padding: "12px 20px", fontSize: 13, fontWeight: 600, color: M.textPrimary }}>{p.title}</td>
                <td style={{ padding: "12px 20px" }}>
                  <span style={{ padding: "3px 10px", borderRadius: 10, fontSize: 11, fontWeight: 600, background: `${M.teal}12`, color: M.tealDeep }}>
                    {p.businessUnit?.id ? p.businessUnit.name : "—"}
                  </span>
                </td>
                <td style={{ padding: "12px 20px", fontSize: 12, color: M.textSec }}>{p.status}</td>
                <td style={{ padding: "12px 20px", fontSize: 11, fontFamily: "DM Mono, monospace", color: M.textSec }}>
                  {p.startDate ? new Date(p.startDate).toLocaleDateString() : "—"}
                </td>
                <td style={{ padding: "12px 20px", fontSize: 11, fontFamily: "DM Mono, monospace", color: M.textSec }}>
                  {p.endDate ? new Date(p.endDate).toLocaleDateString() : "—"}
                </td>
                <td style={{ padding: "12px 20px" }}>
                  <button
                    onClick={() => onEdit(p)}
                    style={{ fontSize: 12, padding: "5px 12px", borderRadius: 10, fontWeight: 500, cursor: "pointer", background: M.bgTeal, color: M.textPrimary, border: `1px solid ${M.border}` }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(p)}
                    style={{ fontSize: 12, padding: "5px 12px", borderRadius: 10, fontWeight: 500, cursor: "pointer", background: M.bgTeal, color: M.danger, border: `1px solid ${M.border}`, marginLeft: 8 }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
