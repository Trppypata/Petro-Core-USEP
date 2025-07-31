import { useState, useEffect } from 'react';
import { Button } from './button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './card';
import { Label } from './label';
import { uploadFile } from '@/services/storage.service';
import { MultiFileUpload } from './file-upload';
import { toast } from 'sonner';
import { Spinner } from '../spinner';
import { supabase } from '@/lib/supabase';
import { Alert, AlertDescription, AlertTitle } from './alert';
import { InfoIcon, RefreshCcw } from 'lucide-react';
import { getRealAuthToken } from '@/modules/admin/minerals/services/minerals.service';

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isTableChecked, setIsTableChecked] = useState(false);
  const [debug, setDebug] = useState<string[]>([]);
  const [showDebug, setShowDebug] = useState(false);

  // Check for auth status on mount
  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        setError('Not authenticated. You might not be able to upload images.');
      }
    };
    
    checkAuth();
    checkTable();
  }, []);
  
  const addDebugMessage = (message: string) => {
    setDebug(prev => [...prev, `[${new Date().toISOString()}] ${message}`]);
  };
  
  // Create the rock_images table if it doesn't exist
  const createTableIfNeeded = async () => {
    try {
      addDebugMessage('Checking for rock_images table...');
      
      // First check if we have an active session
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        // Try to authenticate with token from localStorage
        const token =  getRealAuthToken()
          addDebugMessage('Setting session with token from localStorage');
          try {
            await supabase.auth.setSession({
              access_token: token,
              refresh_token: token, // Using the same token as refresh token
            });
          } catch (err) {
            addDebugMessage(`Session set error: ${err}`);
          }
        } else {
          addDebugMessage('No auth token found for authentication');
        }
      }
      
      // Try to create the table using RPC function if available
      const { error: rpcError } = await supabase.rpc('create_rock_images_table');
      
      if (rpcError && !rpcError.message.includes('does not exist')) {
        addDebugMessage(`RPC error: ${rpcError.message}`);
        
        // Fall back to direct table creation
        const { error } = await supabase.from('rock_images').select('count()', { count: 'exact', head: true });
        
        if (error && error.code === '42P01') { // Table doesn't exist
          addDebugMessage('Table does not exist, creating...');
          
          // Try to create the table directly
          const createTableSQL = `
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
          `;
          
          // This will likely fail unless the user has appropriate permissions
          const { error: createError } = await supabase.rpc('exec_sql', { sql_query: createTableSQL });
          
          if (createError) {
            addDebugMessage(`Create table error: ${createError.message}`);
            return false;
          } else {
            addDebugMessage('Table created successfully');
            return true;
          }
        } else if (error) {
          addDebugMessage(`Check table error: ${error.message}`);
          return false;
        } else {
          addDebugMessage('Table already exists');
          return true;
        }
      } else {
        addDebugMessage('Table check/creation successful via RPC');
        return true;
      }
    } catch (err) {
      addDebugMessage(`Table creation error: ${err}`);
      return false;
    }
  };
  
  const checkTable = async () => {
    try {
      const tableExists = await createTableIfNeeded();
      setIsTableChecked(true);
      if (!tableExists) {
        setError('Could not create or verify the rock_images table. Some features may not work.');
      }
    } catch (err) {
      setError(`Error checking for rock_images table: ${err}`);
      setIsTableChecked(true);
    }
  };
  
  const handleFilesChange = (newFiles: File[]) => {
    setFiles(newFiles);
    setErrorMap(null);
  };
  
  const handleUpload = async () => {
    if (!rockId) {
      setError('No rock ID provided');
      return;
    }
    
    if (!files.length) {
      setError('Please select at least one file to upload');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      addDebugMessage(`Starting upload for rock ID: ${rockId}`);
      addDebugMessage(`Files to upload: ${files.length}`);
      
      // Check authentication and try to set session if not authenticated
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        addDebugMessage('No active session, attempting to authenticate');
        
        // Try to get token from storage
        const token = getRealAuthToken()
                     
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
      
      // Import rock-images service and upload using its functions
      const { uploadRockImages } = await import('@/services/rock-images.service');
      
      // Show loading toast
      toast.loading(`Uploading ${files.length} images...`);
      
      // Upload the files to the 'rocks-minerals' bucket
      addDebugMessage('Calling uploadRockImages function with files to "rocks-minerals" bucket...');
      const result = await uploadRockImages(rockId, files);
      
      if (result && result.length > 0) {
        addDebugMessage(`Upload successful: ${result.length} images uploaded`);
        toast.dismiss();
        toast.success(`Successfully uploaded ${result.length} images`);
        
        // Call success callback if provided
        if (onSuccess) {
          onSuccess(result);
        }
        
        // Clear files array
        setFiles([]);
      } else {
        addDebugMessage('Upload function returned no results');
        throw new Error('No images were uploaded. Please try again.');
      }
    } catch (error: any) {
      console.error('Error uploading images:', error);
      setError(error.message || 'Failed to upload images');
      addDebugMessage(`Upload error: ${error.message || JSON.stringify(error)}`);
      toast.dismiss();
      toast.error('Failed to upload images');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Images</CardTitle>
        <CardDescription>Upload images for this rock specimen</CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <InfoIcon className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="images">Images</Label>
            <MultiFileUpload
              onFilesChange={handleFilesChange}
              accept="image/*"
              multiple={true}
            />
          </div>
          
          {showDebug && debug.length > 0 && (
            <div className="mt-4 p-3 bg-muted rounded-md text-xs font-mono h-40 overflow-auto">
              {debug.map((msg, i) => (
                <div key={i} className="mb-1">{msg}</div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setShowDebug(!showDebug)}
        >
          {showDebug ? 'Hide Debug' : 'Show Debug'}
        </Button>
        
        <div className="flex gap-2">
          {!isTableChecked && (
            <Button variant="outline" onClick={checkTable}>
              <RefreshCcw className="mr-2 h-4 w-4" />
              Check Table
            </Button>
          )}
          <Button 
            onClick={handleUpload} 
            disabled={loading || files.length === 0}
          >
            {loading ? <><Spinner size="sm" className="mr-2" /> Uploading...</> : 'Upload Images'}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}; 