import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet';
import { Spinner } from '@/components/spinner';
import { useAddMineral } from '../hooks/useAddMineral';
import { toast } from 'sonner';
import { type MineralCategory, type IMineral } from '../mineral.interface';
import MineralForm from '../mineral-form';

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

interface MineralContentFormProps {
  category: MineralCategory;
}

const MineralContentForm = ({ category }: MineralContentFormProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { addMineralAsync, isAdding } = useAddMineral();

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleSubmit = async (data: Partial<IMineral>) => {
    try {
      console.log('Adding mineral with data:', data);
      console.log('Current tab category:', category);
      
      // Generate a more unique code if not provided
      let mineralCode = data.mineral_code;
      if (!mineralCode || mineralCode.trim() === '') {
        // Create a more unique code with category, timestamp and random string
        const prefix = category ? 
          category.substring(0, 3).toUpperCase() : 
          'MIN';
        const timestamp = Date.now().toString();
        const random = Math.random().toString(36).substring(2, 5).toUpperCase();
        mineralCode = `${prefix}-${timestamp}-${random}`;
      }
      
      // Determine the category based on the mineral group
      const mineralGroup = data.mineral_group || '';
      const determinedCategory = GROUP_TO_CATEGORY[mineralGroup] || category as string;
      
      // Log category determination
      if (determinedCategory !== category) {
        console.log(`Category changed from ${category} to ${determinedCategory} based on mineral group "${mineralGroup}"`);
      } else {
        console.log(`Using category ${determinedCategory} for mineral group "${mineralGroup}"`);
      }
      
      // For custom mineral groups that aren't in our mapping, we should add them
      if (mineralGroup && !GROUP_TO_CATEGORY[mineralGroup] && determinedCategory) {
        console.log(`Adding custom mineral group "${mineralGroup}" to category mapping with value "${determinedCategory}"`);
        // This is only for the current session and won't persist across page reloads
        GROUP_TO_CATEGORY[mineralGroup] = determinedCategory;
      }
      
      await addMineralAsync({
        ...data,
        mineral_code: mineralCode,
        mineral_name: data.mineral_name || '',
        mineral_group: mineralGroup,
        category: determinedCategory,
        type: 'mineral',
      } as IMineral);
      
      // Show additional message if category was changed
      if (determinedCategory !== category) {
        toast.success(`${data.mineral_name} added to ${determinedCategory} category`);
      } else {
        toast.success(`${data.mineral_name} added successfully`);
      }
      
      handleClose();
    } catch (error) {
      console.error('Error adding mineral:', error);
      toast.error(`Failed to add mineral: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <>
      <Button onClick={() => setIsOpen(true)} className="flex items-center gap-1">
        <Plus className="h-4 w-4" />
        Add Mineral
      </Button>
      
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent className="p-0 flex flex-col h-full md:max-w-[40rem]">
          <SheetHeader className="py-4 bg-overlay-bg border-b border-overlay-border px-6 flex-shrink-0">
            <SheetTitle>Add New Mineral</SheetTitle>
            <p className="text-xs text-muted-foreground">
              Enter the details for the new mineral.
            </p>
          </SheetHeader>
          
          <div className="flex-grow overflow-y-auto">
            <MineralForm
              category={category}
              onSubmit={handleSubmit}
              onCancel={handleClose}
              mode="add"
              isLoading={isAdding}
              inSheet={true}
              hideButtons={true}
            />
          </div>
          
          <SheetFooter className="flex-shrink-0 px-6 py-4 bg-overlay-bg border-t border-overlay-border">
            <Button variant="outline" onClick={handleClose} type="button">
              Cancel
            </Button>
            <Button 
              type="submit" 
              form="mineral-form" 
              disabled={isAdding}
            >
              {isAdding && <Spinner className="mr-2 h-4 w-4" />}
              Add Mineral
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default MineralContentForm; 