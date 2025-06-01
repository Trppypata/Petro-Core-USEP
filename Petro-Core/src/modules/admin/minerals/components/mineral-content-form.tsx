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
      console.log('Category:', category);
      
      await addMineralAsync({
        ...data,
        mineral_code: data.mineral_code || `M-${Date.now()}`,
        mineral_name: data.mineral_name || '',
        mineral_group: data.mineral_group || '',
        category: category as string,
        type: 'mineral',
      } as IMineral);
      
      toast.success(`${data.mineral_name} added successfully`);
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