// Centralized API configuration
export const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8001/api";

// DEBUG: Log the API URL being used
console.log("🔍 DEBUG: API_URL being used:", API_URL);
console.log("🔍 DEBUG: VITE_API_URL from env:", import.meta.env.VITE_API_URL);

// Remove /api suffix to get base URL for auth endpoints
export const API_BASE_URL = API_URL.replace("/api", "");

export const API_CONFIG = {
  BASE_URL: API_URL,
  BASE_URL_NO_API: API_BASE_URL,
  TIMEOUT: 10000,
  WITH_CREDENTIALS: false,
} as const;
