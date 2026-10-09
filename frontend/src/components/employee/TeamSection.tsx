import { useState, useMemo } from "react";
import { SearchInput } from "../common/SearchInput";
import { EmployeeCard } from "./EmployeeCard";
import { M } from "../../theme/tokens";
import type { Employee } from "../../types/employee";


export function TeamSection({
  employees,
  onShowBirthday,
  
}: {
  employees: Employee[];
  onShowBirthday: (emp: Employee) => void;
}) {
  const [search, setSearch] = useState("");
  const [dep, setdep] = useState("All");
  const filterDep = dep !== "All";

  const departmentFilters = useMemo(() => {
    const values = Array.from(new Set(employees.map((employee) => employee.department).filter(Boolean)));
    return ["All", ...values] as string[];
  }, [employees]);

  const pool = useMemo(
    () => (filterDep ? employees.filter((e) => e.department === dep) : employees),
    [filterDep, dep, employees]
  );
  const filtered = useMemo(
    () =>
      pool.filter((e) => {
        const ms =
          `${e.firstName} ${e.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
          (e.department ?? "").toLowerCase().includes(search.toLowerCase());
        return ms ;
      }),
    [search, dep, pool]
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <SearchInput value={search} onChange={setSearch} placeholder="Search employees..." />
        {!filterDep && (
          <div style={{ display: "flex", gap: 4 }}>
            {departmentFilters.map((f) => (
              <button
                key={f}
                onClick={() => setdep(f)}
                style={{
                  padding: "8px 16px",
                  borderRadius: 14,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all .15s",
                  background: dep === f ? M.teal : M.white,
                  color: dep === f ? "#fff" : M.textSec,
                  border: `1px solid ${dep === f ? M.teal : M.border}`,
                }}
              >
                {f}
              </button>
            ))}
          </div>
        )}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
        {filtered.map((emp) => (
          <EmployeeCard key={emp.id} emp={emp} onShowBirthday={onShowBirthday} />
        ))}
      </div>
    </div>
  );
}
