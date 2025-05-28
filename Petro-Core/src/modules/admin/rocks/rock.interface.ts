export interface IRock {
  id?: string;
  name: string;
  rock_code?: string; // O-XXXX format
  commodity_type?: string; // Gold, Copper, Silver, etc.
  ore_group?: string; // Hydrothermal (ISE), Residual, etc.
  mining_company?: string; // Mining company/donated by
  chemical_formula?: string;
  hardness?: string;
  category: string;
  type: string; // igneous, sedimentary, metamorphic
  depositional_environment?: string;
  grain_size?: string;
  color?: string;
  texture?: string;
  latitude?: string;
  longitude?: string;
  locality?: string;
  mineral_composition?: string;
  description?: string;
  formation?: string;
  geological_age?: string;
  status?: 'active' | 'inactive';
  image_url?: string;
  // Metamorphic rock specific fields
  associated_minerals?: string; // Specific minerals associated with metamorphic rocks
  metamorphism_type?: string; // Contact, regional, dynamic, etc.
  metamorphic_grade?: string; // Low, medium, high
  parent_rock?: string; // Original rock type before metamorphism
  foliation?: string; // Whether the rock shows foliation - yes/no/partial
  // Igneous rock specific fields
  silica_content?: string; // Felsic, intermediate, mafic, ultramafic
  cooling_rate?: string; // Fast, slow, variable
  mineral_content?: string; // Major minerals in the igneous rock
  // Sedimentary rock specific fields
  bedding?: string; // Layering characteristics
  sorting?: string; // Well-sorted, poorly-sorted
  roundness?: string; // Angular, subangular, subrounded, rounded
  fossil_content?: string; // Describes fossils present, if any
  sediment_source?: string; // Source of the sediments (terrigenous, biogenic, etc.)
}

export type RockCategory = 
  | 'Igneous'
  | 'Sedimentary' 
  | 'Metamorphic'
  | 'Ore Samples';

export const ROCK_CATEGORIES: RockCategory[] = [
  'Igneous',
  'Sedimentary',
  'Metamorphic',
  'Ore Samples'
]; 