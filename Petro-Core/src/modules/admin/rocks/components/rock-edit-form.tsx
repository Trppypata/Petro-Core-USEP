import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetDescription,
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
import { TabsContent, Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RockImagesManager } from './rock-images-manager';
import { Separator } from '@/components/ui/separator';
import { MultiFileUpload } from '@/components/ui/file-upload';
import { RockImagesGallery } from '@/components/ui/rock-images-gallery';

interface RockEditFormProps {
  rock: IRock;
  onClose: () => void;
  category: RockCategory;
}

const RockEditForm = ({ rock, onClose, category }: RockEditFormProps) => {
  const { updateRock, isUpdating } = useUpdateRock();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [currentTab, setCurrentTab] = useState('details');
  const [formData, setFormData] = useState<Partial<IRock>>(rock);
  const formRef = useRef<HTMLFormElement>(null);
  
  const { 
    images, 
    uploadImages, 
    isLoading: isLoadingImages
  } = useRockImages(rock.id);
  
  // Update formData when the rock prop changes
  useEffect(() => {
    setFormData(rock);
  }, [rock]);
  
  // Periodically refresh token to prevent expiration during long forms
  useEffect(() => {
    const tokenRefreshInterval = setInterval(refreshToken, 15 * 60 * 1000); // Refresh every 15 minutes
    return () => clearInterval(tokenRefreshInterval);
  }, []);
  
  const refreshToken = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (token) {
        // Perform a simple API call to refresh the token session
        // This depends on your auth system, but could be a call to get user profile
        // or a specific refresh endpoint
        const response = await fetch(import.meta.env.VITE_local_url + '/auth/refresh', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        const data = await response.json();
        if (data.token) {
          localStorage.setItem('access_token', data.token);
          console.log('Token refreshed successfully');
        }
      }
    } catch (error) {
      console.error('Error refreshing token:', error);
    }
  };
  
  // Function to prepare data for submission by removing unwanted fields
  const prepareDataForSubmission = (data: Partial<IRock>): Partial<IRock> => {
    // Create a copy to avoid modifying the original
    const cleanedData = { ...data };
    
    // Remove fields that should not be included in updates
    delete cleanedData.created_at;
    delete cleanedData.updated_at;
    delete cleanedData.id; // ID is passed separately to the update function
    
    // These are UI-specific or temporary fields that shouldn't be sent to the API
    delete (cleanedData as any).isLoading;
    delete (cleanedData as any).isSubmitting;
    delete (cleanedData as any).confirmDelete;
    delete (cleanedData as any).isDirty;
    delete (cleanedData as any).errors;
    
    return cleanedData;
  };
  
  // Handle direct update through the form submit button
  const handleDirectUpdate = async () => {
    if (!formRef.current) {
      toast.error('Form reference not found');
      return;
    }
    
    // Trigger the form submission
    const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
    formRef.current.dispatchEvent(submitEvent);
  };
  
  // Handle file selection for additional images
  const handleFilesChange = (files: File[]) => {
    setImageFiles(files);
  };
  
  // Handle uploading additional images for the rock
  const handleAdditionalImagesUpload = async () => {
    if (!rock.id) {
      toast.error('Rock ID is required to upload images');
      return;
    }
    
    if (imageFiles.length === 0) {
      toast.error('Please select at least one image file');
      return;
    }
    
    setIsUploadingImages(true);
    try {
      console.log(`📸 Uploading ${imageFiles.length} additional images for rock ID: ${rock.id}`);
      
      // Use the uploadImages function from useRockImages hook
      const result = await uploadImages(imageFiles);
      
      if (result && result.length > 0) {
        toast.success(`Successfully uploaded ${result.length} images`);
        setImageFiles([]);
        // Invalidate and refetch the rock data to show updated images
        queryClient.invalidateQueries({ queryKey: ['rock', rock.id] });
        queryClient.invalidateQueries({ queryKey: ['rock-images', rock.id] });
      } else {
        toast.error('Failed to upload images');
      }
    } catch (error) {
      console.error('Error uploading images:', error);
      toast.error('Error uploading images. Please try again.');
    } finally {
      setIsUploadingImages(false);
    }
  };
  
  // Handle form submission for updating rock data
  const handleSubmit = async (data: Partial<IRock>) => {
    if (!rock.id) {
      toast.error('Rock ID is required');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Prepare the data for submission
      const cleanedData = prepareDataForSubmission(data);
      console.log('Submitting updated rock data:', cleanedData);
      
      // Update the rock data
      const result = await updateRock({
        id: rock.id,
        rockData: cleanedData
      });
      
      console.log('Rock update result:', result);
      
      // If there are image files to upload, do that after rock update succeeds
      if (imageFiles.length > 0) {
        console.log(`Uploading ${imageFiles.length} images for rock ID: ${rock.id}`);
        
        // Set uploading state
        setIsUploadingImages(true);
        
        try {
          // Use the uploadImages function from useRockImages hook
          const imageResult = await uploadImages(imageFiles);
          
          if (imageResult && imageResult.length > 0) {
            console.log(`Successfully uploaded ${imageResult.length} images`);
            toast.success(`Successfully uploaded ${imageResult.length} images`);
            // Clear the file list after successful upload
            setImageFiles([]);
            // Invalidate queries to refresh the UI
            queryClient.invalidateQueries({ queryKey: ['rock-images', rock.id] });
          } else {
            console.error('No images were uploaded successfully');
            toast.error('Failed to upload images');
          }
        } catch (imageError) {
          console.error('Error uploading images:', imageError);
          toast.error('Error uploading images. Rock data was updated, but images failed.');
        } finally {
          setIsUploadingImages(false);
        }
      }
      
      // Show success message and close the form
      toast.success('Rock updated successfully');
      
      // Invalidate the rocks query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['rocks'] });
      
      // Close the form
      onClose();
    } catch (error) {
      console.error('Error updating rock:', error);
      toast.error('Failed to update rock. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle form data changes
  const handleFormDataChange = (data: Partial<IRock>) => {
    setFormData(data);
  };
  
  // Handle manual submit button click
  const handleManualSubmit = async () => {
    if (!formRef.current) {
      console.error('Form reference not found');
      return;
    }
    
    // Submit the form
    const event = new Event('submit', { bubbles: true, cancelable: true });
    formRef.current.dispatchEvent(event);
  };
  
  return (
    <Sheet open={true} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-xl md:max-w-2xl lg:max-w-4xl xl:max-w-6xl overflow-y-auto">
        <SheetHeader className="mb-4">
          <SheetTitle>Edit Rock: {rock.name}</SheetTitle>
          <SheetDescription>
            Update rock information and add images
          </SheetDescription>
        </SheetHeader>
        
        <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="details">Rock Details</TabsTrigger>
            <TabsTrigger value="images">Rock Images</TabsTrigger>
          </TabsList>
          
          <TabsContent value="details">
            <RockForm
              category={category}
              onClose={onClose}
              defaultValues={rock}
              inSheet={true}
              mode="edit"
              onSubmit={handleSubmit}
              isLoading={isUpdating || isSubmitting}
              formRef={formRef}
              onFormDataChange={handleFormDataChange}
            />
            
            <div className="mt-4 flex gap-2 justify-end">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleManualSubmit} disabled={isSubmitting}>
                {isSubmitting && <Spinner className="mr-2 h-4 w-4" />}
                Update Rock
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="images">
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Current Images</h3>
              
              {isLoadingImages ? (
                <div className="flex justify-center py-4">
                  <Spinner />
                </div>
              ) : images && images.length > 0 ? (
                <RockImagesGallery 
                  images={images.map(img => img.image_url)} 
                  height={300}
                />
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  No images available for this rock.
                </div>
              )}
              
              <Separator className="my-6" />
              
              <h3 className="text-lg font-semibold">Upload New Images</h3>
              <div className="space-y-4">
                <MultiFileUpload
                  onFilesChange={handleFilesChange}
                  maxSizeMB={50}
                />
                
                <div className="flex justify-end">
                  <Button 
                    onClick={handleAdditionalImagesUpload}
                    disabled={isUploadingImages || imageFiles.length === 0}
                  >
                    {isUploadingImages && <Spinner className="mr-2 h-4 w-4" />}
                    Upload {imageFiles.length} {imageFiles.length === 1 ? 'Image' : 'Images'}
                  </Button>
                </div>
              </div>
              
              <Separator className="my-6" />
              
              <div className="mt-4">
                <RockImagesManager rockId={rock.id || ''} rockName={rock.name} />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
};

export default RockEditForm; 