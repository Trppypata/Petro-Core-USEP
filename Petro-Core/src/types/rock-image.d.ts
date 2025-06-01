declare module '@/types/rock-image' {
  export interface IRockImage {
    id?: string;
    rock_id: string;
    image_url: string;
    caption?: string;
    display_order?: number;
    created_at?: string;
    updated_at?: string;
  }
} 