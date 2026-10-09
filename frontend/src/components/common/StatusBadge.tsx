import { CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import { M } from "../../theme/tokens";
import type { ProjectStatus } from "../../types/dashboard";

export function StatusBadge({ status }: { status: ProjectStatus }) {
  const cfg = {
    "On Track": { c: M.successText, bg: M.successBg, border: M.border, icon: <CheckCircle2 size={11} /> },
    Delayed: { c: M.dangerText, bg: M.dangerBg, border: M.border, icon: <Clock size={11} /> },
    Risk: { c: M.warningText, bg: M.warningBg, border: M.border, icon: <AlertTriangle size={11} /> },
  }[status] || { c: M.textSec, bg: "var(--surface-secondary, #EEF4F7)", border: M.border, icon: null };

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "3px 9px",
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 700,
        color: cfg.c,
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
      }}
    >
      {cfg.icon}
      {status}
    </span>
  );
}
