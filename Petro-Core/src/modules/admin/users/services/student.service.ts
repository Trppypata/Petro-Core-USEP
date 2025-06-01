import axios, { AxiosError } from "axios";
import type { UserFormValues } from "../user.types";
import { apiClient } from "@/services/api.service";

// Updated fallback URL to use port 8000 instead of 3000
const localhost_url = import.meta.env.VITE_local_url || "http://localhost:8001";

interface ErrorResponse {
  message: string;
}

const addStudent = async (studentData: UserFormValues) => {
  try {
    console.log('📤 Sending student data to API:', studentData);
    console.log('🔗 API URL: users/registerStudent');
    
    // Log the profile_url before sending
    console.log('📸 Profile URL being sent to backend:', studentData.profile_url || 'No profile URL set');

    // Check if server is available with a timeout
    try {
      // Try a quick health check first (with a 3-second timeout)
      console.log('🏥 Testing API health at:', `${localhost_url}/health`);
      await axios.get(`${localhost_url}/health`, { timeout: 3000 });
      console.log('✅ API health check passed');
    } catch (healthError) {
      console.error('❌ API health check failed - server may be down:', healthError);
      throw new Error('Backend server is not available. Please make sure the server is running on port 8001.');
    }

    // Use apiClient which already has the base URL configured
    const response = await apiClient.post('/users/registerStudent', studentData);

    console.log('✅ API Response:', response.data);
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<ErrorResponse>;
    console.error('❌ API Error:', axiosError.response?.data || axiosError.message);
    
    if (axiosError.code === 'ERR_NETWORK') {
      throw new Error('Network error: Cannot connect to the server. Please check if the server is running and accessible.');
    }
    
    throw new Error(axiosError.response?.data?.message || 'Failed to create student');
  }
};

const getAllStudents = async () => {
  try {
    console.log('🔍 Fetching students from endpoint: users/fetchUserDetails');
    // Use the apiClient which already has the base URL configured
    const response = await apiClient.get('/users/fetchUserDetails');
    console.log('✅ Raw API Response:', response);
    console.log('✅ Response data:', response.data);
    console.log('✅ Response data type:', typeof response.data);
    console.log('✅ Is array?', Array.isArray(response.data));
    
    if (!response.data) {
      console.warn('⚠️ No data received from API');
      return [];
    }

    // If data is wrapped in a data property, extract it
    const students = response.data.data || response.data;
    console.log('✅ Processed students:', students);
    return students;
  } catch (err) {
    console.error("❌ Error fetching students:", err);
    throw new Error('Failed to fetch students');
  }
};

export { addStudent, getAllStudents }; 