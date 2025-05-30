import axios from 'axios';
import type { IMineral } from '../mineral.interface';

const API_URL = import.meta.env.VITE_local_url || 'http://localhost:8001/api';

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
    const response = await axios.post(`${API_URL}/minerals`, mineralData);
    return response.data.data;
  } catch (error) {
    console.error('Error adding mineral:', error);
    throw new Error('Failed to add mineral. Please try again.');
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