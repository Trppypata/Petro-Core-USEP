// A simple, direct export of the rock image interface
export interface IRockImage {
  id?: string;
  rock_id: string;
  image_url: string;
  caption?: string;
  display_order?: number;
  created_at?: string;
  updated_at?: string;
}

// Explicit named export
export { IRockImage };
// Default export
export default IRockImage; 