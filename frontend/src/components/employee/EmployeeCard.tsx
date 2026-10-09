import { M } from "../../theme/tokens";
import { isBirthday } from "../../theme/tokens";
import { Card } from "../common/Card";
import type { Employee } from "../../types/employee";

export function EmployeeCard({ emp, onShowBirthday }: { emp: Employee; onShowBirthday?: (e: Employee) => void }) {
  return (
    <Card style={{ padding: 16, display: "flex", flexDirection: "column", alignItems: "center", gap: 12, transition: "transform .2s, box-shadow .2s", cursor: "default" }}>
      <div style={{ position: "relative" }}>
        <div style={{ width: 64, height: 64, borderRadius: 18, overflow: "hidden", boxShadow: `0 4px 16px ${M.teal}30` }}>
          <img src={emp.photo || "https://via.placeholder.com/64x64?text=User"} alt={emp.firstName + " "+ emp.lastName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
        <div style={{ position: "absolute", bottom: -2, right: -2, width: 16, height: 16, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: M.white }}>
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: emp.isActive ? M.success : M.textSec }} />
        </div>
        {emp.birthDate && isBirthday(emp.birthDate) && onShowBirthday && (
          <button onClick={() => onShowBirthday(emp)} style={{ position: "absolute", top: -6, right: -6, fontSize: 18, cursor: "pointer", background: "none", border: "none", padding: 0 }}>
            🎂
          </button>
        )}
      </div>
      <div style={{ textAlign: "center", width: "100%" }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: M.textPrimary }}>{emp.firstName +" "+ emp.lastName}</p>
        <p style={{ fontSize: 11, color: M.textSec, marginTop: 2 }}>{emp.professionalDomain}</p>
        <span style={{ display: "inline-block", marginTop: 8, fontSize: 10, padding: "2px 8px", borderRadius: 999, fontWeight: 600, background: `${M.teal}15`, color: M.tealDeep }}>
          {emp.position}
        </span>
        <span style={{ display: "inline-block", marginTop: 8, fontSize: 10, padding: "2px 8px", borderRadius: 999, fontWeight: 600, background: `${M.teal}15`, color: M.tealDeep }}>
          {emp.seniority}
        </span>
      </div>
    </Card>
  );
}
