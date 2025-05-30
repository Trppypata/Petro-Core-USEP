import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import MineralForm from '../mineral-form';
import { useUpdateMineral } from '../hooks/useUpdateMineral';
import type { IMineral, MineralCategory } from '../mineral.interface';
import { toast } from 'sonner';

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
      
      await updateMineralAsync({ 
        id: mineral.id,
        mineralData: {
          ...data,
          category: category as string,
          type: 'mineral'
        } 
      });
      
      toast.success(`${data.mineral_name || 'Mineral'} updated successfully`);
      handleClose();
    } catch (error) {
      console.error('Error updating mineral:', error);
      toast.error(`Failed to update mineral: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>Edit Mineral: {mineral.mineral_name}</DialogTitle>
        </DialogHeader>
        <MineralForm
          defaultValues={mineral}
          onSubmit={handleSubmit}
          onCancel={handleClose}
          mode="edit"
          isLoading={isUpdating}
          inDialog={true}
        />
      </DialogContent>
    </Dialog>
  );
};

export default MineralEditForm; 