/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetTrigger,
} from '@/components/ui/sheet';
import { PlusCircleIcon } from 'lucide-react';
import { useState } from 'react';
import { useAddRock } from '../hooks/useAddRock';
import RockForm from '../rock-form';
import type { RockCategory } from '../rock.interface';

interface RockContentFormProps {
  category: RockCategory;
}

const RockContentForm = ({ category }: RockContentFormProps) => {
  const { isAdding } = useAddRock();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <Sheet onOpenChange={setIsOpen} open={isOpen}>
      <SheetTrigger asChild>
        <Button className="h-8 gap-1" size="sm" variant="default">
          <PlusCircleIcon className="h-3.5 w-3.5" />
          <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
            Add Rock
          </span>
        </Button>
      </SheetTrigger>

      <SheetContent className="p-0 flex flex-col h-full md:max-w-[40rem]">
        <header className="py-4 bg-overlay-bg border-b border-overlay-border px-6 flex-shrink-0">
          <div>
            <h3 className="text-lg font-medium">Adding Rock to {category}</h3>
            <p className="text-xs text-muted-foreground">
              Fill in the details.
            </p>
          </div>
        </header>

        <div className="flex-grow overflow-y-auto">
          <RockForm 
            category={category} 
            onClose={handleClose} 
            inSheet={true} 
            hideButtons={true}
          />
        </div>

        <SheetFooter className="flex-shrink-0 px-6 py-4 bg-overlay-bg border-t border-overlay-border">
          <Button variant="outline" onClick={handleClose} type="button">
            Cancel
          </Button>
          <Button type="submit" form="rock-form" disabled={isSubmitting || isAdding}>
            {(isSubmitting || isAdding) && <span className="mr-2 h-4 w-4 animate-spin">◌</span>}
            Save Rock
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default RockContentForm; 