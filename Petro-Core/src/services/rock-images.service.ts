import axios from 'axios';
import { uploadMultipleFiles, deleteMultipleFiles } from './storage.service';
import Cookies from 'js-cookie';
import { toast } from 'sonner';

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

const API_URL = 'https://petro-core-usep.onrender.com';
const STORAGE_BUCKET = 'rocks-minerals';

// Helper function to get the authentication token
const getAuthToken = (): string | null => {
  const token = localStorage.getItem('access_token') || 
         Cookies.get('access_token') || 
         localStorage.getItem('token') || 
         localStorage.getItem('auth_token');
  
  if (!token) {
    console.warn('⚠️ No auth token found in storage');
  } else {
    console.log(`🔑 Auth token found: ${token.substring(0, 10)}...`);
  }
  
  return token;
};

/**
 * Set the auth token for Supabase client
 */
const setAuthTokenManually = async () => {
  try {
    const token = getAuthToken();
    if (!token) {
      console.error('❌ No auth token available to set Supabase session');
      return false;
    }
    
    console.log('🔄 Attempting to set Supabase session with token...');
    
    const { supabase } = await import('@/lib/supabase');
    
    // First check if we already have a session
    const { data: sessionData } = await supabase.auth.getSession();
    if (sessionData?.session) {
      console.log('✅ Existing Supabase session found, no need to set manually');
      return true;
    }
    
    // Try to create a refresh token from the auth token (some implementations require it)
    const refreshToken = localStorage.getItem('refresh_token') || token;
    
    const { data, error } = await supabase.auth.setSession({
      access_token: token,
      refresh_token: refreshToken,
    });
    
    if (error) {
      console.error('❌ Error setting Supabase session:', error);
      
      // Try alternative approach with JWT parsing
      try {
        console.log('🔄 Trying alternative session approach...');
        
        // Decode JWT to get user info
        const tokenParts = token.split('.');
        if (tokenParts.length === 3) {
          const tokenPayload = JSON.parse(atob(tokenParts[1]));
          console.log('🔑 Token payload:', tokenPayload);
          
          // Try to set auth session with user from token
          if (tokenPayload?.sub) {
            await supabase.auth.setSession({
              access_token: token,
              refresh_token: refreshToken || token, // Use access token as refresh token if needed
            });
            console.log('✅ Alternative session approach may have succeeded');
            return true;
          }
        }
      } catch (jwtError) {
        console.error('❌ JWT parsing attempt failed:', jwtError);
      }
      
      return false;
    }
    
    console.log('✅ Manual Supabase session set successfully', data);
    return true;
  } catch (err) {
    console.error('❌ Failed to set auth token manually:', err);
    return false;
  }
};

/**
 * Fetch all images for a specific rock
 * @param rockId ID of the rock
 * @returns Array of rock image data
 */
