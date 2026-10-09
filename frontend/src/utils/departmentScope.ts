const ACTIVE_DEPARTMENT_KEY = "activeDepartmentId";

export function isSuperAdminRole(role: string | null): boolean {
  return role === "SuperAdmin";
}

export function getActiveDepartmentId(): number | null {
  const value = localStorage.getItem(ACTIVE_DEPARTMENT_KEY);
  if (!value) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export function setActiveDepartmentId(departmentId: number): void {
  localStorage.setItem(ACTIVE_DEPARTMENT_KEY, String(departmentId));
}

export function getScopedDepartmentIdForRequests(): number | null {
  const role = localStorage.getItem("role");
  if (!isSuperAdminRole(role)) {
    return null;
  }

  return getActiveDepartmentId();
}

/**
 * Re-syncs the cached department name/id for non-SuperAdmin roles from a freshly
 * fetched department list, so a department reassignment made elsewhere is picked up
 * on next load instead of staying stuck on the stale value cached at login.
 */
export function syncOwnDepartmentCache(department: { id: number; name: string } | undefined | null): void {
  if (!department) {
    return;
  }

  localStorage.setItem("department", department.name);
  localStorage.setItem("departmentId", String(department.id));
  setActiveDepartmentId(department.id);
}
