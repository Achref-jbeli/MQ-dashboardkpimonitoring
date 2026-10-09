import { useState, useEffect } from "react";
import { M } from "../../theme/tokens";
import { Button } from "../common/Button";
import type { Employee } from "../../types/employee";
import type { Department } from "../../types/department";
import type { TeamDto } from "../../types/TeamDto";
import { uploadEmployeePhoto } from "../../api/employeeApi";
import { getTeams } from "../../api/TeamApi";

export interface EmployeeFormValues {
  firstName: string;
  lastName: string;
  email: string;
  position: string;
  department: string;
  departmentId: string;
  teamId: string;
  role: string;
  professionalDomain: string;
  seniority: string;
  photo: string;
  birthDate: string;
  hireDate: string;
  isActive: boolean;
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

export function EmployeeForm({
  initial,
  departments,
  onCancel,
  onSubmit,
}: {
  initial?: Employee;
  departments: Department[];
  onCancel: () => void;
  onSubmit: (values: EmployeeFormValues) => void | Promise<void>;
}) {
  const [values, setValues] = useState<EmployeeFormValues>({
    firstName: initial?.firstName ?? "",
    lastName: initial?.lastName ?? "",
    email: initial?.email ?? "",
    position: initial?.position ?? "",
    department: initial?.department ?? "",
    departmentId: initial?.departmentId != null ? String(initial.departmentId) : "",
    teamId: initial?.teamId != null ? String(initial.teamId) : "",
    professionalDomain: initial?.professionalDomain ?? "",
    seniority: initial?.seniority ?? "",
    role: initial?.role ?? "Employee",
    photo: initial?.photo ?? "",
    birthDate: initial?.birthDate ? initial.birthDate.split("T")[0] : "",
    hireDate: initial?.hireDate ? initial.hireDate.split("T")[0] : "",
    isActive: initial?.isActive ?? true,
  });

  const [availableTeams, setAvailableTeams] = useState<TeamDto[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [validationErrors, setValidationErrors] = useState<Partial<Record<keyof EmployeeFormValues, string>>>({});

  // Single department (e.g. Administrator scope) — auto-select, no picker needed.
  useEffect(() => {
    if (!values.departmentId && departments.length === 1) {
      setValues((v) => ({ ...v, departmentId: String(departments[0].id) }));
    }
  }, [departments, values.departmentId]);

  // Load teams when departmentId changes
  useEffect(() => {
    if (!values.departmentId) {
      setAvailableTeams([]);
      return;
    }

    let isMounted = true;
    setLoadingTeams(true);

    getTeams(Number(values.departmentId))
      .then((teams) => {
        if (isMounted) {
          setAvailableTeams(teams || []);
          if (values.teamId && !teams.some((t) => String(t.id) === values.teamId)) {
            setValues((v) => ({ ...v, teamId: "" }));
          }
        }
      })
      .catch((err) => {
        console.error("Failed to load department teams:", err);
        if (isMounted) setAvailableTeams([]);
      })
      .finally(() => {
        if (isMounted) setLoadingTeams(false);
      });

    return () => {
      isMounted = false;
    };
  }, [values.departmentId]);

  const set =
    (key: keyof EmployeeFormValues) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setValues((v) => ({
        ...v,
        [key]: e.target.value,
      }));
    };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Image must be smaller than 5 MB.");
      return;
    }

    setSelectedPhoto(file);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const errors: Partial<Record<keyof EmployeeFormValues, string>> = {};

    // Required fields: Full Name, Email, Department
    if (!values.firstName.trim()) errors.firstName = "First name is required.";
    if (!values.lastName.trim()) errors.lastName = "Last name is required.";
    if (!values.email.trim()) errors.email = "Email address is required.";
    if (!values.departmentId) errors.departmentId = "Department is required.";

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setValidationErrors({});

