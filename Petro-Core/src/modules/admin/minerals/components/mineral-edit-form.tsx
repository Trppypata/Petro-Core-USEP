import { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import MineralForm from '../mineral-form';
import { useUpdateMineral } from '../hooks/useUpdateMineral';
import type { IMineral, MineralCategory } from '../mineral.interface';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/spinner';

interface MineralEditFormProps {
  mineral: IMineral;
  onClose: () => void;
  category: MineralCategory;
}

const MineralEditForm = ({ mineral, onClose, category }: MineralEditFormProps) => {
  const [isOpen, setIsOpen] = useState(true);
  const { updateMineralAsync, isUpdating } = useUpdateMineral();
  
  const handleClose = () => {
    setIsOpen(false);
    if (onClose) onClose();
  };

  const handleSubmit = async (data: Partial<IMineral>) => {
      if (!mineral.id) {
      toast.error("Cannot update mineral: Missing ID");
        return;
      }
      
    try {
      console.log('Updating mineral with data:', data);
      console.log('Using ID:', mineral.id);
      console.log('Category:', category);
      
      // Ensure category has no trailing spaces
      const cleanCategory = typeof category === 'string' ? category.trim() : category;
      
      // Clean up the data object
      const cleanedData = {
        ...data,
        // Remove any properties that are empty strings or undefined
        ...Object.entries(data).reduce((acc, [key, value]) => {
          if (value !== undefined && value !== '') {
            acc[key] = typeof value === 'string' ? value.trim() : value;
          }
          return acc;
        }, {} as Record<string, any>),
        category: cleanCategory as string,
        type: 'mineral'
      };
      
      console.log('Cleaned data for update:', cleanedData);
      
      await updateMineralAsync({ 
        id: mineral.id,
        mineralData: cleanedData
      });
      
      toast.success(`${data.mineral_name || 'Mineral'} updated successfully`);
      handleClose();
    } catch (error) {
      console.error('Error updating mineral:', error);
      toast.error(`Failed to update mineral: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent className="p-0 flex flex-col h-full md:max-w-[40rem]">
        <SheetHeader className="py-4 bg-overlay-bg border-b border-overlay-border px-6 flex-shrink-0">
          <SheetTitle>Edit Mineral: {mineral.mineral_name}</SheetTitle>
          <p className="text-xs text-muted-foreground">
            Update the mineral details.
          </p>
        </SheetHeader>
        
        <div className="flex-grow overflow-y-auto p-6">
          <MineralForm
            defaultValues={mineral}
            onSubmit={handleSubmit}
            onCancel={handleClose}
            mode="edit"
            isLoading={isUpdating}
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
            disabled={isUpdating}
          >
            {isUpdating && <Spinner className="mr-2 h-4 w-4" />}
            Update Mineral
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default MineralEditForm; 