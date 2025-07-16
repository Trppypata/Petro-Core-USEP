import axios from 'axios';
import type { IRock } from '../rock.interface';
import Cookies from 'js-cookie';
import { toast } from 'sonner';
import { apiClient } from '@/services/api.service';

const API_URL = 'https://petro-core-usep.onrender.com';
console.log('API URL for rocks service:', API_URL);

/**
 * Helper to get auth token
 */
const getAuthToken = () => {
  // Try multiple storage locations for the token
  const token = localStorage.getItem('access_token') || 
         localStorage.getItem('auth_token') || 
         localStorage.getItem('token') || 
         localStorage.getItem('accessToken') ||
         Cookies.get('access_token');
  
  console.log('Auth token exists:', !!token);
  if (token) {
    // Log first and last few characters for debugging
    const firstChars = token.substring(0, 10);
    const lastChars = token.substring(token.length - 5);
    console.log(`Token format check: ${firstChars}...${lastChars} (${token.length} chars)`);
  } else {
    console.error('No authentication token found in any storage location');
  }
  
  return token;
};

/**
 * Get axios instance with auth headers
//  */
// const getAuthAxios = () => {
//   const token = getAuthToken();
//   
//   if (!token) {
//     console.error('No authentication token found');
//     toast.error('Authentication required. Please log in again.');
//     throw new Error('Authentication token not found');
//   }
//   
//   // Create a fresh axios instance with auth headers
//   return axios.create({
//     baseURL: API_URL,
//     headers: {
//       'Content-Type': 'application/json',
//       'Authorization': `Bearer ${token}`
//     },
//     // Add a timeout to avoid hanging requests
//     timeout: 10000
//   });
// };

// Get all rocks
export const getRocks = async (category: string): Promise<IRock[]> => {
  try {
    console.log('Fetching rocks from API...');
    console.log('API URL:', `${API_URL}/rocks`);
    
    // Add category as a query parameter if provided and not ALL
    const url = category && category !== 'ALL' 
      ? `${API_URL}/rocks?category=${encodeURIComponent(category)}` 
      : `${API_URL}/rocks`;
    
    console.log('Request URL with category:', url);
    
    const response = await axios.get(url);
    console.log('API Response status:', response.status);
    console.log('Response data length:', response.data?.data?.length || 'unknown');
    
    if (!response.data || !response.data.data) {
      console.warn('No data received from API');
      return [];
    }
    
    // Extract the data from the response
    const rocks = response.data.data || [];
    
    // Check if rocks is an array
    if (!Array.isArray(rocks)) {
      console.warn('Rocks data is not an array', rocks);
      return [];
    }
    
    console.log('Extracted rocks array:', rocks.length, 'items');
    return rocks;
  } catch (error) {
    console.error('Error fetching rocks:', error);
    throw new Error('Failed to fetch rocks from the database');
  }
};

// Get a rock by ID
export const getRockById = async (id: string): Promise<IRock> => {
  try {
    const response = await axios.get(`${API_URL}/rocks/${id}`);
    return response.data.data;
  } catch (error) {
    console.error('Error fetching rock by ID:', error);
    throw new Error('Failed to fetch rock details');
  }
};

// Add a new rock
export const addRock = async (rockData: Omit<IRock, 'id'>): Promise<IRock> => {
  try {
    // Get token using the helper function
    const token = getAuthToken();

    if (!token) {
      throw new Error('Authentication token not found. Please log in again.');
    }

    console.log('Add rock data before cleaning:', rockData);
    
    // Clean the data to remove any problematic fields
    const cleanedData = cleanRockData(rockData);
    console.log('Add rock data after cleaning:', cleanedData);

    // Create a fresh axios instance with auth headers
    const authAxios = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      withCredentials: true,
      // Add a timeout to avoid hanging requests
      timeout: 10000
    });
    
    console.log('Sending POST request to:', `${API_URL}/rocks`);
    const response = await authAxios.post('/rocks', cleanedData);
    console.log('Response status:', response.status);
    
    if (!response.data || !response.data.data) {
      throw new Error('Invalid response format');
    }
    
    return response.data.data;
  } catch (error) {
    console.error('Error adding rock:', error);
    
    // Enhanced error handling to provide more details
    if (axios.isAxiosError(error)) {
      const statusCode = error.response?.status;
      const responseData = error.response?.data;
      
      console.error(`API Error (${statusCode}):`, responseData);
      
      // Handle token expiration specifically
      if (statusCode === 401) {
        localStorage.removeItem('access_token');
        toast.error('Your session has expired. Please log in again.');
      }
      
      if (responseData?.message) {
        throw new Error(`Failed to add rock: ${responseData.message}`);
      }
    }
    
    throw new Error('Failed to add rock. Please try again.');
  }
};

/**
 * Update an existing rock
 */
