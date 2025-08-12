// Removed old backend service imports - now using direct Supabase
import type { IRock } from "../../../admin/rocks/rock.interface";
import type { IMineral } from "../../../admin/minerals/mineral.interface";
import type { RocksMineralsItem } from "../types";
import { getRockImages } from "@/services/rock-images.service";
import type { FiltersState } from "../filters/RockMineralFilters";
import axios from "axios";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

import { MineralsSupabaseService } from "@/modules/admin/minerals/services/minerals-supabase.service";
import { RocksSupabaseService } from "@/modules/admin/rocks/services/rocks-supabase.service";

// Default image placeholder - updated paths to use static assets from petro-static folder
const DEFAULT_ROCK_IMAGE = "/petro-static/default-rock.jpg";
const DEFAULT_MINERAL_IMAGE = "/petro-static/default-mineral.jpg";

/**
 * Normalize search term - removes extra spaces, converts to lowercase
 * @param searchTerm
 * @returns
 */
const normalizeSearchTerm = (searchTerm: string): string => {
  return searchTerm.trim().toLowerCase();
};

/**
 * Check if a URL is valid
 * @param url
 * @returns
 */
const isValidImageUrl = (url: string | null | undefined): boolean => {
  if (!url) return false;

  // Handle Supabase storage URLs
  if (url.includes("storage/v1/object/public/")) {
    return true;
  }

  // Basic URL validation for other URLs
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
};

/**
 * Transform a rock into a RocksMineralsItem
 * @param rock
 * @returns
 */
const transformRockData = async (rock: IRock): Promise<RocksMineralsItem> => {
  // Set the appropriate imageUrl based on rock category
  let defaultImageUrl = "/petro-static/default-rock.jpg";

  // Check if rock has an image_url and use it if valid
  let imageUrl = rock.image_url;

  if (!isValidImageUrl(imageUrl)) {
    // Get default image based on rock category
    if (rock.category.toLowerCase().includes("igneous")) {
      defaultImageUrl = "/petro-static/default-rock.jpg";
    } else if (rock.category.toLowerCase().includes("metamorphic")) {
      defaultImageUrl = "/petro-static/default-rock.jpg";
    } else if (rock.category.toLowerCase().includes("sedimentary")) {
      defaultImageUrl = "/petro-static/default-rock.jpg";
    } else if (rock.category.toLowerCase().includes("ore")) {
      defaultImageUrl = "/petro-static/default-rock.jpg";
    }

    imageUrl = defaultImageUrl;
  }

  // Only fetch additional images if we have a valid rock ID
  let additionalImages: string[] = [];
  if (rock.id) {
    // Use a cached version of the rock images if available
    const cacheKey = `rock_images_${rock.id}`;
    const cachedImages = sessionStorage.getItem(cacheKey);

    if (cachedImages) {
      try {
        additionalImages = JSON.parse(cachedImages);
      } catch (e) {
        console.error("Error parsing cached images:", e);
      }
    } else {
      try {
        const { data: rockImages } = await supabase
          .from("rock_images")
          .select("image_url")
          .eq("rock_id", rock.id)
          .limit(5);

        if (rockImages && rockImages.length > 0) {
          additionalImages = rockImages
            .map((img: { image_url: string }) => img.image_url)
            .filter((url: string) => isValidImageUrl(url));

          // Cache the results
          sessionStorage.setItem(cacheKey, JSON.stringify(additionalImages));
        }
      } catch (error) {
        console.error("Error fetching additional rock images:", error);
      }
    }
  }

  // Create a description from rock properties if it doesn't exist
  let description = rock.description || "";
  if (!description) {
    const descParts = [];
    if (rock.mineral_composition)
      descParts.push(`Composition: ${rock.mineral_composition}`);
    if (rock.grain_size) descParts.push(`Grain size: ${rock.grain_size}`);
    if (rock.texture) descParts.push(`Texture: ${rock.texture}`);
    if (rock.color) descParts.push(`Color: ${rock.color}`);

    description = descParts.join(". ");
  }

  return {
    id: rock.id || "",
    title: rock.name,
    description: description || `${rock.category} rock sample`,
    imageUrl: imageUrl,
    additionalImages: additionalImages,
    category: rock.category,
    type: "rock",
    color: rock.color,
    associatedMinerals: rock.associated_minerals,
    texture: rock.texture,
    foliation: rock.foliation,
    rockType: rock.type,
    coordinates: rock.coordinates,
    latitude: rock.latitude,
    longitude: rock.longitude,
    locality: rock.locality,
  };
};

