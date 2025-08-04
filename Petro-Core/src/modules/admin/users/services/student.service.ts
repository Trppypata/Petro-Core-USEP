import axios, { AxiosError } from "axios";
import type { UserFormValues } from "../user.types";
import { apiClient } from "@/services/api.service";
import { supabase } from "@/lib/supabase";

// Updated fallback URL to use port 8000 instead of 3000
const localhost_url = (
  import.meta.env.VITE_API_URL || "http://localhost:8001/api"
).replace("/api", "");

interface ErrorResponse {
  message: string;
}

const addStudent = async (studentData: UserFormValues) => {
  try {
    console.log("📤 Sending student data to API:", studentData);
    console.log("🔗 API URL: users/registerStudent");

    // Log the profile_url before sending
    console.log(
      "📸 Profile URL being sent to backend:",
      studentData.profile_url || "No profile URL set"
    );

    // Check if server is available with a timeout
    try {
      // Try a quick health check first (with a 3-second timeout)
      console.log("🏥 Testing API health at:", `${localhost_url}/health`);
      await axios.get(`${localhost_url}/health`, { timeout: 3000 });
      console.log("✅ API health check passed");
    } catch (healthError) {
      console.error(
        "❌ API health check failed - server may be down:",
        healthError
      );
      throw new Error(
        "Backend server is not available. Please make sure the server is running on port 8001."
      );
    }

    // Use apiClient which already has the base URL configured
    const response = await apiClient.post(
      "/users/registerStudent",
      studentData
    );

    console.log("✅ API Response:", response.data);
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<ErrorResponse>;
    console.error(
      "❌ API Error:",
      axiosError.response?.data || axiosError.message
    );

    if (axiosError.code === "ERR_NETWORK") {
      throw new Error(
        "Network error: Cannot connect to the server. Please check if the server is running and accessible."
      );
    }

    throw new Error(
      axiosError.response?.data?.message || "Failed to create student"
    );
  }
};

const getAllStudents = async () => {
  try {
    console.log("🔍 [DEBUG] Starting getAllStudents function");

    // 1. Check Supabase client configuration
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    console.log("🔍 [DEBUG] Supabase URL exists:", !!supabaseUrl);
    console.log("🔍 [DEBUG] Supabase Key exists:", !!supabaseKey);

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Supabase environment variables are missing");
    }

    // 2. Check authentication status
    console.log("🔍 [DEBUG] Checking authentication status...");
    const { data: sessionData, error: sessionError } =
      await supabase.auth.getSession();

    if (sessionError) {
      console.error("❌ [DEBUG] Session error:", sessionError);
    }

    console.log("🔍 [DEBUG] Session exists:", !!sessionData?.session);
    console.log(
      "🔍 [DEBUG] User ID:",
      sessionData?.session?.user?.id || "No user"
    );
    console.log(
      "🔍 [DEBUG] User role:",
      sessionData?.session?.user?.user_metadata?.role || "No role"
    );

    // 3. Try to authenticate with localStorage token if no session
    if (!sessionData?.session) {
      console.log("⚠️ [DEBUG] No active session, attempting authentication...");

      const token = localStorage.getItem("access_token");
      console.log("🔍 [DEBUG] Access token exists in localStorage:", !!token);

      if (token) {
        try {
          const { data, error } = await supabase.auth.setSession({
            access_token: token,
            refresh_token: localStorage.getItem("refresh_token") || "",
          });

          if (error) {
            console.error("❌ [DEBUG] Error setting session:", error);
          } else {
            console.log("✅ [DEBUG] Session set successfully");
            console.log("🔍 [DEBUG] New session user:", data.session?.user?.id);
          }
        } catch (authError) {
          console.error("❌ [DEBUG] Exception setting session:", authError);
        }
      }
    }

    // 4. Test RLS by checking table permissions
    console.log("🔍 [DEBUG] Testing table access permissions...");

    // First, try a simple count query to test RLS
    const { count, error: countError } = await supabase
      .from("students")
      .select("*", { count: "exact", head: true });

    if (countError) {
      console.error("❌ [DEBUG] Count query failed:", countError);
      console.error("❌ [DEBUG] This indicates RLS is blocking access");

      // Try to provide helpful error information
      if (countError.code === "PGRST301") {
        throw new Error(
          "Authentication required: You must be logged in to view students. Please log out and log back in."
        );
      } else {
        throw new Error(`Database access denied: ${countError.message}`);
      }
    } else {
      console.log(
        "✅ [DEBUG] Table access successful, found",
        count,
        "students"
      );
    }

    // 5. Perform the main query
    console.log("🔍 [DEBUG] Executing main students query...");

    const { data: students, error } = await supabase
      .from("students")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("❌ [DEBUG] Main query failed:", error);
      console.error("❌ [DEBUG] Error details:", {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });
      throw new Error(`Failed to fetch students: ${error.message}`);
    }

    console.log("✅ [DEBUG] Query successful!");
    console.log("✅ [DEBUG] Students retrieved:", students?.length || 0);
    console.log(
      "✅ [DEBUG] Sample student:",
      students?.[0]
        ? {
            id: students[0].id,
            user_id: students[0].user_id,
            first_name: students[0].first_name,
            last_name: students[0].last_name,
            email: students[0].email,
          }
        : "No students found"
    );

    return students || [];
  } catch (err) {
    console.error("❌ [DEBUG] getAllStudents error:", err);

    // Provide user-friendly error messages
    if (err instanceof Error) {
      if (err.message.includes("JWT")) {
        throw new Error(
          "Authentication token invalid. Please log out and log back in."
        );
      } else if (
        err.message.includes("RLS") ||
        err.message.includes("policy")
      ) {
        throw new Error(
          "Access denied: Insufficient permissions to view students."
        );
      }
      throw err;
    }

    throw new Error("Failed to fetch students: Unknown error occurred");
  }
};

const updateStudent = async (studentId: string, studentData: Partial<any>) => {
  try {
    console.log("📤 Updating student data:", { studentId, studentData });

    // Update in Supabase
    const { data, error } = await supabase
      .from("students")
      .update(studentData)
      .eq("id", studentId)
      .select()
      .single();

    if (error) {
      console.error("❌ Supabase update error:", error);
      throw new Error(`Failed to update student: ${error.message}`);
    }

    console.log("✅ Student updated successfully:", data);
    return data;
  } catch (error) {
    console.error("❌ Update student error:", error);
    throw error instanceof Error ? error : new Error("Failed to update student");
  }
};

const getStudent = async (studentId: string) => {
  try {
    console.log("🔍 Fetching student data for ID:", studentId);

    const { data, error } = await supabase
      .from("students")
      .select("*")
      .eq("id", studentId)
      .single();

    if (error) {
      console.error("❌ Supabase get student error:", error);
      throw new Error(`Failed to fetch student: ${error.message}`);
    }

    console.log("✅ Student fetched successfully:", data);
    return data;
  } catch (error) {
    console.error("❌ Get student error:", error);
    throw error instanceof Error ? error : new Error("Failed to fetch student");
  }
};

export { addStudent, getAllStudents, updateStudent, getStudent };
