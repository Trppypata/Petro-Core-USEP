import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useUpdateRock } from "../hooks/useUpdateRock";
import RockForm from "../rock-form";
import type { RockCategory, IRock } from "../rock.interface";
import { useQueryClient } from "@tanstack/react-query";
import { Q_KEYS } from "@/shared/qkeys";
import { Button } from "@/components/ui/button";
import { useState, useRef } from "react";
import { Spinner } from "@/components/spinner";
import { toast } from "sonner";

interface RockEditFormProps {
  rock: IRock;
  onClose: () => void;
  category: RockCategory;
}

const RockEditForm = ({ rock, onClose, category }: RockEditFormProps) => {
  const { updateRock, isUpdating } = useUpdateRock();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  
  const handleSubmit = async (data: Partial<IRock>) => {
    if (!rock.id) {
      console.error("Cannot update rock: missing id");
      toast.error("Cannot update rock: missing ID");
      return;
    }
    
    console.log("Starting rock update:", { id: rock.id, data });
    setIsSubmitting(true);
    try {
      console.log("Calling updateRock with:", { id: rock.id, rockData: data });
      const result = await updateRock({
        id: rock.id,
        rockData: data
      });
      
      console.log("Update successful, result:", result);
      
      // Invalidate queries to refresh the data
      queryClient.invalidateQueries({ queryKey: [Q_KEYS.ROCKS] });
      
      // Close the sheet
      onClose();
    } catch (error) {
      console.error("Error updating rock:", error);
      toast.error("Failed to update rock. See console for details.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleManualSubmit = () => {
    if (formRef.current) {
      formRef.current.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
    }
  };
  
  return (
    <Sheet open onOpenChange={onClose}>
      <SheetContent className="p-0 flex flex-col h-full md:max-w-[40rem]">
        <SheetHeader className="py-4 bg-overlay-bg border-b border-overlay-border px-6 flex-shrink-0">
          <SheetTitle>Editing Rock: {rock.name}</SheetTitle>
          <p className="text-xs text-muted-foreground">
            Update the rock details.
          </p>
        </SheetHeader>
        
        <div className="flex-grow overflow-y-auto">
          <RockForm 
            category={category as RockCategory}
            onClose={onClose}
            defaultValues={rock}
            onSubmit={handleSubmit}
            isLoading={isUpdating || isSubmitting}
            mode="edit"
            inSheet={true}
            hideButtons={true}
            formRef={formRef}
          />
        </div>
        
        <SheetFooter className="flex-shrink-0 px-6 py-4 bg-overlay-bg border-t border-overlay-border">
          <Button variant="outline" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button 
            type="button" 
            onClick={handleManualSubmit} 
            disabled={isSubmitting || isUpdating}
          >
            {(isSubmitting || isUpdating) && <Spinner className="mr-2 h-4 w-4" />}
            Update Rock
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default RockEditForm; 