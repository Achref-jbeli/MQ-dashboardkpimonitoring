import { useEffect, useState, useCallback } from "react";
import {
  ClipboardList, Plus, Edit2, Trash2, X, Save, User,
  AlertCircle, CheckCircle2, Clock, PauseCircle, ChevronDown,
} from "lucide-react";
import { M } from "../../theme/tokens";
import {
  getDepartmentTasks,
  createTeamTask,
  updateTeamTask,
  deleteTeamTask,
  type TeamTask,
  type AddTeamTaskInput,
  type UpdateTeamTaskInput,
} from "../../api/taskApi";
import { getEmployees } from "../../api/employeeApi";
import { getProjects } from "../../api/projectApi";
import { getDepartments } from "../../api/departmentApi";
import type { Employee } from "../../types/employee";
import type { Project } from "../../types/project";
import type { Department } from "../../types/department";

// ── Status config ─────────────────────────────────────────────────────────────

const TASK_STATUSES = [
  {
    id: "On Hold",
    label: "On Hold",
    color: "#64748B",
    bg: "#F1F5F9",
    icon: <PauseCircle size={14} />
  },
  {
    id: "In Progress",
    label: "In Progress",
    color: "#3B82F6",
    bg: "#EFF6FF",
    icon: <Clock size={14} />
  },
  {
    id: "Delayed",
    label: "Delayed",
    color: "#EF4444",
    bg: "#FEF2F2",
    icon: <AlertCircle size={14} />
  },
  {
    id: "Done", // IMPORTANT: was "Completed"
    label: "Done",
    color: "#22C55E",
    bg: "#F0FDF4",
    icon: <CheckCircle2 size={14} />
  },
] as const;

type StatusId = (typeof TASK_STATUSES)[number]["id"];

function statusCfg(status: string) {
  const norm = status === "Completed" ? "Done" : status;
  return TASK_STATUSES.find(s => s.id === norm) ?? TASK_STATUSES[0];
}

// ── Types ─────────────────────────────────────────────────────────────────────

type FormState = AddTeamTaskInput & { status: StatusId };

function emptyForm(): FormState {
  return {
    title: "",
    description: "",
    assigneeId: 0,
    projectId: undefined,
    note: "",
    dueDate: "",
    status: "On Hold",
  };
}

function fieldStyle(): React.CSSProperties {
  return {
    width: "100%",
    padding: "9px 12px",
    border: `1px solid ${M.border}`,
    borderRadius: 10,
    fontSize: 13,
    background: "var(--card,#fff)",
    color: M.textPrimary,
    boxSizing: "border-box",
    fontFamily: "inherit",
  };
}

// ── Task Modal ────────────────────────────────────────────────────────────────

