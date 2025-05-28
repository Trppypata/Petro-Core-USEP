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
}

export type MineralCategory = 
  | 'SULFOSALTS'
  | 'BORATES'
  | 'SULFATES'
  | 'CHROMATES'
  | 'MOLYBDATE'
  | 'TUNGSTATES'
  | 'PHOSPHATES'
  | 'VANADATES'
  | 'ARSENATES'
  | 'NATIVE ELEMENTS'
  | 'SULFIDES'
  | 'OXIDES';

export const MINERAL_CATEGORIES: MineralCategory[] = [
  'BORATES',
  'SULFATES',
  'CHROMATES',
  'MOLYBDATE',
  'TUNGSTATES',
  'PHOSPHATES',
  'VANADATES',
  'ARSENATES',
  'NATIVE ELEMENTS',
  'SULFIDES',
  'SULFOSALTS',
  'OXIDES'
]; 