    try {
      let photoUrl = values.photo;
      if (selectedPhoto) {
        photoUrl = await uploadEmployeePhoto(selectedPhoto);
      }

      const selectedDept = departments.find((d) => String(d.id) === values.departmentId);

      // Default position to selected role or "Employee" if not specified
      const positionValue = values.position.trim() || values.role || "Employee";

      await onSubmit({
        ...values,
        position: positionValue,
        department: selectedDept?.name ?? values.department,
        photo: photoUrl,
      });
    } catch (error) {
      console.error("Employee save failed:", error);
      alert("Failed to save employee. Please try again.");
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {Object.keys(validationErrors).length > 0 && (
        <div
          style={{
            padding: "12px 14px",
            borderRadius: 12,
            background: "#FEF2F2",
            border: "1px solid #FECACA",
            color: "#B91C1C",
            fontSize: 13,
          }}
        >
          <strong>Please complete all required fields.</strong>
          <ul style={{ margin: "8px 0 0 18px", padding: 0 }}>
            {Object.values(validationErrors).map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Full Name Fields (Required) */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div>
          <label style={labelStyle}>First Name *</label>
          <input
            required
            value={values.firstName}
            onChange={set("firstName")}
            placeholder="First Name"
            style={fieldStyle}
          />
        </div>

        <div>
          <label style={labelStyle}>Last Name *</label>
          <input
            required
            value={values.lastName}
            onChange={set("lastName")}
            placeholder="Last Name"
            style={fieldStyle}
          />
        </div>
      </div>

      {/* Email (Required) & System Role (Default Employee, SuperAdmin Restricted) */}
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 14 }}>
        <div>
          <label style={labelStyle}>Email Address (Gmail / Corporate) *</label>
          <input
            type="email"
            required
            value={values.email}
            onChange={set("email")}
            placeholder="employee@company.com"
            style={fieldStyle}
          />
        </div>

        <div>
          <label style={labelStyle}>Role</label>
          {values.role === "SuperAdmin" ? (
            <input className="team-input" style={fieldStyle} value="SuperAdmin" disabled readOnly />
          ) : (
            <select value={values.role} onChange={set("role")} style={fieldStyle}>
              <option value="Employee">Employee (Default)</option>
              <option value="TeamLeader">Team Leader</option>
              <option value="Manager">Manager</option>
              <option value="Administrator">Administrator</option>
            </select>
          )}
        </div>
      </div>

      {/* Department (Required) & Team (Optional) */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div>
          <label style={labelStyle}>Department *</label>
          {departments.length === 1 ? (
            <input className="team-input" style={fieldStyle} value={departments[0].name} disabled readOnly />
          ) : (
            <select
              required
              value={values.departmentId}
              onChange={(e) => {
                set("departmentId")(e);
                setValues((v) => ({ ...v, departmentId: e.target.value, teamId: "" }));
              }}
              style={fieldStyle}
            >
              <option value="">Select department</option>
              {departments.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              ))}
            </select>
          )}
        </div>

        <div>
          <label style={labelStyle}>Team (Optional)</label>
          <select
            value={values.teamId}
            onChange={set("teamId")}
            style={fieldStyle}
            disabled={!values.departmentId || loadingTeams}
          >
            <option value="">
              {loadingTeams
                ? "Loading teams..."
                : !values.departmentId
                ? "Select department first"
                : "No Team / Unassigned"}
            </option>
            {availableTeams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Optional: Position / Domain / Seniority */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
        <div>
          <label style={labelStyle}>Job Title / Position (Optional)</label>
          <input
            value={values.position}
            onChange={set("position")}
            placeholder="Defaults to Role (e.g. Employee)"
            style={fieldStyle}
          />
        </div>

        <div>
          <label style={labelStyle}>Domain (Optional)</label>
          <input
            value={values.professionalDomain}
            onChange={set("professionalDomain")}
            placeholder="HMI / HIS / Embedded"
            style={fieldStyle}
          />
        </div>

        <div>
          <label style={labelStyle}>Seniority (Optional)</label>
          <input
            value={values.seniority}
            onChange={set("seniority")}
            placeholder="Junior / Mid / Senior"
            style={fieldStyle}
          />
        </div>
      </div>

      {/* Optional: Birthday & Hire Date */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div>
          <label style={labelStyle}>Birthday (Optional)</label>
          <input
            type="date"
            value={values.birthDate}
            onChange={set("birthDate")}
            style={fieldStyle}
          />
        </div>

        <div>
          <label style={labelStyle}>Hire Date (Optional)</label>
          <input
            type="date"
            value={values.hireDate}
            onChange={set("hireDate")}
            style={fieldStyle}
          />
        </div>
      </div>

      {/* Optional: Photo & Status */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div>
          <label style={labelStyle}>Employee Photo (Optional)</label>
          <input
            type="file"
            accept="image/*"
            onChange={handlePhotoChange}
            style={fieldStyle}
          />
          {selectedPhoto && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10 }}>
              <img
                src={URL.createObjectURL(selectedPhoto)}
                alt="Preview"
                style={{
                  width: 50,
                  height: 50,
                  objectFit: "cover",
                  borderRadius: "50%",
                  border: `2px solid ${M.border}`,
                }}
              />
              <span style={{ fontSize: 12, color: M.textSec }}>{selectedPhoto.name}</span>
            </div>
          )}
          {!selectedPhoto && values.photo && (
            <div style={{ marginTop: 10 }}>
              <img
                src={values.photo}
                alt="Current employee"
                style={{
                  width: 50,
                  height: 50,
                  objectFit: "cover",
                  borderRadius: "50%",
                  border: `2px solid ${M.border}`,
                }}
              />
            </div>
          )}
        </div>

        <div>
          <label style={labelStyle}>Account Status</label>
          <select
            value={values.isActive ? "active" : "inactive"}
            onChange={(e) =>
              setValues((v) => ({
                ...v,
                isActive: e.target.value === "active",
              }))
            }
            style={fieldStyle}
          >
            <option value="active">Active (Default)</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="primary">
          {initial ? "Save Changes" : "Add Employee"}
        </Button>
      </div>
    </form>
  );
}