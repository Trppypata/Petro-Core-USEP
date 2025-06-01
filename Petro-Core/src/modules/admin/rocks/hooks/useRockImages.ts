import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getRockImages, uploadRockImages, deleteRockImage } from '@/services/rock-images.service';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { uploadMultipleFiles } from '@/services/storage.service';

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
        
        // Insert directly using Supabase client
        const { data, error } = await supabase
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

  return {
    images,
    isLoading,
    error,
    refetch,
    uploadImages,
    isUploading: uploadMutation.isPending,
    deleteImage,
    isDeleting: deleteMutation.isPending
  };
}; 