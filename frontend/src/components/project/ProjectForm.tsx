import { useEffect, useState } from "react";
import { M } from "../../theme/tokens";
import { Button } from "../common/Button";
import type { Project } from "../../types/project";
import { getBusinessUnits } from "../../api/projectApi";

export interface ProjectFormValues {
  title: string;
  businessUnitId?: number;
  status: string;
  apiKey: string;
  startDate: string;
  endDate: string;
}

interface BusinessUnit {
  id: number;
  name: string;
}

const fieldStyle = {
  width: "100%",
  padding: "10px 14px",
  borderRadius: 14,
  fontSize: 13,
  outline: "none",
  border: `1px solid ${M.border}`,
  background: M.white,
  color: M.textPrimary,
};

const labelStyle = {
  fontSize: 12,
  fontWeight: 600,
  color: M.textPrimary,
  display: "block",
  marginBottom: 6,
};

export function ProjectForm({
  initial,
  onCancel,
  onSubmit,
}: {
  initial?: Project;
  onCancel: () => void;
  onSubmit: (values: ProjectFormValues) => void;
}) {
  const [businessUnits, setBusinessUnits] = useState<BusinessUnit[]>([]);

  useEffect(() => {
    getBusinessUnits()
      .then(setBusinessUnits)
      .catch(console.error);
  }, []);

  const [values, setValues] = useState<ProjectFormValues>({
    title: initial?.title ?? "",
    businessUnitId: initial?.businessUnitId,
    status: initial?.status ?? "On Track",
    apiKey: initial?.apiKey ?? "",
    startDate: initial?.startDate?.slice(0, 10) ?? "",
    endDate: initial?.endDate?.slice(0, 10) ?? "",
  });

  // ...


  const set =
    (key: keyof ProjectFormValues) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setValues((v) => ({
        ...v,
        [key]:
          key === "businessUnitId"
            ? e.target.value
              ? Number(e.target.value)
              : undefined
            : e.target.value,
      }));
    };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(values);
      }}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 14,
      }}
    >
      <div>
        <label style={labelStyle}>Title</label>

        <input
          required
          value={values.title}
          onChange={set("title")}
          placeholder="New KPI Dashboard"
          style={fieldStyle}
        />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 14,
        }}
      >
        <div>
          <label style={labelStyle}>Business Unit</label>

          <select
            value={values.businessUnitId ?? ""}
            onChange={set("businessUnitId")}
            style={fieldStyle}
          >
          <option value="">Select business unit</option>

          {businessUnits.map((bu) => (
            <option key={bu.id} value={bu.id}>
              {bu.name}
            </option>
          ))}
        </select>
        </div>

        <div>
          <label style={labelStyle}>Status</label>

          <select
            value={values.status}
            onChange={set("status")}
            style={fieldStyle}
          >
            <option value="On Track">On Track</option>
            <option value="Delayed">Delayed</option>
            <option value="Risk">Risk</option>
          </select>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 14,
        }}
      >
        <div>
          <label style={labelStyle}>Start Date</label>

          <input
            type="date"
            value={values.startDate}
            onChange={set("startDate")}
            style={fieldStyle}
          />
        </div>

        <div>
          <label style={labelStyle}>End Date</label>

          <input
            type="date"
            value={values.endDate}
            onChange={set("endDate")}
            style={fieldStyle}
          />
        </div>
      </div>

      <div>
        <label style={labelStyle}>API Key</label>

        <input
          value={values.apiKey}
          onChange={set("apiKey")}
          placeholder="Optional integration key"
          style={fieldStyle}
        />
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: 10,
          marginTop: 8,
        }}
      >
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>

        <Button type="submit" variant="primary">
          {initial ? "Save Changes" : "Add Project"}
        </Button>
      </div>
    </form>
  );
}