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
    // Show the initial progress
    onProgress?.(0);

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

    // Compute a file hash to use for deduplication
    const fileHash = await computeFileHash(file);

    // Create a unique filename to avoid collisions
    const timestamp = Date.now();
    const fileExtension = file.name.split(".").pop() || "";
    const fileName = `${timestamp}_${fileHash.substring(
      0,
      10
    )}.${fileExtension}`;

    // Create the full path including the folder
    let fullPath: string;
    let bucketName =
      folder === "fieldworks" ? FIELDWORKS_BUCKET : STORAGE_BUCKET;

    // Special handling for fieldworks bucket
    if (folder === "fieldworks") {
      // For fieldworks, use the fieldworkpdf subfolder
      fullPath = `fieldworkpdf/${fileName}`;
      console.log(`Using fieldworkpdf subfolder for file: ${fileName}`);
    } else {
      // For rocks-minerals or other buckets, you may want to use subfolders
      fullPath = `${folder}/${fileName}`;
    }

    console.log(
      `Uploading file to storage bucket: ${bucketName}, path: ${fullPath}`
    );

    // Check if file already exists with this hash
    try {
      const { data: existingFile } = await supabase.storage
        .from(bucketName)
        .list(folder, {
          search: fileHash.substring(0, 10),
        });

      // If file with same hash exists, just return its URL
      if (existingFile && existingFile.length > 0) {
        const matchingFile = existingFile.find((f: { name: string }) =>
          f.name.includes(fileHash.substring(0, 10))
        );

        if (matchingFile) {
          console.log(
            "✅ File with same content already exists, reusing:",
            matchingFile.name
          );

          // Get public URL of existing file
          const { data: publicUrlData } = supabase.storage
            .from(bucketName)
            .getPublicUrl(`${folder}/${matchingFile.name}`);

          if (publicUrlData?.publicUrl) {
            console.log(
              "File uploaded successfully. Public URL:",
              publicUrlData.publicUrl
            );
            return publicUrlData.publicUrl;
          }
        }
      }
    } catch (listError) {
      console.error("Error checking for existing file:", listError);
      // Continue with upload even if list check fails
    }

    // Track upload progress with a simple XMLHttpRequest
    if (onProgress) {
      const xhr = new XMLHttpRequest();
      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round(
            (event.loaded / event.total) * 100
          );
          onProgress(percentComplete);
        }
      });

      // Create a promise that resolves when the upload is complete
      const uploadPromise = new Promise<void>((resolve, reject) => {
        xhr.onload = () => resolve();
        xhr.onerror = () => reject(new Error("XHR upload failed"));
      });

      // Get token for authenticated upload
      const token =
        localStorage.getItem("access_token") ||
        localStorage.getItem("token") ||
        localStorage.getItem("auth_token") ||
        sessionStorage.getItem("supabase.auth.token");

      // Start the upload with XHR to track progress
      xhr.open(
        "POST",
        `${
          import.meta.env.VITE_SUPABASE_URL
        }/storage/v1/object/${bucketName}/${fullPath}`
      );
      if (token) {
        xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      }
      xhr.setRequestHeader("Content-Type", file.type);
      xhr.send(file);

      // Wait for the upload to complete
      await uploadPromise;

      // Update progress to completion
      onProgress(100);
    } else {
      // If no progress tracking is needed, use the standard Supabase upload
      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(fullPath, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) {
        console.error("Error uploading file:", uploadError);
        throw uploadError;
      }
    }

    // Get the public URL for the uploaded file
    const { data: urlData } = await supabase.storage
      .from(bucketName)
      .getPublicUrl(fullPath);

    if (!urlData || !urlData.publicUrl) {
      throw new Error("Failed to get public URL for uploaded file");
    }

    console.log("File uploaded successfully. Public URL:", urlData.publicUrl);

    return urlData.publicUrl;
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
        localStorage.getItem("auth_token") ||
        sessionStorage.getItem("supabase.auth.token");
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
        // Try alternative direct upload approach
        try {
          console.log(`📚 Trying direct upload for file ${i + 1}`);
          const fileExt = file.name.split(".").pop() || "";
          const fileName = `${folder}-${Date.now()}-${i}.${fileExt}`;
          const filePath = `${folder}/${fileName}`;

          // Get token from localStorage for authenticated upload
          const token =
            localStorage.getItem("access_token") ||
            localStorage.getItem("token") ||
            localStorage.getItem("auth_token");

          const options = {
            cacheControl: "3600",
            upsert: true,
            ...(token ? { headers: { Authorization: `Bearer ${token}` } } : {}),
          };

          const { data, error } = await supabase.storage
            .from(STORAGE_BUCKET)
            .upload(filePath, file, options);

          if (error) {
            console.error(`📚 Alternative upload error: ${error.message}`);
            continue;
          }

          // Get the public URL
          const { data: urlData } = supabase.storage
            .from(STORAGE_BUCKET)
            .getPublicUrl(data.path);

          if (urlData?.publicUrl) {
            urls.push(urlData.publicUrl);
            console.log(`✅ Alternative upload successful:`, urlData.publicUrl);
            successCount++;
          }
        } catch (alternativeError) {
          console.error(`🔴 Alternative upload failed:`, alternativeError);
        }
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
    if (!fileUrl) {
      throw new Error("File URL is empty");
    }

    console.log(`Attempting to delete file: ${fileUrl}`);

    // Extract the bucket and path from the URL
    const url = new URL(fileUrl);

    // The path will look like: /storage/v1/object/public/[bucket]/[path]
    // or: /storage/v1/object/[bucket]/[path]
    const pathParts = url.pathname.split("/");

    // Find the bucket name in the path
    const bucketIndex = pathParts.findIndex(
      (part) => part === "rocks-minerals" || part === "fieldworks"
    );

    if (bucketIndex === -1) {
      throw new Error(`Cannot determine bucket from URL: ${fileUrl}`);
    }

    const bucket = pathParts[bucketIndex];
    // Get the path after the bucket name
    const filePath = pathParts.slice(bucketIndex + 1).join("/");

    console.log(`Deleting from bucket: ${bucket}, path: ${filePath}`);

    // Delete the file from storage
    const { error } = await supabase.storage.from(bucket).remove([filePath]);

    if (error) {
      console.error("Error deleting file:", error);
      throw error;
    }

    console.log("File deleted successfully");
  } catch (error) {
    console.error("Error in deleteFile:", error);
    throw error;
  }
};

/**
 * Deletes multiple files from Supabase storage
 * @param fileUrls Array of file URLs to delete
 */
export const deleteMultipleFiles = async (
  fileUrls: string[]
): Promise<void> => {
  try {
    console.log(`Attempting to delete ${fileUrls.length} files`);

    for (const url of fileUrls) {
      try {
        await deleteFile(url);
      } catch (error) {
        console.error(`Failed to delete file ${url}:`, error);
      }
    }

    console.log("Finished file deletion process");
  } catch (error) {
    console.error("Error in deleteMultipleFiles:", error);
    throw error;
  }
};
