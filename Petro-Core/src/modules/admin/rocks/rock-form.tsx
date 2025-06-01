import { useState, useEffect } from 'react';
import type { RefObject, Dispatch, SetStateAction } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { RockCategory, IRock } from './rock.interface';
import { useAddRock } from './hooks/useAddRock';
import { useUpdateRock } from './hooks/useUpdateRock';
import { Spinner } from '@/components/spinner';
import { FileUpload, MultiFileUpload } from '@/components/ui/file-upload';
import { uploadFile } from '@/services/storage.service';
import { toast } from 'sonner';
import { SupabaseImage } from '@/components/ui/supabase-image';
import { RockImagesGallery } from '@/components/ui/rock-images-gallery';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useRockImages } from './hooks/useRockImages';
import { Separator } from '@/components/ui/separator';
import { RockImageUploader } from '@/components/ui/rock-image-uploader';

interface RockFormProps {
  category: RockCategory;
  onClose: () => void;
  inDialog?: boolean;
  inSheet?: boolean;
  hideButtons?: boolean;
  defaultValues?: Partial<IRock>;
  onSubmit?: (data: Partial<IRock>) => Promise<void>;
  isLoading?: boolean;
  mode?: 'add' | 'edit';
  formRef?: RefObject<HTMLFormElement>;
  onCancel?: () => void;
  onFormDataChange?: (data: Partial<IRock>) => void;
  onImageFileChange?: (file: File | null) => void;
}

