export interface RocksMineralsItem {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  path?: string;
  category: string;
  type: 'rock' | 'mineral';
}

export type RocksMineralsFilter = {
  searchTerm: string;
  category: string;
} 