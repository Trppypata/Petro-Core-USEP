import { useState, useEffect, useRef } from 'react';
import { ImageIcon, AlertCircle, RefreshCw } from 'lucide-react';
import { Skeleton } from './skeleton';
import { cn } from '@/lib/utils';
import { Button } from './button';

// Cache for already loaded/failed images
const imageCache = new Map<string, 'loading' | 'success' | 'error'>();

interface SupabaseImageProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
  fallbackClassName?: string;
  width?: number | string;
  height?: number | string;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  showRetry?: boolean;
  onRetry?: () => void;
}

export function SupabaseImage({
  src,
  alt,
  className,
  fallbackClassName,
  width,
  height,
  objectFit = 'cover',
  showRetry = true,
  onRetry
}: SupabaseImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const isMounted = useRef(true);
  const imgSrc = src || '';
  const maxRetries = 2;

  // Check cache on initial render
  useEffect(() => {
    isMounted.current = true;
    setError(false);
    setIsLoading(true);
    setRetryCount(0);
    
    // Check cache status
    if (imgSrc && imageCache.has(imgSrc)) {
      const cacheStatus = imageCache.get(imgSrc);
      if (cacheStatus === 'error') {
        setError(true);
        setIsLoading(false);
      } else if (cacheStatus === 'success') {
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
      console.error(`❌ Failed to load image (attempt ${retryCount + 1}): ${imgSrc}`);
      
      // Try to retry if we haven't exceeded max retries
      if (retryCount < maxRetries) {
        console.log(`🔄 Retrying image load (${retryCount + 1}/${maxRetries}): ${imgSrc}`);
        setRetryCount(prev => prev + 1);
        setIsLoading(true);
        setError(false);
        
        // Clear cache for retry
        if (imgSrc) {
          imageCache.delete(imgSrc);
        }
        
        // Retry after a short delay
        setTimeout(() => {
          if (isMounted.current) {
            // Force image reload by adding timestamp
            const img = new Image();
            img.onload = handleLoad;
            img.onerror = handleError;
            img.src = `${fixImagePath(imgSrc)}?retry=${retryCount + 1}&t=${Date.now()}`;
          }
        }, 1000 * (retryCount + 1)); // Exponential backoff
        
        return;
      }
      
      setError(true);
      setIsLoading(false);
      
      // Cache this failure after all retries exhausted
      if (imgSrc) {
        imageCache.set(imgSrc, 'error');
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
      console.log(`✅ Successfully loaded image: ${imgSrc}`);
      setIsLoading(false);
      setError(false);
      
      // Cache this success
      if (imgSrc) {
        imageCache.set(imgSrc, 'success');
      }
    }
  };

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      // Reset state and try again
      setError(false);
      setIsLoading(true);
      setRetryCount(0);
      
      // Clear cache
      if (imgSrc) {
        imageCache.delete(imgSrc);
      }
    }
  };

  // If we have no src, show fallback immediately
  if (!imgSrc) {
    return (
      <div 
        className={cn(
          "bg-muted flex flex-col items-center justify-center rounded-md p-2",
          fallbackClassName
        )}
        style={{ width, height }}
      >
        <ImageIcon className="h-8 w-8 text-muted-foreground mb-1" />
        <span className="text-muted-foreground text-xs text-center">No image</span>
      </div>
    );
  }

  // If it's already known to fail permanently, show fallback with retry option
  if (imageCache.has(imgSrc) && imageCache.get(imgSrc) === 'error') {
    return (
      <div 
        className={cn(
          "bg-muted flex flex-col items-center justify-center rounded-md p-2",
          fallbackClassName
        )}
        style={{ width, height }}
      >
        <AlertCircle className="h-6 w-6 text-muted-foreground mb-1" />
        <span className="text-muted-foreground text-xs text-center mb-2">Failed to load</span>
        {showRetry && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleRetry}
            className="h-6 px-2 text-xs"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Retry
          </Button>
        )}
      </div>
    );
  }

  // Fix the image path if needed
  const correctedSrc = fixImagePath(imgSrc);

  return (
    <div className="relative" style={{ width, height }}>
      {isLoading && (
        <Skeleton 
          className={cn("rounded-md absolute inset-0", fallbackClassName)} 
          style={{ width, height }}
        />
      )}
      <img
        src={correctedSrc}
        alt={alt}
        className={cn(
          className,
          isLoading ? "opacity-0" : "opacity-100",
          "rounded-md transition-opacity duration-200"
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
            "bg-muted flex flex-col items-center justify-center rounded-md p-2 absolute inset-0",
            fallbackClassName
          )}
          style={{ width, height }}
        >
          <AlertCircle className="h-6 w-6 text-muted-foreground mb-1" />
          <span className="text-muted-foreground text-xs text-center mb-2">
            {retryCount >= maxRetries ? 'Failed to load' : 'Loading failed'}
          </span>
          {showRetry && retryCount < maxRetries && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleRetry}
              className="h-6 px-2 text-xs"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Retry
            </Button>
          )}
        </div>
      )}
    </div>
  );
} 