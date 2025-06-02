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
  const [imageUrl, setImageUrl] = useState<string | null | undefined>(src);

  // Reset states when src changes
  useEffect(() => {
    if (src) {
      console.log(`🖼️ Loading image: ${src}`);
      setImageUrl(src);
      setImageError(false);
      setIsLoading(true);
    } else {
      console.log('🖼️ No image source provided');
      setImageError(true);
      setIsLoading(false);
    }
  }, [src]);

  // Handle image load error
  const handleError = () => {
    console.error(`❌ Failed to load image: ${imageUrl}`);
    
    // If the URL is a Supabase URL and it failed, try a different approach
    if (imageUrl?.includes('supabase.co')) {
      console.log('Trying to fix Supabase URL format...');
      
      // If we already tried to fix it once, just give up
      if (imageUrl !== src) {
        setImageError(true);
        setIsLoading(false);
        return;
      }
      
      // Try to modify the URL format slightly for Supabase URLs
      const fixedUrl = imageUrl.replace('/storage/v1/object/public/', '/storage/v1/object/sign/');
      console.log('Trying with modified URL:', fixedUrl);
      setImageUrl(fixedUrl);
      return; // Don't set error yet, let it try the new URL
    }
    
    // For all other URLs, just set the error state
    setImageError(true);
    setIsLoading(false);
  };

  // Handle image load success
  const handleLoad = () => {
    console.log(`✅ Image loaded successfully: ${imageUrl}`);
    setIsLoading(false);
  };

  const containerStyle: React.CSSProperties = {
    width: width || '100%',
    height: height || 'auto',
    maxWidth: '100%',
    position: 'relative'
  };

  if (!imageUrl || imageError) {
    // Render fallback when image URL is missing or failed to load
    return (
      <div 
        className={cn(
          "bg-white flex items-center justify-center rounded-md border border-gray-200",
          fallbackClassName
        )}
        style={containerStyle}
      >
        <div className="text-center p-4">
          <ImageIcon className="mx-auto h-12 w-12 text-gray-400 mb-2" />
          <p className="text-sm text-gray-500">{alt || 'Image not available'}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle} className="overflow-hidden rounded-md bg-white border border-gray-200">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white animate-pulse rounded-md">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
        </div>
      )}
      <img
        src={imageUrl}
        alt={alt}
        className={cn(
          "rounded-md transition-opacity",
          isLoading ? "opacity-0" : "opacity-100",
          className
        )}
        style={{ 
          objectFit,
          maxWidth: '100%',
          maxHeight: height ? `${height}px` : 'none',
          width: objectFit === 'contain' ? 'auto' : (width || '100%'),
          height: objectFit === 'contain' ? 'auto' : (height || 'auto'),
          backgroundColor: 'white'
        }}
        onError={handleError}
        onLoad={handleLoad}
      />
    </div>
  );
} 