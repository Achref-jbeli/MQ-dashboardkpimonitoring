import { useEffect, useState } from "react";
import axios from "axios";

import { M } from "../../theme/tokens";
import { createDepartment, getDepartments } from "../../api/departmentApi";
import type { Department } from "../../types/department";

export default function DepartmentManagementSection() {
  const [items, setItems] = useState<Department[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadDepartments = async () => {
    try {
      const result = await getDepartments();
      setItems(result);
    } catch {
      setItems([]);
    }
  };

  useEffect(() => {
    void loadDepartments();
  }, []);

  const handleCreate = async () => {
    if (!name.trim()) {
      setError("Department name is required.");
      setSuccess("");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await createDepartment({ name: name.trim() });
      setName("");
      setSuccess("Department created successfully.");
      await loadDepartments();
    } catch (caughtError) {
      if (axios.isAxiosError(caughtError)) {
        setError(caughtError.response?.data?.message ?? "Failed to create department.");
      } else {
        setError("Failed to create department.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <section style={{ display: "grid", gap: 16 }}>
      <div>
        <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: M.textPrimary }}>Department Management</h3>
        <p style={{ margin: "6px 0 0", fontSize: 12, color: M.textSec }}>
          Add new departments and keep the global department list up to date.
        </p>
      </div>

      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="New department name"
          style={{
            flex: 1,
            padding: "12px 14px",
            borderRadius: 14,
            border: `1px solid ${M.border}`,
            background: M.white,
            color: M.textPrimary,
          }}
        />
        <button
          onClick={() => void handleCreate()}
          disabled={loading}
          style={{
            padding: "12px 16px",
            borderRadius: 14,
            border: "none",
            background: M.teal,
            color: "#fff",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          {loading ? "Creating..." : "Add Department"}
        </button>
      </div>

      {error && <p style={{ margin: 0, color: M.danger, fontSize: 12 }}>{error}</p>}
      {success && <p style={{ margin: 0, color: M.success, fontSize: 12 }}>{success}</p>}

      <div style={{ border: `1px solid ${M.border}`, borderRadius: 16, overflow: "hidden" }}>
        {items.length === 0 ? (
          <p style={{ margin: 0, padding: 14, fontSize: 12, color: M.textSec }}>No departments available.</p>
        ) : (
          items.map((department) => (
            <div
              key={department.id}
              style={{
                padding: "12px 14px",
                borderBottom: `1px solid ${M.border}`,
                background: M.bgTeal,
                fontSize: 13,
                color: M.textPrimary,
              }}
            >
              {department.name}
            </div>
          ))
        )}
      </div>
    </section>
  );
}
