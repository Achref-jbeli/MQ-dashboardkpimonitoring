import { useState, useEffect } from "react";
import { Button } from "../../components/common/Button";
import { SearchInput } from "../../components/common/SearchInput";
import { EmployeeTable } from "../../components/employee/EmployeeTable";
import { EmployeeModal } from "../../components/employee/EmployeeModal";
import type { EmployeeFormValues } from "../../components/employee/EmployeeForm";
import type { Employee } from "../../types/employee";
import { getEmployees, createEmployee, updateEmployee, deleteEmployee } from "../../api/employeeApi";
import { getDepartments } from "../../api/departmentApi";
import type { Department } from "../../types/department";
import axios from "axios";

export function EmployeesPage() {
const [employees, setEmployees] = useState<Employee[]>([]);
const [search, setSearch] = useState("");
const [editing, setEditing] = useState<Employee | null>(null);
const [showModal, setShowModal] = useState(false);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
const [departments, setDepartments] = useState<Department[]>([]);

const loadEmployees = async () => {
try {
  setLoading(true);
  const data = await getEmployees();
  setEmployees(data);
  setError(null);
} catch (error) {
  console.error("Error fetching employees:", error);
  setError("Failed to load employees.");
} finally {
  setLoading(false);
}
};

useEffect(() => {
loadEmployees();

void getDepartments()
  .then((result) => setDepartments(result))
  .catch(() => setDepartments([]));
}, []);
const filtered = employees.filter((e) =>
`${e.firstName} ${e.lastName}`
  .toLowerCase()
  .includes(search.toLowerCase()) ||
(e.professionalDomain ?? "")
  .toLowerCase()
  .includes(search.toLowerCase()) ||
(e.position ?? "")
  .toLowerCase()
  .includes(search.toLowerCase()) ||
(e.department ?? "")
  .toLowerCase()
  .includes(search.toLowerCase())
);

const handleSubmit = async (values: EmployeeFormValues) => {
  const selectedDepartment = departments.find((department) => String(department.id) === values.departmentId);

  const employeeData = {
    firstName: values.firstName,
    lastName: values.lastName,
    email: values.email,
    position: values.position,
    department: selectedDepartment?.name ?? values.department,
    departmentId: values.departmentId ? Number(values.departmentId) : undefined,
    teamId: values.teamId ? Number(values.teamId) : undefined,
    role: values.role === "SuperAdmin" ? undefined : values.role,
    professionalDomain: values.professionalDomain,
    seniority: values.seniority,
    photo: values.photo,
    birthDate: values.birthDate,
    hireDate: values.hireDate,
    isActive: values.isActive,
  };
  try {
    if (editing) {
      const updated = await updateEmployee(editing.id, employeeData);
      setEmployees((prev) => prev.map((e) => (e.id === editing.id ? updated : e)));
    } else {
      const created = await createEmployee(employeeData);
      setEmployees((prev) => [...prev, created]);
    }
    setShowModal(false);
    setEditing(null);
  } catch (error) {
  console.error("Error saving employee:", error);

  let message = "Failed to save employee.";
  if (axios.isAxiosError(error)) {
    console.error("STATUS:", error.response?.status);
    console.error("RESPONSE:", error.response?.data);
    message = error.response?.data?.message ?? message;
  }

  setError(message);
  alert(message);
}
};

const handleDelete = async (emp: Employee) => {
  if (!confirm(`Delete employee ${emp.firstName} ${emp.lastName}?`)) return;
  try {
    await deleteEmployee(emp.id);
    setEmployees((prev) => prev.filter((e) => e.id !== emp.id));
  } catch (error) {
    console.error("Error deleting employee:", error);
    setError("Failed to delete employee.");
  }
};

return (
  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <SearchInput value={search} onChange={setSearch} placeholder="Search employees..." />
      <Button
        onClick={() => {
          setEditing(null);
          setShowModal(true);
        }}
      >
        + Add Employee
      </Button>
    </div>
    {error && <p style={{ color: "#B91C1C", fontSize: 12, margin: 0 }}>{error}</p>}
    {loading ? (
      <p style={{ fontSize: 13 }}>Loading employees...</p>
    ) : (
      <EmployeeTable
        employees={filtered}
        onEdit={(emp) => {
          setEditing(emp);
          setShowModal(true);
        }}
        onDelete={handleDelete}
      />
    )}
    {showModal && (
      <EmployeeModal
        employee={editing ?? undefined}
        departments={departments}
        onClose={() => {
          setShowModal(false);
          setEditing(null);
        }}
        onSubmit={handleSubmit}
      />
    )}
  </div>
);
}