// Schema for rock form validation
const formSchema = z.object({
  name: z.string().min(1, 'Rock name is required'),
  category: z.string().min(1, 'Category is required'),
  type: z.string().min(1, 'Type is required'),
  status: z.enum(['active', 'inactive']).optional().default('active'),
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
  mode = 'add',
  formRef,
  onCancel,
  onFormDataChange,
  onImageFileChange
}: RockFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | undefined>(defaultValues?.image_url);
  const [multipleImageFiles, setMultipleImageFiles] = useState<File[]>([]);
  const { addRock, isAdding } = useAddRock();
  const { updateRock } = useUpdateRock();
  
  // Load existing rock images if in edit mode
  const isEditMode = mode === 'edit' && defaultValues?.id;
  const { 
    images: existingImages, 
    uploadImages, 
    isUploading,
    deleteImage 
  } = useRockImages(defaultValues?.id || '');
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValues ? {
      ...defaultValues
    } : {
      name: '',
      rock_code: '',
      commodity_type: '',
      ore_group: '',
      mining_company: '',
      chemical_formula: '',
      hardness: '',
      category: category,
      type: '',
      depositional_environment: '',
      grain_size: '',
      color: '',
      texture: '',
      latitude: '',
      longitude: '',
      locality: '',
      mineral_composition: '',
      description: '',
      formation: '',
      geological_age: '',
      status: 'active',
      image_url: '',
      metamorphism_type: '',
      metamorphic_grade: '',
      parent_rock: '',
      foliation: '',
      associated_minerals: '',
      coordinates: '',
      luster: '',
      streak: '',
      reaction_to_hcl: '',
      magnetism: '',
      origin: '',
      protolith: '',
      foliation_type: '',
    },
  });
  
  // Update form when defaultValues change
  useEffect(() => {
    if (defaultValues) {
      // Ensure status is set to a valid value
      const formattedValues = {
        ...defaultValues,
        status: (defaultValues.status === 'active' || defaultValues.status === 'inactive') 
          ? defaultValues.status 
          : 'active' as const
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
    setImageFile(file);
    if (onImageFileChange) {
      onImageFileChange(file);
    }

    // If file is provided, upload it and set the URL
    if (file) {
      uploadFile(file, 'rocks')
        .then(url => {
          setImageUrl(url);
          console.log('Image uploaded, URL:', url);
        })
        .catch(error => {
          console.error('Error uploading image:', error);
          toast.error('Failed to upload image');
        });
    } else {
      // If file is cleared, reset the URL
      setImageUrl(undefined);
    }
  };
  
  const handleMultipleFilesChange = (files: File[]) => {
    setMultipleImageFiles(files);
    console.log(`🖼️ ${files.length} files selected for upload`);
  };
  
  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      console.log('🧩 Starting form submission process');
      // Prepare rock data with proper types
      const rockData = {
        ...values,
        status: values.status || 'active',
      };

      // Add image URL if available
      if (imageUrl) {
        // Cast to allow adding the image_url property
        (rockData as any).image_url = imageUrl;
        console.log('📸 Main image URL set:', imageUrl);
      }

      let submissionResult;
      let rockId = defaultValues?.id;
      console.log(`🪨 Current rock ID: ${rockId || 'New rock (no ID yet)'}`);
      
      if (externalSubmit) {
        console.log("Using external submit handler");
        submissionResult = await externalSubmit(rockData);
        // Try to extract ID from result if available
        if (submissionResult && typeof submissionResult === 'object') {
          rockId = submissionResult.id || (submissionResult.data && submissionResult.data.id) || rockId;
        }
      } else if (mode === 'edit' && defaultValues?.id) {
        console.log("Using internal updateRock handler (edit mode)");
        // For edit mode with correct parameters
        submissionResult = await updateRock({
          id: defaultValues.id,
          rockData: rockData
        });
        rockId = defaultValues.id;
      } else {
        console.log("Using internal addRock handler (add mode)");
        // For add mode - ensure required fields for IRock
        const addRockData = {
          ...rockData,
          rock_code: rockData.rock_code || `R-${Date.now()}`, // Generate a code if not provided
        } as IRock;
        
        submissionResult = await addRock(addRockData);
        // Try to extract ID from the response
        if (submissionResult && typeof submissionResult === 'object') {
          rockId = submissionResult.id || (submissionResult.data && submissionResult.data.id);
          console.log('🆕 New rock created with ID:', rockId);
        }
      }
      
      console.log(`✅ Rock saved successfully. Now handling multiple images. Have ${multipleImageFiles.length} files to upload.`);
      console.log(`✅ Rock ID for image upload: ${rockId || 'Missing ID!'}`);
      
      // Upload multiple images if we have a rock ID and files to upload
      if (rockId && multipleImageFiles.length > 0) {
        try {
          console.log(`🖼️ STARTING UPLOAD OF ${multipleImageFiles.length} IMAGES FOR ROCK ${rockId}`);
          console.log('🖼️ Image files:', multipleImageFiles.map(f => `${f.name} (${f.size} bytes)`).join(', '));
          toast.loading(`Uploading ${multipleImageFiles.length} images...`);
          
          // Debug helper: check if uploadImages function exists
          console.log('🔍 uploadImages function exists:', !!uploadImages);
          console.log('🔍 uploadImages is type:', typeof uploadImages);
          
          const result = await uploadImages(multipleImageFiles);
          console.log('🖼️ Upload result:', result);
          
          if (result && result.length > 0) {
            console.log(`✅ Successfully uploaded ${result.length} images`);
            toast.success(`Successfully uploaded ${result.length} additional images`);
          } else {
            console.error('❌ No images were uploaded successfully');
            toast.error('Failed to upload images. Please try again.');
          }
        } catch (imageError) {
          console.error('❌ Error uploading additional images:', imageError);
          if (imageError instanceof Error) {
            console.error('❌ Error message:', imageError.message);
            console.error('❌ Error stack:', imageError.stack);
          }
          toast.error('Failed to upload images. Please check console for details.');
        }
      } else if (multipleImageFiles.length > 0) {
        console.error('⚠️ Cannot upload images: Missing rock ID or no files selected');
        if (!rockId) {
          toast.error('Could not upload additional images - rock ID not available');
        }
      }
      
      form.reset();
      setImageFile(null);
      setImageUrl(undefined);
      setMultipleImageFiles([]);
      
      // Close the form after successful submission if onClose is provided
      if (onClose) onClose();
    } catch (error) {
      console.error(`Error ${mode === 'add' ? 'adding' : 'updating'} rock:`, error);
      toast.error(`Failed to ${mode === 'add' ? 'add' : 'update'} rock. Please try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Determine if loading state should come from external props or internal state
  const isLoading = externalLoading !== undefined ? externalLoading : (mode === 'add' ? isAdding : isSubmitting);
  
  // Determine the action text based on the mode
  const actionText = mode === 'add' ? 'Save' : 'Update';

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
                  {form.watch('category') === 'Ore Samples' 
                    ? 'Format: O-XXXX for Ore Samples' 
                    : `Format: ${form.watch('category').charAt(0)}-XXXX for ${form.watch('category')} rocks`}
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
                    defaultValue={form.watch('image_url')}
                    maxSizeMB={50}
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="multiple">
                {isEditMode ? (
                  <div className="space-y-4">
                    <Label>Additional Rock Images</Label>
                    
                    {existingImages && existingImages.length > 0 && (
                      <div className="mb-4">
                        <RockImagesGallery 
                          images={existingImages.map((img: any) => img.image_url)} 
                          height={300}
                          aspectRatio="video"
                        />
                      </div>
                    )}
                    
                    <Separator className="my-4" />
                    
                    <div>
                      <RockImageUploader 
                        rockId={defaultValues?.id || ''} 
                        onSuccess={() => {
                          toast.success("Images uploaded successfully!");
                          // No need to manually refetch - the RockImageUploader component will handle invalidation
                        }}
                      />
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
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type *</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Igneous, Metamorphic" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
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
                  onValueChange={field.onChange}
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
                  <Input placeholder="e.g., Fine-grained, Crystalline" {...field} />
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
                  <Input placeholder="e.g., Quartz, Feldspar, Mica" {...field} />
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
                  <Input placeholder="e.g., 7.0051° N, 125.2854° E" {...field} />
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
          {form.watch('category') === 'Ore Samples' && (
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
          {form.watch('category') === 'Metamorphic' && (
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
        
        <FormDescription>
          Fields marked with * are required.
        </FormDescription>
        
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
    return (
      <div className="p-5">
        {formContent}
      </div>
    );
  }
  
  return inDialog ? formContent : (
    <div className="w-full mb-6 border rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-4">
        {mode === 'add' ? 'Add New' : 'Edit'} Rock to {category}
      </h3>
      {formContent}
    </div>
  );
};

export default RockForm; 

// Fix the existingImages.map error by adding a type guard
const renderImageGallery = () => {
  if (existingImages && existingImages.length > 0) {
    return (
      <div className="mb-4">
        <RockImagesGallery 
          images={existingImages.map((img: any) => img.image_url)} 
          height={300}
          aspectRatio="video"
        />
      </div>
    );
  }
  return null;
}; 