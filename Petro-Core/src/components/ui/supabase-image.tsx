import { useState, useEffect } from 'react';
import { ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SupabaseImageProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
  fallbackClassName?: string;
  width?: number | string;
  height?: number | string;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
}

export function SupabaseImage({
  src,
  alt,
  className,
  fallbackClassName,
  width,
  height,
  objectFit = 'cover'
}: SupabaseImageProps) {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Reset states when src changes
  useEffect(() => {
    if (src) {
      setImageError(false);
      setIsLoading(true);
    } else {
      setImageError(true);
      setIsLoading(false);
    }
  }, [src]);

  // Handle image load error
  const handleError = () => {
    console.error('Failed to load image:', src);
    setImageError(true);
    setIsLoading(false);
  };

  // Handle image load success
  const handleLoad = () => {
    setIsLoading(false);
  };

  if (!src || imageError) {
    // Render fallback when image URL is missing or failed to load
    return (
      <div 
        className={cn(
          "bg-gray-200 flex items-center justify-center rounded-md",
          fallbackClassName
        )}
        style={{ 
          width: width || '100%', 
          height: height || '200px',
        }}
      >
        <div className="text-center p-4">
          <ImageIcon className="mx-auto h-10 w-10 text-gray-400 mb-2" />
          <p className="text-sm text-gray-500">{alt || 'Image not available'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative" style={{ width, height }}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 animate-pulse rounded-md">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
        </div>
      )}
      <img
        src={src}
        alt={alt}
        className={cn(
          "rounded-md transition-opacity",
          isLoading ? "opacity-0" : "opacity-100",
          className
        )}
        style={{ 
          objectFit,
          width: width || '100%',
          height: height || 'auto'
        }}
        onError={handleError}
        onLoad={handleLoad}
      />
    </div>
  );
} 