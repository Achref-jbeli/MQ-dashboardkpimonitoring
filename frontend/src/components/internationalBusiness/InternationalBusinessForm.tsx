import { useState } from "react";
import { M } from "../../theme/tokens";
import { Button } from "../common/Button";
import type { InternationalBusiness } from "../../types/internationalBusiness";
import { uploadPhoto, deletePhoto } from "../../api/internationalBusinessApi";
import { Eye, Sparkles } from "lucide-react";

export interface InternationalBusinessFormValues {
  name: string;
  partnerName?: string;
  country?: string;
  departmentId?: number;
  description?: string;
  photos?: string[];
  isPublicActive?: boolean;
  isNewBusiness?: boolean;
  projectInfo?: string;
  volumeLifetime?: string;
  salesLifetime?: string;
  sop?: string;
  productionLocation?: string;
}

const fieldStyle = {
  width: "100%",
  padding: "10px 14px",
  borderRadius: 12,
  fontSize: 13,
  outline: "none",
  border: `1px solid ${M.border}`,
  background: "var(--input-bg, #FFFFFF)",
  color: M.textPrimary,
  boxSizing: "border-box" as const,
  fontFamily: "inherit",
};

const labelStyle = {
  fontSize: 12,
  fontWeight: 700,
  color: M.textPrimary,
  display: "block",
  marginBottom: 6,
};

