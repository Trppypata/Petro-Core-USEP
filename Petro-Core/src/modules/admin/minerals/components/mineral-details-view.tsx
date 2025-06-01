import { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { SupabaseImage } from "@/components/ui/supabase-image";
import type { IMineral } from '../mineral.interface';

interface MineralDetailsViewProps {
  mineral: IMineral;
  onClose: () => void;
}

const MineralDetailsView = ({ mineral, onClose }: MineralDetailsViewProps) => {
  const [isOpen, setIsOpen] = useState(true);
  
  const handleClose = () => {
    setIsOpen(false);
    if (onClose) onClose();
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent className="p-0 flex flex-col h-full md:max-w-[40rem]">
        <SheetHeader className="py-4 bg-overlay-bg border-b border-overlay-border px-6 flex-shrink-0">
          <SheetTitle>{mineral.mineral_name}</SheetTitle>
          <p className="text-xs text-muted-foreground">
            {mineral.category} | {mineral.mineral_group} | Code: {mineral.mineral_code}
          </p>
        </SheetHeader>
        
        <div className="flex-grow overflow-y-auto p-6 space-y-6">
          {/* Image section */}
          {mineral.image_url && (
            <div className="flex justify-center mb-6">
              <SupabaseImage 
                src={mineral.image_url} 
                alt={mineral.mineral_name}
                height={200}
                objectFit="contain"
                className="rounded-md"
              />
            </div>
          )}
          
          {/* Basic properties */}
          <div className="grid grid-cols-2 gap-4">
            {mineral.chemical_formula && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Chemical Formula</h3>
                <p className="text-base">{mineral.chemical_formula}</p>
              </div>
            )}
            
            {mineral.color && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Color</h3>
                <p className="text-base">{mineral.color}</p>
              </div>
            )}
            
            {mineral.streak && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Streak</h3>
                <p className="text-base">{mineral.streak}</p>
              </div>
            )}
            
            {mineral.luster && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Luster</h3>
                <p className="text-base">{mineral.luster}</p>
              </div>
            )}
            
            {mineral.hardness && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Hardness</h3>
                <p className="text-base">{mineral.hardness}</p>
              </div>
            )}
          </div>
          
          {/* Crystal properties */}
          <div>
            <h2 className="text-lg font-semibold mb-3">Crystal Properties</h2>
            <div className="grid grid-cols-2 gap-4">
              {mineral.crystal_system && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Crystal System</h3>
                  <p className="text-base">{mineral.crystal_system}</p>
                </div>
              )}
              
              {mineral.cleavage && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Cleavage</h3>
                  <p className="text-base">{mineral.cleavage}</p>
                </div>
              )}
              
              {mineral.fracture && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Fracture</h3>
                  <p className="text-base">{mineral.fracture}</p>
                </div>
              )}
              
              {mineral.habit && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Habit</h3>
                  <p className="text-base">{mineral.habit}</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Additional properties */}
          {(mineral.specific_gravity || mineral.transparency || mineral.occurrence || mineral.uses) && (
            <div>
              <h2 className="text-lg font-semibold mb-3">Additional Properties</h2>
              <div className="grid grid-cols-2 gap-4">
                {mineral.specific_gravity && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Specific Gravity</h3>
                    <p className="text-base">{mineral.specific_gravity}</p>
                  </div>
                )}
                
                {mineral.transparency && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Transparency</h3>
                    <p className="text-base">{mineral.transparency}</p>
                  </div>
                )}
                
                {mineral.occurrence && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Occurrence</h3>
                    <p className="text-base">{mineral.occurrence}</p>
                  </div>
                )}
                
                {mineral.uses && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Uses</h3>
                    <p className="text-base">{mineral.uses}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        <SheetFooter className="flex-shrink-0 px-6 py-4 bg-overlay-bg border-t border-overlay-border">
          <Button onClick={handleClose} type="button">
            Close
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default MineralDetailsView; 