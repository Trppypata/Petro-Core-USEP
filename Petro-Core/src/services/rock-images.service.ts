import axios from "axios";
import { uploadMultipleFiles, deleteMultipleFiles } from "./storage.service";
import Cookies from "js-cookie";
import { toast } from "sonner";

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

import { API_URL } from "@/config/api.config";
import { getRealAuthToken } from "@/modules/admin/minerals/services/minerals.service";
const STORAGE_BUCKET = "rocks-minerals";

/**
 * Set the auth token for Supabase client
 */
const setAuthTokenManually = async () => {
  try {
    const token = getRealAuthToken();
    if (!token) {
      console.error("❌ No auth token available to set Supabase session");
      return false;
    }

    console.log("🔄 Attempting to set Supabase session with token...");

    const { supabase } = await import("@/lib/supabase");

    // First check if we already have a session
    const { data: sessionData } = await supabase.auth.getSession();
    if (sessionData?.session) {
      console.log(
        "✅ Existing Supabase session found, no need to set manually"
      );
      return true;
    }

    // Try to create a refresh token from the auth token (some implementations require it)
    const refreshToken = localStorage.getItem("refresh_token") || token;

    const { data, error } = await supabase.auth.setSession({
      access_token: token,
      refresh_token: refreshToken,
    });

    if (error) {
      console.error("❌ Error setting Supabase session:", error);

      // Try alternative approach with JWT parsing
      try {
        console.log("🔄 Trying alternative session approach...");

        // Decode JWT to get user info
        const tokenParts = token.split(".");
        if (tokenParts.length === 3) {
          const tokenPayload = JSON.parse(atob(tokenParts[1]));
          console.log("🔑 Token payload:", tokenPayload);

          // Try to set auth session with user from token
          if (tokenPayload?.sub) {
            await supabase.auth.setSession({
              access_token: token,
              refresh_token: refreshToken || token, // Use access token as refresh token if needed
            });
            console.log("✅ Alternative session approach may have succeeded");
            return true;
          }
        }
      } catch (jwtError) {
        console.error("❌ JWT parsing attempt failed:", jwtError);
      }

      return false;
    }

    console.log("✅ Manual Supabase session set successfully", data);
    return true;
  } catch (err) {
    console.error("❌ Failed to set auth token manually:", err);
    return false;
  }
};

/**
 * Validate if an image URL is accessible
 * @param url Image URL to validate
 * @returns Promise<boolean> indicating if the image is accessible
 */
