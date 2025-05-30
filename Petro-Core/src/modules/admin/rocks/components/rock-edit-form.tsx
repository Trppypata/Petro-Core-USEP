import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useUpdateRock } from "../hooks/useUpdateRock";
import RockForm from "../rock-form";
import type { RockCategory, IRock } from "../rock.interface";

interface RockEditFormProps {
  rock: IRock;
  onClose: () => void;
  category: RockCategory;
}

const RockEditForm = ({ rock, onClose, category }: RockEditFormProps) => {
  const { updateRock, isUpdating } = useUpdateRock();
  
  const handleSubmit = async (data: Partial<IRock>) => {
    if (!rock.id) return;
    
    await updateRock({
      id: rock.id,
      rockData: data
    });
  };
  
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Edit Rock: {rock.name}</DialogTitle>
        </DialogHeader>
        
        <RockForm 
          category={category as RockCategory}
          onClose={onClose}
          inDialog
          defaultValues={rock}
          onSubmit={handleSubmit}
          isLoading={isUpdating}
          mode="edit"
        />
      </DialogContent>
    </Dialog>
  );
};

export default RockEditForm; 