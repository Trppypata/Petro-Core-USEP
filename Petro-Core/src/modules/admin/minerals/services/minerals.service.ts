import axios from 'axios';
import type { IMineral } from '../mineral.interface';

const API_URL = import.meta.env.VITE_local_url || 'http://localhost:8000/api';

// Get all minerals by category
export const getMinerals = async (
  category: string
): Promise<IMineral[]> => {
  try {
    console.log('Fetching minerals from API...');
    const response = await axios.get(`${API_URL}/minerals`);
    console.log('API response:', response.data);
    
    let minerals = response.data.data || [];
    
    // Filter by category if specified and not 'ALL'
    if (category && category !== 'ALL') {
      minerals = minerals.filter((mineral: IMineral) => 
        mineral.category === category
      );
    }
    
    return minerals;
  } catch (error) {
    console.error('Error fetching minerals:', error);
    // Fallback to mock data only if API fails
    console.log('Falling back to mock data');
    return mockGetMinerals(category);
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

// Import minerals from default Excel file
export const importDefaultMinerals = async (): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await axios.post(`${API_URL}/minerals/import-default`);
    return response.data;
  } catch (error: any) {
    console.error('Error importing default minerals:', error);
    throw new Error(error.response?.data?.message || 'Failed to import default minerals');
  }
};

// Add a new mineral
export const addMineral = async (
  mineralData: Omit<IMineral, 'id'>
): Promise<IMineral> => {
  try {
    // For development, we'll first try to load from a mock source
    // In production, this would be replaced with a real API call
    if (process.env.NODE_ENV === 'development') {
      return mockAddMineral(mineralData);
    }

    const response = await axios.post(`${API_URL}/minerals`, mineralData);
    return response.data.data;
  } catch (error) {
    console.error('Error adding mineral:', error);
    
    // For development only
    if (process.env.NODE_ENV === 'development') {
      return mockAddMineral(mineralData);
    }
    
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