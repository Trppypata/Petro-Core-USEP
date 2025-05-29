import { useState } from 'react';
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
import type { RockCategory } from './rock.interface';
import { useAddRock } from './hooks/useAddRock';
import { Spinner } from '@/components/spinner';
import { Upload, X } from 'lucide-react';

interface RockFormProps {
  category: RockCategory;
  onClose: () => void;
  inDialog?: boolean;
  inSheet?: boolean;
  hideButtons?: boolean;
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
  hideButtons = false 
}: RockFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const { addRock, isAdding } = useAddRock();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
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
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        form.setValue('image_url', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const removeImage = () => {
    setImagePreview(null);
    setImageFile(null);
    form.setValue('image_url', '');
  };
  
  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      // In a production environment, you would upload the image to a server
      // and get back a URL to store. For now, we'll use the data URL
      await addRock({
        ...values,
        image_url: imagePreview || '',
      });
      form.reset();
      setImagePreview(null);
      setImageFile(null);
      onClose();
    } catch (error) {
      console.error('Error adding rock:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formContent = (
    <Form {...form}>
      <form id="rock-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Basic Information</h3>
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
            
            {/* Category */}
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category *</FormLabel>
                  <Select 
                    onValueChange={(value) => {
                      field.onChange(value);
                      // Reset type field if category changes
                      if (value === 'Ore Samples') {
                        form.setValue('type', '');
                      }
                    }} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
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
            
            {/* Type */}
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type *</FormLabel>
                  {form.watch('category') === 'Ore Samples' ? (
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select ore type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Hydrothermal Ore">Hydrothermal Ore</SelectItem>
                        <SelectItem value="Porphyry Ore">Porphyry Ore</SelectItem>
                        <SelectItem value="Epithermal Ore">Epithermal Ore</SelectItem>
                        <SelectItem value="Lateritic Ore">Lateritic Ore</SelectItem>
                        <SelectItem value="Skarn Ore">Skarn Ore</SelectItem>
                        <SelectItem value="Massive Sulfide Ore">Massive Sulfide Ore</SelectItem>
                        <SelectItem value="Sedimentary Ore">Sedimentary Ore</SelectItem>
                        <SelectItem value="Podiform Chromite">Podiform Chromite</SelectItem>
                        <SelectItem value="Mississippi Valley-Type Ore">Mississippi Valley-Type Ore</SelectItem>
                        <SelectItem value="Hematite-Goethite Ore">Hematite-Goethite Ore</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : form.watch('category') === 'Metamorphic' ? (
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select metamorphic type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Foliated">Foliated</SelectItem>
                        <SelectItem value="Non-foliated">Non-foliated</SelectItem>
                        <SelectItem value="Contact">Contact</SelectItem>
                        <SelectItem value="Regional">Regional</SelectItem>
                        <SelectItem value="Dynamic">Dynamic</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <FormControl>
                      <Input placeholder="e.g., Detrital, Chemical" {...field} />
                    </FormControl>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Commodity Type - Only for Ore Samples */}
            {form.watch('category') === 'Ore Samples' && (
              <FormField
                control={form.control}
                name="commodity_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Commodity Type</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select commodity type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Gold">Gold</SelectItem>
                        <SelectItem value="Copper">Copper</SelectItem>
                        <SelectItem value="Gold-Copper">Gold-Copper</SelectItem>
                        <SelectItem value="Copper-Gold">Copper-Gold</SelectItem>
                        <SelectItem value="Gold-Silver">Gold-Silver</SelectItem>
                        <SelectItem value="Silver-Gold">Silver-Gold</SelectItem>
                        <SelectItem value="Nickel">Nickel</SelectItem>
                        <SelectItem value="Iron">Iron</SelectItem>
                        <SelectItem value="Chromium">Chromium</SelectItem>
                        <SelectItem value="Lead-Zinc">Lead-Zinc</SelectItem>
                        <SelectItem value="Manganese">Manganese</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            {/* Ore Group - Only for Ore Samples */}
            {form.watch('category') === 'Ore Samples' && (
              <FormField
                control={form.control}
                name="ore_group"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ore Group</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select ore group" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Hydrothermal (ISE)">Hydrothermal (ISE)</SelectItem>
                        <SelectItem value="Hydrothermal (LSE)">Hydrothermal (LSE)</SelectItem>
                        <SelectItem value="Hydrothermal">Hydrothermal</SelectItem>
                        <SelectItem value="Residual">Residual</SelectItem>
                        <SelectItem value="Sedimentary">Sedimentary</SelectItem>
                        <SelectItem value="Magmatic Hydrothermal">Magmatic Hydrothermal</SelectItem>
                        <SelectItem value="Metamorphic (Skarn)">Metamorphic (Skarn)</SelectItem>
                        <SelectItem value="Supergene">Supergene</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            {/* Mining Company - Only for Ore Samples */}
            {form.watch('category') === 'Ore Samples' && (
              <FormField
                control={form.control}
                name="mining_company"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mining Company/Donated by</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Apex Mining Company, Inc." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            {/* Status */}
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
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
                    <Input placeholder="e.g., Complex mixture" {...field} />
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

            {/* Ore-specific fields */}
            {form.watch('category') === 'Ore Samples' && (
              <>
                <FormField
                  control={form.control}
                  name="mineral_composition"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Metal Content</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., 2-5% Copper, 1% Zinc" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="depositional_environment"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Deposit Type</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Hydrothermal vein, Porphyry deposit" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
            
            {/* Depositional Environment - show only for sedimentary or when not ore samples */}
            {(form.watch('category') !== 'Ore Samples' || form.watch('category') === 'Sedimentary') && (
              <FormField
                control={form.control}
                name="depositional_environment"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Depositional Environment</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Shallow Marine, Terrestrial" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* NEW FIELDS */}
            {/* Luster */}
            <FormField
              control={form.control}
              name="luster"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Luster</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Vitreous, Metallic" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Streak */}
            <FormField
              control={form.control}
              name="streak"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Streak</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., White, Gray" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Reaction to HCl */}
            <FormField
              control={form.control}
              name="reaction_to_hcl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reaction to HCl</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Effervescent, None" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Magnetism */}
            <FormField
              control={form.control}
              name="magnetism"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Magnetism</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Strong, Weak, None" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Origin */}
            <FormField
              control={form.control}
              name="origin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Origin</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Volcanic, Plutonic" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
        
        {/* Physical Properties */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Physical Properties</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Color */}
            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Color</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Gray, Pink, White" {...field} />
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
                    <Input placeholder="e.g., Porphyritic, Vesicular" {...field} />
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
                    <Input placeholder="e.g., Complex mixture" {...field} />
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

            {/* Ore-specific fields */}
            {form.watch('category') === 'Ore Samples' && (
              <>
                <FormField
                  control={form.control}
                  name="mineral_composition"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Metal Content</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., 2-5% Copper, 1% Zinc" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="depositional_environment"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Deposit Type</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Hydrothermal vein, Porphyry deposit" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
            
            {/* Depositional Environment - show only for sedimentary or when not ore samples */}
            {(form.watch('category') !== 'Ore Samples' || form.watch('category') === 'Sedimentary') && (
              <FormField
                control={form.control}
                name="depositional_environment"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Depositional Environment</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Shallow Marine, Terrestrial" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>
        </div>
        
        {/* Metamorphic Properties - Only show for Metamorphic category */}
        {form.watch('category') === 'Metamorphic' && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Metamorphic Properties</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Metamorphism Type */}
              <FormField
                control={form.control}
                name="metamorphism_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Metamorphism Type</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Contact, Regional" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Metamorphic Grade */}
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
              
              {/* Parent Rock */}
              <FormField
                control={form.control}
                name="parent_rock"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Parent Rock</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Limestone, Shale" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Protolith */}
              <FormField
                control={form.control}
                name="protolith"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Protolith</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Granite, Basalt" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Foliation */}
              <FormField
                control={form.control}
                name="foliation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Foliation</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Yes, No, Partial" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Foliation Type */}
              <FormField
                control={form.control}
                name="foliation_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Foliation Type</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Schistosity, Gneissic banding" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        )}
        
        {/* Location & Age */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Location & Age</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Locality */}
            <FormField
              control={form.control}
              name="locality"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Locality</FormLabel>
                  {form.watch('category') === 'Ore Samples' ? (
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select locality" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Mankayan, Benguet">Mankayan, Benguet</SelectItem>
                        <SelectItem value="Masara, Maco, Davao de Oro">Masara, Maco, Davao de Oro</SelectItem>
                        <SelectItem value="Claver, Surigao del Norte">Claver, Surigao del Norte</SelectItem>
                        <SelectItem value="Consuelo, Agusan del Sur">Consuelo, Agusan del Sur</SelectItem>
                        <SelectItem value="Toledo City, Cebu">Toledo City, Cebu</SelectItem>
                        <SelectItem value="Bunawan, Agusan del Sur">Bunawan, Agusan del Sur</SelectItem>
                        <SelectItem value="Aroroy, Masbate">Aroroy, Masbate</SelectItem>
                        <SelectItem value="Tampakan, South Cotabato">Tampakan, South Cotabato</SelectItem>
                        <SelectItem value="Libjo, Dinagat Islands">Libjo, Dinagat Islands</SelectItem>
                        <SelectItem value="Tubod, Surigao del Norte">Tubod, Surigao del Norte</SelectItem>
                        <SelectItem value="Pantukan, Davao de Oro">Pantukan, Davao de Oro</SelectItem>
                        <SelectItem value="Tubay, Agusan Del Norte">Tubay, Agusan Del Norte</SelectItem>
                        <SelectItem value="Tagum, Davao del Norte">Tagum, Davao del Norte</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <FormControl>
                      <Input placeholder="e.g., Mount St. Helens, Washington" {...field} />
                    </FormControl>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Latitude */}
            <FormField
              control={form.control}
              name="latitude"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Latitude</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., 46.1912° N" 
                      {...field} 
                      onChange={(e) => {
                        field.onChange(e);
                        // Update coordinates when latitude changes
                        const lat = e.target.value;
                        const lng = form.getValues('longitude');
                        if (lat && lng) {
                          form.setValue('coordinates', `${lat}, ${lng}`);
                        }
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Longitude */}
            <FormField
              control={form.control}
              name="longitude"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Longitude</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., 122.1944° W" 
                      {...field} 
                      onChange={(e) => {
                        field.onChange(e);
                        // Update coordinates when longitude changes
                        const lng = e.target.value;
                        const lat = form.getValues('latitude');
                        if (lat && lng) {
                          form.setValue('coordinates', `${lat}, ${lng}`);
                        }
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Coordinates (combined) */}
            <FormField
              control={form.control}
              name="coordinates"
              render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel>Coordinates</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., 46.1912° N, 122.1944° W" 
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        // Parse coordinates if needed
                        const coordsStr = e.target.value;
                        if (coordsStr && coordsStr.includes(',')) {
                          const [lat, lng] = coordsStr.split(',').map(s => s.trim());
                          if (lat) form.setValue('latitude', lat);
                          if (lng) form.setValue('longitude', lng);
                        }
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    Automatically filled from latitude and longitude, or enter manually
                  </FormDescription>
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
                    <Input placeholder="e.g., Morrison Formation" {...field} />
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
                <FormItem className="col-span-2">
                  <FormLabel>Geological Age</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Cretaceous, 65-145 MYA" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
        
        {/* Description */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Description</h3>
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Brief description of the rock..." 
                    {...field} 
                    className="min-h-24"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        {/* Image Upload */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Rock Image</h3>
          <div className="mt-2">
            {imagePreview ? (
              <div className="relative w-40 h-40">
                <img 
                  src={imagePreview} 
                  alt="Rock preview" 
                  className="w-40 h-40 object-cover rounded-md"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-full"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center">
                <Upload className="mx-auto h-8 w-8 text-gray-400" />
                <div className="mt-2">
                  <label
                    htmlFor="image-upload"
                    className="cursor-pointer text-sm font-medium text-blue-600 hover:text-blue-500"
                  >
                    Upload an image
                    <input
                      id="image-upload"
                      name="image"
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={handleImageChange}
                    />
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
                    PNG, JPG, GIF up to 2MB
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <FormDescription>
          Fields marked with * are required.
        </FormDescription>
        
        {!hideButtons && (
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose} type="button">
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || isAdding}>
              {(isSubmitting || isAdding) && <Spinner className="mr-2 h-4 w-4" />}
              Save
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
        Add New Rock to {category}
      </h3>
      {formContent}
    </div>
  );
};

export default RockForm; 