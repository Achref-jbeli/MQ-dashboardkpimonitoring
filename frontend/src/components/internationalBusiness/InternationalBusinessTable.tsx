import { Card } from "../common/Card";
import { M } from "../../theme/tokens";
import type { InternationalBusiness } from "../../types/internationalBusiness";
import { Eye, EyeOff, Sparkles, Edit2, Trash2 } from "lucide-react";

export function InternationalBusinessTable({
  businesses,
  onEdit,
  onDelete,
  onTogglePublic,
  onToggleNew,
}: {
  businesses: InternationalBusiness[];
  onEdit: (business: InternationalBusiness) => void;
  onDelete: (business: InternationalBusiness) => void;
  onTogglePublic?: (business: InternationalBusiness) => void;
  onToggleNew?: (business: InternationalBusiness) => void;
}) {
  return (
    <Card style={{ overflow: "hidden" }}>
      <div
        style={{
          width: "100%",
          overflowX: "auto",
          paddingBottom: 8,
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            minWidth: 800,
          }}
        >
          <thead>
            <tr
              style={{
                borderBottom: `1px solid ${M.border}`,
                background: "var(--table-header-bg, #F8FAFC)",
              }}
            >
              {[
                "Business Name",
                "Status & Visibility",
                "Partner / Customer",
                "Country / Location",
                "Lifetime Vol / Sales",
                "SOP",
                "Photos",
                "Actions",
              ].map((header) => (
                <th
                  key={header}
                  style={{
                    textAlign: "left",
                    fontSize: 11,
                    fontWeight: 700,
                    padding: "12px 18px",
                    color: M.textSec,
                    whiteSpace: "nowrap",
                    letterSpacing: "0.02em",
                  }}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {businesses.map((business, index) => {
              const isPublic = business.isPublicActive !== false;
              const isNew = !!business.isNewBusiness;

              return (
                <tr
                  key={business.id}
                  style={{
                    borderBottom:
                      index < businesses.length - 1
                        ? `1px solid ${M.border}`
                        : "none",
                  }}
                >
                  {/* Name */}
                  <td
                    style={{
                      padding: "14px 18px",
                      fontSize: 13,
                      fontWeight: 700,
                      color: M.textPrimary,
                    }}
                  >
                    <div>{business.name}</div>
                    {business.projectInfo && (
                      <div
                        style={{
                          fontSize: 11,
                          color: M.textSec,
                          fontWeight: 500,
                          marginTop: 2,
                        }}
                      >
                        {business.projectInfo}
                      </div>
                    )}
                  </td>

                  {/* Status & Visibility — now with interactive badges */}
                  <td
                    style={{
                      padding: "14px 18px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                      {/* ── Eye toggle: public / hidden ── */}
                      <button
                        title={isPublic ? "Click to hide from public slide" : "Click to show in public slide"}
                        onClick={() => onTogglePublic?.(business)}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          fontSize: 11,
                          fontWeight: 700,
                          padding: "4px 9px",
                          borderRadius: 999,
                          cursor: onTogglePublic ? "pointer" : "default",
                          color: isPublic ? M.successText : M.textSec,
                          background: isPublic ? M.successBg : "var(--surface-secondary, #EEF4F7)",
                          border: `1px solid ${isPublic ? M.success + "50" : M.border}`,
                          transition: "all 0.18s",
                        }}
                      >
                        {isPublic ? <Eye size={11} /> : <EyeOff size={11} />}
                        {isPublic ? "Public" : "Hidden"}
                      </button>

                      {/* ── Sparkles toggle: new / not new ── */}
                      <button
                        title={isNew ? "Click to unmark as new" : "Click to mark as new"}
                        onClick={() => onToggleNew?.(business)}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 3,
                          fontSize: 10,
                          fontWeight: 800,
                          padding: "4px 8px",
                          borderRadius: 999,
                          cursor: onToggleNew ? "pointer" : "default",
                          color: isNew ? M.orangeText : M.textSec,
                          background: isNew ? M.orangeBg : "var(--surface-secondary, #EEF4F7)",
                          border: `1px solid ${isNew ? (M.orange + "40") : M.border}`,
                          transition: "all 0.18s",
                        }}
                      >
                        <Sparkles size={10} />
                        {isNew ? "New" : "Not New"}
                      </button>
                    </div>
                  </td>

                  {/* Partner */}
                  <td
                    style={{
                      padding: "14px 18px",
                      fontSize: 12,
                      fontWeight: 600,
                      color: M.textSec,
                    }}
                  >
                    {business.partnerName || "—"}
                  </td>

                  {/* Country & Production Location */}
                  <td
                    style={{
                      padding: "14px 18px",
                      fontSize: 12,
                      color: M.textSec,
                    }}
                  >
                    <div>{business.country || "Global"}</div>
                    {business.productionLocation && (
                      <div style={{ fontSize: 11, color: M.textMuted, marginTop: 2 }}>
                        Loc: {business.productionLocation}
                      </div>
                    )}
                  </td>

                  {/* Volume / Sales */}
                  <td
                    style={{
                      padding: "14px 18px",
                      fontSize: 12,
                      fontFamily: "DM Mono, monospace",
                      color: M.textPrimary,
                    }}
                  >
                    {business.volumeLifetime || business.salesLifetime ? (
                      <div>
                        {business.volumeLifetime && <div>Vol: {business.volumeLifetime}</div>}
                        {business.salesLifetime && <div>Sales: {business.salesLifetime}</div>}
                      </div>
                    ) : (
                      <span style={{ color: M.textMuted }}>—</span>
                    )}
                  </td>

                  {/* SOP */}
                  <td
                    style={{
                      padding: "14px 18px",
                      fontSize: 12,
                      fontWeight: 600,
                      color: M.textSec,
                    }}
                  >
                    {business.sop || "—"}
                  </td>

                  {/* Photos */}
                  <td
                    style={{
                      padding: "14px 18px",
                      fontSize: 12,
                      color: M.textSec,
                    }}
                  >
                    {business.photos?.length
                      ? `${business.photos.length} photo${
                          business.photos.length > 1 ? "s" : ""
                        }`
                      : "—"}
                  </td>

                  {/* Actions: Edit + Delete only */}
                  <td
                    style={{
                      padding: "14px 18px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    <button
                      onClick={() => onEdit(business)}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        fontSize: 12,
                        padding: "6px 12px",
                        borderRadius: 10,
                        fontWeight: 600,
                        cursor: "pointer",
                        background: "var(--surface-secondary, #EEF4F7)",
                        color: M.textPrimary,
                        border: `1px solid ${M.border}`,
                      }}
                    >
                      <Edit2 size={12} />
                      Edit
                    </button>

                    <button
                      onClick={() => onDelete(business)}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        fontSize: 12,
                        padding: "6px 12px",
                        borderRadius: 10,
                        fontWeight: 600,
                        cursor: "pointer",
                        background: M.dangerBg,
                        color: M.dangerText,
                        border: `1px solid ${M.border}`,
                        marginLeft: 8,
                      }}
                    >
                      <Trash2 size={12} />
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}

            {businesses.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  style={{
                    textAlign: "center",
                    padding: 36,
                    fontSize: 13,
                    color: M.textSec,
                  }}
                >
                  No requests for quotation found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}