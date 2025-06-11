import { useState, useEffect } from 'react';
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
import { Badge } from "@/components/ui/badge";
import type { MineralCategory, IMineral } from './mineral.interface';
import { useAddMineral } from './hooks/useAddMineral';
import { Spinner } from '@/components/spinner';
import { RefreshCw, Info } from 'lucide-react';
import { toast } from 'sonner';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Common mineral groups for dropdown
const MINERAL_GROUPS = [
  "Silicate",
  "Oxide",
  "Sulfide",
  "Sulfosalt",
  "Native Element",
  "Halide",
  "Carbonate",
  "Nitrate",
  "Borate",
  "Sulfate",
  "Chromate",
  "Phosphate",
  "Arsenate",
  "Vanadate",
  "Tungstate",
  "Molybdate",
  "Organic",
  "Hydroxide",
  "Clay Mineral"
];

// Mapping between mineral groups and categories
const GROUP_TO_CATEGORY: Record<string, string> = {
  "Silicate": "SILICATES",
  "Oxide": "OXIDES",
  "Sulfide": "SULFIDES",
  "Sulfosalt": "SULFOSALTS",
  "Native Element": "NATIVE ELEMENTS",
  "Halide": "HALIDES",
  "Carbonate": "CARBONATES",
  "Nitrate": "ORGANICS",
  "Borate": "BORATES",
  "Sulfate": "SULFATES",
  "Chromate": "CHROMATES",
  "Phosphate": "PHOSPHATES",
  "Arsenate": "ARSENATES",
  "Vanadate": "VANADATES",
  "Tungstate": "TUNGSTATES",
  "Molybdate": "MOLYBDATE",
  "Organic": "ORGANICS",
  "Hydroxide": "HYDROXIDES",
  "Clay Mineral": "SILICATES"
};

// Common crystal systems for dropdown
const CRYSTAL_SYSTEMS = [
  "Cubic",
  "Tetragonal",
  "Orthorhombic",
  "Hexagonal",
  "Trigonal",
  "Monoclinic",
  "Triclinic",
  "Amorphous"
];

// Common luster types for dropdown
const LUSTER_TYPES = [
  "Metallic",
  "Submetallic",
  "Vitreous",
  "Resinous",
  "Pearly",
  "Greasy",
  "Adamantine",
  "Silky",
  "Dull",
  "Waxy"
];

interface MineralFormProps {
  category?: MineralCategory;
  onClose?: () => void;
  onSubmit?: (data: Partial<IMineral>) => Promise<void>;
  inSheet?: boolean;
  hideButtons?: boolean;
  mode?: 'add' | 'edit';
  defaultValues?: Partial<IMineral>;
  isLoading?: boolean;
  onCancel?: () => void;
}

