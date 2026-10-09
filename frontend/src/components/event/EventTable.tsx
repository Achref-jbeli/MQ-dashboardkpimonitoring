import { Card } from "../common/Card";
import { M } from "../../theme/tokens";
import type { Event } from "../../types/event";
import { resolveImageUrl, FALLBACK_IMAGE } from "../../utils/imageUrl";

export function EventTable({
  events,
  onEdit,
  onDelete,
}: {
  events: Event[];
  onEdit: (event: Event) => void;
  onDelete: (event: Event) => void;
}) {
  return (
    <Card style={{ overflow: "hidden" }}>
      <div style={{ width: "100%", overflowX: "auto", paddingBottom: 8 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 600 }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${M.border}` }}>
              {["Image", "Title", "Type", "Date", "Location", "Actions"].map((h) => (
                <th
                  key={h}
                  style={{
                    textAlign: "left",
                    fontSize: 11,
                    fontWeight: 700,
                    padding: "12px 20px",
                    color: M.textSec,
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {events.map((ev, i) => {
              const photoUrl = ev.imageUrl ? resolveImageUrl(ev.imageUrl) : null;

              return (
                <tr
                  key={ev.id}
                  style={{
                    borderBottom: i < events.length - 1 ? `1px solid ${M.border}` : "none",
                  }}
                >
                  <td style={{ padding: "12px 20px" }}>
                    {photoUrl ? (
                      <img
                        src={photoUrl}
                        alt={ev.title}
                        onError={(e) => {
                          e.currentTarget.src = FALLBACK_IMAGE;
                        }}
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 8,
                          objectFit: "cover",
                          border: `1px solid ${M.border}`,
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 8,
                          background: "var(--surface-secondary, #EEF4F7)",
                          border: `1px solid ${M.border}`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 10,
                          color: M.textSec,
                          fontWeight: 700,
                        }}
                      >
                        —
                      </div>
                    )}
                  </td>
                  <td style={{ padding: "12px 20px", fontSize: 13, fontWeight: 600, color: M.textPrimary }}>
                    {ev.title}
                  </td>
                  <td style={{ padding: "12px 20px" }}>
                    <span
                      style={{
                        padding: "3px 10px",
                        borderRadius: 10,
                        fontSize: 11,
                        fontWeight: 600,
                        background: `${M.teal}18`,
                        color: M.teal,
                        textTransform: "capitalize",
                        border: `1px solid ${M.teal}30`,
                      }}
                    >
                      {ev.type || "Event"}
                    </span>
                  </td>
                  <td
                    style={{
                      padding: "12px 20px",
                      fontSize: 12,
                      fontFamily: "DM Mono, monospace",
                      color: M.textSec,
                    }}
                  >
                    {ev.date ? new Date(ev.date).toLocaleDateString() : "—"}
                  </td>
                  <td style={{ padding: "12px 20px", fontSize: 12, color: M.textSec }}>
                    {ev.location || "—"}
                  </td>
                  <td style={{ padding: "12px 20px" }}>
                    <button
                      onClick={() => onEdit(ev)}
                      style={{
                        fontSize: 12,
                        padding: "5px 12px",
                        borderRadius: 10,
                        fontWeight: 600,
                        cursor: "pointer",
                        background: "var(--surface-secondary, #EEF4F7)",
                        color: M.textPrimary,
                        border: `1px solid ${M.border}`,
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => onDelete(ev)}
                      style={{
                        fontSize: 12,
                        padding: "5px 12px",
                        borderRadius: 10,
                        fontWeight: 600,
                        cursor: "pointer",
                        background: M.dangerBg,
                        color: M.dangerText,
                        border: `1px solid ${M.border}`,
                        marginLeft: 8,
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}
            {events.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: 30, color: M.textSec, fontSize: 13 }}>
                  No events found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
