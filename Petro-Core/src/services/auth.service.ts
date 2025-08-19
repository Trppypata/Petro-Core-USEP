import axios from "axios";
import { supabase } from "@/lib/supabase";
import { API_BASE_URL } from "@/config/api.config";

// API base URL
const API_URL = API_BASE_URL;

// Configure axios to use the token for all requests
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials extends AuthCredentials {
  firstName: string;
  lastName: string;
  role?: "student" | "admin";
}

export const authService = {
  /**
   * Login with email and password - checks students table first, then Supabase Auth
   */
  async login({ email, password }: AuthCredentials) {
    try {
      console.log("🔐 Attempting login for:", email);
      
      // First, try to find the user in the students table
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('*')
        .eq('email', email)
        .single();

      if (studentError) {
        console.log("❌ Student not found in database, trying Supabase Auth...");
        // If student not found, try Supabase Auth as fallback
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) {
          throw new Error(error.message || "Login failed");
        }
        return { user: data.user, session: data.session };
      }

      // Student found in database, check password
      if (studentData.password && studentData.password === password) {
        console.log("✅ Password matches in students table");
        
        // Since password matches in students table, create custom session
        // Skip Supabase Auth to avoid 400 errors for database-only users
        console.log("🔧 Creating custom session for database user");
        return {
          user: {
            id: studentData.user_id || studentData.id,
            email: studentData.email,
            user_metadata: {
              role: studentData.position || 'student',
              first_name: studentData.first_name,
              last_name: studentData.last_name,
              full_name: `${studentData.first_name || ''} ${studentData.last_name || ''}`.trim() || studentData.email
            }
          },
          session: null // This will trigger custom session storage
        };
      } else {
        console.log("❌ Password doesn't match in students table");
        throw new Error("Invalid login credentials");
      }
    } catch (error) {
      console.error("❌ Login error:", error);
      throw error;
    }
  },

  /**
   * Register a new user
   */
  async register({
    email,
    password,
    firstName,
    lastName,
    role = "student",
  }: RegisterCredentials) {
    try {
      console.log("Sending registration data:", {
        email,
        password: "***",
        firstName,
        lastName,
        role,
        endpoint: `${API_URL}/api/auth/register`,
      });

      const response = await axios.post(`${API_URL}/api/auth/register`, {
        email,
        password,
        firstName,
        lastName,
        role,
      });

      console.log("Registration successful:", response.data);
      return response.data.data;
    } catch (error) {
      console.error("Registration error details:", error);
      if (axios.isAxiosError(error)) {
        console.error("Server response status:", error.response?.status);
        console.error("Server response data:", error.response?.data);

        // Provide a more specific error message
        const errorMessage =
          error.response?.data?.message ||
          error.message ||
          "Registration failed";

        throw new Error(errorMessage);
      }
      throw error;
    }
  },

  /**
   * Send password reset email
   */
  async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      throw new Error(error.message || "Failed to send reset email");
    }
  },

  /**
   * Refresh user session to get updated role information
   * This is useful after role changes
   */
  async refreshSession() {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        throw new Error(error.message || "Failed to refresh session");
      }
      
      if (data.session) {
        // Force a session refresh
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError) {
          throw new Error(refreshError.message || "Failed to refresh session");
        }
        
        console.log("✅ Session refreshed successfully");
        return refreshData;
      } else {
        throw new Error("No active session to refresh");
      }
    } catch (error) {
      console.error("❌ Session refresh error:", error);
      throw error;
    }
  },

  /**
   * Get updated user role from database
   * This fetches the current role from the students table
   */
  async getUpdatedUserRole() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("No authenticated user");
      }

      // Get the updated role from the students table
      const { data: studentData, error } = await supabase
        .from('students')
        .select('position')
        .eq('user_id', user.id)
        .single();

      if (error) {
        throw new Error(`Failed to fetch updated role: ${error.message}`);
      }

      console.log("✅ Updated role fetched:", studentData.position);
      return studentData.position;
    } catch (error) {
      console.error("❌ Get updated role error:", error);
      throw error;
    }
  },

  /**
   * Check if a password was updated correctly in the database
   * This is useful for debugging password update issues
   */
  async checkPasswordUpdate(email: string, expectedPassword: string) {
    try {
      const { data: studentData, error } = await supabase
        .from('students')
        .select('password')
        .eq('email', email)
        .single();

      if (error) {
        throw new Error(`Failed to fetch password: ${error.message}`);
      }

      const passwordMatches = studentData.password === expectedPassword;
      console.log("🔍 Password check result:", {
        email,
        passwordMatches,
        storedPassword: studentData.password ? "***" : "null"
      });

      return passwordMatches;
    } catch (error) {
      console.error("❌ Password check error:", error);
      throw error;
    }
  },

  /**
   * Logout user
   */
  async logout() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw new Error(error.message || "Logout failed");
    }
  },

  /**
   * Update user password after reset
   */
  async updatePassword(password: string) {
    try {
      const response = await axios.post(`${API_URL}/auth/update-password`, {
        password,
      });

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(
          error.response.data.message || "Password update failed"
        );
      }
      throw error;
    }
  },

  /**
   * Check if the user is authenticated
   */
  isAuthenticated() {
    const token = localStorage.getItem("access_token");
    return !!token;
  },

  /**
   * Get the current auth token
   */
  getToken() {
    return localStorage.getItem("access_token");
  },

  getCurrentUser: async function () {
    // First check for custom user in localStorage
    const customUser = localStorage.getItem('custom_user');
    if (customUser) {
      try {
        const userData = JSON.parse(customUser);
        console.log("🔍 getCurrentUser - Found custom user:", userData);
        // Return in the same format as Supabase user
        return {
          id: userData.id,
          email: userData.email,
          user_metadata: {
            role: userData.role,
            full_name: userData.name,
            first_name: userData.name?.split(' ')[0] || '',
            last_name: userData.name?.split(' ').slice(1).join(' ') || ''
          }
        };
      } catch (error) {
        console.error("Error parsing custom user:", error);
        localStorage.removeItem('custom_user');
      }
    }

    // Fallback to Supabase Auth
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) return null;
    return data.user;
  },
};
