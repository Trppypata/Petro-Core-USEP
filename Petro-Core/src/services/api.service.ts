import axios from "axios";
import { toast } from "sonner";

// API base URL
const API_URL = "https://petro-core-usep.onrender.com/api";

// Create a custom axios instance
const apiClient = axios.create({
  withCredentials: false,
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add a request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem("access_token");

    // Log request details for debugging
    console.log(
      `🔶 API Request: ${config.method?.toUpperCase()} ${config.url}`
    );

    // Add token to headers if it exists
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log("🔑 Token attached to request");
    } else {
      console.warn("⚠️ No auth token available for request");
    }

    return config;
  },
  (error) => {
    console.error("❌ Request interceptor error:", error);
    return Promise.reject(error);
  }
);

// Add a response interceptor
apiClient.interceptors.response.use(
  (response) => {
    // Log successful response
    console.log(`✅ API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Log error details
    console.error("❌ API Error:", {
      url: originalRequest?.url,
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
    });

    // Handle 401 Unauthorized errors
    if (error.response?.status === 401 && !originalRequest._retry) {
      console.warn("⚠️ Unauthorized request - token may be invalid or expired");

      // Mark the request as retried to avoid infinite loops
      originalRequest._retry = true;

      // Show notification to user
      toast.error("Your session has expired. Please log in again.");

      // Clear invalid token
      localStorage.removeItem("access_token");

      // Here you could redirect to login or try to refresh token
      // window.location.href = '/login';

      // For now just reject the request
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);

export { apiClient };

// Export a function to create an authenticated axios instance
export const createAuthApi = (token?: string) => {
  const authToken = token || localStorage.getItem("access_token");

  if (!authToken) {
    console.error("No authentication token provided");
    toast.error("Authentication required. Please log in again.");
    throw new Error("Authentication token not found");
  }

  return axios.create({
    baseURL: API_URL,
    timeout: 10000,
    withCredentials: false,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    },
  });
};
