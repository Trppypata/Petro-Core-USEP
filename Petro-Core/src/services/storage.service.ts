import { supabase } from '../lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';

const STORAGE_BUCKET = 'rocks-minerals';

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
      toast.error('Supabase storage is not configured. Image upload is unavailable.');
      console.error('Missing Supabase environment variables. Please configure your .env file.');
      // Return a placeholder image URL or empty string
      return '';
    }

    // Generate a unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    // Upload the file
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (error) {
      throw error;
    }

    // Get the public URL
    const { data: publicURL } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(data.path);

    return publicURL.publicUrl;
  } catch (error) {
    console.error('Error uploading file:', error);
    toast.error('Failed to upload file. Please try again.');
    return '';
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

    // Extract the path from the URL
    const storageUrl = supabase.storage.from(STORAGE_BUCKET).getPublicUrl('').data.publicUrl;
    const filePath = fileUrl.replace(storageUrl, '');

    // Delete the file
    const { error } = await supabase.storage
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