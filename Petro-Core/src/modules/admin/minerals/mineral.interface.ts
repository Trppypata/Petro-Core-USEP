export interface IMineral {
  id?: string;
  mineral_code: string;
  mineral_name: string;
  chemical_formula?: string;
  mineral_group: string;
  color?: string;
  streak?: string;
  luster?: string;
  hardness?: string;
  cleavage?: string;
  fracture?: string;
  habit?: string;
  crystal_system?: string;
  category: string; // For categorizing into BORATES, SULFATES, etc.
  type: 'mineral' | 'rock'; // To differentiate between minerals and rocks
  // Additional properties
  image_url?: string;
  specific_gravity?: string;
  transparency?: string;
  occurrence?: string;
  uses?: string;
  // User relationship
  user_id?: string;
  // Database fields
  created_at?: string;
  updated_at?: string;
}

export type MineralCategory = 
  | 'ALL'
  | 'SULFOSALTS'
  | 'BORATES' | 'BORATE'
  | 'SULFATES'
  | 'CHROMATES'
  | 'MOLYBDATE' | 'MOLYBDATES'
  | 'TUNGSTATES'
  | 'PHOSPHATES'
  | 'VANADATES'
  | 'ARSENATES'
  | 'NATIVE ELEMENTS'
  | 'SULFIDES'
  | 'OXIDES'
  | 'HYDROXIDES'
  | 'SILICATES'
  | 'ORGANICS'
  | 'HALIDES'
  | 'CARBONATES' | 'CARBONATE'
  | 'NITRATES'
  | 'TELLURIDES'
  | 'SELENIDES'
  | 'ANTIMONIDES'
  | 'ARSENIDES';

export const MINERAL_CATEGORIES: MineralCategory[] = [
  'ALL',
  'NATIVE ELEMENTS',
  'SULFIDES',
  'SULFOSALTS',
  'OXIDES',
  'HYDROXIDES',
  'HALIDES',
  'CARBONATES',
  'NITRATES',
  'BORATES',
  'SULFATES',
  'CHROMATES',
  'MOLYBDATES',
  'TUNGSTATES',
  'PHOSPHATES',
  'VANADATES',
  'ARSENATES',
  'SILICATES',
  'TELLURIDES',
  'SELENIDES',
  'ANTIMONIDES',
  'ARSENIDES',
  'ORGANICS'
]; 