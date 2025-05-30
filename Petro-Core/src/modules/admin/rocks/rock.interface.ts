export type RockCategory = 'Igneous' | 'Sedimentary' | 'Metamorphic' | 'Ore Samples' | 'ALL';

export interface IRock {
  id?: string;
  rock_code: string;
  name: string;
  chemical_formula?: string;
  hardness?: string;
  category: string;
  type: string;
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
  status?: string;
  image_url?: string;
  // Metamorphic rock specific fields
  associated_minerals?: string;
  metamorphism_type?: string; 
  metamorphic_grade?: string;
  parent_rock?: string;
  foliation?: string;
  foliation_type?: string;
  // Igneous rock specific fields
  silica_content?: string;
  cooling_rate?: string;
  mineral_content?: string;
  origin?: string;
  // Sedimentary rock specific fields
  bedding?: string;
  sorting?: string;
  roundness?: string;
  fossil_content?: string;
  sediment_source?: string;
  // Ore samples specific fields
  commodity_type?: string;
  ore_group?: string;
  mining_company?: string;
  coordinates?: string;
  // Fields from Excel
  luster?: string;
  reaction_to_hcl?: string;
  magnetism?: string;
  streak?: string;
  protolith?: string;
  // Database fields
  created_at?: string;
  updated_at?: string;
}

export const ROCK_CATEGORIES: RockCategory[] = [
  'Igneous',
  'Sedimentary',
  'Metamorphic',
  'Ore Samples'
]; 