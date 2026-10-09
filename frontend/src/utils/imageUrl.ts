const API_ORIGIN = "http://localhost:5189";

export const FALLBACK_IMAGE =
  "data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22300%22%20height%3D%22200%22%20viewBox%3D%220%200%20300%20200%22%20fill%3D%22none%22%3E%3Crect%20width%3D%22300%22%20height%3D%22200%22%20fill%3D%22%23F1F5F9%22%2F%3E%3Cpath%20d%3D%22M150%2085a20%2020%200%201%200%200-40%2020%2020%200%200%200%200%2040zm-35%2060c0-19.33%2015.67-35%2035-35s35%2015.67%2035%2035H115z%22%20fill%3D%22%2394A3B8%22%2F%3E%3C%2Fsvg%3E";

export function resolveImageUrl(path?: string | null, fallback = FALLBACK_IMAGE): string {
  if (!path || typeof path !== "string" || !path.trim()) {
    return fallback;
  }

  const trimmed = path.trim();

  // If already absolute URL or data/blob URI
  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("data:") ||
    trimmed.startsWith("blob:")
  ) {
    return trimmed;
  }

  // If relative path like /uploads/..., prefix with API_ORIGIN
  if (trimmed.startsWith("/")) {
    return `${API_ORIGIN}${trimmed}`;
  }

  return `${API_ORIGIN}/${trimmed}`;
}
