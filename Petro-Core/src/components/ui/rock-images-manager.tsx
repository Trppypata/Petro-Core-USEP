import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { MultiFileUpload } from '@/components/ui/file-upload';
import { RockImagesGallery } from '@/components/ui/rock-images-gallery';
import { Separator } from '@/components/ui/separator';
import { Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';

interface IRockImage {
  id?: string;
  rock_id: string;
  image_url: string;
  caption?: string;
  display_order?: number;
  created_at?: string;
  updated_at?: string;
}

interface RockImagesManagerProps {
  rockId: string;
  existingImages: IRockImage[];
  onImagesChange: (images: IRockImage[]) => void;
  onDeleteImage: (imageId: string) => Promise<boolean>;
  onUploadImages: (files: File[], captions?: string[]) => Promise<IRockImage[]>;
  maxImages?: number;
}

export const RockImagesManager: React.FC<RockImagesManagerProps> = ({
  rockId,
  existingImages,
  onImagesChange,
  onDeleteImage,
  onUploadImages,
  maxImages = 10
}) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const handleFilesChange = (files: File[]) => {
    setSelectedFiles(files);
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      toast.error('Please select files to upload');
      return;
    }

    if (existingImages.length + selectedFiles.length > maxImages) {
      toast.error(`You can only upload up to ${maxImages} images total`);
      return;
    }

    setIsUploading(true);
    try {
      const captions = selectedFiles.map((_, index) => `Additional image ${existingImages.length + index + 1}`);
      const newImages = await onUploadImages(selectedFiles, captions);
      
      if (newImages.length > 0) {
        onImagesChange([...existingImages, ...newImages]);
        setSelectedFiles([]);
        toast.success(`Successfully uploaded ${newImages.length} images`);
      }
    } catch (error) {
      console.error('Error uploading images:', error);
      toast.error('Failed to upload images');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    if (!imageId) {
      toast.error('Image ID is required');
      return;
    }

    setIsDeleting(imageId);
    try {
      const success = await onDeleteImage(imageId);
      if (success) {
        const updatedImages = existingImages.filter(img => img.id !== imageId);
        onImagesChange(updatedImages);
        toast.success('Image deleted successfully');
      } else {
        toast.error('Failed to delete image');
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      toast.error('Failed to delete image');
    } finally {
      setIsDeleting(null);
    }
  };

  const handleDeleteAllImages = async () => {
    if (existingImages.length === 0) {
      toast.error('No images to delete');
      return;
    }

    if (!confirm(`Are you sure you want to delete all ${existingImages.length} images?`)) {
      return;
    }

    setIsDeleting('all');
    try {
      const deletePromises = existingImages.map(img => onDeleteImage(img.id!));
      const results = await Promise.all(deletePromises);
      
      if (results.every(result => result)) {
        onImagesChange([]);
        toast.success('All images deleted successfully');
      } else {
        toast.error('Some images failed to delete');
      }
    } catch (error) {
      console.error('Error deleting all images:', error);
      toast.error('Failed to delete all images');
    } finally {
      setIsDeleting(null);
    }
  };

  const remainingSlots = maxImages - existingImages.length;

  return (
    <div className="space-y-6">
      {/* Header with image count and delete all button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Rock Images</h3>
          <p className="text-sm text-muted-foreground">
            {existingImages.length} of {maxImages} images used
          </p>
        </div>
        {existingImages.length > 0 && (
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDeleteAllImages}
            disabled={isDeleting === 'all'}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete All Images
          </Button>
        )}
      </div>

      {/* Existing Images Gallery */}
      {existingImages.length > 0 && (
        <div className="space-y-4">
          <Label>Current Images</Label>
          <RockImagesGallery
            images={existingImages.map(img => img.image_url)}
            height={300}
            aspectRatio="video"
            onDeleteImage={(index) => {
              const image = existingImages[index];
              if (image?.id) {
                handleDeleteImage(image.id);
              }
            }}
            isDeleting={isDeleting}
          />
        </div>
      )}

      <Separator />

      {/* Upload New Images Section */}
      <div className="space-y-4">
        <Label>Upload New Images</Label>
        
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <MultiFileUpload
            onFilesChange={handleFilesChange}
            accept="image/*"
            multiple={true}
            maxFiles={remainingSlots}
          />
          
          <div className="mt-4 space-y-2">
            <p className="text-sm text-muted-foreground">
              JPG, PNG, GIF up to 50MB
            </p>
            <p className="text-sm text-muted-foreground">
              {remainingSlots} slots remaining
            </p>
          </div>
        </div>

        {selectedFiles.length > 0 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {selectedFiles.length} file(s) selected
            </p>
            <Button
              onClick={handleUpload}
              disabled={isUploading || remainingSlots === 0}
              className="ml-auto"
            >
              <Upload className="h-4 w-4 mr-2" />
              {isUploading ? 'Uploading...' : `Upload ${selectedFiles.length} Images`}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
