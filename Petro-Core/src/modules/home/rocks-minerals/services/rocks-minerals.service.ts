import { fetchRocks } from '../../../admin/rocks/services';
import { fetchMinerals } from '../../../admin/minerals/services/minerals.service';
import type { IRock } from '../../../admin/rocks/rock.interface';
import type { IMineral } from '../../../admin/minerals/mineral.interface';
import type { RocksMineralsItem } from '../types';

// Default image placeholder
const DEFAULT_ROCK_IMAGE = '/images/rocks-minerals/default-rock.jpg';
const DEFAULT_MINERAL_IMAGE = '/images/rocks-minerals/default-mineral.jpg';

// Check if an image URL is from Supabase and valid
const isValidImageUrl = (url: string | null | undefined): boolean => {
  if (!url) return false;
  
  // Check if it's a Supabase URL (we'll assume it's valid if it is)
  if (url.includes('supabase.co')) {
    return true;
  }
  
  // Check if it's a valid URL
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
};

/**
 * Transform rock data to display format
 */
const transformRockData = (rock: IRock): RocksMineralsItem => {
  return {
    id: rock.id || rock.rock_code,
    title: rock.name,
    description: rock.description || `${rock.category} rock from ${rock.locality || 'unknown location'}`,
    imageUrl: isValidImageUrl(rock.image_url) ? rock.image_url : DEFAULT_ROCK_IMAGE,
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
    description: `${mineral.mineral_group} mineral with formula ${mineral.chemical_formula || 'N/A'}`,
    imageUrl: isValidImageUrl(mineral.image_url) ? mineral.image_url : DEFAULT_MINERAL_IMAGE,
    path: `/rock-minerals/mineral/${mineral.id}`,
    category: mineral.category,
    type: 'mineral'
  };
};

/**
 * Get rocks with optional search filter
 */
export const getRocks = async (searchTerm: string = ''): Promise<RocksMineralsItem[]> => {
  try {
    const { data: rocks } = await fetchRocks('ALL', 1, 100);
    if (!rocks || !Array.isArray(rocks)) {
      console.error('Failed to fetch rocks or invalid data format:', rocks);
      return [];
    }
    
    let filteredRocks = rocks;
    
    // Apply search filter if provided
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filteredRocks = rocks.filter(rock => 
        rock.name.toLowerCase().includes(searchLower) ||
        (rock.description && rock.description.toLowerCase().includes(searchLower)) ||
        (rock.category && rock.category.toLowerCase().includes(searchLower)) ||
        (rock.type && rock.type.toLowerCase().includes(searchLower))
      );
    }
    
    return filteredRocks.map(transformRockData);
  } catch (error) {
    console.error('Error getting rocks:', error);
    return [];
  }
};

/**
 * Get minerals with optional search filter
 */
export const getMinerals = async (searchTerm: string = ''): Promise<RocksMineralsItem[]> => {
  try {
    const { data: minerals } = await fetchMinerals('ALL', 1, 100);
    if (!minerals || !Array.isArray(minerals)) {
      console.error('Failed to fetch minerals or invalid data format:', minerals);
      return [];
    }
    
    let filteredMinerals = minerals;
    
    // Apply search filter if provided
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filteredMinerals = minerals.filter(mineral => 
        mineral.mineral_name.toLowerCase().includes(searchLower) ||
        (mineral.mineral_group && mineral.mineral_group.toLowerCase().includes(searchLower)) ||
        (mineral.category && mineral.category.toLowerCase().includes(searchLower)) ||
        (mineral.chemical_formula && mineral.chemical_formula.toLowerCase().includes(searchLower))
      );
    }
    
    return filteredMinerals.map(transformMineralData);
  } catch (error) {
    console.error('Error getting minerals:', error);
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