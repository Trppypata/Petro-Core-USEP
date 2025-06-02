import { fetchRocks } from '../../../admin/rocks/services';
import { fetchMinerals } from '../../../admin/minerals/services/minerals.service';
import type { IRock } from '../../../admin/rocks/rock.interface';
import type { IMineral } from '../../../admin/minerals/mineral.interface';
import type { RocksMineralsItem } from '../types';
import { getRockImages } from '@/services/rock-images.service';
import type { FiltersState } from '../filters/RockMineralFilters';

// Default image placeholder - updated paths to use static assets from petro-static folder
const DEFAULT_ROCK_IMAGE = '/petro-static/default-rock.jpg';
const DEFAULT_MINERAL_IMAGE = '/petro-static/default-mineral.jpg';

// Check if an image URL is valid
const isValidImageUrl = (url: string | null | undefined): boolean => {
  if (!url) return false;
  
  // Handle relative paths in public directory
  if (url.startsWith('/')) {
    return true;
  }
  
  // Check if it's a Supabase URL
  if (url.includes('supabase.co')) {
    return true;
  }
  
  // Check if it's a valid absolute URL
  try {
    new URL(url);
    return true;
  } catch (e) {
    console.log('Invalid URL:', url);
    return false;
  }
};

/**
 * Transform rock data to display format with additional images
 */
const transformRockData = async (rock: IRock): Promise<RocksMineralsItem> => {
  console.log('Processing rock:', rock.name, 'Image URL:', rock.image_url);
  
  // Try to fetch additional images for the rock
  let firstImageUrl = rock.image_url; // Default to main image
  
  try {
    // Get additional images for this rock
    const additionalImages = await getRockImages(rock.id || '');
    console.log('Additional images for', rock.name, ':', additionalImages.length);
    
    // If there are additional images, use the first one (if main image is missing)
    if (additionalImages && additionalImages.length > 0) {
      // If no main image, use the first additional image
      if (!isValidImageUrl(firstImageUrl)) {
        firstImageUrl = additionalImages[0].image_url;
        console.log('Using first additional image instead:', firstImageUrl);
      }
      
      // Store all image URLs for gallery view
      const allImageUrls = [
        ...(isValidImageUrl(rock.image_url) ? [rock.image_url as string] : []),
        ...additionalImages.map(img => img.image_url)
      ];
      
      // Create description based on category
      let categorySpecificDescription = rock.description || `${rock.category} rock from ${rock.locality || 'unknown location'}`;
      
      // Create transformed rock data
      return {
        id: rock.id || rock.rock_code,
        title: rock.name,
        description: categorySpecificDescription,
        imageUrl: isValidImageUrl(firstImageUrl) ? firstImageUrl : DEFAULT_ROCK_IMAGE,
        path: `/rock-minerals/rock/${rock.id}`,
        category: rock.category,
        type: 'rock',
        additionalImages: allImageUrls,
        color: rock.color,
        associatedMinerals: rock.associated_minerals,
        coordinates: rock.coordinates,
        latitude: rock.latitude,
        longitude: rock.longitude,
        locality: rock.locality,
        texture: rock.texture,
        foliation: rock.foliation,
        rockType: rock.type
      };
    }
  } catch (error) {
    console.error('Error fetching additional images for rock:', rock.id, error);
  }
  
  // Use a static image if rock doesn't have a valid image URL
  const imageUrl = isValidImageUrl(rock.image_url) ? rock.image_url : DEFAULT_ROCK_IMAGE;
  console.log('Final image URL for', rock.name, ':', imageUrl);
  
  // Default return if no additional images or error occurred
  return {
    id: rock.id || rock.rock_code,
    title: rock.name,
    description: rock.description || `${rock.category} rock from ${rock.locality || 'unknown location'}`,
    imageUrl: imageUrl,
    path: `/rock-minerals/rock/${rock.id}`,
    category: rock.category,
    type: 'rock',
    color: rock.color,
    associatedMinerals: rock.associated_minerals,
    coordinates: rock.coordinates,
    latitude: rock.latitude,
    longitude: rock.longitude,
    locality: rock.locality,
    texture: rock.texture,
    foliation: rock.foliation,
    rockType: rock.type
  };
};

/**
 * Transform mineral data to display format
 */
const transformMineralData = (mineral: IMineral): RocksMineralsItem => {
  // Use a static image if mineral doesn't have a valid image URL
  const imageUrl = isValidImageUrl(mineral.image_url) ? mineral.image_url : DEFAULT_MINERAL_IMAGE;
  console.log('Final image URL for', mineral.mineral_name, ':', imageUrl);
  
  return {
    id: mineral.id || mineral.mineral_code,
    title: mineral.mineral_name,
    description: `${mineral.mineral_group} mineral with formula ${mineral.chemical_formula || 'N/A'}`,
    imageUrl: imageUrl,
    path: `/rock-minerals/mineral/${mineral.id}`,
    category: mineral.category,
    type: 'mineral',
    color: mineral.color
  };
};