/**
 * Transform a mineral into a RocksMineralsItem
 * @param mineral
 * @returns
 */
const transformMineralData = (mineral: IMineral): RocksMineralsItem => {
  // Only use the mineral's image if it's valid, otherwise don't show any image
  const imageUrl = isValidImageUrl(mineral.image_url) ? mineral.image_url : undefined;

  // Create a description from mineral properties
  let description = "";
  const descParts = [];

  if (mineral.chemical_formula)
    descParts.push(`Formula: ${mineral.chemical_formula}`);
  if (mineral.color) descParts.push(`Color: ${mineral.color}`);
  if (mineral.mineral_group) descParts.push(`Group: ${mineral.mineral_group}`);
  if (mineral.hardness) descParts.push(`Hardness: ${mineral.hardness}`);

  description = descParts.join(". ");

  return {
    id: mineral.id || "",
    title: mineral.mineral_name,
    description: description || `${mineral.category} mineral sample`,
    imageUrl: imageUrl,
    category: mineral.category,
    type: "mineral",
    color: mineral.color,
  };
};

/**
 * Remove duplicate rocks based on rock code
 * @param rocks
 * @returns
 */
const deduplicateRocks = (rocks: IRock[]): IRock[] => {
  const uniqueRocks: IRock[] = [];
  const seenCodes = new Set<string>();
  const seenIds = new Set<string>();

  for (const rock of rocks) {
    // Skip if we've seen this ID already
    if (rock.id && seenIds.has(rock.id)) continue;

    // Skip if we've seen this code already
    if (rock.rock_code && seenCodes.has(rock.rock_code)) continue;

    // Add to our sets
    if (rock.id) seenIds.add(rock.id);
    if (rock.rock_code) seenCodes.add(rock.rock_code);

    uniqueRocks.push(rock);
  }

  return uniqueRocks;
};

/**
 * Apply text search to rocks based on a search term
 * @param rocks
 * @param searchTerm
 * @returns
 */
const applyRockTextSearch = (rocks: IRock[], searchTerm: string): IRock[] => {
  if (!searchTerm) return rocks;

  const normalizedTerm = normalizeSearchTerm(searchTerm);

  // First try exact match on rock code or name
  let exactMatches = rocks.filter(
    (rock) =>
      rock.rock_code?.toLowerCase() === normalizedTerm ||
      rock.name?.toLowerCase() === normalizedTerm
  );

  // If we have exact matches, return those
  if (exactMatches.length > 0) {
    return exactMatches;
  }

  // Otherwise do a broader search
  return rocks.filter((rock) => {
    // Check various fields for the search term
    const searchableFields = [
      rock.rock_code,
      rock.name,
      rock.category,
      rock.type,
      rock.color,
      rock.texture,
      rock.mineral_composition,
      rock.locality,
      rock.description,
      rock.associated_minerals,
      rock.metamorphism_type,
      rock.metamorphic_grade,
      rock.formation,
      rock.ore_group,
      rock.commodity_type,
    ];

    // Find any field that contains the search term
    return searchableFields.some((field) =>
      field?.toLowerCase().includes(normalizedTerm)
    );
  });
};

/**
 * Apply filters to rock data
 * @param rocks
 * @param filters
 * @returns
 */
