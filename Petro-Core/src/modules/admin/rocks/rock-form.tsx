import { useState, useEffect } from "react";
import type { RefObject, Dispatch, SetStateAction } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { RockCategory, IRock } from "./rock.interface";
import { useAddRock } from "./hooks/useAddRock";
import { useUpdateRock } from "./hooks/useUpdateRock";
import { Spinner } from "@/components/spinner";
import { FileUpload, MultiFileUpload } from "@/components/ui/file-upload";
import { uploadFile } from "@/services/storage.service";
import { toast } from "sonner";
import { SupabaseImage } from "@/components/ui/supabase-image";
import { RockImagesGallery } from "@/components/ui/rock-images-gallery";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRockImages } from "./hooks/useRockImages";
import { Separator } from "@/components/ui/separator";

interface RockFormProps {
  category: RockCategory;
  onClose: () => void;
  inDialog?: boolean;
  inSheet?: boolean;
  hideButtons?: boolean;
  defaultValues?: Partial<IRock>;
  onSubmit?: (data: Partial<IRock>) => Promise<void>;
  isLoading?: boolean;
  mode?: "add" | "edit";
  formRef?: RefObject<HTMLFormElement>;
  onCancel?: () => void;
  onFormDataChange?: (data: Partial<IRock>) => void;
  onImageFileChange?: (file: File | null) => void;
}

// Schema for rock form validation
const formSchema = z.object({
  name: z.string().min(1, "Rock name is required"),
  category: z.string().min(1, "Category is required"),
  type: z.string().min(1, "Type is required"),
  status: z.enum(["active", "inactive"]).optional().default("active"),
  rock_code: z.string().optional(),
  chemical_formula: z.string().optional(),
  hardness: z.string().optional(),
  depositional_environment: z.string().optional(),
  grain_size: z.string().optional(),
  color: z.string().optional(),
  texture: z.string().optional(),
  locality: z.string().optional(),
  mineral_composition: z.string().optional(),
  description: z.string().optional(),
  formation: z.string().optional(),
  geological_age: z.string().optional(),
  coordinates: z.string().optional(),
  // Metamorphic rock specific fields
  metamorphism_type: z.string().optional(),
  metamorphic_grade: z.string().optional(),
  parent_rock: z.string().optional(),
  foliation: z.string().optional(),
  foliation_type: z.string().optional(),
  // Igneous rock specific fields
  silica_content: z.string().optional(),
  cooling_rate: z.string().optional(),
  mineral_content: z.string().optional(),
  origin: z.string().optional(),
  // Sedimentary rock specific fields
  bedding: z.string().optional(),
  sorting: z.string().optional(),
  roundness: z.string().optional(),
  fossil_content: z.string().optional(),
  sediment_source: z.string().optional(),
  // Ore samples specific fields
  commodity_type: z.string().optional(),
  ore_group: z.string().optional(),
  mining_company: z.string().optional(),
  // Additional fields
  protolith: z.string().optional(),
});

// Type definition for form values
export type FormValues = z.infer<typeof formSchema> & {
  // Add any additional fields that might be in the IRock interface but not in the schema
  image_url?: string;
};

