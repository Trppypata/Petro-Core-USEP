import { supabase } from "@/lib/supabase";
import { getRealAuthToken } from "@/modules/admin/minerals/services/minerals.service";

const STORAGE_BUCKET = "rocks-minerals";
const FIELDWORKS_BUCKET = "fieldworks";

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
    console.log(
      `🚀 Uploading file "${file.name}" to ${STORAGE_BUCKET}/${folder}`
    );

    // Check for auth session
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session) {
      console.log("No active session, attempting to set token manually");
      // Try to authenticate with token from localStorage
      const token = getRealAuthToken();
      if (token) {
        try {
          await supabase.auth.setSession({
            access_token: token,
            refresh_token: token,
          });
          console.log("Session set manually for upload");
        } catch (error) {
          console.error("Failed to set session manually:", error);
          // Continue anyway, the upload might still work
        }
      }
    }

    // Compute file content hash to avoid duplicate uploads
    const fileHash = await computeFileHash(file);
    const fileExt = file.name.split(".").pop();

    // Use a predictable filename based on hash instead of random generation
    // This way, if the same file is uploaded multiple times, it will have the same path
    const filePath = `${folder}/${fileHash}.${fileExt}`;

    console.log(`🚀 File path: ${filePath}`);

    // Check if file already exists with this hash
    const { data: existingFile } = await supabase.storage
      .from(STORAGE_BUCKET)
      .list(folder, {
        search: fileHash,
      });

    // If file with same hash exists, just return its URL
    if (existingFile && existingFile.length > 0) {
      const matchingFile = existingFile.find((f: { name: string }) =>
        f.name.startsWith(fileHash)
      );
      if (matchingFile) {
        console.log(
          "✅ File with same content already exists, reusing:",
          matchingFile.name
        );

        // Get public URL of existing file
        const { data: publicUrlData } = supabase.storage
          .from(STORAGE_BUCKET)
          .getPublicUrl(`${folder}/${matchingFile.name}`);

        if (publicUrlData?.publicUrl) {
          return publicUrlData.publicUrl;
        }
      }
    }

    // Upload with progress handling
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: true,
        onUploadProgress: (progress: { percent?: number }) => {
          if (onProgress) {
            onProgress(progress.percent || 0);
          }
        },
      });

    if (error) {
      console.error("🔴 Upload error:", error);
      throw new Error(`Upload failed: ${error.message}`);
    }

    console.log("✅ Upload successful:", data);

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(data.path);

    if (!publicUrlData?.publicUrl) {
      throw new Error("Failed to get public URL");
    }

    console.log("🔗 Public URL:", publicUrlData.publicUrl);
    return publicUrlData.publicUrl;
  } catch (error) {
    console.error("Error in uploadFile:", error);
    throw error;
  }
};

