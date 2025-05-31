import { useState, useEffect, RefObject } from 'react';
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
import { Spinner } from '@/components/spinner';
import { FileUpload } from '@/components/ui/file-upload';
import { uploadFile } from '@/services/storage.service';
import { toast } from 'sonner';
import { SupabaseImage } from '@/components/ui/supabase-image';

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
}

// Schema for rock form validation
const formSchema = z.object({
  name: z.string().min(1, 'Rock name is required'),
  rock_code: z.string().optional(),
  commodity_type: z.string().optional(),
  ore_group: z.string().optional(),
  mining_company: z.string().optional(),
  chemical_formula: z.string().optional(),
  hardness: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
  type: z.string().min(1, 'Type is required'),
  depositional_environment: z.string().optional(),
  grain_size: z.string().optional(),
  color: z.string().optional(),
  texture: z.string().optional(),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
  locality: z.string().optional(),
  mineral_composition: z.string().optional(),
  description: z.string().optional(),
  formation: z.string().optional(),
  geological_age: z.string().optional(),
  status: z.enum(['active', 'inactive']).default('active'),
  image_url: z.string().optional(),
  // Metamorphic rock specific fields
  metamorphism_type: z.string().optional(),
  metamorphic_grade: z.string().optional(),
  parent_rock: z.string().optional(),
  foliation: z.string().optional(),
  associated_minerals: z.string().optional(),
  coordinates: z.string().optional(),
  luster: z.string().optional(),
  streak: z.string().optional(),
  reaction_to_hcl: z.string().optional(),
  magnetism: z.string().optional(),
  origin: z.string().optional(),
  protolith: z.string().optional(),
  foliation_type: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

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
  onCancel
}: RockFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const { addRock, isAdding } = useAddRock();
  
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
      form.reset(defaultValues);
    }
  }, [defaultValues, form]);
  
  const handleFileChange = (file: File | null) => {
    setImageFile(file);
  };
  
  const onSubmit = async (values: FormValues) => {
    console.log("RockForm onSubmit called with values:", values);
    setIsSubmitting(true);
    try {
      let imageUrl = values.image_url;
      
      // Upload image if we have a new file
      if (imageFile) {
        try {
          console.log("Uploading image file:", imageFile.name);
          // Upload to Supabase storage
          imageUrl = await uploadFile(imageFile, 'rocks');
          console.log('Uploaded image URL:', imageUrl);
        } catch (error) {
          console.error('Error uploading image:', error);
          toast.error('Failed to upload image. Please try again.');
        }
      }
      
      const rockData = {
        ...values,
        image_url: imageUrl,
      };
      
      console.log("Prepared rock data for submission:", rockData);
      
      if (externalSubmit) {
        console.log("Using external submit handler (edit mode)");
        // For edit mode
        await externalSubmit(rockData);
      } else {
        console.log("Using internal addRock handler (add mode)");
        // For add mode
        await addRock(rockData);
        form.reset();
        setImageFile(null);
      }
      
      console.log("Form submission completed successfully");
      if (onClose) onClose();
    } catch (error) {
      console.error('Error submitting rock data:', error);
      toast.error('Failed to save rock. Please try again.');
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
            <Label htmlFor="image">Rock Image</Label>
            <div className="mt-2">
              <FileUpload 
                onFileChange={handleFileChange} 
                defaultValue={form.watch('image_url')}
                maxSizeMB={2}
              />
            </div>
            {!imageFile && form.watch('image_url') && (
              <div className="mt-2">
                <p className="text-xs text-muted-foreground mb-1">Current image from Supabase:</p>
                <SupabaseImage 
                  src={form.watch('image_url')} 
                  alt={form.watch('name') || 'Rock image'} 
                  height={150}
                  width="100%"
                  objectFit="cover"
                  className="rounded-md"
                />
              </div>
            )}
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