import axios from "axios";
import { getScopedDepartmentIdForRequests, isSuperAdminRole } from "../utils/departmentScope";


const api = axios.create({
  baseURL: "http://localhost:5189/api", // Replace with your API base URL
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  const departmentId = getScopedDepartmentIdForRequests();
  const url = config.url ?? "";
  const lowerUrl = url.toLowerCase();
  const isScopedEndpoint =
    lowerUrl.startsWith("/admins") ||
    lowerUrl.startsWith("/employee") ||
    lowerUrl.startsWith("/project") ||
    lowerUrl.startsWith("/event") ||
    lowerUrl.startsWith("/dashboard") ||
    lowerUrl.startsWith("/import") ||
    lowerUrl.startsWith("/kpi") ||
    lowerUrl.startsWith("/team") ||
    lowerUrl.startsWith("/teamleaders") ||
    lowerUrl.startsWith("/tasks") ||
    lowerUrl.startsWith("/milestone");

  // SuperAdmin views are combined across all departments by default (no departmentId sent
  // on reads); writes still use the last-selected department so create/update flows that
  // rely on ambient scope keep working.
  const method = (config.method ?? "get").toLowerCase();
  const isSuperAdmin = isSuperAdminRole(localStorage.getItem("role"));
  const shouldScope = isScopedEndpoint && (!isSuperAdmin || method !== "get");

  if (departmentId && shouldScope) {
    config.params = {
      departmentId,           // scope fallback — explicit caller params override it below
      ...(config.params ?? {}),
    };
  }

  return config;
});

export default api;