// Compute a hash of the file contents to use for deduplication
async function computeFileHash(file: File): Promise<string> {
  try {
    // Use file size and last modified as a simple "hash"
    // This isn't a cryptographic hash but helps with basic deduplication
    const hashParts = [
      file.size.toString(),
      file.lastModified.toString(),
      file.name.replace(/[^a-z0-9]/gi, ""),
    ];

    // For smaller files, we can try to get a more accurate hash
    if (file.size < 10 * 1024 * 1024) {
      // Under 10MB
      try {
        const buffer = await file.arrayBuffer();
        const hashBuffer = await crypto.subtle.digest("SHA-1", buffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");
        return hashHex;
      } catch (hashError) {
        console.warn(
          "Unable to compute file hash, using fallback method",
          hashError
        );
      }
    }

    // Fallback to a simple string concatenation
    return hashParts.join("-");
  } catch (error) {
    console.error("Error computing file hash:", error);
    // Fallback to timestamp-based unique ID
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }
}

/**
 * Uploads multiple files to Supabase storage
 * @param files Array of files to upload
 * @param folder The folder to upload to (e.g. 'rocks', 'minerals')
 * @returns Array of URLs of the uploaded files
 */
export const uploadMultipleFiles = async (
  files: File[],
  folder: string
): Promise<string[]> => {
  try {
    console.log(
      `📚 Uploading ${files.length} files to ${STORAGE_BUCKET}/${folder}`
    );

    // Check for auth session
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session) {
      console.log("No active session, attempting to set token manually");
      // Try to authenticate with token from localStorage
      const token =
        localStorage.getItem("access_token") ||
        localStorage.getItem("token") ||
        localStorage.getItem("auth_token");
      if (token) {
        try {
          await supabase.auth.setSession({
            access_token: token,
            refresh_token: token,
          });
          console.log("Session set manually for upload");
        } catch (error) {
          console.error("Failed to set session manually:", error);
          // Continue anyway, the upload might still work
        }
      }
    }

    // Upload files one by one using the improved uploadFile function
    const urls: string[] = [];
    let successCount = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        console.log(`📚 Uploading file ${i + 1}/${files.length}: ${file.name}`);

        // Use the single file upload function to benefit from deduplication
        const url = await uploadFile(file, folder);

        if (url) {
          console.log(`✅ File ${i + 1} uploaded successfully:`, url);
          urls.push(url);
          successCount++;
        } else {
          console.error(`🔴 Failed to get URL for file ${i + 1}`);
        }
      } catch (fileError) {
        console.error(`🔴 Error processing file ${i + 1}:`, fileError);
      }
    }

    console.log(
      `📚 Uploaded ${successCount}/${files.length} files successfully`
    );
    return urls;
  } catch (error) {
    console.error("Error in uploadMultipleFiles:", error);
    throw error;
  }
};

/**
 * Deletes a file from Supabase storage
 * @param fileUrl The URL of the file to delete
 */
export const deleteFile = async (fileUrl: string): Promise<void> => {
  try {
    if (!fileUrl || typeof fileUrl !== "string") {
      console.warn("Invalid file URL provided for deletion:", fileUrl);
      return;
    }

    // Extract path from URL
    let filePath = fileUrl;

    // Handle full Supabase URLs
    if (fileUrl.includes("/storage/v1/object/public/")) {
      filePath = fileUrl.split("/storage/v1/object/public/")[1];
      // Remove bucket name from path if present
      if (filePath.startsWith(`${STORAGE_BUCKET}/`)) {
        filePath = filePath.replace(`${STORAGE_BUCKET}/`, "");
      }
    }

    console.log(`🗑️ Deleting file from ${STORAGE_BUCKET}: ${filePath}`);

    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([filePath]);

    if (error) {
      console.error("Error deleting file:", error);
    } else {
      console.log("File deleted successfully:", data);
    }
  } catch (error) {
    console.error("Error in deleteFile:", error);
  }
};

/**
 * Deletes multiple files from Supabase storage
 * @param fileUrls Array of URLs of the files to delete
 */
export const deleteMultipleFiles = async (
  fileUrls: string[]
): Promise<void> => {
  try {
    if (!fileUrls || !fileUrls.length) {
      return;
    }

    console.log(`🗑️ Deleting ${fileUrls.length} files`);

    // Extract paths from URLs
    const filePaths = fileUrls
      .map((url) => {
        if (!url || typeof url !== "string") {
          return null;
        }

        let path = url;

        // Handle full Supabase URLs
        if (url.includes("/storage/v1/object/public/")) {
          path = url.split("/storage/v1/object/public/")[1];
          // Remove bucket name from path if present
          if (path.startsWith(`${STORAGE_BUCKET}/`)) {
            path = path.replace(`${STORAGE_BUCKET}/`, "");
          }
        }

        return path;
      })
      .filter(Boolean) as string[];

    if (!filePaths.length) {
      return;
    }

    console.log(`🗑️ Deleting paths:`, filePaths);

    // Delete in batches of 10 to avoid rate limits
    const batchSize = 10;
    for (let i = 0; i < filePaths.length; i += batchSize) {
      const batch = filePaths.slice(i, i + batchSize);
      const { data, error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .remove(batch);

      if (error) {
        console.error(`Error deleting batch ${i / batchSize + 1}:`, error);
      } else {
        console.log(`Batch ${i / batchSize + 1} deleted successfully:`, data);
      }
    }
  } catch (error) {
    console.error("Error in deleteMultipleFiles:", error);
  }
};
