import { supabase } from '../lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';

// Define the bucket name as a constant to ensure consistency throughout the app
export const STORAGE_BUCKET = 'rocks-minerals';

/**
 * Get the authentication token from various storage locations
 */
const getAuthToken = (): string | null => {
  // Try multiple storage locations for the token
  return localStorage.getItem('access_token') || 
         localStorage.getItem('auth_token') || 
         localStorage.getItem('token') || 
         localStorage.getItem('accessToken');
};

/**
 * Creates a Supabase client with the current auth token
 */
const getAuthenticatedSupabaseClient = () => {
  const token = getAuthToken();
  
  if (token) {
    console.log('Using authenticated Supabase client with token:', token.substring(0, 10) + '...' + token.substring(token.length - 5));
    // Set the auth header in the supabase client
    supabase.auth.setSession({
      access_token: token,
      refresh_token: '',
    });
  } else {
    console.warn('No authentication token found. Storage operations may fail.');
  }
  
  return supabase;
};

/**
 * Uploads a file to Supabase storage
 * @param file The file to upload
 * @param folder The folder to upload to (e.g. 'rocks', 'minerals')
 * @returns The URL of the uploaded file
 */
export const uploadFile = async (file: File, folder: string): Promise<string> => {
  try {
    // Check if Supabase is properly configured
    if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
      // More helpful error message with instructions
      console.error(`
        Missing Supabase environment variables. Please configure your .env file.
        
        Create a .env file in the Petro-Core directory with the following:
        VITE_SUPABASE_URL=your_supabase_url
        VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
        
        You can find these values in your Supabase dashboard under Project Settings > API.
      `);
      
      toast.error('Supabase storage is not configured. Your data will be saved without the image.');
      
      // Return empty string but don't block the rest of the form submission
      return '';
    }

    // Get authenticated client
    const client = getAuthenticatedSupabaseClient();

    // Generate a unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    // Upload the file
    const { data, error } = await client.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (error) {
      throw error;
    }

    // Get the public URL
    const { data: publicURL } = client.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(data.path);

    return publicURL.publicUrl;
  } catch (error) {
    console.error('Error uploading file:', error);
    toast.error('Failed to upload file. Your data will be saved without the image.');
    return '';
  }
};

/**
 * Uploads multiple files to Supabase storage
 * @param files Array of files to upload
 * @param folder The folder to upload to (e.g. 'rocks', 'minerals')
 * @returns Array of URLs of the uploaded files
 */
export const uploadMultipleFiles = async (files: File[], folder: string): Promise<string[]> => {
  try {
    console.log(`🗄️ Starting upload of ${files.length} files to ${folder} folder`);
    console.log(`🗄️ File details: ${files.map(f => `${f.name} (${f.size} bytes)`).join(', ')}`);
    
    // Check if Supabase is properly configured
    if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
      console.error('🗄️ Missing Supabase environment variables. Please configure your .env file.');
      toast.error('Supabase storage is not configured. Your data will be saved without images.');
      return [];
    }

    // Get authenticated client
    const client = getAuthenticatedSupabaseClient();

    console.log(`🗄️ Supabase URL: ${import.meta.env.VITE_SUPABASE_URL}`);
    console.log(`🗄️ Storage bucket: ${STORAGE_BUCKET}`);

    // Show a loading toast
    toast.loading(`Uploading ${files.length} images...`);

    // Upload each file concurrently
    const uploadPromises = files.map(async (file, index) => {
      try {
        // Generate a unique filename
        const fileExt = file.name.split('.').pop();
        const fileName = `${uuidv4()}.${fileExt}`;
        const filePath = `${folder}/${fileName}`;
        console.log(`🗄️ [${index + 1}/${files.length}] Uploading ${file.name} to ${filePath}`);

        // Upload the file
        const { data, error } = await client.storage
          .from(STORAGE_BUCKET)
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: true
          });

        if (error) {
          console.error(`❌ [${index + 1}/${files.length}] Error uploading ${file.name}:`, error);
          return '';
        }

        // Get the public URL
        const { data: publicURL } = client.storage
          .from(STORAGE_BUCKET)
          .getPublicUrl(data.path);

        console.log(`✅ [${index + 1}/${files.length}] Successfully uploaded ${file.name} to ${data.path}`);
        console.log(`🔗 Public URL: ${publicURL.publicUrl}`);
        
        return publicURL.publicUrl;
      } catch (error) {
        console.error(`❌ [${index + 1}/${files.length}] Error uploading ${file.name}:`, error);
        return '';
      }
    });

    // Wait for all uploads to complete
    console.log(`🗄️ Waiting for all ${files.length} uploads to complete...`);
    const urls = await Promise.all(uploadPromises);
    
    // Dismiss loading toast
    toast.dismiss();
    
    // Show success toast
    const successCount = urls.filter(url => url !== '').length;
    console.log(`🗄️ Upload complete: ${successCount}/${files.length} files uploaded successfully`);
    
    if (successCount > 0) {
      toast.success(`Successfully uploaded ${successCount} of ${files.length} images`);
    } else {
      toast.error(`Failed to upload any images. Please try again.`);
    }
    
    // Filter out any failed uploads (empty strings)
    return urls.filter(url => url !== '');
  } catch (error) {
    console.error('❌ Error uploading multiple files:', error);
    toast.error('Failed to upload images. Your data will be saved without images.');
    return [];
  }
};

/**
 * Deletes a file from Supabase storage
 * @param fileUrl The URL of the file to delete
 */
export const deleteFile = async (fileUrl: string): Promise<void> => {
  try {
    // Check if Supabase is properly configured
    if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
      toast.error('Supabase storage is not configured. File deletion is unavailable.');
      console.error('Missing Supabase environment variables. Please configure your .env file.');
      return;
    }

    // Skip if fileUrl is empty
    if (!fileUrl) {
      console.warn('Empty file URL provided, skipping deletion');
      return;
    }

    // Get authenticated client
    const client = getAuthenticatedSupabaseClient();

    // Extract the path from the URL
    const storageUrl = client.storage.from(STORAGE_BUCKET).getPublicUrl('').data.publicUrl;
    const filePath = fileUrl.replace(storageUrl, '');

    // Delete the file
    const { error } = await client.storage
      .from(STORAGE_BUCKET)
      .remove([filePath]);

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Error deleting file:', error);
    toast.error('Failed to delete file. Please try again.');
  }
};

/**
 * Deletes multiple files from Supabase storage
 * @param fileUrls Array of URLs of the files to delete
 */
export const deleteMultipleFiles = async (fileUrls: string[]): Promise<void> => {
  try {
    // Check if Supabase is properly configured
    if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
      toast.error('Supabase storage is not configured. File deletion is unavailable.');
      console.error('Missing Supabase environment variables. Please configure your .env file.');
      return;
    }

    // Skip if no URLs provided
    if (!fileUrls.length) {
      console.warn('No file URLs provided, skipping deletion');
      return;
    }

    // Get authenticated client
    const client = getAuthenticatedSupabaseClient();

    // Extract the storage URL
    const storageUrl = client.storage.from(STORAGE_BUCKET).getPublicUrl('').data.publicUrl;
    
    // Extract the paths from the URLs
    const filePaths = fileUrls
      .filter(url => url) // Filter out empty URLs
      .map(url => url.replace(storageUrl, ''));

    if (filePaths.length) {
      // Delete the files
      const { error } = await client.storage
        .from(STORAGE_BUCKET)
        .remove(filePaths);

      if (error) {
        throw error;
      }
    }
  } catch (error) {
    console.error('Error deleting files:', error);
    toast.error('Failed to delete some files. Please try again.');
  }
}; 