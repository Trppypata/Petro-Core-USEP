import { useState } from 'react';
import { useRockImages } from '../hooks/useRockImages';
import { MultiFileUpload } from '@/components/ui/file-upload';
import { RockImagesGallery } from '@/components/ui/rock-images-gallery';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Spinner } from '@/components/spinner';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

interface RockImagesManagerProps {
  rockId: string;
  rockName?: string;
  maxImages?: number;
}

export function RockImagesManager({ rockId, rockName, maxImages = 10 }: RockImagesManagerProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  
  const {
    images,
    isLoading,
    isUploading,
    uploadImages,
    deleteImage,
    refetch
  } = useRockImages(rockId);
  
  const handleFilesChange = (newFiles: File[]) => {
    // Check if adding these files would exceed the limit
    const totalImagesAfterUpload = images.length + newFiles.length;
    if (totalImagesAfterUpload > maxImages) {
      toast.error(`Cannot upload ${newFiles.length} images. Maximum ${maxImages} images allowed. You currently have ${images.length} images.`);
      return;
    }
    setFiles(newFiles);
  };
  
  const handleUpload = async () => {
    if (!files.length) {
      toast.error('No files selected for upload');
      return;
    }
    
    // Double-check the limit before uploading
    const totalImagesAfterUpload = images.length + files.length;
    if (totalImagesAfterUpload > maxImages) {
      toast.error(`Cannot upload ${files.length} images. Maximum ${maxImages} images allowed. You currently have ${images.length} images.`);
      return;
    }
    
    try {
      await uploadImages(files);
      setFiles([]);
      toast.success(`Successfully uploaded ${files.length} image${files.length === 1 ? '' : 's'}`);
    } catch (error) {
      console.error('Error uploading images:', error);
      toast.error('Failed to upload images');
    }
  };
  
  const handleDeleteImage = async (imageId: string) => {
    setSelectedImageId(imageId);
    setIsDeleteDialogOpen(true);
  };
  
  const handleDeleteImageByIndex = async (imageIndex: number) => {
    if (imageIndex >= 0 && imageIndex < images.length) {
      const imageToDelete = images[imageIndex];
      if (imageToDelete && imageToDelete.id) {
        try {
          await deleteImage(imageToDelete.id);
          toast.success('Image deleted successfully');
        } catch (error) {
          console.error('Error deleting image:', error);
          toast.error('Failed to delete image');
        }
      }
    }
  };
  
  const confirmDelete = async () => {
    if (!selectedImageId) return;
    
    try {
      await deleteImage(selectedImageId);
      setIsDeleteDialogOpen(false);
      setSelectedImageId(null);
      toast.success('Image deleted successfully');
    } catch (error) {
      console.error('Error deleting image:', error);
      toast.error('Failed to delete image');
    }
  };
  
  const handleDeleteAll = async () => {
    if (!images.length) return;
    
    const confirmed = window.confirm(
      `Are you sure you want to delete all ${images.length} images for this rock?`
    );
    
    if (confirmed) {
      try {
        // Delete all images one by one
        for (const image of images) {
          if (image.id) {
            await deleteImage(image.id);
          }
        }
        toast.success('All images deleted successfully');
      } catch (error) {
        console.error('Error deleting all images:', error);
        toast.error('Failed to delete all images');
      }
    }
  };
  
  const remainingSlots = maxImages - images.length;
  const isAtLimit = images.length >= maxImages;
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">
            Rock Images {rockName ? `for ${rockName}` : ''}
          </h3>
          <p className="text-sm text-muted-foreground">
            {images.length} of {maxImages} images used
          </p>
        </div>
        
        {images.length > 0 && (
          <Button 
            variant="outline" 
            size="sm" 
            type="button"
            onClick={handleDeleteAll}
          >
            Delete All Images
          </Button>
        )}
      </div>
      
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Spinner className="h-8 w-8" />
        </div>
      ) : images.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No images available for this rock.
        </div>
      ) : (
        <RockImagesGallery 
          images={images.map(img => img.image_url)} 
          height={350}
          aspectRatio="video"
          showDeleteButtons={true}
          onDeleteImage={handleDeleteImageByIndex}
        />
      )}
      
      <Separator className="my-6" />
      
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Label>Upload New Images</Label>
          {isAtLimit && (
            <Alert className="py-2">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Maximum {maxImages} images reached. Delete some images to upload more.
              </AlertDescription>
            </Alert>
          )}
        </div>
        
        {!isAtLimit && (
          <>
            <MultiFileUpload 
              onFilesChange={handleFilesChange}
              accept="image/*"
              multiple={true}
              maxSizeMB={50}
            />
            
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                {remainingSlots} slot{remainingSlots === 1 ? '' : 's'} remaining
              </p>
              <Button 
                type="button"
                onClick={handleUpload} 
                disabled={!files.length || isUploading}
              >
                {isUploading && <Spinner className="mr-2 h-4 w-4" />}
                Upload {files.length} {files.length === 1 ? 'Image' : 'Images'}
              </Button>
            </div>
          </>
        )}
      </div>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this image? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 