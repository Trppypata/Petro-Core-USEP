import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/spinner';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { SupabaseImage } from '@/components/ui/supabase-image';
// Import STORAGE_BUCKET from storage service
import { STORAGE_BUCKET } from '@/services/storage.service';

// Define the rock image interface
interface IRockImage {
  id?: string;
  rock_id: string;
  image_url: string;
  caption?: string;
  display_order?: number;
  created_at?: string;
  updated_at?: string;
}

interface RockImagesUploaderDirectProps {
  rockId: string;
  onSuccess?: (images: IRockImage[]) => void;
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
    console.log('Auth token found for direct uploader:', token.substring(0, 5) + '...' + token.substring(token.length - 5));
  } else {
    console.error('No auth token found for direct uploader');
  }
  
  return token;
};

export const RockImagesUploaderDirect = ({ rockId, onSuccess }: RockImagesUploaderDirectProps) => {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [images, setImages] = useState<IRockImage[]>([]);
  const [loadingImages, setLoadingImages] = useState(false);
  const [authStatus, setAuthStatus] = useState<'checking' | 'authenticated' | 'unauthenticated'>('checking');

  // Fetch existing images on mount
  useEffect(() => {
    fetchExistingImages();
    checkAuthStatus();
  }, [rockId]);

  // Check authentication status
  const checkAuthStatus = async () => {
    setAuthStatus('checking');
    try {
      const token = getAuthToken();
      
      if (token) {
        // Manually set the session with the token
        await supabase.auth.setSession({
          access_token: token,
          refresh_token: '',
        });
        
        const { data, error } = await supabase.auth.getUser();
        
        if (error || !data.user) {
          console.error('Auth status check failed:', error);
          setAuthStatus('unauthenticated');
        } else {
          console.log('Auth status: authenticated as', data.user.email);
          setAuthStatus('authenticated');
        }
      } else {
        console.warn('No auth token available');
        setAuthStatus('unauthenticated');
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      setAuthStatus('unauthenticated');
    }
  };

  // Fetch existing images for this rock
  const fetchExistingImages = async () => {
    if (!rockId) return;
    
    setLoadingImages(true);
    try {
      const token = getAuthToken();
      
      if (!token) {
        toast.error("No active session found. User might not be authenticated.");
        setLoadingImages(false);
        return;
      }
      
      // Set the auth token in the Supabase client
      await supabase.auth.setSession({
        access_token: token,
        refresh_token: '',
      });
      
      // Use the Supabase client directly
      const { data, error } = await supabase
        .from('rock_images')
        .select('*')
        .eq('rock_id', rockId)
        .order('display_order', { ascending: true });
      
      if (error) {
        console.error('Error fetching images:', error);
        toast.error('Failed to load existing images');
      } else if (data) {
        console.log('Fetched images:', data);
        setImages(data);
      }
    } catch (error) {
      console.error('Error fetching images:', error);
      toast.error('Failed to load existing images');
    } finally {
      setLoadingImages(false);
      }
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFiles(Array.from(e.target.files));
    }
  };

  // Upload files directly to Supabase
  const handleUpload = async () => {
    if (!rockId) {
      toast.error('Rock ID is required');
      return;
    }
    
    if (files.length === 0) {
      toast.error('Please select files to upload');
      return;
    }
    
    setUploading(true);
    toast.loading(`Uploading ${files.length} images...`);
    
    try {
      const token = getAuthToken();
      
      if (!token) {
        toast.error("No active session found. User might not be authenticated.");
        setUploading(false);
        return;
      }
      
      // Set the auth token in the Supabase client
      await supabase.auth.setSession({
        access_token: token,
        refresh_token: '',
      });
      
      // 1. Upload files to Supabase storage
      const storagePromises = files.map(async (file, index) => {
        // Create a unique file name
        const fileExt = file.name.split('.').pop();
        const fileName = `${rockId}_${Date.now()}_${index}.${fileExt}`;
        const filePath = `rocks/${fileName}`;
      
        // Upload to Supabase storage using STORAGE_BUCKET
        const { data, error } = await supabase.storage
          .from(STORAGE_BUCKET)
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });
        
        if (error) {
          console.error('Storage upload error:', error);
          return null;
        }
        
        // Get public URL
        const { data: publicUrlData } = supabase.storage
          .from(STORAGE_BUCKET)
          .getPublicUrl(data.path);
        
        return {
          rock_id: rockId,
          image_url: publicUrlData.publicUrl,
          caption: `Rock image ${index + 1}`,
          display_order: images.length + index
        };
      });
      
      // Wait for all uploads to complete
      const uploadResults = await Promise.all(storagePromises);
      const validUploads = uploadResults.filter(Boolean) as Omit<IRockImage, 'id'>[];
      
      if (validUploads.length === 0) {
        toast.error('All uploads failed');
        return;
      }
      
      // 2. Create database records
      const { data, error } = await supabase
        .from('rock_images')
        .insert(validUploads)
        .select();
      
      if (error) {
        console.error('Database error:', error);
        toast.error('Failed to save image records');
        return;
      }
      
      // Update state and notify parent
      const newImages = data as IRockImage[];
      setImages(prev => [...prev, ...newImages]);
      
      if (onSuccess) {
        onSuccess(newImages);
      }
      
      // Reset files
      setFiles([]);
      toast.dismiss();
      toast.success(`Successfully uploaded ${newImages.length} images`);
      
      // Refresh image list
      fetchExistingImages();
    } catch (error) {
      console.error('Upload error:', error);
      toast.dismiss();
      toast.error('Failed to upload images');
    } finally {
      setUploading(false);
    }
  };

  // Delete an image
  const handleDelete = async (imageId: string, imageUrl: string) => {
    if (!imageId) return;
    
    try {
      const token = getAuthToken();
      
      if (!token) {
        toast.error("No active session found. User might not be authenticated.");
        return;
      }
      
      // Set the auth token in the Supabase client
      await supabase.auth.setSession({
        access_token: token,
        refresh_token: '',
      });
      
      // 1. Delete from database
      const { error: dbError } = await supabase
            .from('rock_images')
        .delete()
        .eq('id', imageId);
            
      if (dbError) {
        console.error('Database delete error:', dbError);
        toast.error('Failed to delete image record');
        return;
      }
      
      // 2. Delete from storage
      if (imageUrl) {
        // Extract path from URL
        const urlObj = new URL(imageUrl);
        const pathWithBucket = urlObj.pathname;
        const pathParts = pathWithBucket.split('/');
        // Remove the bucket name and the first slash
        const actualPath = pathParts.slice(2).join('/');
        
        if (actualPath) {
          const { error: storageError } = await supabase.storage
            .from(STORAGE_BUCKET)
            .remove([actualPath]);
          
          if (storageError) {
            console.error('Storage delete error:', storageError);
            // Continue anyway as the database record is already deleted
        }
      }
      }
      
      // Update state
      setImages(prev => prev.filter(img => img.id !== imageId));
      toast.success('Image deleted successfully');
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete image');
    }
  };

  return (
    <div className="space-y-4">
      {/* Auth status debug info */}
      <div className="text-xs border border-dashed border-gray-300 p-2 rounded bg-gray-50 dark:bg-gray-800">
        <p>Auth Status: {authStatus === 'checking' ? 'Checking...' : authStatus}</p>
        <p>Rock ID: {rockId || 'Not set'}</p>
        <p>Token: {getAuthToken() ? 'Available' : 'Not available'}</p>
        <Button 
          variant="outline" 
          size="sm" 
          className="mt-1 text-xs h-6" 
          onClick={checkAuthStatus}
        >
          Refresh Auth
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          className="mt-1 ml-2 text-xs h-6" 
          onClick={fetchExistingImages}
        >
          Refresh Images
        </Button>
      </div>
      
      {/* Existing images */}
      <div>
        <h4 className="text-sm font-medium mb-2">Existing Images</h4>
        {loadingImages ? (
          <div className="flex items-center justify-center p-4 border rounded">
            <Spinner className="mr-2" />
            <span>Loading images...</span>
          </div>
        ) : images.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {images.map((image) => (
              <div key={image.id} className="relative group">
                <SupabaseImage
                  src={image.image_url}
                  alt={image.caption || 'Rock image'}
                  className="h-24 w-full object-cover rounded-md"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => image.id && handleDelete(image.id, image.image_url)}
                >
                  <span className="sr-only">Delete</span>
                  ×
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No images uploaded yet.</p>
        )}
      </div>
      
      {/* Upload new images */}
      <div>
        <h4 className="text-sm font-medium mb-2">Upload New Images</h4>
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
          disabled={uploading}
        />
        {files.length > 0 && (
          <p className="text-sm mt-2">
            {files.length} {files.length === 1 ? 'file' : 'files'} selected
          </p>
        )}
        <div className="mt-2">
        <Button
          onClick={handleUpload}
            disabled={uploading || files.length === 0}
            className="mt-2"
        >
            {uploading ? (
            <>
                <Spinner className="mr-2 h-4 w-4" />
              Uploading...
            </>
          ) : (
              'Upload Images'
          )}
        </Button>
        </div>
      </div>
    </div>
  );
}; 