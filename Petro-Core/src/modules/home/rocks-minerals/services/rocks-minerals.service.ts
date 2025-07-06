import { fetchRocks } from '@/modules/admin/rocks/services';
import { fetchMinerals } from '../../../admin/minerals/services/minerals.service';
import type { IRock } from '../../../admin/rocks/rock.interface';
import type { IMineral } from '../../../admin/minerals/mineral.interface';
import type { RocksMineralsItem } from '../types';
import { getRockImages } from '@/services/rock-images.service';
import type { FiltersState } from '../filters/RockMineralFilters';
import axios from 'axios';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';


const API_URL = import.meta.env.VITE_local_url || 'http://localhost:8001/api';

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
  
  // Check if it's a complete URL
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Transform a rock database object into a standard display format
 */
const transformRockData = async (rock: IRock): Promise<RocksMineralsItem> => {
  // Initialize image URL from the rock data, falling back to default
  let imageUrl = isValidImageUrl(rock.image_url) ? rock.image_url : DEFAULT_ROCK_IMAGE;
  
  try {
    // Try to fetch additional images from the rock_images table
    if (rock.id) {
      const images = await getRockImages(rock.id);
      // If there are additional images, use the first one as the main image
      if (images && images.length > 0) {
        imageUrl = images[0].image_url;
      }
    }
  } catch (error) {
    console.error(`Failed to fetch additional images for rock ${rock.id}:`, error);
    // Continue with the default image
  }
  
  // Format the description to show rock type and locality
  const description = `${rock.category} rock from ${rock.locality || 'n/a'}`;
  
  const formattedCoordinates = rock.coordinates || 
                           (rock.latitude && rock.longitude ? 
                             `${rock.latitude}, ${rock.longitude}` : 
                             undefined);
  
  // Calculate path for rock detail view
  const path = rock.id ? `/rock-minerals/rock/${rock.id}` : undefined;
  
  // Determine the appropriate rockType value
  let rockType = rock.type || '';
  
  // If rockType is empty, use the category
  if (!rockType && rock.category) {
    rockType = rock.category;
  }
  
  // Special case for Ore Samples
  if (rock.category === 'Ore Samples' || rockType === 'Ore') {
    rockType = 'Ore Samples';
  }
  
  // Transform to standard format
  return {
    id: rock.id || '',
    title: rock.name || '',
    description,
    imageUrl,
    path,
    category: rock.category || '',
    type: 'rock',
    color: rock.color || '',
    associatedMinerals: rock.associated_minerals || rock.mineral_composition || '',
    coordinates: formattedCoordinates,
    latitude: rock.latitude,
    longitude: rock.longitude,
    locality: rock.locality || '',
    // Category-specific properties
    texture: rock.texture || '',
    foliation: rock.foliation || '',
    rockType: rockType
  };
};

/**
 * Transform a mineral database object into a standard display format
 */
const transformMineralData = (mineral: IMineral): RocksMineralsItem => {
  // Format the description to show mineral category and occurrence
  const description = `${mineral.category || mineral.mineral_group || 'Mineral'} from ${mineral.occurrence || 'n/a'}`;
  
  // Calculate path for mineral detail view
  const path = mineral.id ? `/rock-minerals/mineral/${mineral.id}` : undefined;
  
  return {
    id: mineral.id || '',
    title: mineral.mineral_name || '',
    description,
    imageUrl: mineral.image_url || DEFAULT_MINERAL_IMAGE,
    path,
    category: mineral.category || mineral.mineral_group || '',
    type: 'mineral',
    color: mineral.color || '',
    associatedMinerals: '',
    locality: mineral.occurrence || '',
    // Include these fields but they'll likely be empty for minerals
    texture: '',
    foliation: '',
    rockType: ''
  };
};

/**
 * Helper function to deduplicate rocks by rock_code and name
 */
