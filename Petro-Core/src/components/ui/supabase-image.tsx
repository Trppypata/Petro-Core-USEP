import { useState, useEffect, useRef } from 'react';
import { ImageIcon } from 'lucide-react';
import { Skeleton } from './skeleton';
import { cn } from '@/lib/utils';

// Cache for already loaded/failed images
const imageCache = new Map<string, boolean>();

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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const isMounted = useRef(true);
  const imgSrc = src || '';

  // Check cache on initial render
  useEffect(() => {
    isMounted.current = true;
    
    // If we've already tried this image and it failed, don't try again
    if (imgSrc && imageCache.has(imgSrc)) {
      const success = imageCache.get(imgSrc);
      if (success === false) {
        setError(true);
        setIsLoading(false);
      }
    }
    
    return () => {
      isMounted.current = false;
    };
  }, [imgSrc]);

  const handleError = () => {
    // Only update state if component is still mounted
    if (isMounted.current) {
      console.error(`❌ Failed to load image: ${imgSrc}`);
      setError(true);
      setIsLoading(false);
      
      // Cache this failure
      if (imgSrc) {
        imageCache.set(imgSrc, false);
      }
    }
  };

  // Handle image paths that might be missing the leading slash
  const fixImagePath = (path: string): string => {
    // If it's a URL, return as is
    if (path.startsWith('http') || path.startsWith('data:')) {
      return path;
    }
    
    // Fix paths that start with 'public/'
    if (path.startsWith('public/')) {
      return `/${path}`;
    }
    
    // Fix paths that don't start with '/'
    if (!path.startsWith('/')) {
      return `/${path}`;
    }
    
    return path;
  };

  const handleLoad = () => {
    // Only update state if component is still mounted
    if (isMounted.current) {
      setIsLoading(false);
      
      // Cache this success
      if (imgSrc) {
        imageCache.set(imgSrc, true);
      }
    }
  };

  // If we have no src or it's already known to fail, show fallback immediately
  if (!imgSrc || (imageCache.has(imgSrc) && imageCache.get(imgSrc) === false)) {
    return (
      <div 
        className={cn(
          "bg-muted flex items-center justify-center rounded-md",
          fallbackClassName
        )}
        style={{ width, height }}
      >
        <span className="text-muted-foreground text-xs">No image</span>
      </div>
    );
  }

  // Fix the image path if needed
  const correctedSrc = fixImagePath(imgSrc);

  return (
    <>
      {isLoading && (
        <Skeleton 
          className={cn("rounded-md", fallbackClassName)} 
          style={{ width, height }}
        />
      )}
      <img
        src={correctedSrc}
        alt={alt}
        className={cn(
          className,
          isLoading ? "hidden" : "block",
          "rounded-md transition-all"
        )}
        style={{ 
          objectFit, 
          width, 
          height,
          display: error ? "none" : undefined
        }}
        onError={handleError}
        onLoad={handleLoad}
        loading="lazy"
      />
      {error && (
        <div 
          className={cn(
            "bg-muted flex items-center justify-center rounded-md",
            fallbackClassName
          )}
          style={{ width, height }}
        >
          <span className="text-muted-foreground text-xs">Failed to load</span>
        </div>
      )}
    </>
  );
} 