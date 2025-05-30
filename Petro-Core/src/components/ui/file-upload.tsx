import { useState, useRef } from 'react';
import { UploadCloud, X, Image as ImageIcon } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  onFileChange: (file: File | null) => void;
  defaultValue?: string;
  accept?: string;
  className?: string;
  maxSizeMB?: number;
}

export function FileUpload({
  onFileChange,
  defaultValue,
  accept = 'image/*',
  className,
  maxSizeMB = 5 // Default 5MB max size
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(defaultValue || null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    setPreview(URL.createObjectURL(file));
    onFileChange(file);
  };

  const clearFile = () => {
    setPreview(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onFileChange(null);
  };

  return (
    <div className={cn("w-full", className)}>
      {preview ? (
        <div className="relative border rounded-md overflow-hidden">
          <img 
            src={preview} 
            alt="Preview" 
            className="w-full h-48 object-cover" 
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