const deduplicateRocks = (rocks: IRock[]): IRock[] => {
  const uniqueByCode = new Map<string, IRock>();
  const uniqueByNameCategory = new Map<string, IRock>();
  
  // First pass: deduplicate by rock_code
  rocks.forEach(rock => {
    if (rock.rock_code) {
      const cleanCode = rock.rock_code.replace(/\s+/g, '').toLowerCase();
      
      // If we already have this code, keep the most recently updated one
      if (uniqueByCode.has(cleanCode)) {
        const existing = uniqueByCode.get(cleanCode)!;
        
        // Compare updated_at dates if available
        if (rock.updated_at && existing.updated_at) {
          if (new Date(rock.updated_at) > new Date(existing.updated_at)) {
            uniqueByCode.set(cleanCode, rock);
          }
        } else {
          // If no dates, prefer the one with more complete data
          const rockFields = Object.values(rock).filter(v => v !== null && v !== undefined && v !== '').length;
          const existingFields = Object.values(existing).filter(v => v !== null && v !== undefined && v !== '').length;
          
          if (rockFields > existingFields) {
            uniqueByCode.set(cleanCode, rock);
          }
        }
      } else {
        uniqueByCode.set(cleanCode, rock);
      }
    }
  });
  
  // Second pass: handle rocks without codes by name+category
  rocks.forEach(rock => {
    // Skip if already included by code
    if (rock.rock_code && uniqueByCode.has(rock.rock_code.replace(/\s+/g, '').toLowerCase())) {
      return;
    }
    
    if (rock.name && rock.category) {
      const nameKey = `${rock.name.toLowerCase()}-${rock.category.toLowerCase()}`;
      
      // If we already have this name+category, keep the most recently updated one
      if (uniqueByNameCategory.has(nameKey)) {
        const existing = uniqueByNameCategory.get(nameKey)!;
        
        // Compare updated_at dates if available
        if (rock.updated_at && existing.updated_at) {
          if (new Date(rock.updated_at) > new Date(existing.updated_at)) {
            uniqueByNameCategory.set(nameKey, rock);
          }
        } else {
          // If no dates, prefer the one with more complete data
          const rockFields = Object.values(rock).filter(v => v !== null && v !== undefined && v !== '').length;
          const existingFields = Object.values(existing).filter(v => v !== null && v !== undefined && v !== '').length;
          
          if (rockFields > existingFields) {
            uniqueByNameCategory.set(nameKey, rock);
          }
        }
      } else {
        uniqueByNameCategory.set(nameKey, rock);
      }
    }
  });
  
  // Combine both sets of unique rocks
  const uniqueRocks = [...uniqueByCode.values(), ...uniqueByNameCategory.values()];
  
  console.log(`Deduplicated ${rocks.length} rocks to ${uniqueRocks.length} unique rocks`);
  return uniqueRocks;
};

/**
 * Enhanced search function for rocks
 * Searches across all relevant fields of rock data
 */
