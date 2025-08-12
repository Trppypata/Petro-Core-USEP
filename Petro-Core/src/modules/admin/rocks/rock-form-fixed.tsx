import { useState, useEffect } from "react";
import type { RefObject } from "react";
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
import { RockImagesGallery } from "@/components/ui/rock-images-gallery";
import { RockImagesManager } from "@/components/ui/rock-images-manager";
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
  onSubmit?: (data: Partial<IRock>) => Promise<any>;
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
  image_url: z.string().optional(),
});

// Type definition for form values
export type FormValues = z.infer<typeof formSchema>;

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
  const [imageUrl, setImageUrl] = useState<string | undefined>(
    defaultValues?.image_url
  );
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

      form.reset(formattedValues as FormValues);
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

          console.log("✅ Main image URL saved to rocks table:", url);
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
          rockId = (submissionResult as any).id || rockId;
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

      // Note: Additional images are now handled by the RockImagesManager component
      // which uploads them directly when the user clicks the upload button

      form.reset();
      setImageUrl(undefined);

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
                  <RockImagesManager
                    rockId={defaultValues?.id || ""}
                    existingImages={existingImages}
                    onImagesChange={(newImages) => {
                      // This will be handled by the hook's refetch
                      refetchImages();
                    }}
                    onDeleteImage={deleteImage}
                    onUploadImages={uploadImages}
                    maxImages={10}
                  />
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
