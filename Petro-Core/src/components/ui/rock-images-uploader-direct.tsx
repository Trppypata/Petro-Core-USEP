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
    if (!rockId) {
      setError('Rock ID is required');
      toast.error('Rock ID is required');
      return;
    }
    
    if (files.length === 0) {
      setError('No files selected');
      toast.error('Please select at least one file');
      return;
    }
    
    setIsUploading(true);
    setError(null);
    setDebug([]);
    
    // Check authentication first
    await checkAndSetAuthentication();
    
    try {
      addDebugMessage(`Starting upload of ${files.length} images for rock ${rockId}`);
      
      // Check Supabase configuration
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey) {
        addDebugMessage('Missing Supabase credentials in .env file');
        throw new Error('Supabase is not configured properly. Please check your .env file.');
      }
      
      addDebugMessage(`Supabase URL: ${supabaseUrl.substring(0, 15)}...`);
      addDebugMessage('Supabase key is defined: ' + (supabaseKey ? 'Yes' : 'No'));
      
      // First check if bucket exists
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
      
      if (bucketsError) {
        addDebugMessage(`Error listing buckets: ${bucketsError.message}`);
        addDebugMessage(`Error details: ${JSON.stringify(bucketsError)}`);
        throw new Error(`Could not list storage buckets: ${bucketsError.message}`);
      }
      
      const bucketExists = buckets?.some((bucket: { name: string }) => bucket.name === STORAGE_BUCKET);
      addDebugMessage(`Bucket "${STORAGE_BUCKET}" exists: ${bucketExists ? 'Yes' : 'No'}`);
      
      if (!bucketExists) {
        setShowBucketHelp(true);
        throw new Error(`Bucket "${STORAGE_BUCKET}" does not exist. Please create it in your Supabase dashboard.`);
      }
      
      // Check if user is authenticated
      const { data: sessionData } = await supabase.auth.getSession();
      const isAuthenticated = !!sessionData?.session;
      addDebugMessage(`User is authenticated: ${isAuthenticated ? 'Yes' : 'No'}`);
      
      if (!isAuthenticated) {
        addDebugMessage('WARNING: User is not authenticated, upload may fail due to RLS policies');
        
        // Try to authenticate using the token from localStorage
        const token = localStorage.getItem('access_token');
        if (token) {
          addDebugMessage('Attempting to set session with token from localStorage');
          try {
            const { error: sessionError } = await supabase.auth.setSession({
              access_token: token,
              refresh_token: '',
            });
            
            if (sessionError) {
              addDebugMessage(`Session error: ${sessionError.message}`);
            } else {
              addDebugMessage('Session successfully set');
              // Check again
              const { data: newSessionData } = await supabase.auth.getSession();
              addDebugMessage(`Re-check auth status: ${!!newSessionData?.session ? 'Authenticated' : 'Still not authenticated'}`);
            }
          } catch (sessionErr) {
            addDebugMessage(`Error setting session: ${sessionErr}`);
          }
        }
      }
      
      toast.loading(`Uploading ${files.length} images...`);
      
      // Try to list the bucket contents to test permissions
      try {
        const { data: folderData, error: folderError } = await supabase.storage
          .from(STORAGE_BUCKET)
          .list('rocks');
          
        if (folderError) {
          addDebugMessage(`Folder list error: ${folderError.message}`);
        } else {
          addDebugMessage(`Successfully listed folder contents. Found ${folderData.length} items.`);
        }
      } catch (folderErr) {
        addDebugMessage(`Error listing folder: ${folderErr}`);
      }
      
      // Upload each file
      const uploadPromises = files.map(file => uploadImage(file));
      const urls = await Promise.all(uploadPromises);
      
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
        } catch (dbErr) {
          const message = dbErr instanceof Error ? dbErr.message : String(dbErr);
          addDebugMessage(`Database error: ${message}`);
          toast.error('Images uploaded to storage but failed to update database');
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      addDebugMessage(`Upload error: ${errorMessage}`);
      toast.dismiss();
      toast.error('Failed to upload images');
      setError(errorMessage);
    } finally {
      setIsUploading(false);
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