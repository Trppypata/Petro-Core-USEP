/**
 * Rock image interface for the application
 */
export interface IRockImage {
  id?: string;
  rock_id: string;
  image_url: string;
  caption?: string;
  display_order?: number;
  created_at?: string;
  updated_at?: string;
}

// Make sure both named and default exports are available
export { IRockImage };
export default IRockImage; 