export const getRocks = async (searchTerm: string = '', filters?: FiltersState): Promise<RocksMineralsItem[]> => {
  try {
    console.log('Fetching rocks with search term:', searchTerm);
    console.log('Filters applied:', filters);
    
    // Fetch all rocks from the API or data source
    const { data: rocks } = await fetchRocks('ALL', 1, 1000);
    console.log(`Fetched ${rocks.length} rocks from database`);
    
    // Deduplicate rocks first
    const uniqueRocks = deduplicateRocks(rocks);
    console.log(`After deduplication: ${uniqueRocks.length} rocks`);
    
    // Log the distribution of rock categories
    const categoryDistribution: Record<string, number> = {};
    uniqueRocks.forEach(rock => {
      const category = rock.category || 'Unknown';
      categoryDistribution[category] = (categoryDistribution[category] || 0) + 1;
    });
    console.log('Rock category distribution:', categoryDistribution);

    // Apply search filtering if a search term is provided
    const filteredRocks = uniqueRocks.filter(rock => {
      if (!searchTerm) return true;

      const searchLower = searchTerm.toLowerCase();
      
      // Comprehensive search across all relevant rock fields
      return (
        // Basic fields
        (rock.name && rock.name.toLowerCase().includes(searchLower)) ||
        (rock.rock_code && rock.rock_code.toLowerCase().includes(searchLower)) ||
        (rock.category && rock.category.toLowerCase().includes(searchLower)) ||
        (rock.type && rock.type.toLowerCase().includes(searchLower)) ||
        (rock.color && rock.color.toLowerCase().includes(searchLower)) ||
        (rock.hardness && rock.hardness.toLowerCase().includes(searchLower)) ||
        (rock.texture && rock.texture.toLowerCase().includes(searchLower)) ||
        (rock.grain_size && rock.grain_size.toLowerCase().includes(searchLower)) ||
        (rock.locality && rock.locality.toLowerCase().includes(searchLower)) ||
        (rock.mineral_composition && rock.mineral_composition.toLowerCase().includes(searchLower)) ||
        (rock.description && rock.description.toLowerCase().includes(searchLower)) ||
        (rock.formation && rock.formation.toLowerCase().includes(searchLower)) ||
        (rock.depositional_environment && rock.depositional_environment.toLowerCase().includes(searchLower)) ||
        
        // Associated minerals
        (rock.associated_minerals && rock.associated_minerals.toLowerCase().includes(searchLower)) ||
        
        // Coordinates or location
        (rock.coordinates && rock.coordinates.toLowerCase().includes(searchLower)) ||
        (rock.latitude && rock.latitude.toLowerCase().includes(searchLower)) ||
        (rock.longitude && rock.longitude.toLowerCase().includes(searchLower)) ||
        
        // Category-specific fields
        // Metamorphic
        (rock.metamorphism_type && rock.metamorphism_type.toLowerCase().includes(searchLower)) || 
        (rock.metamorphic_grade && rock.metamorphic_grade.toLowerCase().includes(searchLower)) || 
        (rock.parent_rock && rock.parent_rock.toLowerCase().includes(searchLower)) ||
        (rock.foliation && rock.foliation.toLowerCase().includes(searchLower)) ||
        
        // Igneous
        (rock.silica_content && rock.silica_content.toLowerCase().includes(searchLower)) ||
        (rock.cooling_rate && rock.cooling_rate.toLowerCase().includes(searchLower)) ||
        (rock.mineral_content && rock.mineral_content.toLowerCase().includes(searchLower)) ||
        
        // Sedimentary
        (rock.bedding && rock.bedding.toLowerCase().includes(searchLower)) ||
        (rock.sorting && rock.sorting.toLowerCase().includes(searchLower)) ||
        (rock.roundness && rock.roundness.toLowerCase().includes(searchLower)) ||
        (rock.fossil_content && rock.fossil_content.toLowerCase().includes(searchLower)) ||
        
        // Ore samples
        (rock.commodity_type && rock.commodity_type.toLowerCase().includes(searchLower)) ||
        (rock.ore_group && rock.ore_group.toLowerCase().includes(searchLower)) ||
        (rock.mining_company && rock.mining_company.toLowerCase().includes(searchLower))
      );
    });

    // Apply additional filters if provided
    let filteredAndSelectedRocks = filteredRocks;
    
    if (filters) {
      filteredAndSelectedRocks = filteredAndSelectedRocks.filter(rock => {
        // Filter by selected rock types
        if (filters.rockType.length > 0) {
          // Check both type and category fields for the rock type
          const rockTypeMatches = filters.rockType.some(filterType => {
            // Convert both to lowercase for case-insensitive comparison
            const filterTypeLower = filterType.toLowerCase();
            
            // Check if the rock type matches directly
            if (rock.type && rock.type.toLowerCase().includes(filterTypeLower)) {
              return true;
            }
            
            // Check if the rock category matches
            if (rock.category && rock.category.toLowerCase().includes(filterTypeLower)) {
              return true;
            }
            
            // Special case for "Ore Samples" which might be stored as "Ore" in the type field
            if (filterTypeLower === "ore samples" && rock.type && rock.type.toLowerCase() === "ore") {
              return true;
            }
            
            return false;
          });
          
          if (!rockTypeMatches) {
            return false;
          }
        }
        
        // Filter by color
        if (filters.colors.length > 0 && rock.color) {
          if (!filters.colors.some(c => rock.color?.toLowerCase().includes(c.toLowerCase()))) {
            return false;
          }
        }
        
        // Filter by associated minerals
        if (filters.associatedMinerals.length > 0 && 
            (rock.associated_minerals || rock.mineral_composition)) {
          const minerals = rock.associated_minerals || rock.mineral_composition || '';
          if (!filters.associatedMinerals.some(m => minerals.toLowerCase().includes(m.toLowerCase()))) {
            return false;
          }
        }
        
        return true;
      });
      
      // Log filter results
      if (filters.rockType.length > 0) {
        console.log(`After rock type filtering: ${filteredAndSelectedRocks.length} rocks match`);
        // Count by rock type
        const matchesByType: Record<string, number> = {};
        filteredAndSelectedRocks.forEach(rock => {
          const category = rock.category || 'Unknown';
          matchesByType[category] = (matchesByType[category] || 0) + 1;
        });
        console.log('Matches by category after filtering:', matchesByType);
      }
      
      if (filters.colors.length > 0) {
        console.log(`After color filtering: ${filteredAndSelectedRocks.length} rocks match`);
      }
      
      if (filters.associatedMinerals.length > 0) {
        console.log(`After mineral filtering: ${filteredAndSelectedRocks.length} rocks match`);
      }
    }

    // Transform to standard format
    const transformedRocks = await Promise.all(
      filteredAndSelectedRocks.map(rock => transformRockData(rock))
    );

    return transformedRocks;
  } catch (error) {
    console.error('Error getting rocks:', error);
    return [];
  }
};

