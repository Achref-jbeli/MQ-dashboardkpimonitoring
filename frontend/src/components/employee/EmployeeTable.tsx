import { Card } from "../common/Card";
import { M } from "../../theme/tokens";
import { isBirthday } from "../../theme/tokens";
import type { Employee } from "../../types/employee";
import { resolveImageUrl } from "../../utils/imageUrl";

export function EmployeeTable({
  employees,
  onEdit,
  onDelete,
}: {
  employees: Employee[];
  onEdit: (emp: Employee) => void;
  onDelete: (emp: Employee) => void;
}) {
  const formatDate = (date?: string) => {
    if (!date) return "-";
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) {
      return date;
    }
    return parsed.toLocaleDateString("en-GB");
  };

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
            minWidth: 950,
          }}
        >
          <thead>
            <tr style={{ borderBottom: `1px solid ${M.border}` }}>
              {[
                "Employee",
                "Email",
                "Role",
                "Department / Team",
                "Birthday",
                "Hire Date",
                "Status",
                "Actions",
              ].map((header) => (
                <th
                  key={header}
                  style={{
                    textAlign: "left",
                    fontSize: 11,
                    fontWeight: 700,
                    padding: "12px 20px",
                    color: M.textSec,
                    whiteSpace: "nowrap",
                  }}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {employees.map((emp, index) => (
              <tr
                key={emp.id}
                style={{
                  borderBottom:
                    index < employees.length - 1
                      ? `1px solid ${M.border}`
                      : "none",
                }}
              >
                {/* EMPLOYEE */}
                <td style={{ padding: "12px 20px" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                    }}
                  >
                    {emp.photo ? (
                      <img
                        src={resolveImageUrl(emp.photo)}
                        alt={`${emp.firstName} ${emp.lastName}`}
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 12,
                          objectFit: "cover",
                          border: `1px solid ${M.border}`,
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 12,
                          background: M.bgTeal,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 13,
                          fontWeight: 700,
                          color: M.textPrimary,
                        }}
                      >
                        {emp.firstName?.charAt(0).toUpperCase()}
                        {emp.lastName?.charAt(0).toUpperCase()}
                      </div>
                    )}

                    <div>
                      <p
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          color: M.textPrimary,
                          margin: 0,
                        }}
                      >
                        {emp.firstName} {emp.lastName}
                      </p>
                      <p
                        style={{
                          fontSize: 11,
                          color: M.textSec,
                          margin: "2px 0 0",
                        }}
                      >
                        {emp.position || emp.professionalDomain || "-"}
                      </p>
                    </div>
                  </div>
                </td>

                {/* EMAIL */}
                <td style={{ padding: "12px 20px", fontSize: 12, color: M.textPrimary }}>
                  {emp.email || "—"}
                </td>

                {/* ROLE */}
                <td style={{ padding: "12px 20px" }}>
                  <span
                    style={{
                      display: "inline-block",
                      padding: "4px 10px",
                      borderRadius: 10,
                      fontSize: 11,
                      fontWeight: 600,
                      background:
                        emp.role === "TeamLeader"
                          ? "#E0F2FE"
                          : emp.role === "Manager" || emp.role === "Administrator"
                          ? "#FEF3C7"
                          : `${M.teal}12`,
                      color:
                        emp.role === "TeamLeader"
                          ? "#0369A1"
                          : emp.role === "Manager" || emp.role === "Administrator"
                          ? "#92400E"
                          : M.tealDeep,
                    }}
                  >
                    {emp.role || "Employee"}
                  </span>
                </td>

                {/* DEPARTMENT & TEAM */}
                <td style={{ padding: "12px 20px" }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: M.textPrimary }}>
                    {emp.department || emp.departmentName || "—"}
                  </div>
                  {emp.teamName && (
                    <div style={{ fontSize: 11, color: M.teal, marginTop: 2 }}>
                      Team: {emp.teamName}
                    </div>
                  )}
                </td>

                {/* BIRTHDAY */}
                <td style={{ padding: "12px 20px" }}>
                  <span
                    style={{
                      fontSize: 11,
                      fontFamily: "DM Mono, monospace",
                      color: M.textSec,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {formatDate(emp.birthDate)}
                  </span>
                  {emp.birthDate && isBirthday(emp.birthDate) && (
                    <span style={{ marginLeft: 8 }}>🎂</span>
                  )}
                </td>

                {/* HIRE DATE */}
                <td style={{ padding: "12px 20px" }}>
                  <span
                    style={{
                      fontSize: 11,
                      fontFamily: "DM Mono, monospace",
                      color: M.textSec,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {formatDate(emp.hireDate)}
                  </span>
                </td>

                {/* STATUS */}
                <td style={{ padding: "12px 20px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: "50%",
                        background: emp.isActive ? M.success : M.textSec,
                      }}
                    />
                    <span style={{ fontSize: 12, color: M.textSec, whiteSpace: "nowrap" }}>
                      {emp.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                </td>

                {/* ACTIONS */}
                <td style={{ padding: "12px 20px" }}>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={() => onEdit(emp)}
                      style={{
                        fontSize: 12,
                        padding: "5px 12px",
                        borderRadius: 10,
                        fontWeight: 500,
                        cursor: "pointer",
                        background: M.bgTeal,
                        color: M.textPrimary,
                        border: `1px solid ${M.border}`,
                      }}
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => onDelete(emp)}
                      style={{
                        fontSize: 12,
                        padding: "5px 12px",
                        borderRadius: 10,
                        fontWeight: 500,
                        cursor: "pointer",
                        background: M.bgTeal,
                        color: M.danger,
                        border: `1px solid ${M.border}`,
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}