const applyRockFilters = (rocks: IRock[], filters: FiltersState): IRock[] => {
  if (!filters) return rocks;

  return rocks.filter((rock) => {
    // Apply rock type filter
    if (filters.rockType.length > 0) {
      const rockTypeMatches = filters.rockType.some(
        (type) =>
          rock.category?.toLowerCase() === type.toLowerCase() ||
          rock.type?.toLowerCase() === type.toLowerCase()
      );
      if (!rockTypeMatches) return false;
    }

    // Apply color filter
    if (filters.colors.length > 0) {
      const colorMatches = filters.colors.some((color) =>
        rock.color?.toLowerCase().includes(color.toLowerCase())
      );
      if (!colorMatches) return false;
    }

    // Apply associated minerals filter
    if (filters.associatedMinerals.length > 0) {
      const mineralMatches = filters.associatedMinerals.some(
        (mineral) =>
          rock.associated_minerals
            ?.toLowerCase()
            .includes(mineral.toLowerCase()) ||
          rock.mineral_composition
            ?.toLowerCase()
            .includes(mineral.toLowerCase())
      );
      if (!mineralMatches) return false;
    }

    return true;
  });
};

/**
 * Get rocks based on search term and filters
 * @param searchTerm
 * @param filters
 * @returns
 */
export const getRocks = async (
  searchTerm: string = "",
  filters?: FiltersState
): Promise<RocksMineralsItem[]> => {
  try {
    console.log("Fetching rocks with search term:", searchTerm);

    // Fetch all rocks first, then apply filters in-memory for better performance
    let query = supabase.from("rocks").select("*");

    // Remove the limit to ensure we get all rocks for proper filtering
    // The limit was causing issues with filtering - we need all rocks to apply filters correctly

    const { data: rocks, error } = await query;

    if (error) {
      console.error("Error fetching rocks:", error);
      return [];
    }

    console.log(`Fetched ${rocks.length} rocks from database`);

    // Remove duplicates
    const uniqueRocks = deduplicateRocks(rocks);
    console.log(`After deduplication: ${uniqueRocks.length} rocks`);

    // Apply search term filter
    let filteredRocks = uniqueRocks;
    if (searchTerm) {
      filteredRocks = applyRockTextSearch(filteredRocks, searchTerm);
      console.log(
        `After text search: ${filteredRocks.length} rocks matching "${searchTerm}"`
      );
    }

    // Apply other filters
    if (filters) {
      filteredRocks = applyRockFilters(filteredRocks, filters);
      console.log(`After applying filters: ${filteredRocks.length} rocks`);
    }

    // Transform to RocksMineralsItem format
    const rockItems: RocksMineralsItem[] = await Promise.all(
      filteredRocks.map(transformRockData)
    );

    return rockItems;
  } catch (err) {
    console.error("Error in getRocks:", err);
    return [];
  }
};

/**
 * Apply text search to minerals based on a search term
 * @param minerals
 * @param searchTerm
 * @returns
 */
const applyMineralTextSearch = (
  minerals: IMineral[],
  searchTerm: string
): IMineral[] => {
  if (!searchTerm) return minerals;

  const normalizedTerm = normalizeSearchTerm(searchTerm);

  // First try exact match on mineral code or name
  let exactMatches = minerals.filter(
    (mineral) =>
      mineral.mineral_code?.toLowerCase() === normalizedTerm ||
      mineral.mineral_name?.toLowerCase() === normalizedTerm
  );

  // If we have exact matches, return those
  if (exactMatches.length > 0) {
    return exactMatches;
  }

  // Otherwise do a broader search
  return minerals.filter((mineral) => {
    // Check various fields for the search term
    const searchableFields = [
      mineral.mineral_code,
      mineral.mineral_name,
      mineral.category,
      mineral.chemical_formula,
      mineral.mineral_group,
      mineral.color,
      mineral.streak,
      mineral.luster,
      mineral.cleavage,
      mineral.fracture,
      mineral.crystal_system,
      mineral.habit,
      mineral.occurrence,
      mineral.uses,
    ];

    // Find any field that contains the search term
    return searchableFields.some((field) =>
      field?.toLowerCase().includes(normalizedTerm)
    );
  });
};

/**
 * Apply filters to mineral data
 * @param minerals
 * @param filters
 * @returns
 */