/**
 * Enhanced search function for minerals
 * Searches across all relevant fields of mineral data
 */
export const getMinerals = async (searchTerm: string = '', filters?: FiltersState): Promise<RocksMineralsItem[]> => {
  try {
    console.log('Fetching minerals with search term:', searchTerm);
    
    // First check for an active session
    const { data: sessionData } = await supabase.auth.getSession();
    console.log('Current session status:', sessionData?.session ? 'Authenticated' : 'Not authenticated');
    
    // Fetch all minerals from the API or data source
    let minerals: IMineral[] = [];
    let retryCount = 0;
    const maxRetries = 3;
    
    while (retryCount <= maxRetries) {
      try {
        console.log(`Attempting to fetch minerals (attempt ${retryCount + 1}/${maxRetries + 1})...`);
        
        // Directly use Supabase client for more reliable access
        const { data, error } = await supabase
          .from('minerals')
          .select('*');
        
        if (error) {
          console.error(`Supabase error fetching minerals (attempt ${retryCount + 1}):`, error);
          throw error;
        }
        
        if (!data || !Array.isArray(data)) {
          console.error(`Invalid minerals data format (attempt ${retryCount + 1}):`, data);
          throw new Error('Invalid minerals data format');
        }
        
        minerals = data;
        console.log(`Successfully fetched ${minerals.length} minerals on attempt ${retryCount + 1}`);
        break;
      } catch (fetchError) {
        console.error(`Error fetching minerals (attempt ${retryCount + 1}/${maxRetries + 1}):`, fetchError);
        retryCount++;
        
        if (retryCount <= maxRetries) {
          console.log(`Retrying mineral fetch (${retryCount}/${maxRetries})...`);
          // Wait 1 second before retrying
          await new Promise(resolve => setTimeout(resolve, 1000));
        } else {
          console.error('Max retries reached for mineral fetch');
          throw fetchError;
        }
      }
    }

    console.log(`Fetched ${minerals.length} minerals from database`);
    
    // Apply search filtering if a search term is provided
    const filteredMinerals = minerals.filter((mineral: IMineral) => {
      if (!searchTerm) return true;

      const searchLower = searchTerm.toLowerCase();
      
      // Comprehensive search across all relevant mineral fields
      return (
        // Search in mineral name
        (mineral.mineral_name && mineral.mineral_name.toLowerCase().includes(searchLower)) ||
        // Search in chemical formula
        (mineral.chemical_formula && mineral.chemical_formula.toLowerCase().includes(searchLower)) ||
        // Search in group
        (mineral.mineral_group && mineral.mineral_group.toLowerCase().includes(searchLower)) ||
        // Search in category
        (mineral.category && mineral.category.toLowerCase().includes(searchLower)) ||
        // Search in color
        (mineral.color && mineral.color.toLowerCase().includes(searchLower)) ||
        // Search in occurrence
        (mineral.occurrence && mineral.occurrence.toLowerCase().includes(searchLower)) ||
        // Search in crystal system
        (mineral.crystal_system && mineral.crystal_system.toLowerCase().includes(searchLower))
      );
    });
    
    console.log(`Applied search filtering: ${filteredMinerals.length} minerals match the search term`);
    
    // Apply filters if they exist
    let finalFilteredMinerals = filteredMinerals;
    
    if (filters) {
      finalFilteredMinerals = filteredMinerals.filter((mineral: IMineral) => {
        // Apply category filters
        if (filters.mineralCategory && filters.mineralCategory.length > 0) {
          if (!mineral.category && !mineral.mineral_group) return false;
          
          const mineralCategory = mineral.category || mineral.mineral_group || '';
          if (!filters.mineralCategory.some(category => 
            mineralCategory.toLowerCase().includes(category.toLowerCase())
          )) {
            return false;
          }
        }
        
        // Apply color filters
        if (filters.colors && filters.colors.length > 0) {
          if (!mineral.color) return false;
          
          if (!filters.colors.some(color => 
            mineral.color?.toLowerCase().includes(color.toLowerCase())
          )) {
            return false;
          }
        }
        
        return true;
      });
      
      console.log(`Applied additional filters: ${finalFilteredMinerals.length} minerals match all filters`);
    }

    // Transform mineral data to standard format
    const transformedMinerals = finalFilteredMinerals.map(transformMineralData);
    console.log(`Returning ${transformedMinerals.length} transformed minerals`);
    return transformedMinerals;
  } catch (error) {
    console.error('Error getting minerals:', error);
    // Show a toast notification about the error
    toast.error('Failed to fetch minerals data. Please try again later.');
    return [];
  }
};

