import { useState, useEffect } from "react";
import { M } from "../../theme/tokens";
import { Button } from "../common/Button";
import type { Event } from "../../types/event";
import { getEmployees } from "../../api/employeeApi";
import type { Employee } from "../../types/employee";
import { uploadPhoto } from "../../api/internationalBusinessApi";
import { resolveImageUrl, FALLBACK_IMAGE } from "../../utils/imageUrl";
import { Upload, X, Image as ImageIcon } from "lucide-react";

export interface EventFormValues {
  title: string;
  description: string;
  date: string;
  location: string;
  type: string;
  imageUrl?: string;
  employeeId?: number;
}

const fieldStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  borderRadius: 14,
  fontSize: 13,
  outline: "none",
  border: `1px solid ${M.border}`,
  background: "var(--card, #FFFFFF)",
  color: M.textPrimary,
  boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: M.textPrimary,
  display: "block",
  marginBottom: 6,
};

export function EventForm({
  initial,
  onCancel,
  onSubmit,
}: {
  initial?: Event;
  onCancel: () => void;
  onSubmit: (values: EventFormValues) => void;
}) {
  const [values, setValues] = useState<EventFormValues>({
    title: initial?.title ?? "",
    description: initial?.description ?? "",
    date: initial?.date?.slice(0, 10) ?? "",
    location: initial?.location ?? "",
    type: initial?.type ?? "Event",
    imageUrl: initial?.imageUrl ?? "",
    employeeId: initial?.employeeId,
  });

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    getEmployees().then(setEmployees).catch(console.error);
  }, []);

  const set =
    (key: keyof EventFormValues) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >
    ) => {
      const val = e.target.value;
      setValues((v) => ({
        ...v,
        [key]: key === "employeeId" ? (val ? Number(val) : undefined) : val,
      }));
    };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      const url = await uploadPhoto("events", file);
      setValues((v) => ({ ...v, imageUrl: url }));
    } catch (err) {
      console.error("Failed to upload event image:", err);
      alert("Failed to upload event image.");
    } finally {
      setUploadingImage(false);
    }
  };

  const normalizedType = (values.type || "").toLowerCase();
  const isExcludedFromImage =
    normalizedType === "birthday" ||
    normalizedType === "visit" ||
    normalizedType === "visits" ||
    normalizedType === "audit" ||
    normalizedType === "audits";

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(values);
      }}
      style={{ display: "flex", flexDirection: "column", gap: 14 }}
    >
      <div>
        <label style={labelStyle}>Title</label>
        <input
          required
          value={values.title}
          onChange={set("title")}
          placeholder="Team Building Day / Project Kickoff"
          style={fieldStyle}
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div>
          <label style={labelStyle}>Date</label>
          <input
            type="date"
            value={values.date}
            onChange={set("date")}
            style={fieldStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>Type</label>
          <select value={values.type} onChange={set("type")} style={fieldStyle}>
            <option value="Event">Event</option>
            <option value="Visit">Visit</option>
            <option value="Audit">Audit</option>
            <option value="Meeting">Meeting</option>
            <option value="Birthday">Birthday</option>
            <option value="Milestone">Milestone</option>
            <option value="Holiday">Holiday</option>
            <option value="Employee of the month">Employee of the month</option>
          </select>
        </div>
      </div>

      {values.type === "Employee of the month" && (
        <div>
          <label style={labelStyle}>Choose Employee</label>
          <select
            value={values.employeeId ?? ""}
            onChange={set("employeeId")}
            style={fieldStyle}
            required
          >
            <option value="" disabled>
              Select an employee...
            </option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.firstName} {emp.lastName}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Event Image Upload for non-Birthday, non-Visit, non-Audit types */}
      {!isExcludedFromImage && (
        <div>
          <label style={labelStyle}>Event Cover Image (Optional)</label>
          {values.imageUrl ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "10px 14px",
                borderRadius: 14,
                border: `1px solid ${M.border}`,
                background: "var(--surface-secondary, #EEF4F7)",
              }}
            >
              <img
                src={resolveImageUrl(values.imageUrl)}
                alt="Event cover preview"
                onError={(e) => {
                  e.currentTarget.src = FALLBACK_IMAGE;
                }}
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 10,
                  objectFit: "cover",
                  border: `1px solid ${M.border}`,
                }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: M.textPrimary,
                    margin: 0,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {values.imageUrl}
                </p>
                <span style={{ fontSize: 11, color: M.textSec }}>
                  Image attached to event
                </span>
              </div>
              <button
                type="button"
                onClick={() => setValues((v) => ({ ...v, imageUrl: "" }))}
                style={{
                  padding: 6,
                  borderRadius: 8,
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: M.danger,
                }}
                title="Remove image"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <label
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                padding: "16px 14px",
                borderRadius: 14,
                border: `1px dashed ${M.border}`,
                background: "var(--surface-secondary, #EEF4F7)",
                cursor: uploadingImage ? "not-allowed" : "pointer",
                color: M.textSec,
                fontSize: 13,
                fontWeight: 600,
                transition: "all 0.2s",
              }}
            >
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploadingImage}
                style={{ display: "none" }}
              />
              {uploadingImage ? (
                <span>Uploading event image...</span>
              ) : (
                <>
                  <ImageIcon size={18} color={M.teal} />
                  <span>Click or drag image to attach to this event</span>
                </>
              )}
            </label>
          )}
        </div>
      )}

      <div>
        <label style={labelStyle}>Location</label>
        <input
          value={values.location}
          onChange={set("location")}
          placeholder="Main Auditorium / Conference Room / Global"
          style={fieldStyle}
        />
      </div>

      <div>
        <label style={labelStyle}>Description</label>
        <textarea
          value={values.description}
          onChange={set("description")}
          rows={3}
          placeholder="Event details, schedule, or additional info..."
          style={{ ...fieldStyle, resize: "vertical" }}
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
          {initial ? "Save Changes" : "Add Event"}
        </Button>
      </div>
    </form>
  );
}