/**
 * Get rocks with search and filter options
 */
export const getRocks = async (searchTerm: string = '', filters?: FiltersState): Promise<RocksMineralsItem[]> => {
  try {
    // Determine if we need to filter by rock type (category)
    const categoryFilter = filters?.rockType.length ? filters.rockType[0] : 'ALL';
    
    const { data: rocks } = await fetchRocks(categoryFilter, 1, 100);
    if (!rocks || !Array.isArray(rocks)) {
      console.error('Failed to fetch rocks or invalid data format:', rocks);
      return [];
    }
    
    let filteredRocks = rocks;
    
    // Apply search filter if provided
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filteredRocks = filteredRocks.filter(rock => 
        rock.name.toLowerCase().includes(searchLower) ||
        (rock.description && rock.description.toLowerCase().includes(searchLower)) ||
        (rock.category && rock.category.toLowerCase().includes(searchLower)) ||
        (rock.type && rock.type.toLowerCase().includes(searchLower))
      );
    }
    
    // Apply additional filters if provided
    if (filters) {
      // Filter by rock type if we have more than one (first one is already applied in fetchRocks)
      if (filters.rockType.length > 1) {
        const rockTypes = filters.rockType.slice(1); // Skip the first one we already used
        filteredRocks = filteredRocks.filter(rock => 
          rockTypes.some(type => rock.category === type)
        );
      }
      
      // Filter by color
      if (filters.colors.length > 0) {
        filteredRocks = filteredRocks.filter(rock => {
          if (!rock.color) return false;
          const rockColorLower = rock.color.toLowerCase();
          return filters.colors.some(color => 
            rockColorLower.includes(color.toLowerCase())
          );
        });
      }
      
      // Filter by associated minerals
      if (filters.associatedMinerals.length > 0) {
        filteredRocks = filteredRocks.filter(rock => {
          if (!rock.associated_minerals) return false;
          const associatedMineralsLower = rock.associated_minerals.toLowerCase();
          return filters.associatedMinerals.some(mineral => 
            associatedMineralsLower.includes(mineral.toLowerCase())
          );
        });
      }
    }
    
    console.log(`Fetched ${filteredRocks.length} rocks after filtering`);
    
    // Transform all rocks with promise.all since transformRockData is now async
    const transformedRocks = await Promise.all(filteredRocks.map(transformRockData));
    return transformedRocks;
  } catch (error) {
    console.error('Error getting rocks:', error);
    return [];
  }
};

/**
 * Get minerals with search and filter options
 */
export const getMinerals = async (searchTerm: string = '', filters?: FiltersState): Promise<RocksMineralsItem[]> => {
  try {
    // Determine if we need to filter by mineral category
    const categoryFilter = filters?.mineralCategory.length ? filters.mineralCategory[0] : 'ALL';
    
    const { data: minerals } = await fetchMinerals(categoryFilter, 1, 100);
    if (!minerals || !Array.isArray(minerals)) {
      console.error('Failed to fetch minerals or invalid data format:', minerals);
      return [];
    }
    
    let filteredMinerals = minerals;
    
    // Apply search filter if provided
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filteredMinerals = filteredMinerals.filter(mineral => 
        mineral.mineral_name.toLowerCase().includes(searchLower) ||
        (mineral.mineral_group && mineral.mineral_group.toLowerCase().includes(searchLower)) ||
        (mineral.category && mineral.category.toLowerCase().includes(searchLower)) ||
        (mineral.chemical_formula && mineral.chemical_formula.toLowerCase().includes(searchLower))
      );
    }
    
    // Apply additional filters if provided
    if (filters) {
      // Filter by mineral category if we have more than one (first one is already applied in fetchMinerals)
      if (filters.mineralCategory.length > 1) {
        const mineralCategories = filters.mineralCategory.slice(1); // Skip the first one we already used
        filteredMinerals = filteredMinerals.filter(mineral => 
          mineralCategories.some(category => mineral.category === category)
        );
      }
      
      // Filter by color
      if (filters.colors.length > 0) {
        filteredMinerals = filteredMinerals.filter(mineral => {
          if (!mineral.color) return false;
          const mineralColorLower = mineral.color.toLowerCase();
          return filters.colors.some(color => 
            mineralColorLower.includes(color.toLowerCase())
          );
        });
      }
    }
    
    console.log(`Fetched ${filteredMinerals.length} minerals after filtering`);
    
    return filteredMinerals.map(transformMineralData);
  } catch (error) {
    console.error('Error getting minerals:', error);
    return [];
  }
};

/**
 * Get both rocks and minerals combined with filters
 */
export const getRocksAndMinerals = async (searchTerm?: string, filters?: FiltersState): Promise<RocksMineralsItem[]> => {
  const [rocks, minerals] = await Promise.all([
    getRocks(searchTerm, filters),
    getMinerals(searchTerm, filters)
  ]);
  
  return [...rocks, ...minerals];
}; 