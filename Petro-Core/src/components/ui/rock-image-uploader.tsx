import { useState } from 'react';
import { Button } from './button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './card';
import { Label } from './label';
import { uploadFile } from '@/services/storage.service';
import { MultiFileUpload } from './file-upload';
import { toast } from 'sonner';
import { Spinner } from '../spinner';
import { supabase } from '@/lib/supabase';
import { Alert, AlertDescription, AlertTitle } from './alert';
import { InfoIcon } from 'lucide-react';

// Define the interface directly in this file
interface IRockImage {
  id?: string;
  rock_id: string;
  image_url: string;
  caption?: string;
  display_order?: number;
  created_at?: string;
  updated_at?: string;
}

interface RockImageUploaderProps {
  rockId: string;
  onSuccess?: (images: IRockImage[]) => void;
}

export const RockImageUploader = ({ rockId, onSuccess }: RockImageUploaderProps) => {
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);
  const [dbResult, setDbResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Create table if it doesn't exist
  const createTableIfNeeded = async () => {
    setStatusMessage('Checking if rock_images table exists...');
    try {
      console.log('📊 Attempting to check if rock_images table exists...');
      
      // First check if table exists
      const { count, error: checkError } = await supabase
        .from('rock_images')
        .select('*', { count: 'exact', head: true });
      
      if (!checkError) {
        console.log('📊 rock_images table already exists!');
        setStatusMessage('rock_images table already exists!');
        return true;
      }
      
      console.log('📊 Table check error:', checkError);
      console.log('📊 Table does not exist. Attempting to create rock_images table...');
      setStatusMessage('Table does not exist. Creating rock_images table...');
      
      // First make sure UUID extension is installed
      try {
        console.log('📊 Ensuring UUID extension is installed...');
        const { error: extensionError } = await supabase.rpc('exec_sql', { 
          sql: `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`
        });
        
        if (extensionError) {
          console.error('📊 Error creating UUID extension:', extensionError);
          // Continue anyway, as it might already be installed
        } else {
          console.log('📊 UUID extension installed or already exists');
        }
      } catch (extErr) {
        console.error('📊 Exception during UUID extension installation:', extErr);
        // Continue anyway
      }
      
      // Create the table using SQL
      console.log('📊 Creating rock_images table...');
      const { error: createError } = await supabase.rpc('exec_sql', { 
        sql: `
          CREATE TABLE IF NOT EXISTS rock_images (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            rock_id UUID NOT NULL,
            image_url TEXT NOT NULL,
            caption TEXT,
            display_order INTEGER DEFAULT 0,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
          
          CREATE INDEX IF NOT EXISTS rock_images_rock_id_idx ON rock_images(rock_id);
        `
      });
      
      if (createError) {
        console.error('📊 Error creating rock_images table:', createError);
        setStatusMessage(`Error creating table: ${createError.message}`);
        return false;
      }
      
      console.log('📊 rock_images table created successfully!');
      setStatusMessage('rock_images table created successfully!');
      return true;
    } catch (err: any) {
      console.error('📊 Exception during table creation:', err);
      setStatusMessage(`Error checking/creating table: ${err.message}`);
      return false;
    }
  };

  // Check if table exists
  const checkTable = async () => {
    setStatusMessage('Checking if rock_images table exists...');
    try {
      const { data, error } = await supabase
        .from('rock_images')
        .select('count(*)')
        .limit(1);
      
      if (error) {
        setStatusMessage(`Error checking table: ${error.message}`);
        return false;
      }
      
      setStatusMessage('rock_images table exists!');
      return true;
    } catch (err: any) {
      setStatusMessage(`Error checking table: ${err.message}`);
      return false;
    }
  };

  const handleFilesChange = (newFiles: File[]) => {
    setFiles(newFiles);
    setStatusMessage(`Selected ${newFiles.length} files`);
  };

  const handleUpload = async () => {
    if (!rockId) {
      const errorMsg = 'Rock ID is required';
      console.error(`❌ ${errorMsg}`);
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    console.log(`🔍 Starting upload process for rock ID: ${rockId}`);
    console.log(`🔍 Number of files selected: ${files.length}`);
    
    if (files.length === 0) {
      const errorMsg = 'No files selected';
      console.error(`❌ ${errorMsg}`);
      setError(errorMsg);
      toast.error('Please select at least one file');
      return;
    }

    setIsUploading(true);
    setError(null);
    setUploadedUrls([]);
    setDbResult(null);

    try {
      // First check if table exists
      console.log('🔍 Checking if rock_images table exists...');
      const tableExists = await checkTable();
      console.log(`🔍 Table exists check result: ${tableExists}`);
      
      if (!tableExists) {
        // Try to create the table
        console.log('🔍 Attempting to create rock_images table...');
        const tableCreated = await createTableIfNeeded();
        console.log(`🔍 Table creation result: ${tableCreated}`);
        
        if (!tableCreated) {
          const errorMsg = 'Failed to create rock_images table in the database';
          console.error(`❌ ${errorMsg}`);
          toast.error(errorMsg);
          setIsUploading(false);
          return;
        }
      }

      // 1. Upload files to storage
      setStatusMessage('Uploading files to storage...');
      console.log(`🔍 Starting upload of ${files.length} files to storage...`);
      
      const urls = await Promise.all(
        files.map(async (file, index) => {
          try {
            console.log(`🔍 Uploading file ${index + 1}/${files.length}: ${file.name} (${file.size} bytes)`);
            const url = await uploadFile(file, 'rocks');
            console.log(`✅ File ${index + 1} uploaded successfully. URL: ${url}`);
            return url;
          } catch (err) {
            console.error(`❌ Error uploading file ${file.name}:`, err);
            return '';
          }
        })
      );

      // Filter out any failed uploads
      const successfulUrls = urls.filter(url => url !== '');
      setUploadedUrls(successfulUrls);
      const statusMsg = `Uploaded ${successfulUrls.length} of ${files.length} files to storage`;
      console.log(`🔍 ${statusMsg}`);
      setStatusMessage(statusMsg);

      if (successfulUrls.length === 0) {
        const errorMsg = 'Failed to upload any files to storage';
        console.error(`❌ ${errorMsg}`);
        setError(errorMsg);
        toast.error(errorMsg);
        setIsUploading(false);
        return;
      }

      // 2. Save image records to database
      setStatusMessage('Saving image records to database...');
      console.log(`🔍 Creating ${successfulUrls.length} database records for rock ID: ${rockId}`);
      
      const imageData = successfulUrls.map((url, index) => ({
        rock_id: rockId,
        image_url: url,
        caption: `Rock image ${index + 1}`,
        display_order: index
      }));
      
      console.log('🔍 Database records to insert:', imageData);

      const { data, error } = await supabase
        .from('rock_images')
        .insert(imageData)
        .select();

      if (error) {
        console.error('❌ Database insert error:', error);
        console.error('❌ Error code:', error.code);
        console.error('❌ Error message:', error.message);
        console.error('❌ Error details:', error.details);
        
        setError(`Database error: ${error.message}`);
        setStatusMessage(`Failed to save images to database: ${error.message}`);
        toast.error('Failed to save images to database');
      } else {
        console.log('✅ Database records created successfully:', data);
        setDbResult(data);
        setStatusMessage(`Successfully saved ${data.length} images to database`);
        toast.success(`Successfully uploaded ${data.length} images`);
        if (onSuccess) onSuccess(data);
      }
    } catch (err: any) {
      console.error('❌ Unhandled error during upload process:', err);
      if (err.message) console.error('❌ Error message:', err.message);
      if (err.stack) console.error('❌ Stack trace:', err.stack);
      
      setError(`Upload error: ${err.message}`);
      setStatusMessage(`Upload failed: ${err.message}`);
      toast.error('Failed to upload images');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Rock Image Uploader</CardTitle>
        <CardDescription>
          Upload additional images for rock ID: {rockId || 'No ID provided'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="files">Select Images</Label>
          <MultiFileUpload onFilesChange={handleFilesChange} maxSizeMB={50} />
        </div>

        {statusMessage && (
          <Alert>
            <InfoIcon className="h-4 w-4" />
            <AlertTitle>Status</AlertTitle>
            <AlertDescription>{statusMessage}</AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <InfoIcon className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {uploadedUrls.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Uploaded Files:</h3>
            <div className="grid grid-cols-2 gap-2">
              {uploadedUrls.map((url, index) => (
                <div key={index} className="border rounded p-2">
                  <img 
                    src={url} 
                    alt={`Uploaded ${index}`} 
                    className="h-24 w-full object-cover"
                  />
                  <p className="text-xs truncate mt-1">{url}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {dbResult && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Database Result:</h3>
            <pre className="text-xs bg-slate-100 p-2 rounded overflow-auto max-h-40">
              {JSON.stringify(dbResult, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={handleUpload} disabled={isUploading || files.length === 0}>
          {isUploading && <Spinner className="mr-2 h-4 w-4" />}
          Upload {files.length} Image{files.length !== 1 ? 's' : ''}
        </Button>
      </CardFooter>
    </Card>
  );
}; 