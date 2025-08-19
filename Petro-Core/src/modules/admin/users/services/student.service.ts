import { supabase } from "@/lib/supabase";
import { apiClient } from "@/services/api.service";
import type { UserFormValues } from "../user.types";

interface ErrorResponse {
  message: string;
}

const addStudent = async (studentData: UserFormValues) => {
  try {
    console.log("📤 Adding student data to Supabase:", studentData);

    // Log the profile_url before sending
    console.log(
      "📸 Profile URL being sent to Supabase:",
      studentData.profile_url || "No profile URL set"
    );

    // Add student directly to Supabase
    const { data, error } = await supabase
      .from("students")
      .insert(studentData)
      .select()
      .single();

    if (error) {
      console.error("❌ Supabase add student error:", error);
      throw new Error(`Failed to add student: ${error.message}`);
    }

    console.log("✅ Student added successfully:", data);
    return data;
  } catch (error) {
    console.error("❌ Add student error:", error);
    throw error instanceof Error ? error : new Error("Failed to create student");
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

    // Separate password and position from other student data
    const { password, position, ...studentDataWithoutPassword } = studentData;

    // Update student data in students table (excluding password and position)
    const { data, error } = await supabase
      .from("students")
      .update(studentDataWithoutPassword)
      .eq("id", studentId)
      .select()
      .single();

    if (error) {
      console.error("❌ Supabase update error:", error);
      throw new Error(`Failed to update student: ${error.message}`);
    }

    console.log("✅ Student updated successfully:", data);
    
    // Get the user_id from the student record for auth updates
    const { data: studentRecord, error: studentError } = await supabase
      .from("students")
      .select("user_id, email")
      .eq("id", studentId)
      .single();

    if (studentError) {
      console.error("❌ Error fetching student record:", studentError);
      throw new Error("Failed to fetch student record for auth updates");
    }

    let authUpdates = [];

    // If password is provided, update it in both systems
    if (password && password.trim() !== "") {
      console.log("🔐 Updating password in both systems...");
      
      // Update password in students table
      const { error: passwordError } = await supabase
        .from("students")
        .update({ password: password })
        .eq("id", studentId);

      if (passwordError) {
        console.error("❌ Error updating password in students table:", passwordError);
        throw new Error("Failed to update password in database");
      }

      console.log("✅ Password updated in students table");
      authUpdates.push("password");
      
      // Note: Supabase Auth password update requires backend with admin privileges
      // For now, password is updated in database only
    }

    // If position/role is provided, update it in database
    if (position && position.trim() !== "") {
      console.log("👤 Updating role in database...");
      
      // Update position in students table
      const { error: positionError } = await supabase
        .from("students")
        .update({ position: position })
        .eq("id", studentId);

      if (positionError) {
        console.error("❌ Error updating position in students table:", positionError);
        throw new Error("Failed to update position in database");
      }

      console.log("✅ Role updated in students table");
      authUpdates.push("role");
      
      // Note: Supabase Auth role update requires backend with admin privileges
      // For now, role is updated in database only
    }
    
    // Return success message with details about what was updated
    const updateMessages = [];
    if (authUpdates.length > 0) {
      updateMessages.push(`${authUpdates.join(" and ")} updated in database`);
    }
    updateMessages.push("Student data updated successfully");

    return {
      ...data,
      message: updateMessages.join(". ") + "!"
    };
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
