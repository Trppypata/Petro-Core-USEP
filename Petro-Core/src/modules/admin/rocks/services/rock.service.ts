import axios from 'axios';
import type { IRock } from '../rock.interface';
import Cookies from 'js-cookie';

const API_URL = import.meta.env.VITE_local_url || 'http://localhost:8001/api';

// Helper function to get the authentication token
const getAuthToken = (): string | null => {
  // Try to get token from multiple possible sources
  return localStorage.getItem('access_token') || 
         Cookies.get('access_token') || 
         localStorage.getItem('token') || 
         localStorage.getItem('auth_token');
};

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

    // Set headers with the token for authorization
    const headers = {
      Authorization: `Bearer ${token}`
    };

    console.log('Add rock headers:', headers);
    console.log('Add rock data:', rockData);

    const response = await axios.post(`${API_URL}/rocks`, rockData, { headers });
    return response.data.data;
  } catch (error) {
    console.error('Error adding rock:', error);
    throw new Error('Failed to add rock. Please try again.');
  }
};

// Update a rock
export const updateRock = async (
  id: string,
  rockData: Partial<IRock>
): Promise<IRock> => {
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

    console.log('Update rock headers:', headers);
    console.log('Update rock data:', rockData);

    const response = await axios.put(`${API_URL}/rocks/${id}`, rockData, { headers });
    return response.data.data;
  } catch (error) {
    console.error('Error updating rock:', error);
    throw new Error('Failed to update rock. Please try again.');
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

    await axios.delete(`${API_URL}/rocks/${id}`, { headers });
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