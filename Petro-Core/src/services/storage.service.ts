import { supabase } from '../lib/supabase';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_BUCKET = 'rocks-minerals';

/**
 * Uploads a file to Supabase storage
 * @param file The file to upload
 * @param folder The folder to upload to (e.g. 'rocks', 'minerals')
 * @returns The URL of the uploaded file
 */
export const uploadFile = async (file: File, folder: string): Promise<string> => {
  try {
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
    throw new Error('Failed to upload file. Please try again.');
  }
};

/**
 * Deletes a file from Supabase storage
 * @param fileUrl The URL of the file to delete
 */
export const deleteFile = async (fileUrl: string): Promise<void> => {
  try {
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
    throw new Error('Failed to delete file. Please try again.');
  }
}; 