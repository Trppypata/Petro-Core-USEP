import axios from 'axios';
import { uploadMultipleFiles, deleteMultipleFiles } from './storage.service';
import Cookies from 'js-cookie';

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

const API_URL = import.meta.env.VITE_local_url || 'http://localhost:8001/api';

// Helper function to get the authentication token
const getAuthToken = (): string | null => {
  return localStorage.getItem('access_token') || 
         Cookies.get('access_token') || 
         localStorage.getItem('token') || 
         localStorage.getItem('auth_token');
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
    
    // Get token
    const token = getAuthToken();
    if (!token) {
      console.error('📸 Authentication token missing');
      throw new Error('Authentication required');
    }
    console.log('📸 Auth token found:', token.substring(0, 10) + '...');

    // 1. Upload files to storage
    console.log('📸 Uploading files to storage...');
    const imageUrls = await uploadMultipleFiles(files, 'rocks');
    console.log(`📸 Storage upload complete. Received ${imageUrls.length} URLs:`, imageUrls);
    
    if (!imageUrls.length) {
      console.error('📸 No image URLs returned from storage upload');
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
      }
      throw apiError;
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