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
  const formRef = useRef<HTMLFormElement>(null);
  const [formData, setFormData] = useState<Partial<IRock>>({...rock});
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [additionalImages, setAdditionalImages] = useState<File[]>([]);
  
  // Use the rock images hook to handle image management
  const { 
    images: existingImages, 
    uploadImages, 
    isUploading,
    deleteImage,
    isDeleting,
    refetch: refetchImages
  } = useRockImages(rock.id);
  
  // Save the rock ID for reference
  const rockId = rock.id;
  
  useEffect(() => {
    console.log("Current form data:", formData);
  }, [formData]);
  
  // Check authentication status
  const refreshToken = async () => {
    try {
      // Check if user is authenticated first
      const isAuth = authService.isAuthenticated();
      if (!isAuth) {
        toast.error("You need to be logged in to update rocks");
        // Here you would redirect to login
        return false;
      }
      
      // Get current user to verify token
      const user = await authService.getCurrentUser();
      if (!user) {
        toast.error("Session expired. Please log in again.");
        // Here you would redirect to login
        return false;
      }
      
      return true;
    } catch (error) {
      console.error("Auth check failed:", error);
      return false;
    }
  };
  
  // Add this function at the top of the component, before the return statement
  const prepareDataForSubmission = (data: Partial<IRock>): Partial<IRock> => {
    // Create a new object with the original data
    const safeData: Partial<IRock> = { ...data };
    
    // Explicitly remove problematic fields using any type cast to avoid TypeScript errors
    delete (safeData as any).user;
    delete (safeData as any).user_id;
    delete (safeData as any).user_metadata;
    delete safeData.origin; // This one is in the interface
    
    // Temporarily remove protolith field until the database schema is updated
    delete safeData.protolith;
    
    // Remove any null/undefined values using type-safe approach
    Object.keys(safeData).forEach(key => {
      const typedKey = key as keyof IRock;
      if (safeData[typedKey] === null || safeData[typedKey] === undefined) {
        delete safeData[typedKey];
      }
    });
    
    console.log("Prepared safe data for submission:", safeData);
    return safeData;
  };
  
  // Direct update handler that bypasses form submission
  const handleDirectUpdate = async () => {
    if (!rockId) {
      console.error("Cannot update rock: missing id");
      toast.error("Cannot update rock: missing ID");
      return;
    }
    
    // Verify authentication first
    const isAuthenticated = await refreshToken();
    if (!isAuthenticated) {
      return;
    }
    
    setIsSubmitting(true);
    try {
      // Make sure we're working with the latest form data
      console.log("Direct update initiated with raw data:", formData);
      
      // Ensure required fields
      if (!formData.name) {
        toast.error("Rock name is required");
        return;
      }
      
      // Show loading toast
      toast.loading("Updating rock...");
      
      // Handle image upload if a new image file has been selected
      let imageUrl = formData.image_url || '';
      
      if (imageFile) {
        try {
          console.log("Direct update: Uploading image file:", imageFile.name);
          
          // Check if Supabase is properly configured before attempting upload
          if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
            console.warn("Supabase storage is not configured. Skipping image upload.");
            toast.warning("Image upload skipped due to missing Supabase configuration");
          } else {
            // Upload to Supabase storage
            imageUrl = await uploadFile(imageFile, 'rocks');
            console.log('Direct update: Uploaded image URL:', imageUrl);
          }
        } catch (error) {
          console.error('Error uploading image:', error);
          toast.error('Failed to upload image, but will continue updating rock data.');
          // Continue with the update even if image upload fails
        }
      }
      
      // Update formData with the new image URL
      const updatedFormData = {
        ...formData,
        image_url: imageUrl
      };
      
      // Prepare data for update - explicitly clean it
      const cleanData = prepareDataForSubmission({
        ...updatedFormData,
        category: category as string,
        type: formData.type || rock.type,
      });
      
      const result = await updateRock({
        id: rockId,
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
  
  const handleSubmit = async (data: Partial<IRock>) => {
    console.log("Form submission received with data:", data);
    setFormData(data);
    
    if (!rockId) {
      console.error("Cannot update rock: missing id");
      toast.error("Cannot update rock: missing ID");
      return;
    }
    
    // Verify authentication first
    const isAuthenticated = await refreshToken();
    if (!isAuthenticated) {
      return;
    }
    
    console.log("Starting rock update:", { id: rockId, data });
    console.log("Image file for regular submission:", imageFile ? imageFile.name : "none");
    
    setIsSubmitting(true);
    try {
      console.log("Calling updateRock with:", { id: rockId, rockData: data });
      
      // Show loading toast
      toast.loading("Updating rock...");
      
      const result = await updateRock({
        id: rockId,
        rockData: {
          ...data,
          category: category as string
        }
      });
      
      // Dismiss loading toast
      toast.dismiss();
      
      console.log("Update successful, result:", result);
      
      // Show success notification
      toast.success(`Rock "${data.name}" has been updated successfully`);
      
      // Invalidate queries to refresh the data
      queryClient.invalidateQueries({ queryKey: [Q_KEYS.ROCKS] });
      
      // Close the sheet
      onClose();
    } catch (error: any) {
      // Dismiss loading toast
      toast.dismiss();
      
      console.error("Error updating rock:", error);
      toast.error(`Failed to update rock: ${error.message || "Unknown error"}`);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Manually trigger form submission
  const handleManualSubmit = async () => {
    console.log("Manual form submission triggered");
    
    // Check authentication first
    const isAuthenticated = await refreshToken();
    if (!isAuthenticated) {
      return;
    }
    
    // Use direct update as fallback approach
    if (!formRef.current) {
      console.log("Form reference not found, using direct update instead");
      handleDirectUpdate();
      return;
    }
    
    // Try regular form submission first
    try {
      formRef.current.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
      
      // Set a timeout to check if submission was successful
      setTimeout(() => {
        if (!isSubmitting) {
          console.log("Form submission may have failed, trying direct update");
          handleDirectUpdate();
        }
      }, 500);
    } catch (error) {
      console.error("Error during form submission:", error);
      handleDirectUpdate();
    }
  };
  
  // Handle additional images upload
  const handleAdditionalImagesUpload = async () => {
    if (additionalImages.length === 0 || !rockId) return;
    
    try {
      toast.loading(`Uploading ${additionalImages.length} additional images...`);
      const result = await uploadImages(additionalImages);
      toast.dismiss();
      
      if (result && result.length > 0) {
        toast.success(`Successfully uploaded ${result.length} additional images`);
        setAdditionalImages([]);
        refetchImages();
      } else {
        toast.error('Failed to upload additional images');
      }
    } catch (error) {
      toast.dismiss();
      console.error('Error uploading additional images:', error);
      toast.error('Error uploading additional images');
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
            onFormDataChange={setFormData}
            onImageFileChange={setImageFile}
          />
          
          {/* Additional Images Upload Section */}
          <div className="px-6 py-4 border-t border-overlay-border">
            <h4 className="text-sm font-medium mb-2">Additional Images</h4>
            
            {/* Display existing images if any */}
            {existingImages && existingImages.length > 0 && (
              <div className="mb-4">
                <p className="text-xs text-muted-foreground mb-2">Existing Images:</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {existingImages.map(image => (
                    <div key={image.id} className="relative group">
                      <img 
                        src={image.image_url} 
                        alt={image.caption || 'Rock image'} 
                        className="h-20 w-full object-cover rounded-md"
                      />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => image.id && deleteImage(image.id)}
                        disabled={isDeleting}
                      >
                        <span className="sr-only">Delete</span>
                        ×
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* File input for additional images */}
            <div className="mt-2">
              <label htmlFor="additional-images" className="block text-xs font-medium mb-1">
                Upload Additional Images
              </label>
              <input
                type="file"
                id="additional-images"
                multiple
                accept="image/*"
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/90"
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  setAdditionalImages(prev => [...prev, ...files]);
                }}
              />
              {additionalImages.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-muted-foreground">
                    {additionalImages.length} new image(s) selected
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-1"
                    onClick={() => setAdditionalImages([])}
                  >
                    Clear Selection
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <SheetFooter className="flex-shrink-0 px-6 py-4 bg-overlay-bg border-t border-overlay-border">
          <Button variant="outline" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button 
            type="button" 
            onClick={handleManualSubmit} 
            disabled={isSubmitting || isUpdating || isUploading}
          >
            {(isSubmitting || isUpdating || isUploading) && <Spinner className="mr-2 h-4 w-4" />}
            Update Rock
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default RockEditForm; 