export const getRockImages = async (rockId: string): Promise<IRockImage[]> => {
  try {
    console.log(`🖼️ Fetching images for rock ID: ${rockId}`);
    console.log(`🖼️ API URL: ${API_URL}/rock-images/${rockId}`);
    
    // Try to authenticate with Supabase first for storage access
    await setAuthTokenManually();
    
    // Proceed with fetching images from the API
    const response = await axios.get(`${API_URL}/rock-images/${rockId}`);
    
    console.log(`🖼️ Images fetch response status: ${response.status}`);
    console.log(`🖼️ Data received: ${JSON.stringify(response.data)}`);
    
    if (response.data && response.data.data) {
      console.log(`🖼️ Found ${response.data.data.length} images`);
      return response.data.data || [];
    } else {
      console.log('🖼️ No images found in response data');
      return [];
    }
  } catch (error) {
    console.error('❌ Error fetching rock images:', error);
    if (axios.isAxiosError(error)) {
      console.error('❌ Axios error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });
    }
    return [];
  }
};

/**
 * Upload images for a rock and create records in the database
 * @param rockId ID of the rock
 * @param files Array of image files to upload
 * @param captions Optional array of captions for each image
 * @returns Array of created rock image data
 */
export const uploadRockImages = async (
  rockId: string,
  files: File[],
  captions: string[] = []
): Promise<IRockImage[]> => {
  try {
    console.log(`📸 Starting rock image upload for rock ID: ${rockId}`);
    console.log(`📸 Number of files to upload: ${files.length}`);
    console.log(`📸 File details:`, files.map(f => ({ name: f.name, size: f.size, type: f.type })));
    
    // Set auth token for Supabase client
    await setAuthTokenManually();
    
    // Get token for API calls
    const token = getAuthToken();
    if (!token) {
      console.error('📸 Authentication token missing');
      toast.error('Authentication required. Please log in again.');
      return [];
    }

    // 1. Upload files to storage
    console.log('📸 Uploading files to storage...');
    const imageUrls = await uploadMultipleFiles(files, 'rocks');
    console.log(`📸 Storage upload complete. Received ${imageUrls.length} URLs:`, imageUrls);
    
    if (!imageUrls.length) {
      console.error('📸 No image URLs returned from storage upload');
      
      // Fallback to direct Supabase storage upload
      try {
        console.log('📸 Trying direct Supabase storage upload as fallback');
        const { supabase } = await import('@/lib/supabase');
        
        // Get authentication token
        const token = getAuthToken();
        if (!token) {
          console.error('📸 No auth token available for direct upload');
          return [];
        }
        
        // Manually create a session if not exists
        const { data: sessionData } = await supabase.auth.getSession();
        if (!sessionData.session) {
          console.log('📸 No active session, setting token manually for direct upload');
          try {
            await supabase.auth.setSession({
              access_token: token,
              refresh_token: token, // Use access as refresh token for simplicity
            });
            console.log('📸 Session set manually for direct upload');
          } catch (sessionError) {
            console.error('📸 Failed to set session for direct upload:', sessionError);
            // Continue anyway - the upload might still work with authorization headers
          }
        } else {
          console.log('📸 Using existing session for direct upload');
        }
        
        // Upload files directly with custom headers
        const directUrls = await Promise.all(files.map(async (file, index) => {
          try {
            const fileExt = file.name.split('.').pop() || '';
            const fileName = `rock-${rockId}-${Date.now()}-${index}.${fileExt}`;
            const filePath = `rocks/${fileName}`;
            
            console.log(`📸 Attempting direct upload for file ${index + 1}/${files.length}: ${fileName}`);
            
            // Add auth headers explicitly
            const options = {
              cacheControl: '3600',
              upsert: true,
              headers: token ? { 'Authorization': `Bearer ${token}` } : undefined
            };
            
            const { data, error } = await supabase.storage
              .from(STORAGE_BUCKET)
              .upload(filePath, file, options);
              
            if (error) {
              console.error(`📸 Direct upload error for file ${index + 1}:`, error);
              
              // If it's a permissions issue, try alternative approach
              if (error.statusCode === 400 || error.message.includes('Permission')) {
                console.log('📸 Permission error, trying server upload fallback...');
                // Implement a server-side upload fallback here if needed
                // This would involve sending the file to your backend API
                // and having it handle the upload with service role credentials
              }
              
              return null;
            }
            
            console.log(`📸 File ${index + 1} uploaded successfully:`, data.path);
            
            // Get the public URL
            const { data: urlData } = supabase.storage
              .from(STORAGE_BUCKET)
              .getPublicUrl(data.path);
              
            console.log(`📸 Public URL generated:`, urlData.publicUrl);
            return urlData.publicUrl;
          } catch (fileError) {
            console.error(`📸 Error processing file ${index + 1}:`, fileError);
            return null;
          }
        }));
        
        const validUrls = directUrls.filter(url => url !== null) as string[];
        if (validUrls.length > 0) {
          console.log('📸 Direct upload successful for some files:', validUrls);
          
          // Continue with these URLs
          imageUrls.push(...validUrls);
        } else {
          console.error('📸 All direct uploads failed');
        }
      } catch (directError) {
        console.error('📸 Direct upload fallback failed:', directError);
      }
    }
    
    // If we still don't have any URLs, return empty array
    if (!imageUrls.length) {
      return [];
    }
    
    // 2. Create image records in the database
    const imageData = imageUrls.map((url, index) => ({
      rock_id: rockId,
      image_url: url,
      caption: captions[index] || '',
      display_order: index
    }));
    
    console.log(`📸 Saving ${imageData.length} images to database:`, imageData);
    console.log(`📸 API URL: ${API_URL}/rock-images`);
    
    try {
      const response = await axios.post(
        `${API_URL}/rock-images`, 
        { images: imageData },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      console.log('📸 Database save response:', response.status, response.data);
      
      return response.data.data || [];
    } catch (apiError) {
      console.error('📸 API error during database save:', apiError);
      if (axios.isAxiosError(apiError)) {
        console.error('📸 API error details:', {
          status: apiError.response?.status,
          statusText: apiError.response?.statusText,
          data: apiError.response?.data,
          headers: apiError.response?.headers
        });
        
        // Try direct database insert if API fails
        try {
          console.log('📸 Trying direct database insert as fallback');
          const { supabase } = await import('@/lib/supabase');
          
          // Try each image one by one
          const results = await Promise.all(imageData.map(async (image) => {
            const { data, error } = await supabase
              .from('rock_images')
              .insert([image])
              .select();
              
            if (error) {
              console.error('📸 Direct insert error:', error);
              return null;
            }
            
            return data[0];
          }));
          
          const successfulInserts = results.filter(r => r !== null) as IRockImage[];
          if (successfulInserts.length > 0) {
            console.log('📸 Direct insert successful for some images:', successfulInserts);
            return successfulInserts;
          }
        } catch (directDbError) {
          console.error('📸 Direct database insert fallback failed:', directDbError);
        }
      }
      
      // If URLs were created but database save failed, still return the URLs
      // The frontend can show the images even if they're not saved in the database
      return imageData;
    }
  } catch (error) {
    console.error('❌ Error uploading rock images:', error);
    if (axios.isAxiosError(error)) {
      console.error('❌ Axios error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });
    }
    throw error;
  }
};

/**
 * Update a rock image
 * @param imageId ID of the image to update
 * @param data Updated image data
 * @returns Updated rock image data
 */
export const updateRockImage = async (
  imageId: string,
  data: Partial<IRockImage>
): Promise<IRockImage> => {
  try {
    // Get token
    const token = getAuthToken();
    if (!token) {
      throw new Error('Authentication required');
    }
    
    const response = await axios.put(
      `${API_URL}/rock-images/${imageId}`,
      data,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    return response.data.data;
  } catch (error) {
    console.error('Error updating rock image:', error);
    throw error;
  }
};

/**
 * Delete a rock image
 * @param imageId ID of the image to delete
 * @param deleteFromStorage Whether to also delete the file from storage
 * @returns Success status
 */
export const deleteRockImage = async (
  imageId: string,
  deleteFromStorage = true
): Promise<boolean> => {
  try {
    // Get token
    const token = getAuthToken();
    if (!token) {
      throw new Error('Authentication required');
    }
    
    // First get the image URL if we need to delete from storage
    let imageUrl = '';
    if (deleteFromStorage) {
      const response = await axios.get(
        `${API_URL}/rock-images/${imageId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      imageUrl = response.data.data?.image_url || '';
    }
    
    // Delete the database record
    await axios.delete(
      `${API_URL}/rock-images/${imageId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    // Delete the file from storage if needed
    if (deleteFromStorage && imageUrl) {
      await deleteMultipleFiles([imageUrl]);
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting rock image:', error);
    return false;
  }
};

/**
 * Delete all images for a rock
 * @param rockId ID of the rock
 * @param deleteFromStorage Whether to also delete the files from storage
 * @returns Success status
 */
export const deleteRockImages = async (
  rockId: string,
  deleteFromStorage = true
): Promise<boolean> => {
  try {
    // Get token
    const token = getAuthToken();
    if (!token) {
      throw new Error('Authentication required');
    }
    
    // First get all image URLs if we need to delete from storage
    let imageUrls: string[] = [];
    if (deleteFromStorage) {
      const response = await axios.get(
        `${API_URL}/rock-images/${rockId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      imageUrls = (response.data.data || []).map((img: IRockImage) => img.image_url).filter(Boolean);
    }
    
    // Delete all image records for this rock
    await axios.delete(
      `${API_URL}/rock-images/rock/${rockId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    // Delete files from storage if needed
    if (deleteFromStorage && imageUrls.length) {
      await deleteMultipleFiles(imageUrls);
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting rock images:', error);
    return false;
  }
}; 