/**
 * Get combined rocks and minerals data
 */
export const getRocksAndMinerals = async (searchTerm?: string, filters?: FiltersState): Promise<RocksMineralsItem[]> => {
  try {
    console.log('Fetching combined rocks and minerals with search term:', searchTerm);
    // Get both datasets in parallel
    const [rocks, minerals] = await Promise.all([
      getRocks(searchTerm, filters),
      getMinerals(searchTerm, filters)
    ]);
    
    // Combine the results
    return [...rocks, ...minerals];
  } catch (error) {
    console.error('Error getting combined data:', error);
    return [];
  }
};

/**
 * Fetch minerals directly from Supabase
 */
async function fetchMineralsFromSupabase(category: string): Promise<IMineral[]> {
  try {
    console.log(`Fetching minerals for category: ${category}`);
    // First, check auth status to see if we have a valid session
    const { data: sessionData } = await supabase.auth.getSession();
    const isAuthenticated = !!sessionData?.session;
    
    console.log(`User authentication status: ${isAuthenticated ? 'Authenticated' : 'Not authenticated'}`);
    
    // Log the endpoint we're about to hit
    console.log(`Fetching from Supabase table 'minerals' with${category !== 'ALL' ? ` category=${category}` : ' all categories'}`);
    
    // Fetch the minerals
    let query = supabase.from('minerals').select('*');
    
    // Add category filter if specified
    if (category !== 'ALL') {
      query = query.eq('category', category);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Supabase error fetching minerals:', error);
      throw error;
    }
    
    console.log(`Successfully fetched ${data?.length || 0} minerals`);
    return data || [];
  } catch (err) {
    console.error('Error in fetchMineralsFromSupabase:', err);
    throw err;
  }
} 