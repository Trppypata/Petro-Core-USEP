import { useState } from 'react';
import { useRockImages } from '../hooks/useRockImages';
import { MultiFileUpload } from '@/components/ui/file-upload';
import { RockImagesGallery } from '@/components/ui/rock-images-gallery';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Spinner } from '@/components/spinner';
import { toast } from 'sonner';
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
}

export function RockImagesManager({ rockId, rockName }: RockImagesManagerProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  
  const {
    images,
    isLoadingImages,
    isUploading,
    uploadImages,
    deleteImage,
    deleteAllImages,
    refetchImages
  } = useRockImages(rockId);
  
  const handleFilesChange = (newFiles: File[]) => {
    setFiles(newFiles);
  };
  
  const handleUpload = async () => {
    if (!files.length) {
      toast.error('No files selected for upload');
      return;
    }
    
    try {
      await uploadImages(files);
      setFiles([]);
    } catch (error) {
      console.error('Error uploading images:', error);
    }
  };
  
  const handleDeleteImage = async (imageId: string) => {
    setSelectedImageId(imageId);
    setIsDeleteDialogOpen(true);
  };
  
  const confirmDelete = async () => {
    if (!selectedImageId) return;
    
    try {
      await deleteImage(selectedImageId);
      setIsDeleteDialogOpen(false);
      setSelectedImageId(null);
    } catch (error) {
      console.error('Error deleting image:', error);
    }
  };
  
  const handleDeleteAll = async () => {
    if (!images.length) return;
    
    const confirmed = window.confirm(
      `Are you sure you want to delete all ${images.length} images for this rock?`
    );
    
    if (confirmed) {
      try {
        await deleteAllImages();
      } catch (error) {
        console.error('Error deleting all images:', error);
      }
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">
          Rock Images {rockName ? `for ${rockName}` : ''}
        </h3>
        
        {images.length > 0 && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleDeleteAll}
          >
            Delete All Images
          </Button>
        )}
      </div>
      
      {isLoadingImages ? (
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
        />
      )}
      
      <Separator className="my-6" />
      
      <div className="space-y-4">
        <Label>Upload New Images</Label>
        <MultiFileUpload 
          onFilesChange={handleFilesChange}
          maxSizeMB={50}
        />
        
        <div className="flex justify-end">
          <Button 
            onClick={handleUpload} 
            disabled={!files.length || isUploading}
          >
            {isUploading && <Spinner className="mr-2 h-4 w-4" />}
            Upload {files.length} {files.length === 1 ? 'Image' : 'Images'}
          </Button>
        </div>
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
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 