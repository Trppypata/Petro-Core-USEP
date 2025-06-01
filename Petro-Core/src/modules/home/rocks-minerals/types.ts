export interface RocksMineralsItem {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  path?: string;
  category: string;
  type: 'rock' | 'mineral';
  additionalImages?: string[]; // Array of additional image URLs
  color?: string;
  associatedMinerals?: string;
  coordinates?: string;
  latitude?: string;
  longitude?: string;
  locality?: string;
}

export type RocksMineralsFilter = {
  searchTerm: string;
  category: string;
} 