import { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, ImageIcon, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';
import { SupabaseImage } from './supabase-image';

interface RockImagesGalleryProps {
  images: string[];
  className?: string;
  aspectRatio?: 'square' | 'video' | 'wide';
  height?: number;
  width?: number;
  onRetryAll?: () => void;
}

export function RockImagesGallery({
  images,
  className,
  aspectRatio = 'square',
  height = 300,
  width,
  onRetryAll
}: RockImagesGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [validImages, setValidImages] = useState<string[]>([]);
  
  // Filter and validate images
  useEffect(() => {
    if (!images || images.length === 0) {
      console.log('🖼️ Gallery: No images provided');
      return;
    }
    
    console.log(`🖼️ Gallery: Received ${images.length} images:`, images);
    
    // Filter out any null, undefined or empty strings
    const filtered = images.filter(img => img && img.trim().length > 0);
    console.log(`🖼️ Gallery: After filtering, ${filtered.length} valid images remain`);
    
    setValidImages(filtered);
  }, [images]);
  
  // Don't render if no valid images
  if (!validImages || validImages.length === 0) {
    console.log('🖼️ Gallery: No valid images to display');
    return (
      <div 
        className={cn(
          "w-full bg-white flex flex-col items-center justify-center rounded-md border border-gray-200",
          className
        )}
        style={{ 
          height: height || 300,
          width: width || '100%'
        }}
      >
        <div className="text-center p-4">
          <ImageIcon className="mx-auto h-12 w-12 text-gray-400 mb-2" />
          <p className="text-sm text-gray-500 mb-3">No images available</p>
          {onRetryAll && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRetryAll}
              className="h-8 px-3 text-sm"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry Loading Images
            </Button>
          )}
        </div>
      </div>
    );
  }
  
  const handlePrevious = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setActiveIndex((prev) => (prev === 0 ? validImages.length - 1 : prev - 1));
  };
  
  const handleNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setActiveIndex((prev) => (prev === validImages.length - 1 ? 0 : prev + 1));
  };
  
  const handleThumbnailClick = (index: number) => {
    setActiveIndex(index);
  };
  
  const handleImageClick = () => {
    setShowFullscreen(true);
  };
  
  const handleCloseFullscreen = () => {
    setShowFullscreen(false);
  };
  
  // Handle keyboard navigation in fullscreen mode
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showFullscreen) {
      if (e.key === 'ArrowLeft') {
        handlePrevious();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'Escape') {
        handleCloseFullscreen();
      }
    }
  };
  
  return (
    <div 
      className={cn("w-full", className)}
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      {/* Main Image */}
      <div 
        className="relative rounded-lg overflow-hidden cursor-pointer mb-3 border border-muted flex items-center justify-center bg-white"
        style={{ 
          width: width || '100%',
          height: height,
          maxWidth: '100%'
        }}
        onClick={handleImageClick}
      >
        <div className="w-full h-full flex items-center justify-center">
          <SupabaseImage 
            src={validImages[activeIndex]} 
            alt="Rock image" 
            objectFit="contain"
            className="max-w-full max-h-full"
            width="auto"
            height={height}
          />
        </div>
        
        {/* Navigation buttons */}
        {validImages.length > 1 && (
          <>
            <Button 
              variant="outline" 
              size="icon" 
              className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-background/80 hover:bg-background rounded-full shadow-sm"
              onClick={(e) => {
                e.stopPropagation();
                handlePrevious();
              }}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-background/80 hover:bg-background rounded-full shadow-sm"
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </>
        )}
        
        {/* Image counter */}
        {validImages.length > 1 && (
          <div className="absolute bottom-2 right-2 bg-background/80 rounded-full px-2 py-1 text-xs">
            {activeIndex + 1} / {validImages.length}
          </div>
        )}
      </div>
      
      {/* Thumbnails */}
      {validImages.length > 1 && (
        <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-thin scrollbar-thumb-muted-foreground/30 scrollbar-track-transparent">
          {validImages.map((image, index) => (
            <div 
              key={index} 
              className={cn(
                "h-20 w-20 flex-shrink-0 rounded-md overflow-hidden cursor-pointer border-2 transition-all duration-200 flex items-center justify-center bg-white",
                index === activeIndex ? "border-primary ring-1 ring-primary" : "border-muted hover:border-muted-foreground/50"
              )}
              onClick={() => handleThumbnailClick(index)}
            >
              <SupabaseImage 
                src={image} 
                alt={`Thumbnail ${index + 1}`} 
                objectFit="contain" 
                className="max-w-full max-h-full"
                width={80}
                height={80}
              />
            </div>
          ))}
        </div>
      )}
      
      {/* Fullscreen Modal */}
      {showFullscreen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/90"
          onClick={handleCloseFullscreen}
        >
          <div 
            className="relative w-full h-full flex flex-col items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              variant="outline"
              size="icon"
              className="absolute top-4 right-4 z-10 bg-background/80 rounded-full"
              onClick={handleCloseFullscreen}
            >
              <X className="h-4 w-4" />
            </Button>
            
            <div className="relative w-full max-w-5xl max-h-[80vh] flex items-center justify-center">
              <SupabaseImage 
                src={validImages[activeIndex]} 
                alt="Rock image fullscreen" 
                objectFit="contain"
                className="max-w-full max-h-full"
              />
              
              {/* Fullscreen Navigation buttons */}
              {validImages.length > 1 && (
                <>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-background/80 hover:bg-background rounded-full shadow-md"
                    onClick={() => handlePrevious()}
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-background/80 hover:bg-background rounded-full shadow-md"
                    onClick={() => handleNext()}
                  >
                    <ChevronRight className="h-6 w-6" />
                  </Button>
                </>
              )}
            </div>
            
            {/* Fullscreen Thumbnails */}
            {validImages.length > 1 && (
              <div className="flex overflow-x-auto gap-2 mt-4 max-w-full p-2 bg-background/50 rounded-lg">
                {validImages.map((image, index) => (
                  <div 
                    key={index} 
                    className={cn(
                      "h-20 w-20 flex-shrink-0 rounded-md overflow-hidden cursor-pointer border-2 transition-all duration-200 flex items-center justify-center bg-white",
                      index === activeIndex ? "border-primary ring-1 ring-primary" : "border-transparent hover:border-muted-foreground/50"
                    )}
                    onClick={() => handleThumbnailClick(index)}
                  >
                    <SupabaseImage 
                      src={image} 
                      alt={`Thumbnail ${index + 1}`} 
                      objectFit="contain" 
                      className="max-w-full max-h-full"
                      width={80}
                      height={80}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 