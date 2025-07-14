// Rock image interface
interface IRockImage {
  id?: string;
  rock_id: string;
  image_url: string;
  caption?: string;
  display_order?: number;
  created_at?: string;
  updated_at?: string;
}

// Export the interface as a type
export type { IRockImage }; 