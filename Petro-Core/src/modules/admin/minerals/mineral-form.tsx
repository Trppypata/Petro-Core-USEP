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
import type { MineralCategory } from './mineral.interface';
import { useAddMineral } from './hooks/useAddMineral';
import { Spinner } from '@/components/spinner';

interface MineralFormProps {
  category?: MineralCategory;
  onClose: () => void;
  inDialog?: boolean;
  inSheet?: boolean;
  hideButtons?: boolean;
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
  inDialog = false, 
  inSheet = false, 
  hideButtons = false 
}: MineralFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addMineral, isAdding } = useAddMineral();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
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
  
  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      await addMineral({
        ...values,
        category: category || 'Silicate',
        type: 'mineral',
      });
      form.reset();
      onClose();
    } catch (error) {
      console.error('Error adding mineral:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formContent = (
    <Form {...form}>
      <form id="mineral-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Mineral Code */}
          <FormField
            control={form.control}
            name="mineral_code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Code *</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., M-SFS-001" {...field} />
                </FormControl>
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
          
          {/* Mineral Group */}
          <FormField
            control={form.control}
            name="mineral_group"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Group *</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Sulfosalt" {...field} />
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
                <FormControl>
                  <Input placeholder="e.g., Metallic" {...field} />
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
                <FormControl>
                  <Input placeholder="e.g., Orthorhombic" {...field} />
                </FormControl>
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
        Add New Mineral {category ? `to ${category}` : ''}
      </h3>
      {formContent}
    </div>
  );
};

export default MineralForm; 