export function InternationalBusinessForm({
  initial,
  onCancel,
  onSubmit,
}: {
  initial?: InternationalBusiness;
  onCancel: () => void;
  onSubmit: (values: InternationalBusinessFormValues) => void;
}) {
  const [values, setValues] = useState<InternationalBusinessFormValues>({
    name: initial?.name ?? "",
    partnerName: initial?.partnerName ?? "",
    country: initial?.country ?? "",
    departmentId: initial?.departmentId,
    description: initial?.description ?? "",
    photos: initial?.photos ?? [],
    isPublicActive: initial?.isPublicActive ?? true,
    isNewBusiness: initial?.isNewBusiness ?? false,
    projectInfo: initial?.projectInfo ?? "",
    volumeLifetime: initial?.volumeLifetime ?? "",
    salesLifetime: initial?.salesLifetime ?? "",
    sop: initial?.sop ?? "",
    productionLocation: initial?.productionLocation ?? "",
  });

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const set = (
    key: keyof InternationalBusinessFormValues
  ) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setValues((current) => ({
      ...current,
      [key]: e.target.value,
    }));
  };

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setUploadError(null);

    try {
      const uploadedUrls: string[] = [];

      for (const file of Array.from(files)) {
        const url = await uploadPhoto("international-business", file);
        uploadedUrls.push(url);
      }

      setValues((current) => ({
        ...current,
        photos: [...(current.photos ?? []), ...uploadedUrls],
      }));
    } catch (err) {
      console.error("Error uploading photo:", err);
      setUploadError("Failed to upload one or more photos.");
    } finally {
      setUploading(false);
      e.target.value = ""; // allow re-selecting the same file
    }
  };

  const removePhoto = async (index: number) => {
    const url = values.photos?.[index];
    if (!url) return;

    setValues((current) => ({
      ...current,
      photos: (current.photos ?? []).filter((_, i) => i !== index),
    }));

    try {
      await deletePhoto(url);
    } catch (err) {
      console.error("Error deleting photo file:", err);
    }
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();

        if (!values.name.trim()) {
          return;
        }

        onSubmit({
          ...values,
          name: values.name.trim(),
          partnerName: values.partnerName?.trim() || undefined,
          country: values.country?.trim() || undefined,
          description: values.description?.trim() || undefined,
          projectInfo: values.projectInfo?.trim() || undefined,
          volumeLifetime: values.volumeLifetime?.trim() || undefined,
          salesLifetime: values.salesLifetime?.trim() || undefined,
          sop: values.sop?.trim() || undefined,
          productionLocation: values.productionLocation?.trim() || undefined,
        });
      }}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      {/* Visibility & Badges Toggles */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
          padding: "12px 16px",
          borderRadius: 14,
          background: "var(--surface-secondary, #EEF4F7)",
          border: `1px solid ${M.border}`,
        }}
      >
        {/* Public Visibility Toggle */}
        <label
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 10,
            cursor: "pointer",
            userSelect: "none",
          }}
        >
          <input
            type="checkbox"
            checked={values.isPublicActive}
            onChange={(e) =>
              setValues((curr) => ({ ...curr, isPublicActive: e.target.checked }))
            }
            style={{ marginTop: 3, cursor: "pointer", accentColor: M.teal, width: 16, height: 16 }}
          />
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Eye size={14} color={M.teal} />
              <span style={{ fontSize: 13, fontWeight: 700, color: M.textPrimary }}>
                Public Dashboard Active
              </span>
            </div>
            <p style={{ margin: "2px 0 0", fontSize: 11, color: M.textSec }}>
              Controls whether this business is visible on the public dashboard.
            </p>
          </div>
        </label>

        {/* New Business Toggle */}
        <label
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 10,
            cursor: "pointer",
            userSelect: "none",
          }}
        >
          <input
            type="checkbox"
            checked={values.isNewBusiness}
            onChange={(e) =>
              setValues((curr) => ({ ...curr, isNewBusiness: e.target.checked }))
            }
            style={{ marginTop: 3, cursor: "pointer", accentColor: M.orange, width: 16, height: 16 }}
          />
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Sparkles size={14} color={M.orange} />
              <span style={{ fontSize: 13, fontWeight: 700, color: M.textPrimary }}>
                Mark as New Business
              </span>
            </div>
            <p style={{ margin: "2px 0 0", fontSize: 11, color: M.textSec }}>
              Displays a glowing NEW badge on the public business card.
            </p>
          </div>
        </label>
      </div>

      {/* Name */}
      <div>
        <label style={labelStyle}>Business Name *</label>
        <input
          required
          value={values.name}
          onChange={set("name")}
          placeholder="e.g. BMW Gen5 Switch / Steering Column Module"
          style={fieldStyle}
        />
      </div>

      {/* Partner + Country */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 14,
        }}
      >
        <div>
          <label style={labelStyle}>Partner / Customer</label>
          <input
            value={values.partnerName ?? ""}
            onChange={set("partnerName")}
            placeholder="e.g. BMW Group, Mercedes-Benz"
            style={fieldStyle}
          />
        </div>

        <div>
          <label style={labelStyle}>Country</label>
          <input
            value={values.country ?? ""}
            onChange={set("country")}
            placeholder="e.g. Germany, USA, Global"
            style={fieldStyle}
          />
        </div>
      </div>

      {/* Structured Business Metadata */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 14,
        }}
      >
        <div>
          <label style={labelStyle}>Volume Lifetime</label>
          <input
            value={values.volumeLifetime ?? ""}
            onChange={set("volumeLifetime")}
            placeholder="e.g. 1.3 Mio pcs"
            style={fieldStyle}
          />
        </div>

        <div>
          <label style={labelStyle}>Sales Lifetime</label>
          <input
            value={values.salesLifetime ?? ""}
            onChange={set("salesLifetime")}
            placeholder="e.g. 4 Mio €"
            style={fieldStyle}
          />
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
          <label style={labelStyle}>Start of Production (SOP)</label>
          <input
            value={values.sop ?? ""}
            onChange={set("sop")}
            placeholder="e.g. Q1/2026 or Nov 2026"
            style={fieldStyle}
          />
        </div>

        <div>
          <label style={labelStyle}>Production Location</label>
          <input
            value={values.productionLocation ?? ""}
            onChange={set("productionLocation")}
            placeholder="e.g. MSC / Rietheim / Bressoux"
            style={fieldStyle}
          />
        </div>
      </div>

      {/* Project Information */}
      <div>
        <label style={labelStyle}>Project / Technical Information</label>
        <input
          value={values.projectInfo ?? ""}
          onChange={set("projectInfo")}
          placeholder="e.g. Steering wheel switch modules with capacitive touch"
          style={fieldStyle}
        />
      </div>

      {/* Description */}
      <div>
        <label style={labelStyle}>Description / Notes</label>
        <textarea
          value={values.description ?? ""}
          onChange={set("description")}
          placeholder="Detailed description of the business scope and strategic impact..."
          rows={3}
          style={{
            ...fieldStyle,
            resize: "vertical",
          }}
        />
      </div>

      {/* Photos */}
      <div>
        <label style={labelStyle}>Photos / Product Images</label>

        <div>
          <input
            id="photo-upload-input"
            type="file"
            accept="image/png, image/jpeg, image/gif, image/webp"
            multiple
            onChange={handleFileChange}
            disabled={uploading}
            style={{ display: "none" }}
          />

          <Button
            type="button"
            variant="outline"
            disabled={uploading}
            onClick={() =>
              document.getElementById("photo-upload-input")?.click()
            }
          >
            {uploading ? "Uploading..." : "+ Upload Photo"}
          </Button>
        </div>

        {uploadError && (
          <p style={{ color: M.dangerText, fontSize: 11, marginTop: 6 }}>
            {uploadError}
          </p>
        )}

        {(values.photos?.length ?? 0) > 0 && (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 10,
              marginTop: 12,
            }}
          >
            {values.photos!.map((url, index) => (
              <div
                key={`${url}-${index}`}
                style={{
                  position: "relative",
                  width: 76,
                  height: 76,
                  borderRadius: 10,
                  overflow: "hidden",
                  border: `1px solid ${M.border}`,
                  background: "var(--surface-secondary, #EEF4F7)",
                }}
              >
                <img
                  src={url}
                  alt={`Photo ${index + 1}`}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                  }}
                />

                <button
                  type="button"
                  onClick={() => removePhoto(index)}
                  aria-label={`Remove photo ${index + 1}`}
                  style={{
                    position: "absolute",
                    top: 3,
                    right: 3,
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    border: "none",
                    background: "rgba(0,0,0,0.65)",
                    color: "#fff",
                    fontSize: 12,
                    lineHeight: 1,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 0,
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        <small
          style={{
            display: "block",
            marginTop: 8,
            fontSize: 11,
            color: M.textSec,
          }}
        >
          Supported formats: PNG, JPEG, GIF, WEBP. Max 5MB per photo.
        </small>
      </div>

      {/* Actions */}
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: 10,
          marginTop: 10,
        }}
      >
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>

        <Button type="submit" variant="primary">
          {initial ? "Save Changes" : "Add Request for Quotation"}
        </Button>
      </div>
    </form>
  );
}