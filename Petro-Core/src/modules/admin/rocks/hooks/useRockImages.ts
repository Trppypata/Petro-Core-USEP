import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getRockImages, uploadRockImages, deleteRockImage } from '@/services/rock-images.service';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { uploadMultipleFiles, STORAGE_BUCKET } from '@/services/storage.service';

// Define the interface directly in this file
interface IRockImage {
  id?: string;
  rock_id: string;
  image_url: string;
  caption?: string;
  display_order?: number;
  created_at?: string;
  updated_at?: string;
}

/**
 * Get authentication token from various storage locations
 */
const getAuthToken = (): string | null => {
  // Try multiple storage locations for the token
  const token = localStorage.getItem('access_token') || 
         localStorage.getItem('auth_token') || 
         localStorage.getItem('token') || 
         localStorage.getItem('accessToken');
  
  if (token) {
    console.log('Auth token found for rock images operations');
  } else {
    console.error('No auth token found for rock images operations');
  }
  
  return token;
};

/**
 * Creates authenticated Supabase client
 */
const getAuthenticatedSupabaseClient = () => {
  const token = getAuthToken();
  
  if (token) {
    // Set the auth header in the supabase client
    supabase.auth.setSession({
      access_token: token,
      refresh_token: '',
    });
  }
  
  return supabase;
};

/**
 * Hook to fetch and manage rock images
 * @param rockId - The ID of the rock to fetch images for
 */
export const useRockImages = (rockId?: string) => {
  const [images, setImages] = useState<IRockImage[]>([]);
  const queryClient = useQueryClient();
  
  const {
    data,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['rock-images', rockId],
    queryFn: () => getRockImages(rockId || ''),
    enabled: !!rockId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Upload images mutation
  const uploadMutation = useMutation({
    mutationFn: async ({ files, captions }: { files: File[], captions?: string[] }) => {
      console.log('🔄 Starting direct Supabase upload for rock ID:', rockId);
      console.log('🔄 Files:', files.map(f => f.name));
      
      if (!rockId) {
        console.error('❌ No rock ID provided');
        throw new Error('Rock ID is required');
      }
      
      try {
        // Get authenticated client
        const client = getAuthenticatedSupabaseClient();
        
        // 1. Upload files to storage
        console.log('📤 Uploading files to Supabase storage...');
        const imageUrls = await uploadMultipleFiles(files, 'rocks');
        console.log('✅ Files uploaded to storage. URLs:', imageUrls);
        
        if (!imageUrls.length) {
          console.error('❌ No image URLs returned from storage upload');
          return [];
        }
        
        // 2. Create image records in the database using direct Supabase client
        console.log('📝 Creating database records...');
        const imageData = imageUrls.map((url, index) => ({
          rock_id: rockId,
          image_url: url,
          caption: captions?.[index] || `Rock image ${index + 1}`,
          display_order: index
        }));
        
        // Get token and check auth status before inserting
        const token = getAuthToken();
        if (!token) {
          console.error('❌ Authentication required for database operations');
          throw new Error('Authentication required');
        }
        
        // Insert directly using Supabase client
        const { data, error } = await client
          .from('rock_images')
          .insert(imageData)
          .select();
          
        if (error) {
          console.error('❌ Database insert error:', error);
          throw error;
        }
        
        console.log('✅ Database records created:', data);
        return data;
      } catch (err) {
        console.error('❌ Upload error:', err);
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rock-images', rockId] });
      toast.success('Images uploaded successfully');
    },
    onError: (error) => {
      console.error('Failed to upload images:', error);
      toast.error('Failed to upload images');
    }
  });

  // Delete image mutation
  const deleteMutation = useMutation({
    mutationFn: (imageId: string) => deleteRockImage(imageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rock-images', rockId] });
      toast.success('Image deleted successfully');
    },
    onError: (error) => {
      console.error('Failed to delete image:', error);
      toast.error('Failed to delete image');
    }
  });

  // Delete all images mutation
  const deleteAllMutation = useMutation({
    mutationFn: async () => {
      if (!rockId) {
        throw new Error('Rock ID is required');
      }
      
      // Get all image URLs
      const images = await getRockImages(rockId);
      const imageIds = images.map(img => img.id).filter(Boolean) as string[];
      
      if (imageIds.length === 0) {
        return { success: true, count: 0 };
      }
      
      // Get authenticated client
      const client = getAuthenticatedSupabaseClient();
      
      // Delete database records
      const { error } = await client
        .from('rock_images')
        .delete()
        .in('id', imageIds);
      
      if (error) {
        throw error;
      }
      
      return { success: true, count: imageIds.length };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rock-images', rockId] });
      toast.success('All images deleted successfully');
      setImages([]);
    },
    onError: (error) => {
      console.error('Failed to delete all images:', error);
      toast.error('Failed to delete all images');
    }
  });

  useEffect(() => {
    if (data) {
      setImages(data);
    }
  }, [data]);

  const uploadImages = async (files: File[], captions?: string[]) => {
    if (!rockId) {
      toast.error('Rock ID is required to upload images');
      return [];
    }
    
    try {
      const result = await uploadMutation.mutateAsync({ files, captions });
      return result;
    } catch (error) {
      console.error('Error uploading images:', error);
      return [];
    }
  };

  const deleteImage = async (imageId: string) => {
    if (!imageId) {
      toast.error('Image ID is required to delete an image');
      return false;
    }
    
    try {
      await deleteMutation.mutateAsync(imageId);
      return true;
    } catch (error) {
      console.error('Error deleting image:', error);
      return false;
    }
  };
  
  const deleteAllImages = async () => {
    try {
      await deleteAllMutation.mutateAsync();
      return true;
    } catch (error) {
      console.error('Error deleting all images:', error);
      return false;
    }
  };

  return {
    images,
    isLoading,
    error,
    refetch,
    uploadImages,
    isUploading: uploadMutation.isPending,
    deleteImage,
    deleteAllImages,
    isDeleting: deleteMutation.isPending || deleteAllMutation.isPending
  };
}; 