export const updateRock = async (
  id: string,
  rockData: Partial<IRock>
): Promise<IRock> => {
  try {
    console.log('⭐ Update rock service called with ID:', id);
    console.log('⭐ Initial rock data:', JSON.stringify(rockData, null, 2));
    
    // First, get the current rock to preserve the rock_code
    let originalRockCode = rockData.rock_code;
    try {
      const currentRock = await getRockById(id);
      if (currentRock && currentRock.rock_code) {
        originalRockCode = currentRock.rock_code;
        console.log('🔑 Retrieved original rock_code:', originalRockCode);
      }
    } catch (fetchError) {
      console.warn('⚠️ Could not fetch original rock, using provided rock_code');
    }
    
    // Clean the data to only include valid fields
    const cleanedData = cleanRockData(rockData);
    
    // Always use the original rock_code to prevent unique constraint violations
    if (originalRockCode) {
      cleanedData.rock_code = originalRockCode;
      console.log('🔒 Ensuring original rock_code is preserved:', originalRockCode);
    }
    
    console.log('🧹 Cleaned data for update:', JSON.stringify(cleanedData, null, 2));
    
    // Get token using the helper function
    const token = getAuthToken();

    if (!token) {
      throw new Error('Authentication token not found. Please log in again.');
    }
    
    // Create a fresh axios instance with auth headers
    const authAxios = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      withCredentials: true,
      timeout: 10000
    });
    
    // Make the request
    console.log('📤 Sending update request...');
    const response = await authAxios.put(`/rocks/${id}`, cleanedData);
    
    console.log('📥 Update response status:', response.status);
    console.log('📥 Update response data:', response.data);
    
    if (!response.data || !response.data.data) {
      throw new Error('Invalid response format');
    }
    
    return response.data.data;
  } catch (error: any) {
    console.error('❌ Error updating rock:', error);
    
    // Enhanced error logging
    if (error.response) {
      console.error('❌ Error status:', error.response.status);
      console.error('❌ Error data:', error.response.data);
      
      // Handle token expiration specifically
      if (error.response.status === 401) {
        localStorage.removeItem('access_token');
        toast.error('Your session has expired. Please log in again.');
      }
      
      // Special handling for 400 errors with schema issues
      if (error.response.status === 400 && 
          error.response.data?.message?.includes('Schema mismatch')) {
        const message = `Database schema error: ${error.response.data.message}`;
        throw new Error(message);
      }
    }
    
    throw new Error(error.response?.data?.message || error.message || 'Failed to update rock. Please try again.');
  }
};

// Delete a rock
export const deleteRock = async (id: string): Promise<void> => {
  try {
    // Get token using the helper function
    const token = getAuthToken();

    if (!token) {
      throw new Error('Authentication token not found. Please log in again.');
    }

    // Set headers with the token for authorization
    const headers = {
      Authorization: `Bearer ${token}`
    };

    console.log('Delete rock headers:', headers);
    console.log('Deleting rock ID:', id);

    await axios.delete(`${API_URL}/rocks/${id}`, { 
      headers,
      withCredentials: true 
    });
  } catch (error) {
    console.error('Error deleting rock:', error);
    throw new Error('Failed to delete rock. Please try again.');
  }
};

// Import rocks from Excel
export const importRocksFromExcel = async (
  file: File
): Promise<{ success: boolean; message: string }> => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await axios.post(`${API_URL}/rocks/import`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      withCredentials: true,
    });

    return response.data;
  } catch (error: any) {
    console.error('Error importing rocks from Excel:', error);
    throw new Error(error.response?.data?.message || 'Failed to import rocks');
  }
};

// Paginated fetch for rocks
export const fetchRocks = async (
  category: string,
  page: number = 1,
  pageSize: number = 10
): Promise<{ data: IRock[]; pagination: { total: number; page: number; pageSize: number; totalPages: number } }> => {
  try {
    let params = new URLSearchParams();
    if (category && category !== 'ALL') {
      params.append('category', category);
    }
    params.append('page', page.toString());
    params.append('pageSize', pageSize.toString());
    const url = `${API_URL}/rocks?${params.toString()}`;
    
    // Get the authentication token
    const token = getAuthToken();
    
    // Set up request headers with authentication
    const headers: Record<string, string> = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    console.log('Fetch rocks headers:', headers);
    console.log('Fetch rocks URL:', url);
    
    const response = await axios.get(url, { headers });
    
    if (!response.data || !response.data.data) {
      return { data: [], pagination: { total: 0, page, pageSize, totalPages: 0 } };
    }
    const rocks = response.data.data || [];
    const pagination = response.data.pagination || {
      total: rocks.length,
      page,
      pageSize,
      totalPages: Math.ceil(rocks.length / pageSize)
    };
    return { data: rocks, pagination };
  } catch (error) {
    console.error('Error fetching rocks:', error);
    throw new Error('Failed to fetch rocks from the database');
  }
};

/**
 * Cleans rock data to include only valid fields from the schema
 */
export const cleanRockData = (rockData: any): Partial<IRock> => {
  // Only include fields that are in the IRock interface
  const validKeys = [
    'id', 'rock_code', 'name', 'chemical_formula', 'hardness',
    'category', 'type', 'depositional_environment', 'grain_size',
    'color', 'texture', 'latitude', 'longitude', 'locality',
    'mineral_composition', 'description', 'formation', 'geological_age',
    'status', 'image_url', 'associated_minerals', 'metamorphism_type',
    'metamorphic_grade', 'parent_rock', 'foliation', 'foliation_type',
    'silica_content', 'cooling_rate', 'mineral_content', 
    'bedding', 'sorting', 'roundness', 'fossil_content', 'sediment_source',
    'commodity_type', 'ore_group', 'mining_company', 'coordinates',
    'luster', 'reaction_to_hcl', 'magnetism', 'streak', 'protolith',
    'created_at', 'updated_at'
  ];
  
  // Create a new object with only valid fields
  const cleanedData: Partial<IRock> = {};
  
  // Add each valid field if it exists in the input data
  for (const key of validKeys) {
    if (rockData[key] !== undefined) {
      cleanedData[key] = rockData[key];
    }
  }
  
  // Explicitly remove ALL problematic fields that might be included
  delete (cleanedData as any).origin;
  delete (cleanedData as any).user;
  delete (cleanedData as any).user_id;
  delete (cleanedData as any).user_metadata;
  delete (cleanedData as any).auth;
  delete (cleanedData as any).auth_user;
  delete (cleanedData as any).auth_user_id;
  delete (cleanedData as any).owner;
  delete (cleanedData as any).owner_id;
  
  return cleanedData;
}; 