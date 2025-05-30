import axios from 'axios';
import type { IMineral } from '../mineral.interface';
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

// Get all minerals by category
export const getMinerals = async (
  category: string
): Promise<IMineral[]> => {
  try {
    console.log('🔍 Fetching minerals from API...');
    console.log('🔗 API URL:', `${API_URL}/minerals`);
    
    // Add category as a query parameter if provided and not ALL
    const url = category && category !== 'ALL' 
      ? `${API_URL}/minerals?category=${encodeURIComponent(category)}` 
      : `${API_URL}/minerals`;
    
    console.log('🔍 Request URL with category:', url);
    
    const response = await axios.get(url);
    console.log('✅ Raw API Response status:', response.status);
    console.log('✅ Response data length:', response.data?.data?.length || 'unknown');
    
    if (!response.data || !response.data.data) {
      console.warn('⚠️ No data received from API');
      return [];
    }
    
    // Extract the data from the response
    const minerals = response.data.data || [];
    
    // Check if minerals is an array
    if (!Array.isArray(minerals)) {
      console.warn('⚠️ Minerals data is not an array', minerals);
      return [];
    }
    
    console.log('✅ Extracted minerals array:', minerals.length, 'items');
    return minerals;
  } catch (error) {
    console.error('❌ Error fetching minerals:', error);
    throw new Error('Failed to fetch minerals from the database');
  }
};

// Import minerals from Excel
export const importMineralsFromExcel = async (
  file: File
): Promise<{ success: boolean; message: string }> => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await axios.post(`${API_URL}/minerals/import`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  } catch (error: any) {
    console.error('Error importing minerals from Excel:', error);
    throw new Error(error.response?.data?.message || 'Failed to import minerals');
  }
};

// Add a new mineral
export const addMineral = async (
  mineralData: Omit<IMineral, 'id'>
): Promise<IMineral> => {
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

    console.log('Add mineral headers:', headers);
    console.log('Add mineral data:', mineralData);

    const response = await axios.post(`${API_URL}/minerals`, mineralData, { headers });
    return response.data.data;
  } catch (error) {
    console.error('Error adding mineral:', error);
    throw new Error('Failed to add mineral. Please try again.');
  }
};

// Update a mineral
export const updateMineral = async (
  id: string,
  mineralData: Partial<IMineral>
): Promise<IMineral> => {
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

    console.log('Update mineral headers:', headers);
    console.log('Update mineral data:', mineralData);

    const response = await axios.put(`${API_URL}/minerals/${id}`, mineralData, { headers });
    return response.data.data;
  } catch (error) {
    console.error('Error updating mineral:', error);
    throw new Error('Failed to update mineral. Please try again.');
  }
};

// Delete a mineral
export const deleteMineral = async (id: string): Promise<void> => {
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

    console.log('Delete mineral headers:', headers);
    console.log('Deleting mineral ID:', id);

    await axios.delete(`${API_URL}/minerals/${id}`, { headers });
  } catch (error) {
    console.error('Error deleting mineral:', error);
    throw new Error('Failed to delete mineral. Please try again.');
  }
};

// Mock functions for development until the API is implemented
const mockMinerals: IMineral[] = [
  {
    id: 'M-SFS-001',
    mineral_code: 'M-SFS-001',
    mineral_name: 'Enargite',
    chemical_formula: 'Cu₃AsS₄',
    mineral_group: 'Sulfosalt',
    color: 'Gray-black',
    streak: 'Black',
    luster: 'Metallic',
    hardness: '3',
    cleavage: 'Perfect',
    fracture: 'Uneven',
    habit: 'Prismatic, striated',
    crystal_system: 'Orthorhombic',
    category: 'SULFOSALTS',
    type: 'mineral',
  },
  {
    id: 'M-SFS-002',
    mineral_code: 'M-SFS-002',
    mineral_name: 'Tetrahedrite',
    chemical_formula: '(Cu,Fe)₁₂Sb₄S₁₃',
    mineral_group: 'Sulfosalt',
    color: 'Black to gray',
    streak: 'Black',
    luster: 'Metallic',
    hardness: '3-4',
    cleavage: 'None',
    fracture: 'Uneven',
    habit: 'Tetrahedral, massive',
    crystal_system: 'Cubic',
    category: 'SULFOSALTS',
    type: 'mineral',
  },
];

const mockGetMinerals = (
  category: string
): Promise<IMineral[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (category === 'ALL') {
        resolve(mockMinerals);
      } else {
        const filtered = mockMinerals.filter(
          (mineral) => mineral.category === category
        );
        resolve(filtered);
      }
    }, 500);
  });
};

const mockAddMineral = (
  mineralData: Omit<IMineral, 'id'>
): Promise<IMineral> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const newMineral = {
        ...mineralData,
        id: `M-${Math.random().toString(36).substr(2, 9)}`,
      };
      mockMinerals.push(newMineral);
      resolve(newMineral);
    }, 500);
  });
};

// Paginated fetch for minerals
export const fetchMinerals = async (
  category: string,
  page: number = 1,
  pageSize: number = 10
): Promise<{ data: IMineral[]; pagination: { total: number; page: number; pageSize: number; totalPages: number } }> => {
  try {
    let params = new URLSearchParams();
    if (category && category !== 'ALL') {
      params.append('category', category);
    }
    params.append('page', page.toString());
    params.append('pageSize', pageSize.toString());
    const url = `${API_URL}/minerals?${params.toString()}`;
    
    // Get the authentication token
    const token = getAuthToken();
    
    // Set up request headers with authentication
    const headers: Record<string, string> = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    console.log('Fetch minerals headers:', headers);
    console.log('Fetch minerals URL:', url);
    
    const response = await axios.get(url, { headers });
    
    if (!response.data || !response.data.data) {
      return { data: [], pagination: { total: 0, page, pageSize, totalPages: 0 } };
    }
    const minerals = response.data.data || [];
    const pagination = response.data.pagination || {
      total: minerals.length,
      page,
      pageSize,
      totalPages: Math.ceil(minerals.length / pageSize)
    };
    return { data: minerals, pagination };
  } catch (error) {
    console.error('Error fetching minerals:', error);
    throw new Error('Failed to fetch minerals from the database');
  }
}; 