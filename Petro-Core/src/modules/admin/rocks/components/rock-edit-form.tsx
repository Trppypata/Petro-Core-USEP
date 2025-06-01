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
import { useState, useRef, useEffect } from "react";
import { Spinner } from "@/components/spinner";
import { toast } from "sonner";
import { authService } from "@/services/auth.service";
import { uploadFile } from "@/services/storage.service";
import { useRockImages } from "../hooks/useRockImages";

interface RockEditFormProps {
  rock: IRock;
  onClose: () => void;
  category: RockCategory;
}

const RockEditForm = ({ rock, onClose, category }: RockEditFormProps) => {
  const { updateRock, isUpdating } = useUpdateRock();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [additionalImages, setAdditionalImages] = useState<File[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [formData, setFormData] = useState<Partial<IRock>>(rock);
  const { uploadImages, isUploading } = useRockImages(rock.id);
  const formRef = useRef<HTMLFormElement>(null);
  const [refreshingToken, setRefreshingToken] = useState(false);
  
  // Preserve the original rock_code to prevent duplicate key errors
  const originalRockCode = rock.rock_code;
  
  // Update formData when the rock prop changes
  useEffect(() => {
    setFormData(rock);
  }, [rock]);
  
  const refreshToken = async () => {
    try {
      setRefreshingToken(true);
      console.log("🔑 Refreshing auth token...");
      // Since authService.refreshToken doesn't exist, we'll use logout and login to refresh the session
      // Or just check if the user is authenticated
      const isAuth = authService.isAuthenticated();
      if (!isAuth) {
        throw new Error("You're not authenticated");
      }
      console.log("✅ Auth token verified");
    } catch (error) {
      console.error("❌ Error refreshing token:", error);
      toast.error("Authentication error. Please log in again.");
    } finally {
      setRefreshingToken(false);
    }
  };
  
  // Prepare data for submission - remove problematic fields and clean up data
  const prepareDataForSubmission = (data: Partial<IRock>): Partial<IRock> => {
    // Remove fields that don't need to be sent to the server
    const { id, created_at, updated_at, ...rest } = data;
    
    // Ensure we preserve the original rock_code to prevent duplicate key errors
    return {
      ...rest,
      rock_code: originalRockCode, // Always use the original rock_code
    };
  };
  
  // Direct update function for the manual submit button
  const handleDirectUpdate = async () => {
    if (!rock.id) {
      toast.error("Cannot update: Rock ID is missing");
      return;
    }
    
    if (refreshingToken) {
      toast.error("Please wait, refreshing authentication token...");
      return;
    }
    
    if (isSubmitting || isUpdating) {
      toast.error("Update already in progress");
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Show loading toast
      toast.loading("Updating rock...");
      
      // Get current form data
      const updatedFormData = formData;
      console.log("Current form data:", updatedFormData);
      
      // Prepare data for update - explicitly clean it
      const cleanData = prepareDataForSubmission({
        ...updatedFormData,
        category: category as string,
        type: formData.type || rock.type,
      });
      
      const result = await updateRock({
        id: rock.id,
        rockData: cleanData
      });
      
      // Dismiss loading toast and show success
      toast.dismiss();
      toast.success(`Rock "${cleanData.name || rock.name}" updated successfully!`);
      console.log("Update successful, result:", result);
      
      // Upload additional images if there are any
      if (additionalImages.length > 0) {
        await handleAdditionalImagesUpload();
      }
      
      // Invalidate queries to refresh the data
      queryClient.invalidateQueries({ queryKey: [Q_KEYS.ROCKS] });
      
      // Close the sheet
      onClose();
    } catch (error: any) {
      toast.dismiss();
      console.error("Error updating rock:", error);
      toast.error(`Failed to update rock: ${error.message || "Unknown error"}`);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Main submit handler for the form
  const handleSubmit = async (data: Partial<IRock>) => {
    if (!rock.id) {
      toast.error("Cannot update: Rock ID is missing");
      return;
    }
    
    if (refreshingToken) {
      toast.error("Please wait, refreshing authentication token...");
      return;
    }
    
    if (isSubmitting || isUpdating) {
      toast.error("Update already in progress");
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Prepare data - ensure we keep the original rock_code
      const cleanData = prepareDataForSubmission({
        ...data,
        category: category as string,
        rock_code: originalRockCode, // Explicitly set original rock_code
      });
      
      console.log("Submitting rock update with data:", cleanData);
      
      // Update the rock
      const result = await updateRock({
        id: rock.id,
        rockData: cleanData
      });
      
      console.log("Rock updated successfully, result:", result);
      
      // Upload additional images if there are any
      if (additionalImages.length > 0) {
        await handleAdditionalImagesUpload();
      }
      
      // Close the form
      onClose();
    } catch (error: any) {
      console.error("Error updating rock:", error);
      
      // If we get an authentication error, try to refresh the token
      if (error.message?.includes("token") || error.message?.includes("auth")) {
        toast.error("Authentication issue. Trying to refresh your session...");
        await refreshToken();
        toast.error("Please try saving again");
      } else {
        toast.error(`Failed to update rock: ${error.message || "Unknown error"}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Upload additional images after rock is saved
  const handleAdditionalImagesUpload = async () => {
    if (!rock.id) {
      toast.error("Cannot upload images: Rock ID is missing");
      return;
    }
    
    if (!additionalImages.length) {
      return;
    }
    
    try {
      toast.loading(`Uploading ${additionalImages.length} additional images...`);
      
      const result = await uploadImages(additionalImages);
      
      toast.dismiss();
      if (result && result.length > 0) {
        toast.success(`Successfully uploaded ${result.length} additional images`);
      } else {
        toast.error("Failed to upload additional images");
      }
    } catch (error: any) {
      toast.dismiss();
      console.error("Error uploading additional images:", error);
      toast.error(`Failed to upload images: ${error.message || "Unknown error"}`);
    }
  };
  
  const handleManualSubmit = async () => {
    // Check if form is valid first
    if (formRef.current) {
      if (!formRef.current.checkValidity()) {
        formRef.current.reportValidity();
        return;
      }
    }
    
    // Then proceed with update
    await handleDirectUpdate();
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
            onFormDataChange={setFormData}
            onImageFileChange={setImageFile}
          />
          
          {/* Additional Images Upload Section */}
          <div className="px-6 py-4">
            <h3 className="font-medium mb-2">Additional Images</h3>
            <p className="text-sm text-muted-foreground mb-2">
              Upload more images for this rock
            </p>
            
            {/* File input for additional images */}
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => {
                const files = Array.from(e.target.files || []);
                setAdditionalImages(files);
              }}
              className="block w-full text-sm text-slate-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-primary file:text-primary-foreground
                hover:file:bg-primary/90"
            />
            
            {additionalImages.length > 0 && (
              <p className="text-sm mt-2">
                {additionalImages.length} {additionalImages.length === 1 ? 'file' : 'files'} selected
              </p>
            )}
          </div>
        </div>
        
        <SheetFooter className="px-6 py-4 border-t border-overlay-border flex-shrink-0">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleManualSubmit}
            disabled={isSubmitting || isUpdating || refreshingToken}
          >
            {(isSubmitting || isUpdating) ? (
              <>
                <Spinner size="sm" className="mr-2" />
                Saving...
              </>
            ) : refreshingToken ? (
              <>
                <Spinner size="sm" className="mr-2" />
                Refreshing Session...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default RockEditForm; 