import { useEffect, useState } from "react";
import axios from "axios";

import { M } from "../../theme/tokens";
import { createBusinessUnit, getBusinessUnits, deleteBusinessUnit } from "../../api/businessUnitApi";
import type { BusinessUnit } from "../../api/businessUnitApi";
import { Trash2 } from "lucide-react";

export default function BusinessUnitManagementSection() {
  const [items, setItems] = useState<BusinessUnit[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadBusinessUnits = async () => {
    try {
      const result = await getBusinessUnits();
      setItems(result);
    } catch {
      setItems([]);
    }
  };

  useEffect(() => {
    void loadBusinessUnits();
  }, []);

  const handleCreate = async () => {
    if (!name.trim()) {
      setError("Business Unit name is required.");
      setSuccess("");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await createBusinessUnit(name.trim());
      setName("");
      setSuccess("Business Unit created successfully.");
      await loadBusinessUnits();
    } catch (caughtError) {
      if (axios.isAxiosError(caughtError)) {
        setError(caughtError.response?.data?.message ?? "Failed to create business unit.");
      } else {
        setError("Failed to create business unit.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await deleteBusinessUnit(id);
      setSuccess("Business Unit deleted successfully.");
      await loadBusinessUnits();
    } catch (caughtError) {
      setError("Failed to delete business unit.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section style={{ display: "grid", gap: 16 }}>
      <div>
        <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: M.textPrimary }}>Business Units Management</h3>
        <p style={{ margin: "6px 0 0", fontSize: 12, color: M.textSec }}>
          Add and manage Business Units available in the system.
        </p>
      </div>

      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="New business unit name (e.g. HMI)"
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
          {loading ? "Creating..." : "Add BU"}
        </button>
      </div>

      {error && <p style={{ margin: 0, color: M.danger, fontSize: 12 }}>{error}</p>}
      {success && <p style={{ margin: 0, color: M.success, fontSize: 12 }}>{success}</p>}

      <div style={{ border: `1px solid ${M.border}`, borderRadius: 16, overflow: "hidden" }}>
        {items.length === 0 ? (
          <p style={{ margin: 0, padding: 14, fontSize: 12, color: M.textSec }}>No business units available.</p>
        ) : (
          items.map((bu) => (
            <div
              key={bu.id}
              style={{
                padding: "12px 14px",
                borderBottom: `1px solid ${M.border}`,
                background: M.bgTeal,
                fontSize: 13,
                color: M.textPrimary,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}
            >
              <span>{bu.name}</span>
              <button
                onClick={() => void handleDelete(bu.id)}
                disabled={loading}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: M.danger
                }}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