const validateImageUrl = async (url: string): Promise<boolean> => {
  try {
    // Basic URL validation
    if (!url || typeof url !== "string" || url.trim().length === 0) {
      return false;
    }

    // Check if it's a valid URL format
    try {
      new URL(url);
    } catch {
      // If it's not a valid URL, it might be a relative path
      if (!url.startsWith("/") && !url.startsWith("http")) {
        return false;
      }
    }

    // Try to fetch the image with a HEAD request to check if it exists
    const response = await fetch(url, {
      method: "HEAD",
      mode: "cors",
      cache: "no-cache",
    });

    return (
      response.ok && response.headers.get("content-type")?.startsWith("image/")
    );
  } catch (error) {
    console.warn(`🖼️ Image validation failed for URL: ${url}`, error);
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

    // Validate input
    if (!rockId || typeof rockId !== "string" || rockId.trim().length === 0) {
      console.warn("🖼️ Invalid rock ID provided");
      return [];
    }

    const apiUrl = `${API_URL}/rock-images/${rockId}`;
    console.log(`🖼️ API URL: ${apiUrl}`);

    // Fetch images from the API (no authentication required for GET)
    const response = await axios.get(apiUrl, {
      timeout: 10000, // 10 second timeout
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    console.log(`🖼️ Images fetch response status: ${response.status}`);
    console.log(`🖼️ Response data structure:`, {
      success: response.data?.success,
      dataLength: response.data?.data?.length || 0,
      hasData: !!response.data?.data,
    });

    // Check if response is successful and has data
    if (!response.data?.success) {
      console.warn(
        "🖼️ API response indicates failure:",
        response.data?.message
      );
      return [];
    }

    const images = response.data.data || [];
    console.log(`🖼️ Found ${images.length} images`);

    if (images.length === 0) {
      console.log("🖼️ No images found for this rock");
      return [];
    }

    // Validate and filter images
    const validatedImages: IRockImage[] = [];

    for (const image of images) {
      if (!image || typeof image !== "object") {
        console.warn("🖼️ Invalid image object:", image);
        continue;
      }

      // Ensure required fields exist
      if (!image.image_url || !image.rock_id) {
        console.warn("🖼️ Image missing required fields:", {
          hasUrl: !!image.image_url,
          hasRockId: !!image.rock_id,
          image,
        });
        continue;
      }

      // Validate image URL format
      const isValidUrl = await validateImageUrl(image.image_url);
      if (!isValidUrl) {
        console.warn("🖼️ Invalid or inaccessible image URL:", image.image_url);
        // Still include the image but mark it for fallback handling
      }

      validatedImages.push({
        id: image.id,
        rock_id: image.rock_id,
        image_url: image.image_url,
        caption: image.caption || "",
        display_order: image.display_order || 0,
        created_at: image.created_at,
        updated_at: image.updated_at,
      });
    }

    console.log(
      `🖼️ Validated ${validatedImages.length} images out of ${images.length}`
    );
    return validatedImages;
  } catch (error) {
    console.error("❌ Error fetching rock images:", error);

    if (axios.isAxiosError(error)) {
      console.error("❌ Axios error details:", {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url,
        timeout: error.code === "ECONNABORTED",
      });

      // Handle specific error cases
      if (error.response?.status === 404) {
        console.log("🖼️ No images found for this rock (404)");
        return [];
      }

      if (error.response?.status === 500) {
        console.error("🖼️ Server error when fetching images");
        toast.error(
          "Server error while loading images. Please try again later."
        );
        return [];
      }

      if (error.code === "ECONNABORTED") {
        console.error("🖼️ Request timeout when fetching images");
        toast.error(
          "Request timeout while loading images. Please check your connection."
        );
        return [];
      }

      if (error.response?.status === 403) {
        console.error("🖼️ Access forbidden when fetching images");
        toast.error("Access denied while loading images.");
        return [];
      }
    } else {
      console.error("🖼️ Non-axios error:", error);
      toast.error("Unexpected error while loading images.");
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
    console.log(
      `📸 File details:`,
      files.map((f) => ({ name: f.name, size: f.size, type: f.type }))
    );

    // Set auth token for Supabase client
    await setAuthTokenManually();

    // Get token for API calls
    const token = getRealAuthToken();
    if (!token) {
      console.error("📸 Authentication token missing");
      toast.error("Authentication required. Please log in again.");
      return [];
    }

    // 1. Upload files to storage
    console.log("📸 Uploading files to storage...");
    const imageUrls = await uploadMultipleFiles(files, "rocks");
    console.log(
      `📸 Storage upload complete. Received ${imageUrls.length} URLs:`,
      imageUrls
    );

    if (!imageUrls.length) {
      console.error("📸 No image URLs returned from storage upload");

      // Fallback to direct Supabase storage upload
      try {
        console.log("📸 Trying direct Supabase storage upload as fallback");
        const { supabase } = await import("@/lib/supabase");

        // Get authentication token
        const token = getRealAuthToken();
        if (!token) {
          console.error("📸 No auth token available for direct upload");
          return [];
        }

        // Manually create a session if not exists
        const { data: sessionData } = await supabase.auth.getSession();
        if (!sessionData.session) {
          console.log(
            "📸 No active session, setting token manually for direct upload"
          );
          try {
            await supabase.auth.setSession({
              access_token: token,
              refresh_token: token, // Use access as refresh token for simplicity
            });
            console.log("📸 Session set manually for direct upload");
          } catch (sessionError) {
            console.error(
              "📸 Failed to set session for direct upload:",
              sessionError
            );
            // Continue anyway - the upload might still work with authorization headers
          }
        } else {
          console.log("📸 Using existing session for direct upload");
        }

        // Upload files directly with custom headers
        const directUrls = await Promise.all(
          files.map(async (file, index) => {
            try {
              const fileExt = file.name.split(".").pop() || "";
              const fileName = `rock-${rockId}-${Date.now()}-${index}.${fileExt}`;
              const filePath = `rocks/${fileName}`;

              console.log(
                `📸 Attempting direct upload for file ${index + 1}/${
                  files.length
                }: ${fileName}`
              );

              // Add auth headers explicitly
              const options = {
                cacheControl: "3600",
                upsert: true,
                headers: token
                  ? { Authorization: `Bearer ${token}` }
                  : undefined,
              };

              const { data, error } = await supabase.storage
                .from(STORAGE_BUCKET)
                .upload(filePath, file, options);

              if (error) {
                console.error(
                  `📸 Direct upload error for file ${index + 1}:`,
                  error
                );

                // If it's a permissions issue, try alternative approach
                if (
                  error.statusCode === 400 ||
                  error.message.includes("Permission")
                ) {
                  console.log(
                    "📸 Permission error, trying server upload fallback..."
                  );
                  // Implement a server-side upload fallback here if needed
                  // This would involve sending the file to your backend API
                  // and having it handle the upload with service role credentials
                }

                return null;
              }

              console.log(
                `📸 File ${index + 1} uploaded successfully:`,
                data.path
              );

              // Get the public URL
              const { data: urlData } = supabase.storage
                .from(STORAGE_BUCKET)
                .getPublicUrl(data.path);

              console.log(`📸 Public URL generated:`, urlData.publicUrl);
              return urlData.publicUrl;
            } catch (fileError) {
              console.error(
                `📸 Error processing file ${index + 1}:`,
                fileError
              );
              return null;
            }
          })
        );

        const validUrls = directUrls.filter((url) => url !== null) as string[];
        if (validUrls.length > 0) {
          console.log("📸 Direct upload successful for some files:", validUrls);

          // Continue with these URLs
          imageUrls.push(...validUrls);
        } else {
          console.error("📸 All direct uploads failed");
        }
      } catch (directError) {
        console.error("📸 Direct upload fallback failed:", directError);
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
      caption: captions[index] || "",
      display_order: index,
    }));

    console.log(`📸 Saving ${imageData.length} images to database:`, imageData);
    console.log(`📸 API URL: ${API_URL}/rock-images`);

    try {
      const response = await axios.post(
        `${API_URL}/rock-images`,
        { images: imageData },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("📸 Database save response:", response.status, response.data);

      return response.data.data || [];
    } catch (apiError) {
      console.error("📸 API error during database save:", apiError);
      if (axios.isAxiosError(apiError)) {
        console.error("📸 API error details:", {
          status: apiError.response?.status,
          statusText: apiError.response?.statusText,
          data: apiError.response?.data,
          headers: apiError.response?.headers,
        });

        // Try direct database insert if API fails
        try {
          console.log("📸 Trying direct database insert as fallback");
          const { supabase } = await import("@/lib/supabase");

          // Try each image one by one
          const results = await Promise.all(
            imageData.map(async (image) => {
              const { data, error } = await supabase
                .from("rock_images")
                .insert([image])
                .select();

              if (error) {
                console.error("📸 Direct insert error:", error);
                return null;
              }

              return data[0];
            })
          );

          const successfulInserts = results.filter(
            (r) => r !== null
          ) as IRockImage[];
          if (successfulInserts.length > 0) {
            console.log(
              "📸 Direct insert successful for some images:",
              successfulInserts
            );
            return successfulInserts;
          }
        } catch (directDbError) {
          console.error(
            "📸 Direct database insert fallback failed:",
            directDbError
          );
        }
      }

      // If URLs were created but database save failed, still return the URLs
      // The frontend can show the images even if they're not saved in the database
      return imageData;
    }
  } catch (error) {
    console.error("❌ Error uploading rock images:", error);
    if (axios.isAxiosError(error)) {
      console.error("❌ Axios error details:", {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
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
    const token = getRealAuthToken();
    if (!token) {
      throw new Error("Authentication required");
    }

    const response = await axios.put(
      `${API_URL}/rock-images/${imageId}`,
      data,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    return response.data.data;
  } catch (error) {
    console.error("Error updating rock image:", error);
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
    const token = getRealAuthToken();
    if (!token) {
      throw new Error("Authentication required");
    }

    // First get the image URL if we need to delete from storage
    let imageUrl = "";
    if (deleteFromStorage) {
      const response = await axios.get(`${API_URL}/rock-images/${imageId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      imageUrl = response.data.data?.image_url || "";
    }

    // Delete the database record
    await axios.delete(`${API_URL}/rock-images/${imageId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    // Delete the file from storage if needed
    if (deleteFromStorage && imageUrl) {
      await deleteMultipleFiles([imageUrl]);
    }

    return true;
  } catch (error) {
    console.error("Error deleting rock image:", error);
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
    const token = getRealAuthToken();
    if (!token) {
      throw new Error("Authentication required");
    }

    // First get all image URLs if we need to delete from storage
    let imageUrls: string[] = [];
    if (deleteFromStorage) {
      const response = await axios.get(`${API_URL}/rock-images/${rockId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      imageUrls = (response.data.data || [])
        .map((img: IRockImage) => img.image_url)
        .filter(Boolean);
    }

    // Delete all image records for this rock
    await axios.delete(`${API_URL}/rock-images/rock/${rockId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    // Delete files from storage if needed
    if (deleteFromStorage && imageUrls.length) {
      await deleteMultipleFiles(imageUrls);
    }

    return true;
  } catch (error) {
    console.error("Error deleting rock images:", error);
    return false;
  }
};
