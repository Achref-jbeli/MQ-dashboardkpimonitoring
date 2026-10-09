import React, { useState, useEffect, useCallback } from "react";
import { M } from "../../theme/tokens";
import {
  getMilestones,
  createMilestone,
  updateMilestone,
  deleteMilestone,
} from "../../api/milestoneApi";
import { getProjects } from "../../api/projectApi";
import type { Milestone } from "../../types/milestone";
import type { Project } from "../../types/project";
import { getActiveDepartmentId } from "../../utils/departmentScope";
import { getAuthenticatedSafeUser } from "../../utils/safeUser";
import {
  Plus,
  Trash2,
  Edit2,
  CalendarCheck2,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  AlertCircle,
  X,
} from "lucide-react";

interface MilestonesPageProps {
  departmentId?: number | null;
}

export function MilestonesPage({ departmentId }: MilestonesPageProps) {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState<number | "all">("all");
  const [error, setError] = useState<string | null>(null);

  const effectiveDepartmentId =
    departmentId ?? getActiveDepartmentId() ?? getAuthenticatedSafeUser().departmentId;

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);
  const [formData, setFormData] = useState({
    projectId: 0,
    name: "",
    description: "",
    plannedDate: "",
    actualDate: "",
    status: "Open",
    responsible: "",
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [mList, pList] = await Promise.all([
        getMilestones(effectiveDepartmentId ?? undefined),
        getProjects(effectiveDepartmentId ? { departmentId: effectiveDepartmentId } : undefined),
      ]);

      setMilestones(Array.isArray(mList) ? mList : []);
      setProjects(Array.isArray(pList) ? pList : []);
    } catch (err: any) {
      console.error("Failed to load milestones:", err);
      setError("Failed to load milestones data.");
    } finally {
      setLoading(false);
    }
  }, [effectiveDepartmentId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenCreate = () => {
    setEditingMilestone(null);
    setFormData({
      projectId: projects[0]?.id || 0,
      name: "",
      description: "",
      plannedDate: "",
      actualDate: "",
      status: "Open",
      responsible: "",
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (m: Milestone) => {
    setEditingMilestone(m);
    setFormData({
      projectId: m.projectId,
      name: m.name,
      description: m.description || "",
      plannedDate: m.plannedDate ? m.plannedDate.slice(0, 10) : "",
      actualDate: m.actualDate ? m.actualDate.slice(0, 10) : "",
      status: m.status || "Open",
      responsible: m.responsible || "",
    });
    setModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this milestone?")) return;
    try {
      await deleteMilestone(id);
      setMilestones((prev) => prev.filter((m) => m.id !== id));
    } catch (err) {
      console.error("Failed to delete milestone:", err);
      alert("Failed to delete milestone.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalDeptId =
      effectiveDepartmentId ??
      (formData.projectId ? projects.find((p) => p.id === formData.projectId)?.departmentId : undefined) ??
      0;

    if (!formData.projectId || !formData.name.trim()) {
      alert("Please select a project and enter a milestone name.");
      return;
    }

    try {
      if (editingMilestone) {
        const updated = await updateMilestone(editingMilestone.id, {
          projectId: formData.projectId,
          name: formData.name,
          description: formData.description || undefined,
          plannedDate: formData.plannedDate ? new Date(formData.plannedDate).toISOString() : undefined,
          actualDate: formData.actualDate ? new Date(formData.actualDate).toISOString() : undefined,
          status: formData.status,
          responsible: formData.responsible || undefined,
        });
        setMilestones((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
      } else {
        const created = await createMilestone({
          departmentId: finalDeptId,
          projectId: formData.projectId,
          name: formData.name,
          description: formData.description || undefined,
          plannedDate: formData.plannedDate ? new Date(formData.plannedDate).toISOString() : undefined,
          actualDate: formData.actualDate ? new Date(formData.actualDate).toISOString() : undefined,
          status: formData.status,
          responsible: formData.responsible || undefined,
        });
        setMilestones((prev) => [...prev, created]);
      }
      setModalOpen(false);
    } catch (err) {
      console.error("Failed to save milestone:", err);
      alert("Failed to save milestone.");
    }
  };

  const getPepCategory = (m: Milestone) => {
    const isCompleted = m.actualDate || m.status === "Completed";
    if (!isCompleted || !m.actualDate || !m.plannedDate) {
      return { label: "Open", color: "#00B8C2", bg: "rgba(0, 184, 194, 0.12)" };
    }
    const delay = Math.max(
      0,
      (new Date(m.actualDate).getTime() - new Date(m.plannedDate).getTime()) / (1000 * 3600 * 24)
    );
    if (delay <= 14) {
      return { label: "On time / ≤ 2w", color: "#10B981", bg: "rgba(16, 185, 129, 0.12)" };
    }
    if (delay <= 28) {
      return { label: "Delay 2–4w", color: "#F59E0B", bg: "rgba(245, 158, 11, 0.12)" };
    }
    return { label: "Delay > 4w", color: "#EF4444", bg: "rgba(239, 68, 68, 0.12)" };
  };

  const filtered = milestones.filter((m) => {
    if (selectedProjectId !== "all" && m.projectId !== selectedProjectId) {
      return false;
    }
    const q = search.toLowerCase();
    return (
      m.name.toLowerCase().includes(q) ||
      (m.projectTitle ?? "").toLowerCase().includes(q) ||
      (m.responsible ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <div style={{ padding: "24px 32px", maxWidth: 1280, margin: "0 auto" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 24,
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 26,
              fontWeight: 800,
              color: "var(--text-primary, #0B192C)",
              margin: 0,
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <CalendarCheck2 size={26} color={M.teal} />
            PEP Milestones
          </h1>
          <p style={{ fontSize: 14, color: M.textSec, margin: "4px 0 0" }}>
            Track and manage PEP project milestones and schedule performance.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 18px",
            background: `linear-gradient(135deg, ${M.teal}, ${M.tealDeep})`,
            color: "#fff",
            border: "none",
            borderRadius: 10,
            fontWeight: 700,
            cursor: "pointer",
            boxShadow: "0 4px 14px rgba(0, 181, 200, 0.35)",
            transition: "transform 0.2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.03)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          <Plus size={18} />
          New Milestone
        </button>
      </div>

      {/* Filter Bar */}
      <div
        style={{
          display: "flex",
          gap: 16,
          marginBottom: 20,
          flexWrap: "wrap",
          background: "var(--card, #FFFFFF)",
          padding: 16,
          borderRadius: 14,
          border: `1px solid var(--border, ${M.border})`,
        }}
      >
        {/* Search */}
        <div style={{ position: "relative", flex: 1, minWidth: 220 }}>
          <Search
            size={16}
            style={{
              position: "absolute",
              left: 12,
              top: "50%",
              transform: "translateY(-50%)",
              color: M.textSec,
            }}
          />
          <input
            type="text"
            placeholder="Search milestones, projects, owners..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 12px 10px 38px",
              borderRadius: 10,
              border: `1px solid var(--border, ${M.border})`,
              background: "var(--background, #F8FAFC)",
              color: "var(--text-primary, #0B192C)",
              fontSize: 14,
              outline: "none",
            }}
          />
        </div>

        {/* Project Filter */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Filter size={16} color={M.textSec} />
          <select
            value={selectedProjectId}
            onChange={(e) =>
              setSelectedProjectId(
                e.target.value === "all" ? "all" : parseInt(e.target.value, 10)
              )
            }
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              border: `1px solid var(--border, ${M.border})`,
              background: "var(--background, #F8FAFC)",
              color: "var(--text-primary, #0B192C)",
              fontSize: 14,
              fontWeight: 600,
              outline: "none",
              cursor: "pointer",
            }}
          >
            <option value="all">All Projects ({projects.length})</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div
        style={{
          background: "var(--card, #FFFFFF)",
          borderRadius: 16,
          border: `1px solid var(--border, ${M.border})`,
          overflow: "hidden",
          boxShadow: "0 4px 18px rgba(0,0,0,0.04)",
        }}
      >
        {loading ? (
          <div style={{ padding: 48, textAlign: "center", color: M.textSec }}>
            Loading milestones...
          </div>
        ) : error ? (
          <div style={{ padding: 48, textAlign: "center", color: M.danger }}>
            {error}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 48, textAlign: "center", color: M.textSec }}>
            No milestones found. Click "New Milestone" to create one.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr
                  style={{
                    background: "var(--surface-secondary, #F8FAFC)",
                    borderBottom: `1px solid var(--border, ${M.border})`,
                    color: M.textSec,
                    fontSize: 12,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  <th style={{ padding: "14px 18px" }}>Milestone</th>
                  <th style={{ padding: "14px 18px" }}>Project</th>
                  <th style={{ padding: "14px 18px" }}>Planned Date</th>
                  <th style={{ padding: "14px 18px" }}>Actual Date</th>
                  <th style={{ padding: "14px 18px" }}>PEP Status</th>
                  <th style={{ padding: "14px 18px" }}>Owner</th>
                  <th style={{ padding: "14px 18px", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((m) => {
                  const pep = getPepCategory(m);
                  return (
                    <tr
                      key={m.id}
                      style={{
                        borderBottom: `1px solid var(--border, #F1F5F9)`,
                        transition: "background 0.15s",
                      }}
                    >
                      <td style={{ padding: "14px 18px" }}>
                        <div style={{ fontWeight: 700, color: "var(--text-primary, #0B192C)", fontSize: 14 }}>
                          {m.name}
                        </div>
                        {m.description && (
                          <div style={{ fontSize: 12, color: M.textSec, marginTop: 2 }}>
                            {m.description}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: "14px 18px", fontSize: 13, fontWeight: 600, color: M.teal }}>
                        {m.projectTitle || `Project #${m.projectId}`}
                      </td>
                      <td style={{ padding: "14px 18px", fontSize: 13, color: M.textSec, fontFamily: "DM Mono, monospace" }}>
                        {m.plannedDate ? new Date(m.plannedDate).toLocaleDateString("en-GB") : "-"}
                      </td>
                      <td style={{ padding: "14px 18px", fontSize: 13, color: M.textSec, fontFamily: "DM Mono, monospace" }}>
                        {m.actualDate ? new Date(m.actualDate).toLocaleDateString("en-GB") : "-"}
                      </td>
                      <td style={{ padding: "14px 18px" }}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 5,
                            padding: "4px 10px",
                            borderRadius: 20,
                            fontSize: 12,
                            fontWeight: 700,
                            color: pep.color,
                            background: pep.bg,
                          }}
                        >
                          {pep.label}
                        </span>
                      </td>
                      <td style={{ padding: "14px 18px", fontSize: 13, color: M.textSec }}>
                        {m.responsible || "-"}
                      </td>
                      <td style={{ padding: "14px 18px", textAlign: "right" }}>
                        <div style={{ display: "inline-flex", gap: 8 }}>
                          <button
                            onClick={() => handleOpenEdit(m)}
                            title="Edit"
                            style={{
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              color: M.teal,
                              padding: 4,
                            }}
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(m.id)}
                            title="Delete"
                            style={{
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              color: M.danger,
                              padding: 4,
                            }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: 20,
          }}
        >
          <div
            style={{
              background: "var(--card, #FFFFFF)",
              borderRadius: 16,
              width: "100%",
              maxWidth: 520,
              padding: 24,
              boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
              border: `1px solid var(--border, ${M.border})`,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 20,
              }}
            >
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "var(--text-primary, #0B192C)" }}>
                {editingMilestone ? "Edit Milestone" : "Create New Milestone"}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: M.textSec }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 6, color: M.textSec }}>
                  Project *
                </label>
                <select
                  required
                  value={formData.projectId}
                  onChange={(e) => setFormData({ ...formData, projectId: parseInt(e.target.value, 10) })}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 8,
                    border: `1px solid var(--border, ${M.border})`,
                    background: "var(--background, #F8FAFC)",
                    color: "var(--text-primary, #0B192C)",
                    fontSize: 14,
                  }}
                >
                  <option value={0} disabled>
                    Select Project
                  </option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 6, color: M.textSec }}>
                  Milestone Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. PEP Phase 1 Concept Freeze"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 8,
                    border: `1px solid var(--border, ${M.border})`,
                    background: "var(--background, #F8FAFC)",
                    color: "var(--text-primary, #0B192C)",
                    fontSize: 14,
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 6, color: M.textSec }}>
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Optional milestone scope, deliverables, or criteria"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 8,
                    border: `1px solid var(--border, ${M.border})`,
                    background: "var(--background, #F8FAFC)",
                    color: "var(--text-primary, #0B192C)",
                    fontSize: 14,
                    resize: "vertical",
                  }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 6, color: M.textSec }}>
                    Planned Date
                  </label>
                  <input
                    type="date"
                    value={formData.plannedDate}
                    onChange={(e) => setFormData({ ...formData, plannedDate: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: 8,
                      border: `1px solid var(--border, ${M.border})`,
                      background: "var(--background, #F8FAFC)",
                      color: "var(--text-primary, #0B192C)",
                      fontSize: 14,
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 6, color: M.textSec }}>
                    Actual Completion Date
                  </label>
                  <input
                    type="date"
                    value={formData.actualDate}
                    onChange={(e) => setFormData({ ...formData, actualDate: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: 8,
                      border: `1px solid var(--border, ${M.border})`,
                      background: "var(--background, #F8FAFC)",
                      color: "var(--text-primary, #0B192C)",
                      fontSize: 14,
                    }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 6, color: M.textSec }}>
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: 8,
                      border: `1px solid var(--border, ${M.border})`,
                      background: "var(--background, #F8FAFC)",
                      color: "var(--text-primary, #0B192C)",
                      fontSize: 14,
                    }}
                  >
                    <option value="Open">Open</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Delayed">Delayed</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 6, color: M.textSec }}>
                    Responsible Owner
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Lead Engineer"
                    value={formData.responsible}
                    onChange={(e) => setFormData({ ...formData, responsible: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: 8,
                      border: `1px solid var(--border, ${M.border})`,
                      background: "var(--background, #F8FAFC)",
                      color: "var(--text-primary, #0B192C)",
                      fontSize: 14,
                    }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 12 }}>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  style={{
                    padding: "10px 16px",
                    borderRadius: 8,
                    border: `1px solid var(--border, ${M.border})`,
                    background: "transparent",
                    color: M.textSec,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: "10px 20px",
                    borderRadius: 8,
                    border: "none",
                    background: `linear-gradient(135deg, ${M.teal}, ${M.tealDeep})`,
                    color: "#fff",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {editingMilestone ? "Save Changes" : "Create Milestone"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