const applyMineralFilters = (
  minerals: IMineral[],
  filters: FiltersState
): IMineral[] => {
  if (!filters) return minerals;

  return minerals.filter((mineral) => {
    // Apply mineral category filter
    if (filters.mineralCategory.length > 0) {
      // More flexible category matching to handle format discrepancies
      const categoryMatches = filters.mineralCategory.some((category) => {
        if (!mineral.category) return false;

        const normalizedCategory = mineral.category.toLowerCase().trim();
        const normalizedFilter = category.toLowerCase().trim();

        // Check exact match
        if (normalizedCategory === normalizedFilter) return true;

        // Check singular/plural variants
        if (normalizedFilter === "borates" && normalizedCategory === "borate")
          return true;
        if (normalizedFilter === "borate" && normalizedCategory === "borates")
          return true;

        if (
          normalizedFilter === "carbonates" &&
          normalizedCategory === "carbonate"
        )
          return true;
        if (
          normalizedFilter === "carbonate" &&
          normalizedCategory === "carbonates"
        )
          return true;

        if (normalizedFilter === "sulfates" && normalizedCategory === "sulfate")
          return true;
        if (normalizedFilter === "sulfate" && normalizedCategory === "sulfates")
          return true;

        if (
          normalizedFilter === "phosphates" &&
          normalizedCategory === "phosphate"
        )
          return true;
        if (
          normalizedFilter === "phosphate" &&
          normalizedCategory === "phosphates"
        )
          return true;

        if (
          normalizedFilter === "molybdates" &&
          normalizedCategory === "molybdate"
        )
          return true;
        if (
          normalizedFilter === "molybdate" &&
          normalizedCategory === "molybdates"
        )
          return true;

        // Add more variants as needed

        return false;
      });

      if (!categoryMatches) return false;
    }

    // Apply color filter
    if (filters.colors.length > 0) {
      const colorMatches = filters.colors.some((color) =>
        mineral.color?.toLowerCase().includes(color.toLowerCase())
      );
      if (!colorMatches) return false;
    }

    return true;
  });
};

/**
 * Get minerals based on search term and filters
 * @param searchTerm
 * @param filters
 * @returns
 */
export const getMinerals = async (
  searchTerm: string = "",
  filters?: FiltersState
): Promise<RocksMineralsItem[]> => {
  try {
    console.log("Fetching minerals with search term:", searchTerm);

    // Fetch all minerals first, then apply filters in-memory
    let query = supabase.from("minerals").select("*");

    const { data: minerals, error } = await query;

    if (error) {
      console.error("Error fetching minerals:", error);
      return [];
    }

    console.log(`Fetched ${minerals.length} minerals from database`);

    // Apply search term filter
    let filteredMinerals = minerals;
    if (searchTerm) {
      filteredMinerals = applyMineralTextSearch(filteredMinerals, searchTerm);
      console.log(
        `After text search: ${filteredMinerals.length} minerals matching "${searchTerm}"`
      );
    }

    // Apply other filters
    if (filters) {
      filteredMinerals = applyMineralFilters(filteredMinerals, filters);
      console.log(
        `After applying filters: ${filteredMinerals.length} minerals`
      );
    }

    // Transform to RocksMineralsItem format
    const mineralItems: RocksMineralsItem[] =
      filteredMinerals.map(transformMineralData);

    return mineralItems;
  } catch (err) {
    console.error("Error in getMinerals:", err);
    return [];
  }
};

/**
 * Get both rocks and minerals based on search term and filters
 * @param searchTerm
 * @param filters
 * @returns
 */
export const getRocksAndMinerals = async (
  searchTerm?: string,
  filters?: FiltersState
): Promise<RocksMineralsItem[]> => {
  try {
    // Fetch both rocks and minerals in parallel
    const [rockItems, mineralItems] = await Promise.all([
      getRocks(searchTerm, filters),
      getMinerals(searchTerm, filters),
    ]);

    // Combine the results
    return [...rockItems, ...mineralItems];
  } catch (err) {
    console.error("Error fetching rocks and minerals:", err);
    return [];
  }
};

/**
 * Helper function to fetch minerals from Supabase
 * @param category
 * @returns
 */
async function fetchMineralsFromSupabase(
  category: string
): Promise<IMineral[]> {
  try {
    const { data, error } = await supabase
      .from("minerals")
      .select("*")
      .eq("category", category);

    if (error) {
      console.error("Error fetching minerals from Supabase:", error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error("Error in fetchMineralsFromSupabase:", err);
    return [];
  }
}
