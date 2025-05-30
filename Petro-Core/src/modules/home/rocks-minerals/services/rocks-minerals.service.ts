import { fetchRocks } from '../../../admin/rocks/services';
import { fetchMinerals } from '../../../admin/minerals/services/minerals.service';
import type { IRock } from '../../../admin/rocks/rock.interface';
import type { IMineral } from '../../../admin/minerals/mineral.interface';
import type { RocksMineralsItem } from '../types';

// Default image placeholder
const DEFAULT_ROCK_IMAGE = '/images/rocks-minerals/default-rock.jpg';
const DEFAULT_MINERAL_IMAGE = '/images/rocks-minerals/default-mineral.jpg';

/**
 * Transform rock data to display format
 */
const transformRockData = (rock: IRock): RocksMineralsItem => {
  return {
    id: rock.id || rock.rock_code,
    title: rock.name,
    description: rock.description || `${rock.category} rock from ${rock.locality || 'unknown location'}`,
    imageUrl: rock.image_url || DEFAULT_ROCK_IMAGE,
    path: `/rock-minerals/rock/${rock.id}`,
    category: rock.category,
    type: 'rock'
  };
};

/**
 * Transform mineral data to display format
 */
const transformMineralData = (mineral: IMineral): RocksMineralsItem => {
  return {
    id: mineral.id || mineral.mineral_code,
    title: mineral.mineral_name,
    description: mineral.chemical_formula 
      ? `${mineral.mineral_group} - ${mineral.chemical_formula}`
      : mineral.mineral_group,
    imageUrl: mineral.image_url || DEFAULT_MINERAL_IMAGE,
    path: `/rock-minerals/mineral/${mineral.id}`,
    category: mineral.category,
    type: 'mineral'
  };
};

/**
 * Fetch rocks with optional search filter
 */
export const getRocks = async (searchTerm?: string): Promise<RocksMineralsItem[]> => {
  try {
    // Fetch all rocks with a large page size to get most records
    const response = await fetchRocks('ALL', 1, 100);
    
    if (!response.data) {
      return [];
    }
    
    // Transform rocks to display format
    const rocks = response.data.map(transformRockData);
    
    // Apply search filter if provided
    if (searchTerm && searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      return rocks.filter(rock => 
        rock.title.toLowerCase().includes(term) ||
        rock.description.toLowerCase().includes(term) ||
        rock.category.toLowerCase().includes(term)
      );
    }
    
    return rocks;
  } catch (error) {
    console.error('Error fetching rocks:', error);
    return [];
  }
};

/**
 * Fetch minerals with optional search filter
 */
export const getMinerals = async (searchTerm?: string): Promise<RocksMineralsItem[]> => {
  try {
    // Fetch all minerals with a large page size to get most records
    const response = await fetchMinerals('ALL', 1, 100);
    
    if (!response.data) {
      return [];
    }
    
    // Transform minerals to display format
    const minerals = response.data.map(transformMineralData);
    
    // Apply search filter if provided
    if (searchTerm && searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      return minerals.filter(mineral => 
        mineral.title.toLowerCase().includes(term) ||
        mineral.description.toLowerCase().includes(term) ||
        mineral.category.toLowerCase().includes(term)
      );
    }
    
    return minerals;
  } catch (error) {
    console.error('Error fetching minerals:', error);
    return [];
  }
};

/**
 * Get both rocks and minerals combined
 */
export const getRocksAndMinerals = async (searchTerm?: string): Promise<RocksMineralsItem[]> => {
  const [rocks, minerals] = await Promise.all([
    getRocks(searchTerm),
    getMinerals(searchTerm)
  ]);
  
  return [...rocks, ...minerals];
}; 