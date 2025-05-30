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
import type { RockCategory, IRock } from '../rock.interface';

interface RockContentFormProps {
  category?: RockCategory;
  rock?: IRock;
  readOnly?: boolean;
}

const RockContentForm = ({ category, rock, readOnly = false }: RockContentFormProps) => {
  const { isAdding } = useAddRock();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClose = () => {
    setIsOpen(false);
  };

  // If we're in read-only mode showing an existing rock
  if (readOnly && rock) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-medium">Rock Code</h3>
            <p>{rock.rock_code || 'N/A'}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium">Category</h3>
            <p>{rock.category || 'N/A'}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium">Name</h3>
            <p>{rock.name || 'N/A'}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium">Type</h3>
            <p>{rock.type || 'N/A'}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium">Color</h3>
            <p>{rock.color || 'N/A'}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium">Hardness</h3>
            <p>{rock.hardness || 'N/A'}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium">Texture</h3>
            <p>{rock.texture || 'N/A'}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium">Grain Size</h3>
            <p>{rock.grain_size || 'N/A'}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium">Locality</h3>
            <p>{rock.locality || 'N/A'}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium">Coordinates</h3>
            <p>{rock.coordinates || (rock.latitude && rock.longitude ? `${rock.latitude}, ${rock.longitude}` : 'N/A')}</p>
          </div>
          
          {/* Category-specific fields */}
          {rock.category === 'Igneous' && (
            <>
              <div>
                <h3 className="text-sm font-medium">Silica Content</h3>
                <p>{rock.silica_content || 'N/A'}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium">Cooling Rate</h3>
                <p>{rock.cooling_rate || 'N/A'}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium">Mineral Content</h3>
                <p>{rock.mineral_content || 'N/A'}</p>
              </div>
            </>
          )}
          
          {rock.category === 'Sedimentary' && (
            <>
              <div>
                <h3 className="text-sm font-medium">Bedding</h3>
                <p>{rock.bedding || 'N/A'}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium">Sorting</h3>
                <p>{rock.sorting || 'N/A'}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium">Roundness</h3>
                <p>{rock.roundness || 'N/A'}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium">Fossil Content</h3>
                <p>{rock.fossil_content || 'N/A'}</p>
              </div>
            </>
          )}
          
          {rock.category === 'Metamorphic' && (
            <>
              <div>
                <h3 className="text-sm font-medium">Metamorphism Type</h3>
                <p>{rock.metamorphism_type || 'N/A'}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium">Metamorphic Grade</h3>
                <p>{rock.metamorphic_grade || 'N/A'}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium">Parent Rock</h3>
                <p>{rock.parent_rock || 'N/A'}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium">Foliation</h3>
                <p>{rock.foliation || 'N/A'}</p>
              </div>
            </>
          )}
          
          {rock.category === 'Ore Samples' && (
            <>
              <div>
                <h3 className="text-sm font-medium">Commodity Type</h3>
                <p>{rock.commodity_type || 'N/A'}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium">Ore Group</h3>
                <p>{rock.ore_group || 'N/A'}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium">Mining Company</h3>
                <p>{rock.mining_company || 'N/A'}</p>
              </div>
            </>
          )}
          
          <div>
            <h3 className="text-sm font-medium">Chemical Formula</h3>
            <p>{rock.chemical_formula || 'N/A'}</p>
          </div>
          
          <div>
            <h3 className="text-sm font-medium">Associated Minerals</h3>
            <p>{rock.associated_minerals || 'N/A'}</p>
          </div>
          
          {rock.category !== 'Ore Samples' ? (
            <div>
              <h3 className="text-sm font-medium">Depositional Environment</h3>
              <p>{rock.depositional_environment || 'N/A'}</p>
            </div>
          ) : (
            <div>
              <h3 className="text-sm font-medium">Description</h3>
              <p>{rock.description || 'N/A'}</p>
            </div>
          )}
          
          {rock.category !== 'Ore Samples' && (
            <>
              <div>
                <h3 className="text-sm font-medium">Geological Age</h3>
                <p>{rock.geological_age || 'N/A'}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium">Formation</h3>
                <p>{rock.formation || 'N/A'}</p>
              </div>
            </>
          )}
          
          <div>
            <h3 className="text-sm font-medium">Status</h3>
            <p>{rock.status || 'inactive'}</p>
          </div>
        </div>
      </div>
    );
  }

  // If we're adding a new rock (original functionality)
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
            category={category as RockCategory} 
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