const RockForm = ({
  category,
  onClose,
  inDialog = false,
  inSheet = false,
  hideButtons = false,
  defaultValues,
  onSubmit: externalSubmit,
  isLoading: externalLoading,
  mode = "add",
  formRef,
  onCancel,
  onFormDataChange,
  onImageFileChange,
}: RockFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | undefined>(
    defaultValues?.image_url
  );
  const [multipleImageFiles, setMultipleImageFiles] = useState<File[]>([]);
  const [isImageUploading, setIsImageUploading] = useState(false);
  const [imageUploadError, setImageUploadError] = useState(false);
  const { addRock, isAdding } = useAddRock();
  const { updateRock } = useUpdateRock();

  // Load existing rock images if in edit mode
  const isEditMode = mode === "edit" && defaultValues?.id;
  const {
    images: existingImages,
    uploadImages,
    isUploading,
    deleteImage,
    refetch: refetchImages,
  } = useRockImages(defaultValues?.id || "");

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValues
      ? {
          ...defaultValues,
        }
      : {
          name: "",
          rock_code: "",
          commodity_type: "",
          ore_group: "",
          mining_company: "",
          chemical_formula: "",
          hardness: "",
          category: category,
          type: "",
          depositional_environment: "",
          grain_size: "",
          color: "",
          texture: "",
          latitude: "",
          longitude: "",
          locality: "",
          mineral_composition: "",
          description: "",
          formation: "",
          geological_age: "",
          status: "active",
          image_url: "",
          metamorphism_type: "",
          metamorphic_grade: "",
          parent_rock: "",
          foliation: "",
          associated_minerals: "",
          coordinates: "",
          luster: "",
          streak: "",
          reaction_to_hcl: "",
          magnetism: "",
          origin: "",
          protolith: "",
          foliation_type: "",
        },
  });

  // Update form when defaultValues change
  useEffect(() => {
    if (defaultValues) {
      // Ensure status is set to a valid value
      const formattedValues = {
        ...defaultValues,
        status:
          defaultValues.status === "active" ||
          defaultValues.status === "inactive"
            ? defaultValues.status
            : ("active" as const),
      };

      form.reset(formattedValues as unknown as FormValues);
    }
  }, [defaultValues, form]);

  // Add useEffect to push form changes when they happen
  useEffect(() => {
    // Only set up the watcher if onFormDataChange is provided
    if (!onFormDataChange) return;

    // Watch all form fields
    const subscription = form.watch((value) => {
      // Notify parent about data changes when fields change
      onFormDataChange(value as Partial<IRock>);
    });

    // Cleanup subscription
    return () => subscription.unsubscribe();
  }, [form, onFormDataChange]);

  const handleFileChange = (file: File | null) => {
    if (file) {
      setIsImageUploading(true);
      setImageUploadError(false);
      uploadFile(file, "rocks")
        .then((url) => {
          setImageUrl(url);
          setIsImageUploading(false);
          form.setValue("image_url", url);

          // Update the parent form data if callback exists
          if (onFormDataChange) {
            const currentValues = form.getValues();
            onFormDataChange({
              ...currentValues,
              image_url: url,
            });
          }

          // Call the external callback if provided
          if (onImageFileChange) {
            onImageFileChange(file);
          }

          // If we're in edit mode and have a rock ID, save to rock_images table
          if (mode === "edit" && defaultValues?.id) {
            console.log(
              `📸 Adding image to rock_images table for rock ID: ${defaultValues.id}`
            );

            // First try the API service approach
            try {
              import("@/services/rock-images.service").then(
                async ({ uploadRockImages }) => {
                  try {
                    // Create a new file object from the URL so we can upload it
                    const res = await fetch(url);
                    const blob = await res.blob();
                    const imageFile = new File(
                      [blob],
                      `rock-${defaultValues.id}.png`,
                      { type: blob.type }
                    );
                    const result = await uploadRockImages(
                      defaultValues.id as string,
                      [imageFile]
                    );
                    console.log("✅ Image saved via API service:", result);
                  } catch (err) {
                    console.error("Error saving image via API service:", err);
                    // Try Supabase direct approach as fallback
                  }
                }
              );
            } catch (importErr) {
              console.error("Error importing rock-images service:", importErr);
            }

            // Also use Supabase client to directly insert into rock_images table
            import("@/lib/supabase")
              .then(async ({ supabase }) => {
                // Try to get auth session before proceeding
                const { data: sessionData } = await supabase.auth.getSession();

                // Manually set auth token if no active session
                if (!sessionData.session) {
                  console.log(
                    "No active session found, attempting to set token manually"
                  );
                  const token = localStorage.getItem("access_token");
                  if (token) {
                    try {
                      await supabase.auth.setSession({
                        access_token: token,
                        refresh_token: "",
                      });
                      console.log(
                        "✅ Manual session set with token from localStorage"
                      );
                    } catch (err) {
                      console.error("Failed to set session manually:", err);
                    }
                  }
                }

                supabase
                  .from("rock_images")
                  .insert([
                    {
                      rock_id: defaultValues.id,
                      image_url: url,
                      caption: `Rock image ${new Date().toISOString()}`,
                      display_order: 0,
                    },
                  ])
                  .then(({ error }) => {
                    if (error) {
                      console.error(
                        "Error saving image to rock_images table:",
                        error
                      );

                      // Direct API call as last resort
                      if (error.code === "42501") {
                        // Permission denied error
                        console.log(
                          "🛠️ Attempting direct API call as fallback"
                        );
                        const token = localStorage.getItem("access_token");
                        const apiUrl =
                          import.meta.env.VITE_local_url ||
                          "https://petro-core-usep.onrender.com/api";

                        fetch(`${apiUrl}/rock-images`, {
                          method: "POST",
                          headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token || ""}`,
                          },
                          body: JSON.stringify({
                            images: [
                              {
                                rock_id: defaultValues.id,
                                image_url: url,
                                caption: `Rock image (direct API fallback)`,
                                display_order: 0,
                              },
                            ],
                          }),
                        })
                          .then((response) => response.json())
                          .then((result) => {
                            if (result.success) {
                              console.log(
                                "✅ Image saved via direct API call:",
                                result
                              );
                            } else {
                              console.error(
                                "❌ Direct API call failed:",
                                result
                              );
                            }
                          })
                          .catch((apiErr) => {
                            console.error(
                              "❌ Error making direct API call:",
                              apiErr
                            );
                          });
                      }
                    } else {
                      console.log(
                        "✅ Image saved to rock_images table successfully"
                      );
                    }
                  });
              })
              .catch((error) => {
                console.error("Error importing Supabase client:", error);
              });
          }
        })
        .catch((error) => {
          console.error("Error uploading image:", error);
          toast.error("Failed to upload image");
          setIsImageUploading(false);
          setImageUploadError(true);
        });
    } else {
      // If file is cleared, reset the URL
      setImageUrl(undefined);
      form.setValue("image_url", "");

      // Update the parent form data if callback exists
      if (onFormDataChange) {
        const currentValues = form.getValues();
        onFormDataChange({
          ...currentValues,
          image_url: "",
        });
      }

      if (onImageFileChange) {
        onImageFileChange(null);
      }
    }
  };

  const handleMultipleFilesChange = (files: File[]) => {
    setMultipleImageFiles(files);
    console.log(`🖼️ ${files.length} files selected for upload`);
  };

  // Helper function to upload a single additional image
  const uploadAdditionalImage = async (
    file: File,
    rockId: string,
    index: number
  ): Promise<string | null> => {
    try {
      console.log(`📸 Uploading additional image ${index + 1}`);

      // Try to use the storage service first
      try {
        const imageUrl = await uploadFile(file, "rocks");
        console.log(
          `✅ Successfully uploaded image ${index + 1} via storage service`
        );
        return imageUrl;
      } catch (storageError) {
        console.error(
          `Storage service upload failed for image ${index + 1}:`,
          storageError
        );

        // Direct upload to Supabase as fallback
        const { supabase } = await import("@/lib/supabase");

        // Ensure authentication with multiple methods
        let isAuthenticated = false;

        // 1. Check for existing session
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData?.session) {
          console.log("✅ Using existing Supabase session");
          isAuthenticated = true;
        } else {
          console.log(
            "⚠️ No active session found, trying authentication methods..."
          );

          // 2. Try to set session with token from localStorage
          const token = localStorage.getItem("access_token");
          if (token) {
            try {
              const { data, error } = await supabase.auth.setSession({
                access_token: token,
                refresh_token: "",
              });

              if (data.session) {
                console.log("✅ Session set successfully with access_token");
                isAuthenticated = true;
              } else if (error) {
                console.error("❌ Error setting session:", error.message);
              }
            } catch (authError) {
              console.error("❌ Failed to set auth token:", authError);
            }
          } else {
            console.warn("⚠️ No access_token found in localStorage");
          }
        }

        if (!isAuthenticated) {
          console.warn(
            "⚠️ Failed to authenticate with Supabase, attempting anonymous upload"
          );
        }

        // Upload to Supabase storage with explicit storage bucket
        const fileExt = file.name.split(".").pop();
        const fileName = `rock-${rockId}-${Date.now()}-${index}.${fileExt}`;
        const filePath = `rocks/${fileName}`;

        console.log(
          `📤 Uploading to bucket: rocks-minerals, path: ${filePath}`
        );

        // Add custom headers if we have a token
        const token = localStorage.getItem("access_token");
        const options = {
          cacheControl: "3600",
          upsert: true,
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        };

        // Use let instead of const for data since we might reassign it
        let uploadData;
        let uploadError;

        // First upload attempt
        const uploadResult = await supabase.storage
          .from("rocks-minerals") // Explicitly use the correct bucket
          .upload(filePath, file, options);

        uploadData = uploadResult.data;
        uploadError = uploadResult.error;

        if (uploadError) {
          console.error(
            `❌ Supabase upload error for image ${index + 1}:`,
            uploadError
          );
          // Try one more time with a simplified path if it might be a path issue
          const simpleFileName = `rock-${Date.now()}-${index}.${fileExt}`;
          console.log(`📤 Retrying with simplified path: ${simpleFileName}`);

          const retryResult = await supabase.storage
            .from("rocks-minerals")
            .upload(simpleFileName, file, options);

          if (retryResult.error) {
            console.error(`❌ Retry upload also failed:`, retryResult.error);
            return null;
          }

          console.log(`✅ Retry upload succeeded:`, retryResult.data.path);
          uploadData = retryResult.data;
        } else {
          console.log(`✅ Upload succeeded:`, uploadData.path);
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from("rocks-minerals")
          .getPublicUrl(uploadData.path);

        console.log(`🔗 Public URL generated:`, urlData.publicUrl);
        return urlData.publicUrl;
      }
    } catch (error) {
      console.error(`Failed to upload image ${index + 1}:`, error);
      return null;
    }
  };

  // Helper function to save image URL to database
  const saveImageToDatabase = async (
    rockId: string,
    imageUrl: string,
    caption: string,
    order: number
  ): Promise<boolean> => {
    try {
      console.log(`💾 Saving image to database for rock ID: ${rockId}`);
      console.log(`💾 Image URL: ${imageUrl}`);

      // Try API service approach first
      try {
        console.log("💾 Attempting API service approach...");
        const { uploadRockImages } = await import(
          "@/services/rock-images.service"
        );
        const res = await fetch(imageUrl);
        const blob = await res.blob();
        const imageFile = new File(
          [blob],
          `rock-${rockId}-db-${Date.now()}.png`,
          { type: blob.type }
        );
        const result = await uploadRockImages(rockId, [imageFile]);
        if (result && result.length > 0) {
          console.log("✅ Image saved via API service");
          return true;
        } else {
          console.log(
            "⚠️ API service returned empty result, trying next method"
          );
        }
      } catch (apiError) {
        console.error("❌ API service approach failed:", apiError);
      }

      // Try Supabase client approach
      try {
        console.log("💾 Attempting Supabase client approach...");
        const { supabase } = await import("@/lib/supabase");

        // Ensure authentication with multiple methods
        let isAuthenticated = false;

        // 1. Check for existing session
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData?.session) {
          console.log("✅ Using existing Supabase session for database insert");
          isAuthenticated = true;
        } else {
          console.log(
            "⚠️ No active session found, trying authentication methods..."
          );

          // 2. Try to set session with token from localStorage
          const token = localStorage.getItem("access_token");
          if (token) {
            try {
              const { data, error } = await supabase.auth.setSession({
                access_token: token,
                refresh_token: "",
              });

              if (data.session) {
                console.log(
                  "✅ Session set successfully with access_token for database insert"
                );
                isAuthenticated = true;
              } else if (error) {
                console.error(
                  "❌ Error setting session for database insert:",
                  error.message
                );
              }
            } catch (authError) {
              console.error(
                "❌ Failed to set auth token for database insert:",
                authError
              );
            }
          } else {
            console.warn(
              "⚠️ No access_token found in localStorage for database insert"
            );
          }
        }

        if (!isAuthenticated) {
          console.warn(
            "⚠️ Failed to authenticate with Supabase, attempting insert anyway"
          );
        }

        // Try inserting the record
        console.log("💾 Inserting record into rock_images table...");
        const { error } = await supabase.from("rock_images").insert([
          {
            rock_id: rockId,
            image_url: imageUrl,
            caption,
            display_order: order,
          },
        ]);

        if (error) {
          console.error("❌ Error saving to rock_images table:", error);
          throw error;
        }

        console.log("✅ Image saved to database via Supabase client");
        return true;
      } catch (supabaseError) {
        console.error("❌ Supabase client approach failed:", supabaseError);
      }

      // Direct API call as last resort
      console.log("💾 Attempting direct API call as last resort...");
      const token = localStorage.getItem("access_token");
      const apiUrl =
        import.meta.env.VITE_local_url ||
        "https://petro-core-usep.onrender.com/api";

      const response = await fetch(`${apiUrl}/rock-images`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token || ""}`,
        },
        body: JSON.stringify({
          images: [
            {
              rock_id: rockId,
              image_url: imageUrl,
              caption,
              display_order: order,
            },
          ],
        }),
      });

      const result = await response.json();
      if (response.ok) {
        console.log("✅ Image saved via direct API call");
        return true;
      } else {
        console.error("❌ Direct API call failed:", result);
        return false;
      }
    } catch (error) {
      console.error("❌ All methods to save image to database failed:", error);
      return false;
    }
  };

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      console.log("🧩 Starting form submission process");
      // Prepare rock data with proper types
      const rockData = {
        ...values,
        status: values.status || "active",
      };

      // Add image URL if available - first try from the form values, then from local state
      if (values.image_url) {
        console.log("📸 Image URL from form:", values.image_url);
        rockData.image_url = values.image_url;
      } else if (imageUrl) {
        console.log("📸 Image URL from state:", imageUrl);
        rockData.image_url = imageUrl;
      }

      console.log("📸 Final main image URL:", rockData.image_url);

      let submissionResult;
      let rockId = defaultValues?.id;
      console.log(`🪨 Current rock ID: ${rockId || "New rock (no ID yet)"}`);

      // Submit the rock data
      if (externalSubmit) {
        console.log("Using external submit handler");
        submissionResult = await externalSubmit(rockData);
        // Try to extract ID from result if available
        if (
          submissionResult &&
          typeof submissionResult === "object" &&
          "id" in submissionResult
        ) {
          rockId =
            submissionResult.id ||
            (submissionResult.data && "id" in submissionResult.data
              ? submissionResult.data.id
              : rockId);
        }
      } else if (mode === "edit" && defaultValues?.id) {
        console.log("Using internal updateRock handler (edit mode)");
        const result = await updateRock({ id: defaultValues.id, rockData });
        rockId = defaultValues.id;
      } else {
        console.log("Using internal addRock handler (add mode)");
        const result = await addRock(rockData as IRock);
        rockId = result?.id;
      }

      // Process upload of multiple images if any
      if (rockId) {
        console.log(`Rock saved with ID ${rockId}. Processing images...`);

        // Also add the main image to rock_images table if present
        const mainImageUrl = rockData.image_url;
        if (rockId && mainImageUrl) {
          console.log(
            `📸 Adding main image to rock_images table for rock ID: ${rockId}`
          );
          await saveImageToDatabase(rockId, mainImageUrl, "Main rock image", 0);
        }

        // Process additional images if any
        if (multipleImageFiles.length > 0) {
          try {
            console.log(
              `📸 Uploading ${multipleImageFiles.length} additional images`
            );
            toast.loading(
              `Uploading ${multipleImageFiles.length} additional images...`
            );

            // Upload each image and save to database
            const results = await Promise.all(
              multipleImageFiles.map(async (file, index) => {
                // Upload the file
                const imageUrl = await uploadAdditionalImage(
                  file,
                  rockId as string,
                  index
                );

                // If upload succeeded, save to database
                if (imageUrl) {
                  const saved = await saveImageToDatabase(
                    rockId as string,
                    imageUrl,
                    `Additional image ${index + 1}`,
                    index + 1
                  );
                  return { success: saved, url: imageUrl };
                }

                return { success: false, url: null };
              })
            );

            // Count successes
            const successCount = results.filter(
              (result) => result.success
            ).length;

            if (successCount > 0) {
              console.log(
                `✅ Successfully saved ${successCount} of ${multipleImageFiles.length} additional images`
              );
              toast.success(`Added ${successCount} additional images`);

              // Refresh images if in edit mode
              if (isEditMode) {
                refetchImages();
              }
            } else {
              console.error("❌ Failed to save any additional images");
              toast.error("Failed to upload additional images");
            }
          } catch (error) {
            console.error("Error processing additional images:", error);
            toast.error("Failed to upload additional images");
          }
        }
      } else {
        console.error(
          "❌ Failed to get rock ID after saving. Cannot upload images."
        );
      }

      form.reset();
      setImageFile(null);
      setImageUrl(undefined);
      setMultipleImageFiles([]);

      // Close the form after successful submission if onClose is provided
      if (onClose) onClose();
    } catch (error: any) {
      console.error(
        `Error ${mode === "add" ? "adding" : "updating"} rock:`,
        error
      );
      toast.error(
        `Failed to ${mode === "add" ? "add" : "update"} rock. Please try again.`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Determine if loading state should come from external props or internal state
  const isLoading =
    externalLoading !== undefined
      ? externalLoading
      : mode === "add"
      ? isAdding
      : isSubmitting;

  // Determine the action text based on the mode
  const actionText = mode === "add" ? "Save" : "Update";

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else if (onClose) {
      onClose();
    }
  };

  const formContent = (
    <Form {...form}>
      <form
        id="rock-form"
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6"
        ref={formRef}
        onChange={() => {
          const values = form.getValues();
          if (onFormDataChange) {
            onFormDataChange(values);
          }
        }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Rock Name */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name *</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Granite" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Rock Code - For all categories */}
          <FormField
            control={form.control}
            name="rock_code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Rock Code</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., I-0001" {...field} />
                </FormControl>
                <FormDescription>
                  {form.watch("category") === "Ore Samples"
                    ? "Format: O-XXXX for Ore Samples"
                    : `Format: ${form
                        .watch("category")
                        .charAt(0)}-XXXX for ${form.watch("category")} rocks`}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Image Upload */}
          <div className="col-span-2">
            <Tabs defaultValue="single" className="w-full">
              <TabsList className="mb-2">
                <TabsTrigger value="single">Primary Image</TabsTrigger>
                <TabsTrigger value="multiple" disabled={!isEditMode}>
                  Additional Images {isEditMode && `(${existingImages.length})`}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="single">
                <Label htmlFor="image">Main Rock Image</Label>
                <div className="mt-2">
                  <FileUpload
                    onFileChange={handleFileChange}
                    defaultValue={form.watch("image_url")}
                    maxSizeMB={50}
                    isLoading={isImageUploading}
                    hasError={imageUploadError}
                  />
                  {isImageUploading && (
                    <div className="mt-2">
                      <Spinner size="sm" />{" "}
                      <span className="text-sm text-muted-foreground ml-2">
                        Uploading image...
                      </span>
                    </div>
                  )}
                  {imageUploadError && (
                    <p className="text-sm text-destructive mt-2">
                      Failed to upload image. Please try again.
                    </p>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="multiple">
                {isEditMode ? (
                  <div className="space-y-4">
                    <Label>Additional Rock Images</Label>

                    {existingImages && existingImages.length > 0 && (
                      <div className="mb-4">
                        <RockImagesGallery
                          images={existingImages.map((img) => img.image_url)}
                          height={300}
                          aspectRatio="video"
                        />
                      </div>
                    )}

                    <Separator className="my-4" />

                    <div>
                      <Label htmlFor="additional-images">
                        Upload More Images
                      </Label>
                      <div className="mt-2">
                        <MultiFileUpload
                          onFilesChange={handleMultipleFilesChange}
                          accept="image/*"
                          multiple={true}
                        />
                        {multipleImageFiles.length > 0 && (
                          <p className="text-sm text-muted-foreground mt-2">
                            {multipleImageFiles.length} file(s) selected. Images
                            will be uploaded when you save changes.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-center">
                    <p className="text-muted-foreground">
                      You can add additional images after saving the rock.
                    </p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Rest of the form fields - continue with existing fields */}

          {/* Rest of your form fields go here */}

          {/* Type */}
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => {
              // Check if current category is Metamorphic
              const isMetamorphic = form.watch("category") === "Metamorphic";

              // If metamorphic, automatically set type to "Metamorphic"
              if (isMetamorphic && field.value !== "Metamorphic") {
                field.onChange("Metamorphic");
              }

              return (
                <FormItem>
                  <FormLabel>Type *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Igneous, Metamorphic"
                      {...field}
                      disabled={isMetamorphic}
                      className={isMetamorphic ? "bg-muted" : ""}
                    />
                  </FormControl>
                  {isMetamorphic && (
                    <FormDescription>
                      Type is automatically set to Metamorphic
                    </FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              );
            }}
          />

          {/* Category */}
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category *</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={(value) => {
                    field.onChange(value);
                    // If changing to metamorphic, auto-set the type
                    if (value === "Metamorphic") {
                      form.setValue("type", "Metamorphic");
                    }
                  }}
                  defaultValue={category}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Igneous">Igneous</SelectItem>
                    <SelectItem value="Sedimentary">Sedimentary</SelectItem>
                    <SelectItem value="Metamorphic">Metamorphic</SelectItem>
                    <SelectItem value="Ore Samples">Ore Samples</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Description */}
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem className="col-span-2">
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Enter a description of the rock..."
                    className="min-h-[100px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Color */}
          <FormField
            control={form.control}
            name="color"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Color</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Gray, White" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Texture */}
          <FormField
            control={form.control}
            name="texture"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Texture</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Porphyritic" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Grain Size */}
          <FormField
            control={form.control}
            name="grain_size"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Grain Size</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g., Fine-grained, Crystalline"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Hardness */}
          <FormField
            control={form.control}
            name="hardness"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Hardness</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., 6-7" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Chemical Formula */}
          <FormField
            control={form.control}
            name="chemical_formula"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Chemical Formula</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., SiO2" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Mineral Composition */}
          <FormField
            control={form.control}
            name="mineral_composition"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mineral Composition</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g., Quartz, Feldspar, Mica"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Locality */}
          <FormField
            control={form.control}
            name="locality"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Locality</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Mount Apo, Davao" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Coordinates */}
          <FormField
            control={form.control}
            name="coordinates"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Coordinates</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g., 7.0051° N, 125.2854° E"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Formation */}
          <FormField
            control={form.control}
            name="formation"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Formation</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Apo Formation" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Geological Age */}
          <FormField
            control={form.control}
            name="geological_age"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Geological Age</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Cretaceous" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Ore Samples specific fields */}
          {form.watch("category") === "Ore Samples" && (
            <>
              <FormField
                control={form.control}
                name="commodity_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Commodity Type</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Gold, Copper" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ore_group"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ore Group/Type of Deposit</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Porphyry Copper" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="mining_company"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mining Company</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., ABC Mining Corp" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </>
          )}

          {/* Metamorphic rock specific fields */}
          {form.watch("category") === "Metamorphic" && (
            <>
              <FormField
                control={form.control}
                name="metamorphism_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Metamorphism Type</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Regional, Contact" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="metamorphic_grade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Metamorphic Grade</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Low, Medium, High" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="parent_rock"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Parent Rock</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Granite, Basalt" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="foliation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Foliation</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Present, Absent" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </>
          )}
        </div>

        <FormDescription>Fields marked with * are required.</FormDescription>

        {!hideButtons && (
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={handleCancel} type="button">
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Spinner className="mr-2 h-4 w-4" />}
              {actionText}
            </Button>
          </div>
        )}
      </form>
    </Form>
  );

  if (inSheet) {
    return <div className="p-5">{formContent}</div>;
  }

  return inDialog ? (
    formContent
  ) : (
    <div className="w-full mb-6 border rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-4">
        {mode === "add" ? "Add New" : "Edit"} Rock to {category}
      </h3>
      {formContent}
    </div>
  );
};

export default RockForm;
