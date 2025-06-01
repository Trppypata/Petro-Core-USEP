import { useState, useRef, useEffect } from 'react';
import { UploadCloud, X, ImageIcon, Plus } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';

interface SingleFileUploadProps {
  onFileChange: (file: File | null) => void;
  defaultValue?: string;
  accept?: string;
  className?: string;
  maxSizeMB?: number;
}

interface MultiFileUploadProps {
  onFilesChange: (files: File[]) => void;
  defaultValues?: string[];
  accept?: string;
  className?: string;
  maxSizeMB?: number;
  multiple?: boolean;
}

// Original single file upload component (renamed for backward compatibility)
export function FileUpload({
  onFileChange,
  defaultValue,
  accept = 'image/*',
  className,
  maxSizeMB = 50 // Increased from 5MB to 50MB max size
}: SingleFileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(defaultValue || null);
  const [error, setError] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update preview when defaultValue changes
  useEffect(() => {
    if (defaultValue) {
      setPreview(defaultValue);
      setImageError(false);
    }
  }, [defaultValue]);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    // Check file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSizeMB) {
      setError(`File size exceeds the maximum limit of ${maxSizeMB}MB`);
      return;
    }

    // Check file type
    if (!file.type.match(accept.replace('*', '.*'))) {
      setError(`Invalid file type. Please upload ${accept.replace('*', '')} files`);
      return;
    }

    setError(null);
    setImageError(false);
    setPreview(URL.createObjectURL(file));
    onFileChange(file);
  };

  const clearFile = () => {
    setPreview(null);
    setError(null);
    setImageError(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onFileChange(null);
  };

  const handleImageError = () => {
    console.error('Image failed to load:', preview);
    setImageError(true);
  };

  return (
    <div className={cn("w-full", className)}>
      {preview && !imageError ? (
        <div className="relative border rounded-md overflow-hidden">
          <img 
            src={preview} 
            alt="Preview" 
            className="w-full h-48 object-cover" 
            onError={handleImageError}
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 rounded-full"
            onClick={clearFile}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div
          className={cn(
            "border-2 border-dashed rounded-md p-6 flex flex-col items-center justify-center h-48",
            isDragging ? "border-primary bg-muted/50" : "border-border",
            error && "border-destructive"
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="flex flex-col items-center justify-center text-center">
            {imageError ? (
              <>
                <ImageIcon className="mb-2 h-8 w-8 text-muted-foreground" />
                <p className="mb-1 text-sm font-medium text-destructive">
                  Image failed to load
                </p>
                <p className="text-xs text-muted-foreground">
                  Click to upload a new image
                </p>
              </>
            ) : (
              <>
                <UploadCloud className="mb-2 h-8 w-8 text-muted-foreground" />
                <p className="mb-1 text-sm font-medium">
                  Drag and drop or click to upload
                </p>
                <p className="text-xs text-muted-foreground">
                  {accept === 'image/*' 
                    ? 'JPG, PNG, GIF up to ' 
                    : 'Files up to '}
                  {maxSizeMB}MB
                </p>
              </>
            )}
            {error && <p className="text-xs text-destructive mt-2">{error}</p>}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleFileInput}
            className="hidden"
          />
        </div>
      )}
    </div>
  );
}

// New multi-file upload component
export function MultiFileUpload({
  onFilesChange,
  defaultValues = [],
  accept = 'image/*',
  className,
  maxSizeMB = 50,
  multiple = true
}: MultiFileUploadProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>(defaultValues || []);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    // Update previews when defaultValues change
    if (defaultValues && defaultValues.length > 0) {
      console.log('📁 Setting default previews:', defaultValues);
      setPreviews(defaultValues);
    }
  }, [defaultValues]);
  
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    console.log('📁 Files dropped:', e.dataTransfer.files.length);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };
  
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('📁 Files selected through input:', e.target.files?.length || 0);
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(Array.from(e.target.files));
    }
  };
  
  const handleFiles = (newFiles: File[]) => {
    console.log('📁 Processing', newFiles.length, 'new files');
    
    // Check file size and type for each file
    const validFiles = newFiles.filter(file => {
      const fileSizeMB = file.size / (1024 * 1024);
      console.log(`📁 Checking file: ${file.name}, size: ${fileSizeMB.toFixed(2)}MB, type: ${file.type}`);
      
      if (fileSizeMB > maxSizeMB) {
        const errorMsg = `File "${file.name}" exceeds the maximum limit of ${maxSizeMB}MB`;
        console.error(`📁 ${errorMsg}`);
        setError(errorMsg);
        return false;
      }
      
      if (!file.type.match(accept.replace('*', '.*'))) {
        const errorMsg = `Invalid file type for "${file.name}". Please upload ${accept.replace('*', '')} files`;
        console.error(`📁 ${errorMsg}`);
        setError(errorMsg);
        return false;
      }
      
      console.log(`📁 File "${file.name}" is valid`);
      return true;
    });
    
    if (validFiles.length > 0) {
      console.log(`📁 ${validFiles.length} valid files to add`);
      
      // Create new object URLs for previews
      const newPreviews = validFiles.map(file => URL.createObjectURL(file));
      
      // Update state with new files and previews
      const updatedFiles = [...files, ...validFiles];
      setFiles(updatedFiles);
      setPreviews(prevPreviews => [...prevPreviews, ...newPreviews]);
      
      // Notify parent component
      console.log(`📁 Notifying parent of ${updatedFiles.length} total files`);
      onFilesChange(updatedFiles);
      
      // Clear error if it exists
      setError(null);
      
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } else {
      console.warn('📁 No valid files were found in the selection');
    }
  };
  
  const removeFile = (index: number) => {
    console.log(`📁 Removing file at index ${index}`);
    
    // Create new arrays without the file at the specified index
    const newFiles = files.filter((_, i) => i !== index);
    const newPreviews = previews.filter((_, i) => i !== index);
    
    // Update state
    setFiles(newFiles);
    setPreviews(newPreviews);
    
    // Notify parent component
    console.log(`📁 Notifying parent of ${newFiles.length} remaining files after removal`);
    onFilesChange(newFiles);
    
    // Revoke the object URL to free up memory
    if (previews[index]) {
      URL.revokeObjectURL(previews[index]);
    }
  };
  
  return (
    <div className={cn("w-full", className)}>
      {/* Preview Grid */}
      {previews.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
          {previews.map((preview, index) => (
            <div key={index} className="relative border rounded-md overflow-hidden">
              <img 
                src={preview} 
                alt={`Preview ${index + 1}`} 
                className="w-full h-32 object-cover" 
                onError={() => {
                  console.error('Image failed to load:', preview);
                }}
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 rounded-full"
                onClick={() => removeFile(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
      
      {/* Upload Area */}
      <div
        className={cn(
          "border-2 border-dashed rounded-md p-6 flex flex-col items-center justify-center h-32",
          "border-border hover:border-primary hover:bg-muted/50 cursor-pointer",
          error && "border-destructive"
        )}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="flex flex-col items-center justify-center text-center">
          <Plus className="mb-2 h-6 w-6 text-muted-foreground" />
          <p className="text-sm font-medium">
            Add more images
          </p>
          <p className="text-xs text-muted-foreground">
            JPG, PNG, GIF up to {maxSizeMB}MB
          </p>
          {error && <p className="text-xs text-destructive mt-2">{error}</p>}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileInput}
          className="hidden"
        />
      </div>
    </div>
  );
} 