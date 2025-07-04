import { useState, useEffect } from 'react';
import { Button } from './button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from './card';
import { toast } from 'sonner';
import { Spinner } from '../spinner';
import { MultiFileUpload } from './file-upload';
import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import { Alert, AlertTitle, AlertDescription } from './alert';
import { InfoIcon } from 'lucide-react';

// Storage bucket name
const STORAGE_BUCKET = 'rocks-minerals';

interface RockImagesUploaderDirectProps {
  rockId: string;
  onSuccess?: (imageUrls: string[]) => void;
}

export function RockImagesUploaderDirect({ rockId, onSuccess }: RockImagesUploaderDirectProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showBucketHelp, setShowBucketHelp] = useState(false);
  const [debug, setDebug] = useState<string[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    // Check authentication status on component mount
    checkAndSetAuthentication();
  }, []);

  const checkAndSetAuthentication = async () => {
    try {
      // First check if we have a token in localStorage
      const token = localStorage.getItem('access_token');
      addDebugMessage(`Access token exists: ${!!token}`);
      
      if (token) {
        addDebugMessage('Setting auth token manually from localStorage');
        try {
          // Try to set the session manually
          const { error: authError } = await supabase.auth.setSession({
            access_token: token,
            refresh_token: '',
          });
          
          if (authError) {
            addDebugMessage(`Error setting session: ${authError.message}`);
          } else {
            addDebugMessage('Session set successfully with token from localStorage');
          }
        } catch (authErr) {
          addDebugMessage(`Failed to set session: ${authErr}`);
        }
      }

      // Then check if we have an active session
      const { data: sessionData } = await supabase.auth.getSession();
      const hasSession = !!sessionData?.session;
      setIsAuthenticated(hasSession);
      addDebugMessage(`Authentication status: ${hasSession ? 'Authenticated' : 'Not authenticated'}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      addDebugMessage(`Auth check error: ${message}`);
    }
  };

  const addDebugMessage = (message: string) => {
    console.log(message);
    setDebug(prev => [...prev, `${new Date().toISOString().substring(11, 19)} - ${message}`]);
  };

  const handleFilesChange = (newFiles: File[]) => {
    addDebugMessage(`Selected ${newFiles.length} files: ${newFiles.map(f => f.name).join(', ')}`);
    setFiles(newFiles);
    setError(null);
  };

  const uploadImage = async (file: File): Promise<string> => {
    try {
      // Generate a unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${uuidv4()}.${fileExt}`;
      const filePath = `rocks/${fileName}`;
      
      addDebugMessage(`Uploading file ${file.name} (${file.size} bytes) to ${filePath}`);
      
      // Check Supabase client
      if (!supabase || !supabase.storage) {
        addDebugMessage('ERROR: Supabase client or storage is undefined');
        throw new Error('Supabase client not properly initialized');
      }
      
      // Double check the bucket access
      try {
        const { data: bucketList, error: bucketListError } = await supabase.storage.listBuckets();
        if (bucketListError) {
          addDebugMessage(`Error listing buckets: ${bucketListError.message}`);
        } else {
          const bucketExists = bucketList?.some(b => b.name === STORAGE_BUCKET);
          addDebugMessage(`Bucket check: "${STORAGE_BUCKET}" exists: ${bucketExists ? 'Yes' : 'No'}`);
          if (!bucketExists) {
            setShowBucketHelp(true);
            throw new Error(`Bucket "${STORAGE_BUCKET}" not found in your Supabase project`);
          }
        }
      } catch (bucketError) {
        addDebugMessage(`Bucket verification error: ${bucketError}`);
      }
      
      // Get token from localStorage for authenticated upload
      const token = localStorage.getItem('access_token');
      const headers: Record<string, string> = {};
      
      if (token) {
        addDebugMessage(`Using auth token for upload: ${token.substring(0, 10)}...`);
        headers['Authorization'] = `Bearer ${token}`;
      } else {
        addDebugMessage('WARNING: No auth token available for upload');
      }
      
      // Try uploading to the bucket
      const { data, error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
          ...(token ? { headers } : {})
        });
      
      if (error) {
        addDebugMessage(`Upload error: ${error.message}`);
        addDebugMessage(`Error details: ${JSON.stringify(error)}`);
        
        // Check for bucket-related errors
        if (error.message?.includes('bucket not found') || 
            error.message?.includes('bucketId is required') ||
            error.message?.includes('row-level security policy')) {
          
          setShowBucketHelp(true);
          throw new Error(`Bucket issue: ${error.message}`);
        }
        
        throw error;
      }
      
      // Get the public URL
      const { data: publicURL } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(data.path);
      
      addDebugMessage(`Successfully uploaded to ${data.path}`);
      return publicURL.publicUrl;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      addDebugMessage(`Error uploading file: ${message}`);
      return '';
    }
  };

  const handleUpload = async () => {
    if (!files.length) {
      addDebugMessage('No files selected');
      return;
    }
    
    if (!rockId) {
      addDebugMessage('No rock ID provided');
      return;
    }
    
    setIsUploading(true);
    setUploadProgress(10);
    toast.loading(`Uploading ${files.length} images...`);
    
    try {
      addDebugMessage(`Starting upload for rock ID: ${rockId}`);
      addDebugMessage(`Bucket target: rocks-minerals/rocks`);
      
      // Check authentication status
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        addDebugMessage('No active session found, attempting to authenticate');
        
        // Try to get token from storage
        const token = localStorage.getItem('access_token') || 
                      localStorage.getItem('token') || 
                      localStorage.getItem('auth_token') ||
                      sessionStorage.getItem('supabase.auth.token');
                      
        if (token) {
          addDebugMessage(`Found token, attempting to set session manually`);
          try {
            const { error } = await supabase.auth.setSession({
              access_token: token,
              refresh_token: token,
            });
            
            if (error) {
              addDebugMessage(`Error setting session: ${error.message}`);
            } else {
              addDebugMessage('Successfully set session manually');
            }
          } catch (sessionError) {
            addDebugMessage(`Exception setting session: ${sessionError}`);
          }
        } else {
          addDebugMessage('No authentication token found in storage');
        }
      } else {
        addDebugMessage('Found active session');
      }
      
      setUploadProgress(20);
      
      // Upload each file
      const uploadPromises = files.map(file => uploadImage(file));
      
      setUploadProgress(30);
      
      // Wait for all uploads to complete
      const urls = await Promise.all(uploadPromises);
      
      setUploadProgress(80);
      
      // Filter out failed uploads
      const successfulUrls = urls.filter(url => url !== '');
      addDebugMessage(`Successfully uploaded ${successfulUrls.length} of ${files.length} images`);
      
      if (successfulUrls.length === 0) {
        throw new Error('Failed to upload any images');
      }
      
      // Show success message
      toast.dismiss();
      toast.success(`Uploaded ${successfulUrls.length} images successfully`);
      
      // Now save to database
      if (successfulUrls.length > 0) {
        try {
          // Create image records in the database
          const imageData = successfulUrls.map((url, index) => ({
            rock_id: rockId,
            image_url: url,
            caption: `Rock image ${index + 1}`,
            display_order: index
          }));
          
          addDebugMessage(`Creating ${imageData.length} database records`);
          setUploadProgress(90);
          
          const { data, error } = await supabase
            .from('rock_images')
            .insert(imageData)
            .select();
            
          if (error) {
            addDebugMessage(`Database insert error: ${error.message}`);
            addDebugMessage(`Error details: ${JSON.stringify(error)}`);
            toast.error(`Saved images to storage but failed to update database: ${error.message}`);
          } else {
            addDebugMessage(`Database records created: ${data.length}`);
            toast.success(`Successfully saved ${data.length} images`);
            if (onSuccess) onSuccess(successfulUrls);
            setFiles([]);
            setShowBucketHelp(false);
          }
        } catch (dbError: any) {
          addDebugMessage(`Database error: ${dbError.message || JSON.stringify(dbError)}`);
          toast.error('Failed to update database records');
        }
      }
    } catch (error: any) {
      toast.dismiss();
      toast.error(`Upload failed: ${error.message || 'Unknown error'}`);
      addDebugMessage(`Upload error: ${error.message || JSON.stringify(error)}`);
    } finally {
      setIsUploading(false);
      setUploadProgress(100);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Upload Rock Images</CardTitle>
        <CardDescription>
          Images will be stored in the "rocks-minerals" bucket in Supabase storage
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="flex items-center mb-2">
            <div className={`w-3 h-3 rounded-full mr-2 ${isAuthenticated ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm font-medium">
              Status: {isAuthenticated ? 'Authenticated' : 'Not authenticated'}
            </span>
          </div>
          {!isAuthenticated && (
            <p className="text-xs text-red-500 mt-1">
              Not authenticated. Login first or uploads may fail due to permission issues.
            </p>
          )}
          <Button
            variant="outline" 
            size="sm" 
            className="mt-2"
            onClick={checkAndSetAuthentication}
          >
            Check Authentication
          </Button>
        </div>
        
        <MultiFileUpload 
          onFilesChange={handleFilesChange} 
          maxSizeMB={50}
        />
        
        {showBucketHelp && (
          <Alert variant="destructive" className="mt-4">
            <InfoIcon className="h-4 w-4" />
            <AlertTitle>Bucket Setup Required</AlertTitle>
            <AlertDescription>
              <p className="mb-2">The "rocks-minerals" bucket needs to be created in Supabase Storage:</p>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Go to your Supabase dashboard</li>
                <li>Navigate to Storage</li>
                <li>Click "New Bucket"</li>
                <li>Name it exactly "rocks-minerals"</li>
                <li>Enable RLS and set to public access</li>
                <li>Create appropriate RLS policies</li>
              </ol>
            </AlertDescription>
          </Alert>
        )}
        
        {error && !showBucketHelp && (
          <p className="text-sm text-red-500 mt-2">{error}</p>
        )}
        
        {debug.length > 0 && (
          <div className="mt-4 border rounded p-3 bg-slate-50">
            <p className="font-medium text-sm">Debug Log:</p>
            <pre className="mt-1 text-xs overflow-auto max-h-40 whitespace-pre-wrap text-slate-700">
              {debug.join('\n')}
            </pre>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button
          onClick={handleUpload}
          disabled={isUploading || files.length === 0}
        >
          {isUploading ? (
            <>
              <Spinner size="sm" className="mr-2" />
              Uploading...
            </>
          ) : (
            `Upload ${files.length || 0} Images`
          )}
        </Button>
      </CardFooter>
    </Card>
  );
} 