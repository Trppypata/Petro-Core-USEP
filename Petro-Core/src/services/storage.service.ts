import { supabase } from '../lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';

const STORAGE_BUCKET = 'rocks-minerals';
const FIELDWORKS_BUCKET = 'fieldworks';

/**
 * Uploads a file to Supabase storage
 * @param file The file to upload
 * @param folder The folder to upload to (e.g. 'rocks', 'minerals', 'fieldworks')
 * @param onProgress Optional callback to track upload progress
 * @returns The URL of the uploaded file
 */
export const uploadFile = async (
  file: File, 
  folder: string, 
  onProgress?: (progress: number) => void
): Promise<string> => {
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
      
      toast.error('Supabase storage is not configured. Your data will be saved without the file.');
      
      // Return empty string but don't block the rest of the form submission
      return '';
    }

    // Report initial progress
    onProgress?.(10);

    // Force authentication by setting the auth token manually if needed
    const token = localStorage.getItem('access_token');
    if (token) {
      console.log('Setting auth token manually:', token.substring(0, 10) + '...');
      try {
        // Set the auth token for this session
        const { error: authError } = await supabase.auth.setSession({
          access_token: token,
          refresh_token: '',
        });
        
        if (authError) {
          console.error('Error setting session:', authError);
        }
      } catch (authErr) {
        console.error('Failed to set session:', authErr);
      }
    } else {
      console.warn('No access token found in localStorage');
    }

    // Report progress after auth check
    onProgress?.(20);

    // Check auth session before uploading
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      console.error('No active session found. User might not be authenticated.');
      
      // Try to create an anonymous session for testing
      console.log('Attempting anonymous upload...');
      // We'll continue anyway and let RLS policies determine if it works
    } else {
      console.log('User authenticated, proceeding with upload');
    }

    // Report progress after session check
    onProgress?.(30);

    // Generate a unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    console.log(`🔄 Uploading file to ${filePath} (Size: ${(file.size / 1024).toFixed(2)} KB)`);

    // Determine which bucket to use
    const bucketName = folder === 'fieldworks' ? FIELDWORKS_BUCKET : STORAGE_BUCKET;
    console.log(`Using storage bucket: ${bucketName}`);

    // Create folder if it doesn't exist (for some storage providers)
    try {
      const { data: folderData, error: folderError } = await supabase.storage
        .from(bucketName)
        .list(folder);
        
      if (folderError && !folderError.message.includes("The resource was not found")) {
        console.warn(`⚠️ Folder check warning: ${folderError.message}`);
      }
    } catch (folderErr) {
      console.warn(`⚠️ Folder check exception: ${folderErr}`);
      // Continue anyway as some providers create folders automatically
    }

    // Report progress before upload
    onProgress?.(40);

    // Add auth headers explicitly for this request
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Upload the file
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
        ...(token ? { headers } : {})
      });

    // Report progress after upload
    onProgress?.(80);

    if (error) {
      if (error.statusCode === 400) {
        console.error(`❌ Upload 400 error - Policy violation: ${error.message}`);
        console.error('This is likely a permissions issue. Please check your storage bucket policies.');
        
        // Additional information about potential solutions
        console.error(`
          Solutions to try:
          1. Make sure the '${bucketName}' bucket exists in your Supabase project
          2. Check Row Level Security policies for the storage.objects table
          3. Make sure you're properly authenticated
          4. Try creating a policy allowing anonymous uploads if needed
        `);
        
        toast.error('Storage permission denied. Please contact administrator.');
        return '';
      }
      throw error;
    }

    // Get the public URL
    const { data: publicURL } = supabase.storage
      .from(bucketName)
      .getPublicUrl(data.path);

    // Report completion
    onProgress?.(100);

    console.log(`✅ File uploaded successfully: ${publicURL.publicUrl}`);
    return publicURL.publicUrl;
  } catch (error) {
    console.error('Error uploading file:', error);
    toast.error('Failed to upload file. Your data will be saved without the file.');
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

    // Check auth session before uploading
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      console.error('No active session found. User might not be authenticated.');
      toast.error('Authentication required for uploading images.');
      return [];
    }

    console.log(`🗄️ Supabase URL: ${import.meta.env.VITE_SUPABASE_URL}`);
    console.log(`🗄️ Storage bucket: ${STORAGE_BUCKET}`);
    console.log(`🗄️ User authenticated: ${!!sessionData.session}`);

    // Show a loading toast
    toast.loading(`Uploading ${files.length} images...`);

    // Try to create folder if needed
    try {
      const { data: folderData, error: folderError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .list(folder);
        
      if (folderError && !folderError.message.includes("The resource was not found")) {
        console.warn(`⚠️ Folder check warning: ${folderError.message}`);
      }
    } catch (folderErr) {
      console.warn(`⚠️ Folder check exception: ${folderErr}`);
      // Continue anyway as some providers create folders automatically
    }

    // Upload each file concurrently
    const uploadPromises = files.map(async (file, index) => {
      try {
        // Generate a unique filename
        const fileExt = file.name.split('.').pop();
        const fileName = `${uuidv4()}.${fileExt}`;
        const filePath = `${folder}/${fileName}`;
        console.log(`🗄️ [${index + 1}/${files.length}] Uploading ${file.name} to ${filePath}`);

        // Upload the file
        const { data, error } = await supabase.storage
          .from(STORAGE_BUCKET)
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: true
          });

        if (error) {
          if (error.statusCode === 400) {
            console.error(`❌ 400 error - likely permissions issue: ${error.message}`);
            console.error('Please check your Supabase storage bucket RLS policies.');
            return '';
          }
          console.error(`❌ [${index + 1}/${files.length}] Error uploading ${file.name}:`, error);
          return '';
        }

        // Get the public URL
        const { data: publicURL } = supabase.storage
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

    // Determine which bucket the file belongs to
    let bucketName = STORAGE_BUCKET;
    if (fileUrl.includes('fieldworks')) {
      bucketName = FIELDWORKS_BUCKET;
    }

    // Extract the path from the URL
    const storageUrl = supabase.storage.from(bucketName).getPublicUrl('').data.publicUrl;
    const filePath = fileUrl.replace(storageUrl, '');

    // Delete the file
    const { error } = await supabase.storage
      .from(bucketName)
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

    // Skip if no fileUrls provided
    if (!fileUrls.length) {
      console.warn('No file URLs provided, skipping deletion');
      return;
    }

    // Extract the paths from the URLs
    const storageUrl = supabase.storage.from(STORAGE_BUCKET).getPublicUrl('').data.publicUrl;
    const filePaths = fileUrls
      .filter(url => url) // Filter out empty URLs
      .map(url => url.replace(storageUrl, ''));

    if (filePaths.length === 0) {
      console.warn('No valid file paths to delete');
      return;
    }

    // Delete the files
    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove(filePaths);

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Error deleting files:', error);
    toast.error('Failed to delete files. Please try again.');
  }
}; 