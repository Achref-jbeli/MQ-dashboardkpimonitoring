import { useState, useEffect } from "react";
import { Button } from "../../components/common/Button";
import { SearchInput } from "../../components/common/SearchInput";
import { ProjectTable } from "../../components/project/ProjectTable";
import { ProjectModal } from "../../components/project/ProjectModal";
import type { ProjectFormValues } from "../../components/project/ProjectForm";
import type { Project } from "../../types/project";
import { getProjects, createProject, updateProject, deleteProject } from "../../api/projectApi";

export function ProjectsPage() {
const [projects, setProjects] = useState<Project[]>([]);
const [search, setSearch] = useState("");
const [editing, setEditing] = useState<Project | null>(null);
const [showModal, setShowModal] = useState(false);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);

const loadProjects = async () => {
  try {
    setLoading(true);
    const data = await getProjects();
    setProjects(data);
    setError(null);
  } catch (error) {
    console.error("Error fetching projects:", error);
    setError("Failed to load projects.");
  } finally {
    setLoading(false);
  }
};

useEffect(() => {
  loadProjects();
}, []);

const filtered = projects.filter(
  (p) =>
    (p.title ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (p.businessUnit?.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (p.status ?? "").toLowerCase().includes(search.toLowerCase())
);

const handleSubmit = async (values: ProjectFormValues) => {
  const projectData = {
    title: values.title,
    businessUnitId: values.businessUnitId,
    status: values.status,
    apiKey: values.apiKey,
    startDate: values.startDate || undefined,
    endDate: values.endDate || undefined,
  };
  try {
    if (editing) {
      const updated = await updateProject(editing.id, projectData);
      setProjects((prev) => prev.map((p) => (p.id === editing.id ? updated : p)));
    } else {
      const created = await createProject(projectData);
      setProjects((prev) => [...prev, created]);
    }
    setShowModal(false);
    setEditing(null);
  } catch (error) {
    console.error("Error saving project:", error);
    setError("Failed to save project.");
  }
};

const handleDelete = async (project: Project) => {
  if (!confirm(`Delete project "${project.title}"?`)) return;
  try {
    await deleteProject(project.id);
    setProjects((prev) => prev.filter((p) => p.id !== project.id));
  } catch (error) {
    console.error("Error deleting project:", error);
    setError("Failed to delete project.");
  }
};

return (
  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <SearchInput value={search} onChange={setSearch} placeholder="Search projects..." />
      <Button
        onClick={() => {
          setEditing(null);
          setShowModal(true);
        }}
      >
        + Add Project
      </Button>
    </div>
    {error && <p style={{ color: "#B91C1C", fontSize: 12, margin: 0 }}>{error}</p>}
    {loading ? (
      <p style={{ fontSize: 13 }}>Loading projects...</p>
    ) : (
      <ProjectTable
        projects={filtered}
        onEdit={(project) => {
          setEditing(project);
          setShowModal(true);
        }}
        onDelete={handleDelete}
      />
    )}
    {showModal && (
      <ProjectModal
        project={editing ?? undefined}
        onClose={() => {
          setShowModal(false);
          setEditing(null);
        }}
        onSubmit={handleSubmit}
      />
    )}
  </div>
);
}