// Schema for mineral form validation
const formSchema = z.object({
  mineral_code: z.string().min(1, 'Mineral code is required'),
  mineral_name: z.string().min(1, 'Mineral name is required'),
  chemical_formula: z.string().optional(),
  mineral_group: z.string().min(1, 'Mineral group is required'),
  color: z.string().optional(),
  streak: z.string().optional(),
  luster: z.string().optional(),
  hardness: z.string().optional(),
  cleavage: z.string().optional(),
  fracture: z.string().optional(),
  habit: z.string().optional(),
  crystal_system: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const MineralForm = ({ 
  category, 
  onClose, 
  onSubmit: externalSubmit,
  inSheet = false, 
  hideButtons = false,
  mode = 'add',
  defaultValues,
  isLoading: externalLoading,
  onCancel
}: MineralFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addMineral, isAdding } = useAddMineral();
  
  // Create local copies of the dropdown lists that we might modify
  const [localMineralGroups, setLocalMineralGroups] = useState<string[]>([...MINERAL_GROUPS]);
  const [localLusterTypes, setLocalLusterTypes] = useState<string[]>([...LUSTER_TYPES]);
  const [localCrystalSystems, setLocalCrystalSystems] = useState<string[]>([...CRYSTAL_SYSTEMS]);
  
  // States for custom input mode
  const [customGroupMode, setCustomGroupMode] = useState(false);
  const [customLusterMode, setCustomLusterMode] = useState(false);
  const [customCrystalMode, setCustomCrystalMode] = useState(false);
  
  // Custom input values
  const [customGroupValue, setCustomGroupValue] = useState("");
  const [customLusterValue, setCustomLusterValue] = useState("");
  const [customCrystalValue, setCustomCrystalValue] = useState("");
  
  // State for generating code
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  
  // State for tracking the category based on selected mineral group
  const [selectedCategory, setSelectedCategory] = useState<string>(category as string || "");
  
  // Generate a unique mineral code
  const generateMineralCode = () => {
    setIsGeneratingCode(true);
    
    try {
      // Generate a code with category prefix and timestamp
      const prefix = category ? 
        category.substring(0, 3).toUpperCase() : 
        'MIN';
      
      const timestamp = Date.now().toString().slice(-6);
      const random = Math.random().toString(36).substring(2, 5).toUpperCase();
      const newCode = `${prefix}-${timestamp}-${random}`;
      
      // Update the form with the new code
      form.setValue('mineral_code', newCode, { shouldValidate: true });
      toast.success("Generated unique mineral code");
    } catch (error) {
      console.error("Error generating code:", error);
      toast.error("Failed to generate unique code");
    } finally {
      setIsGeneratingCode(false);
    }
  };
  
  // Check if defaultValues contain values not in our lists and add them
  useEffect(() => {
    if (defaultValues) {
      // Add custom mineral group if it exists and isn't in our list
      if (defaultValues.mineral_group && !MINERAL_GROUPS.includes(defaultValues.mineral_group)) {
        setLocalMineralGroups(prev => [...prev, defaultValues.mineral_group!]);
      }
      
      // Add custom luster if it exists and isn't in our list
      if (defaultValues.luster && !LUSTER_TYPES.includes(defaultValues.luster)) {
        setLocalLusterTypes(prev => [...prev, defaultValues.luster!]);
      }
      
      // Add custom crystal system if it exists and isn't in our list
      if (defaultValues.crystal_system && !CRYSTAL_SYSTEMS.includes(defaultValues.crystal_system)) {
        setLocalCrystalSystems(prev => [...prev, defaultValues.crystal_system!]);
      }
    }
  }, [defaultValues]);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValues ? {
      mineral_code: defaultValues.mineral_code || '',
      mineral_name: defaultValues.mineral_name || '',
      chemical_formula: defaultValues.chemical_formula || '',
      mineral_group: defaultValues.mineral_group || '',
      color: defaultValues.color || '',
      streak: defaultValues.streak || '',
      luster: defaultValues.luster || '',
      hardness: defaultValues.hardness || '',
      cleavage: defaultValues.cleavage || '',
      fracture: defaultValues.fracture || '',
      habit: defaultValues.habit || '',
      crystal_system: defaultValues.crystal_system || '',
    } : {
      mineral_code: '',
      mineral_name: '',
      chemical_formula: '',
      mineral_group: '',
      color: '',
      streak: '',
      luster: '',
      hardness: '',
      cleavage: '',
      fracture: '',
      habit: '',
      crystal_system: '',
    },
  });
  
  useEffect(() => {
    if (defaultValues) {
      form.reset({
        mineral_code: defaultValues.mineral_code || '',
        mineral_name: defaultValues.mineral_name || '',
        chemical_formula: defaultValues.chemical_formula || '',
        mineral_group: defaultValues.mineral_group || '',
        color: defaultValues.color || '',
        streak: defaultValues.streak || '',
        luster: defaultValues.luster || '',
        hardness: defaultValues.hardness || '',
        cleavage: defaultValues.cleavage || '',
        fracture: defaultValues.fracture || '',
        habit: defaultValues.habit || '',
        crystal_system: defaultValues.crystal_system || '',
      });
    }
  }, [defaultValues, form]);
  
  // Update the category based on the selected mineral group
  const watchedMineralGroup = form.watch("mineral_group");
  useEffect(() => {
    if (watchedMineralGroup) {
      const newCategory = GROUP_TO_CATEGORY[watchedMineralGroup] || category as string || "";
      setSelectedCategory(newCategory);
    }
  }, [watchedMineralGroup, category]);
  
  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      if (externalSubmit) {
        // For edit mode, use the external submit function
        await externalSubmit(values);
      } else {
        // For add mode, use the addMineral function
        await addMineral({
          ...values,
          category: GROUP_TO_CATEGORY[values.mineral_group] || 'BORATES',
          type: 'mineral',
        });
        form.reset();
      }
      
      // Close the form after successful submission
      if (onClose) onClose();
    } catch (error) {
      console.error(`Error ${mode === 'add' ? 'adding' : 'updating'} mineral:`, error);
      
      // Handle duplicate key error specifically
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage.includes('duplicate key') || errorMessage.includes('unique constraint')) {
        toast.error("A mineral with this code already exists. Please use a different code.");
        // Focus the mineral_code field
        setTimeout(() => {
          const codeInput = document.querySelector('input[name="mineral_code"]');
          if (codeInput) {
            (codeInput as HTMLInputElement).focus();
          }
        }, 100);
      } else {
        toast.error(`Failed to ${mode === 'add' ? 'add' : 'update'} mineral: ${errorMessage}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Determine if loading state should come from external props or internal state
  const isLoading = externalLoading !== undefined ? externalLoading : (mode === 'add' ? isAdding : isSubmitting);
  
  // Determine the action text based on the mode
  const actionText = mode === 'add' ? 'Save' : 'Update';
  
  // Handle cancel button
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else if (onClose) {
      onClose();
    }
  };

  const formContent = (
    <Form {...form}>
      <form id="mineral-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Mineral Code */}
          <FormField
            control={form.control}
            name="mineral_code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Code *</FormLabel>
                <div className="flex gap-2">
                  <FormControl>
                    <Input placeholder="e.g., M-SFS-001" {...field} />
                  </FormControl>
                  {mode === 'add' && (
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="icon"
                      onClick={generateMineralCode}
                      disabled={isGeneratingCode}
                      title="Generate unique code"
                    >
                      <RefreshCw className={`h-4 w-4 ${isGeneratingCode ? 'animate-spin' : ''}`} />
                    </Button>
                  )}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Mineral Name */}
          <FormField
            control={form.control}
            name="mineral_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name *</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Enargite" {...field} />
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
                  <Input placeholder="e.g., Cu₃AsS₄" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Mineral Group - Replaced with dropdown */}
          <FormField
            control={form.control}
            name="mineral_group"
            render={({ field }) => (
              <FormItem>
                <div className="flex justify-between">
                  <FormLabel>Group *</FormLabel>
                  {field.value && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-1 text-xs">
                            <Badge variant="outline" className="px-2 py-0 text-xs">
                              {GROUP_TO_CATEGORY[field.value] || category}
                            </Badge>
                            <Info className="h-3 w-3" />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>This mineral will be categorized under {GROUP_TO_CATEGORY[field.value] || category}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
                {customGroupMode ? (
                  <div className="space-y-2">
                    <FormControl>
                      <Input 
                        value={customGroupValue}
                        onChange={(e) => setCustomGroupValue(e.target.value)}
                        placeholder="Enter custom mineral group"
                      />
                    </FormControl>
                    <div className="flex justify-end space-x-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        onClick={() => setCustomGroupMode(false)}
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="button" 
                        size="sm"
                        onClick={() => {
                          if (customGroupValue) {
                            const newGroup = customGroupValue.trim();
                            setLocalMineralGroups(prev => [...prev, newGroup]);
                            field.onChange(newGroup);
                            setCustomGroupMode(false);
                          }
                        }}
                        disabled={!customGroupValue}
                      >
                        Add
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Select
                    onValueChange={(value) => {
                      if (value === 'custom') {
                        setCustomGroupMode(true);
                      } else {
                        field.onChange(value);
                      }
                    }}
                    value={field.value}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a mineral group" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {localMineralGroups.map((group) => (
                        <SelectItem key={group} value={group}>
                          {group}
                        </SelectItem>
                      ))}
                      <SelectItem key="custom" value="custom">
                        Custom...
                      </SelectItem>
                    </SelectContent>
                  </Select>
                )}
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
                  <Input placeholder="e.g., Gray-black" {...field} />
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
                  <Input placeholder="e.g., Black" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Luster */}
          <FormField
            control={form.control}
            name="luster"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Luster</FormLabel>
                {customLusterMode ? (
                  <div className="space-y-2">
                    <FormControl>
                      <Input 
                        value={customLusterValue}
                        onChange={(e) => setCustomLusterValue(e.target.value)}
                        placeholder="Enter custom luster type"
                      />
                    </FormControl>
                    <div className="flex justify-end space-x-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        onClick={() => setCustomLusterMode(false)}
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="button" 
                        size="sm"
                        onClick={() => {
                          if (customLusterValue) {
                            const newLuster = customLusterValue.trim();
                            setLocalLusterTypes(prev => [...prev, newLuster]);
                            field.onChange(newLuster);
                            setCustomLusterMode(false);
                          }
                        }}
                        disabled={!customLusterValue}
                      >
                        Add
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Select
                    onValueChange={(value) => {
                      if (value === 'custom') {
                        setCustomLusterMode(true);
                      } else {
                        field.onChange(value);
                      }
                    }}
                    value={field.value}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a luster type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {localLusterTypes.map((luster) => (
                        <SelectItem key={luster} value={luster}>
                          {luster}
                        </SelectItem>
                      ))}
                      <SelectItem key="custom" value="custom">
                        Custom...
                      </SelectItem>
                    </SelectContent>
                  </Select>
                )}
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
                  <Input placeholder="e.g., 3" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Cleavage */}
          <FormField
            control={form.control}
            name="cleavage"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cleavage</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Perfect" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Fracture */}
          <FormField
            control={form.control}
            name="fracture"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fracture</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Uneven" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Habit */}
          <FormField
            control={form.control}
            name="habit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Habit</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Prismatic, striated" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Crystal System */}
          <FormField
            control={form.control}
            name="crystal_system"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Crystal System</FormLabel>
                {customCrystalMode ? (
                  <div className="space-y-2">
                    <FormControl>
                      <Input 
                        value={customCrystalValue}
                        onChange={(e) => setCustomCrystalValue(e.target.value)}
                        placeholder="Enter custom crystal system"
                      />
                    </FormControl>
                    <div className="flex justify-end space-x-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        onClick={() => setCustomCrystalMode(false)}
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="button" 
                        size="sm"
                        onClick={() => {
                          if (customCrystalValue) {
                            const newSystem = customCrystalValue.trim();
                            setLocalCrystalSystems(prev => [...prev, newSystem]);
                            field.onChange(newSystem);
                            setCustomCrystalMode(false);
                          }
                        }}
                        disabled={!customCrystalValue}
                      >
                        Add
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Select
                    onValueChange={(value) => {
                      if (value === 'custom') {
                        setCustomCrystalMode(true);
                      } else {
                        field.onChange(value);
                      }
                    }}
                    value={field.value}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a crystal system" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {localCrystalSystems.map((system) => (
                        <SelectItem key={system} value={system}>
                          {system}
                        </SelectItem>
                      ))}
                      <SelectItem key="custom" value="custom">
                        Custom...
                      </SelectItem>
                    </SelectContent>
                  </Select>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormDescription>
          Fields marked with * are required.
        </FormDescription>
        
        {!hideButtons && (
          <div className="flex justify-end space-x-2">
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
  
  return (
    <div className="w-full mb-6 border rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-4">
        {mode === 'add' ? 'Add New' : 'Edit'} Mineral {category ? `to ${category}` : ''}
      </h3>
      {formContent}
    </div>
  );
};

export default MineralForm; 