/**
 * Safe user identification utility.
 * Exposes non-sensitive user metadata without leaking any tokens, credentials, or password hashes.
 */

export interface SafeUserInfo {
  id: number | null;
  email: string | null;
  fullName: string | null;
  role: string | null;
  department: string | null;
  departmentId: number | null;
  safeKey: string;
}

export function getAuthenticatedSafeUser(): SafeUserInfo {
  const empIdRaw = localStorage.getItem("employeeId");
  const empId = empIdRaw ? parseInt(empIdRaw, 10) : null;
  const email = localStorage.getItem("email") || null;
  const fullName = localStorage.getItem("fullName") || null;
  const role = localStorage.getItem("role") || null;
  const department = localStorage.getItem("department") || null;
  const deptIdRaw = localStorage.getItem("departmentId");
  const departmentId = deptIdRaw ? parseInt(deptIdRaw, 10) : null;

  // Stable, deterministic, non-sensitive identifier
  const safeKey = empId ? `emp-${empId}` : role ? `role-${role.toLowerCase()}` : "anonymous";

  return {
    id: empId,
    email,
    fullName,
    role,
    department,
    departmentId,
    safeKey,
  };
}
