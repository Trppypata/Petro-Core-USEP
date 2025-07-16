import axios, { AxiosError } from "axios";
import type { UserFormValues } from "../user.types";

const localhost_url = import.meta.env.VITE_local_url;

interface ErrorResponse {
  message: string;
}
// code sa inyong api
const addUser = async (userData: UserFormValues) => {
  try {
    console.log('📤 Sending user data to API:', userData);
    
    // Log the profile_url before sending
    console.log('📸 Profile URL being sent to backend:', userData.profile_url || 'No profile URL set');

    const response = await axios.post(`${localhost_url}/api/users/registerStudent`, userData, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('✅ API Response:', response.data);
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<ErrorResponse>;
    console.error('❌ API Error:', axiosError.response?.data || axiosError.message);
    throw new Error(axiosError.response?.data?.message || 'Failed to create user');
  }
};

const getAllUser = async () => {
  try {
    console.log('🔍 Fetching users from:', `${localhost_url}/api/users/fetchUserDetails`);
    const response = await axios.get(`${localhost_url}/api/users/fetchUserDetails`);
    console.log('✅ Raw API Response:', response);
    console.log('✅ Response data:', response.data);
    console.log('✅ Response data type:', typeof response.data);
    console.log('✅ Is array?', Array.isArray(response.data));
    
    if (!response.data) {
      console.warn('⚠️ No data received from API');
      return [];
    }

    // If data is wrapped in a data property, extract it
    const users = response.data.data || response.data;
    console.log('✅ Processed users:', users);
    return users;
  } catch (err) {
    console.error("❌ Error fetching users:", err);
    throw new Error('Failed to fetch users');
  }
};

export { addUser, getAllUser };