function TaskModal({
  task,
  employees,
  projects,
  onClose,
  onSave,
}: {
  task: TeamTask | null;
  employees: Employee[];
  projects: Project[];
  onClose: () => void;
  onSave: (form: FormState) => Promise<void>;
}) {
  const [form, setForm] = useState<FormState>(
    task
      ? {
        title: task.title,
        description: task.description ?? "",
        assigneeId: task.assigneeId ?? 0,
        projectId: task.projectId,
        note: task.note ?? "",
        dueDate: task.dueDate ? task.dueDate.slice(0, 10) : "",
        status: (task.status as StatusId) ?? "On Hold",
      }
      : emptyForm()
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (field: keyof FormState, value: string | number | undefined) =>
    setForm(f => ({ ...f, [field]: value }));

  const submit = async () => {
    if (!form.title.trim()) { setError("Title is required."); return; }
    if (!form.assigneeId) { setError("Please select an assignee."); return; }
    setSaving(true); setError(null);
    try { await onSave(form); onClose(); }
    catch (e: any) { setError(e?.response?.data?.message ?? "Failed to save."); }
    finally { setSaving(false); }
  };

  const lbl = (text: string) => (
    <div style={{ fontSize: 11, fontWeight: 700, color: M.textSec, marginBottom: 5, letterSpacing: "0.05em" }}>{text}</div>
  );

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }} onClick={onClose} />
      <div style={{
        position: "relative", zIndex: 1, background: "var(--card,#fff)",
        borderRadius: 20, padding: "28px 32px",
        width: "min(560px, 94vw)", maxHeight: "90vh", overflowY: "auto",
        boxShadow: "0 20px 60px rgba(0,0,0,0.25)", border: `1px solid ${M.border}`,
      }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <ClipboardList size={18} color={M.teal} />
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: M.textPrimary }}>{task ? "Edit Task" : "New Task"}</h3>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: M.textSec }}><X size={18} /></button>
        </div>

        {error && <div style={{ padding: "10px 14px", borderRadius: 10, background: M.dangerBg, color: M.dangerText, fontSize: 13, marginBottom: 16 }}>{error}</div>}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 20px" }}>
          {/* Title */}
          <div style={{ gridColumn: "1/-1" }}>
            {lbl("TITLE *")}
            <input style={fieldStyle()} value={form.title} onChange={e => set("title", e.target.value)} placeholder="Task title…" />
          </div>

          {/* Assignee */}
          <div>
            {lbl("ASSIGNED TO *")}
            <select style={fieldStyle()} value={form.assigneeId || ""} onChange={e => set("assigneeId", Number(e.target.value))}>
              <option value="">Select employee…</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div>
            {lbl("STATUS")}
            <select style={fieldStyle()} value={form.status} onChange={e => set("status", e.target.value as StatusId)}>
              {TASK_STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </div>

          {/* Project */}
          <div>
            {lbl("PROJECT (optional)")}
            <select
              style={fieldStyle()}
              value={form.projectId ?? ""}
              onChange={e => set("projectId", e.target.value ? Number(e.target.value) : undefined)}
            >
              <option value="">— No project —</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.title ?? `Project #${p.id}`}</option>)}
            </select>
          </div>

          {/* Due Date */}
          <div>
            {lbl("DUE DATE")}
            <input type="date" style={fieldStyle()} value={form.dueDate ?? ""} onChange={e => set("dueDate", e.target.value)} />
          </div>

          {/* Description */}
          <div style={{ gridColumn: "1/-1" }}>
            {lbl("DESCRIPTION")}
            <textarea style={{ ...fieldStyle(), resize: "vertical", minHeight: 72 }} value={form.description ?? ""} onChange={e => set("description", e.target.value)} placeholder="Optional description…" />
          </div>

          {/* Note */}
          <div style={{ gridColumn: "1/-1" }}>
            {lbl("NOTE")}
            <textarea style={{ ...fieldStyle(), resize: "vertical", minHeight: 52 }} value={form.note ?? ""} onChange={e => set("note", e.target.value)} placeholder="Internal notes…" />
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 24 }}>
          <button onClick={onClose} style={{ padding: "9px 20px", borderRadius: 12, border: `1px solid ${M.border}`, background: "none", color: M.textSec, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
          <button
            onClick={submit} disabled={saving}
            style={{ padding: "9px 22px", borderRadius: 12, border: "none", background: `linear-gradient(135deg, ${M.teal}, ${M.tealDeep})`, color: "#fff", fontSize: 13, fontWeight: 700, cursor: saving ? "wait" : "pointer", display: "flex", alignItems: "center", gap: 6 }}
          >
            <Save size={14} />{saving ? "Saving…" : task ? "Update Task" : "Create Task"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Task Card ─────────────────────────────────────────────────────────────────

function TaskCard({
  task, onEdit, onDelete, onStatusChange,
}: {
  task: TeamTask;
  onEdit: () => void;
  onDelete: () => void;
  onStatusChange: (status: string) => void;
}) {
  const cfg = statusCfg(task.status);
  const [showMenu, setShowMenu] = useState(false);
  const isOverdue =
    task.dueDate &&
    task.status !== "Done" &&
    new Date(task.dueDate) < new Date();



  return (
    <div style={{
      background: "var(--card,#fff)", borderRadius: 14, padding: "14px 16px",
      border: `1px solid ${M.border}`, borderLeft: `4px solid ${cfg.color}`,
      boxShadow: "0 2px 8px rgba(0,0,0,0.06)", display: "flex", flexDirection: "column", gap: 10,
    }}>
      {/* Title + actions */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: M.textPrimary, lineHeight: 1.4, flex: 1 }}>{task.title}</div>
        <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
          <button onClick={onEdit} title="Edit" style={{ padding: "4px 6px", borderRadius: 7, border: "none", background: "var(--surface-secondary,#EEF4F7)", color: M.textSec, cursor: "pointer" }}><Edit2 size={12} /></button>
          <button onClick={onDelete} title="Delete" style={{ padding: "4px 6px", borderRadius: 7, border: "none", background: M.dangerBg, color: M.dangerText, cursor: "pointer" }}><Trash2 size={12} /></button>
        </div>
      </div>

      {task.description && (
        <p style={{ margin: 0, fontSize: 12, color: M.textSec, lineHeight: 1.45, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{task.description}</p>
      )}

      {/* Meta */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
        {task.assigneeName && (
          <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: M.textSec, background: "var(--surface-secondary,#EEF4F7)", padding: "3px 8px", borderRadius: 6 }}>
            <User size={10} /> {task.assigneeName}
          </span>
        )}
        {task.dueDate && (
          <span style={{ fontSize: 11, color: isOverdue ? M.dangerText : M.textSec, background: isOverdue ? M.dangerBg : "var(--surface-secondary,#EEF4F7)", padding: "3px 8px", borderRadius: 6, fontWeight: isOverdue ? 700 : 500 }}>
            {isOverdue ? "⚠ " : "📅 "}
            {new Date(task.dueDate).toLocaleDateString("en-GB", { month: "short", day: "numeric" })}
          </span>
        )}
        {task.projectId && (
          <span style={{ fontSize: 11, color: M.teal, background: "rgba(0,168,168,0.1)", padding: "3px 8px", borderRadius: 6 }}>🗂 Project</span>
        )}
      </div>

      {/* Status quick-picker */}
      <div style={{ position: "relative" }}>
        <button
          onClick={() => setShowMenu(v => !v)}
          style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 5, width: "100%", fontSize: 11, fontWeight: 700, padding: "5px 10px", borderRadius: 8, color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.color}40`, cursor: "pointer" }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: 5 }}>{cfg.icon} {cfg.label}</span>
          <ChevronDown size={11} />
        </button>

        {showMenu && (
          <div style={{ position: "absolute", bottom: "calc(100% + 4px)", left: 0, right: 0, zIndex: 50, background: "var(--card,#fff)", borderRadius: 10, border: `1px solid ${M.border}`, boxShadow: "0 8px 24px rgba(0,0,0,0.15)", overflow: "hidden" }}>
            {TASK_STATUSES.map(s => (
              <button key={s.id} onClick={() => { onStatusChange(s.id); setShowMenu(false); }}
                style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "9px 14px", border: "none", background: task.status === s.id ? s.bg : "none", cursor: "pointer", fontSize: 12, fontWeight: 700, color: s.color, textAlign: "left" }}>
                {s.icon} {s.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export function TaskManagementPage({ departmentId: propDepartmentId }: { departmentId?: number | null }) {
  const [tasks, setTasks] = useState<TeamTask[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<TeamTask | null | "new">(null);
  const [filter, setFilter] = useState<StatusId | "all">("all");
  const [year, setYear] = useState<number | undefined>(undefined);
  const [month, setMonth] = useState<number | undefined>(undefined);

  const effectiveDeptId = propDepartmentId ?? undefined;

  const YEARS = Array.from({ length: new Date().getFullYear() - 2019 }, (_, i) => 2020 + i).reverse();
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const load = useCallback(async (deptId?: number, y?: number, m?: number) => {
    try {
      setLoading(true);
      const [t, e, p] = await Promise.all([
        getDepartmentTasks({ departmentId: deptId, year: y, month: m }),
        getEmployees(),
        getProjects(),
      ]);
      setTasks(Array.isArray(t) ? t : []);
      setEmployees(Array.isArray(e) ? e : []);
      setProjects(Array.isArray(p) ? p : []);
      setError(null);
    } catch {
      setError("Failed to load tasks.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(effectiveDeptId, year, month); }, [load, effectiveDeptId, year, month]);

  const handleSave = async (form: FormState) => {
    if (modal === "new") {
      const created = await createTeamTask({
        title: form.title, description: form.description,
        assigneeId: form.assigneeId, projectId: form.projectId,
        note: form.note, dueDate: form.dueDate,
      });
      // Apply chosen status if not default
      if (form.status !== "On Hold") {
        const updated = await updateTeamTask(created.id, { status: form.status });
        setTasks(prev => [updated, ...prev]);
      } else {
        setTasks(prev => [created, ...prev]);
      }
    } else if (modal && modal !== "new") {
      const payload: UpdateTeamTaskInput = {
        title: form.title, description: form.description, status: form.status,
        assigneeId: form.assigneeId, projectId: form.projectId ?? 0,
        note: form.note, dueDate: form.dueDate,
      };
      const updated = await updateTeamTask(modal.id, payload);
      setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
    }
  };

  const handleStatusChange = async (task: TeamTask, status: string) => {
    try {
      const updated = await updateTeamTask(task.id, { status });
      setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
    } catch { /* silent */ }
  };

  const handleDelete = async (task: TeamTask) => {
    if (!window.confirm(`Delete task "${task.title}"?`)) return;
    await deleteTeamTask(task.id);
    setTasks(prev => prev.filter(t => t.id !== task.id));
  };

  const counts = Object.fromEntries(
    TASK_STATUSES.map(s => [
      s.id,
      tasks.filter(t => (s.id === "Done" ? (t.status === "Done" || t.status === "Completed") : t.status === s.id)).length,
    ])
  );

  const displayed = filter === "all"
    ? tasks
    : filter === "Done"
      ? tasks.filter(t => t.status === "Done" || t.status === "Completed")
      : tasks.filter(t => t.status === filter);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>

      {/* ── Page header ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 42, height: 42, borderRadius: 13, background: "rgba(0,168,168,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ClipboardList size={20} color={M.teal} />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: M.textPrimary }}>Task Management</h2>
            <p style={{ margin: "2px 0 0", fontSize: 12, color: M.textSec }}>Department tasks — assign, track status, link to projects</p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          {/* Date filters */}
          <select
            value={year ?? ""}
            onChange={e => setYear(e.target.value ? Number(e.target.value) : undefined)}
            style={{ padding: "8px 12px", borderRadius: 10, border: `1px solid ${M.border}`, fontSize: 13, background: "var(--card,#fff)", color: M.textPrimary, cursor: "pointer", fontFamily: "inherit" }}
          >
            <option value="">All Years</option>
            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <select
            value={month ?? ""}
            onChange={e => setMonth(e.target.value ? Number(e.target.value) : undefined)}
            style={{ padding: "8px 12px", borderRadius: 10, border: `1px solid ${M.border}`, fontSize: 13, background: "var(--card,#fff)", color: M.textPrimary, cursor: "pointer", fontFamily: "inherit" }}
          >
            <option value="">All Months</option>
            {MONTHS.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
          </select>
          <button
            onClick={() => setModal("new")}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 18px", borderRadius: 12, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700, background: `linear-gradient(135deg, ${M.teal}, ${M.tealDeep})`, color: "#fff", boxShadow: "0 4px 12px rgba(0,168,168,0.3)" }}
          >
            <Plus size={15} /> Add Task
          </button>
        </div>
      </div>

      {/* ── Status filter pills ── */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {([["all", "All", tasks.length, M.teal]] as [string, string, number, string][]).concat(
          TASK_STATUSES.map(s => [s.id, s.label, counts[s.id] ?? 0, s.color] as [string, string, number, string])
        ).map(([id, label, count, color]) => (
          <button key={id} onClick={() => setFilter(id as StatusId | "all")}
            style={{
              padding: "7px 15px", borderRadius: 999, fontSize: 12, fontWeight: 700, cursor: "pointer", transition: "all 0.15s",
              border: `1.5px solid ${filter === id ? color : M.border}`,
              background: filter === id ? `${color}18` : "var(--card,#fff)",
              color: filter === id ? color : M.textSec,
            }}
          >
            {label} ({count})
          </button>
        ))}
      </div>

      {error && <div style={{ padding: "10px 14px", borderRadius: 12, background: M.dangerBg, color: M.dangerText, fontSize: 13 }}>{error}</div>}

      {/* ── Kanban board ── */}
      {loading ? (
        <div style={{ padding: "60px 0", textAlign: "center", color: M.textSec, fontSize: 14 }}>Loading tasks…</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, alignItems: "start" }}>
          {TASK_STATUSES.map(col => {
            const colTasks = displayed.filter(t => t.status === col.id);
            return (
              <div key={col.id} style={{ background: col.bg, borderRadius: 16, border: `1px solid ${col.color}30`, overflow: "hidden", minHeight: 140 }}>
                {/* Column header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", borderBottom: `2px solid ${col.color}40` }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 800, color: col.color, letterSpacing: "0.05em" }}>
                    {col.icon} {col.label.toUpperCase()}
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 800, color: col.color, background: `${col.color}18`, padding: "2px 8px", borderRadius: 99 }}>
                    {colTasks.length}
                  </span>
                </div>

                {/* Cards */}
                <div style={{ padding: "10px", display: "flex", flexDirection: "column", gap: 10 }}>
                  {colTasks.map(task => (
                    <TaskCard key={task.id} task={task}
                      onEdit={() => setModal(task)}
                      onDelete={() => handleDelete(task)}
                      onStatusChange={status => handleStatusChange(task, status)}
                    />
                  ))}
                  {colTasks.length === 0 && (
                    <div style={{ padding: "24px 0", textAlign: "center", fontSize: 12, color: col.color, opacity: 0.45 }}>No tasks</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Modal ── */}
      {modal !== null && (
        <TaskModal
          task={modal === "new" ? null : modal}
          employees={employees}
          projects={projects}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
