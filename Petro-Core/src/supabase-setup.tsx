import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { Button } from './components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './components/ui/card';
import { Spinner } from './components/spinner';
import { toast } from 'sonner';

// Constants
const STORAGE_BUCKET = 'rocks-minerals';

export function SupabaseSetup() {
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [bucketStatus, setBucketStatus] = useState<'checking' | 'exists' | 'not-exists' | 'error'>('checking');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string>('');

  // Check Supabase connection
  useEffect(() => {
    async function checkConnection() {
      try {
        console.log('Testing Supabase connection...');
        
        // Check if environment variables are set
        if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
          setErrorMessage('Missing Supabase environment variables. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env file.');
          setConnectionStatus('error');
          return;
        }
        
        // Test connection with a basic query
        const { error } = await supabase.storage.listBuckets();
        
        if (error) {
          console.error('Supabase connection error:', error);
          setErrorMessage(`Connection error: ${error.message}`);
          setConnectionStatus('error');
        } else {
          console.log('Supabase connection successful');
          setConnectionStatus('connected');
          checkBucket();
        }
      } catch (err) {
        console.error('Unexpected error testing connection:', err);
        setErrorMessage(`Unexpected error: ${err instanceof Error ? err.message : String(err)}`);
        setConnectionStatus('error');
      }
    }
    
    checkConnection();
  }, []);
  
  // Check if bucket exists
  async function checkBucket() {
    try {
      console.log(`Checking if bucket "${STORAGE_BUCKET}" exists...`);
      setBucketStatus('checking');
      
      const { data: buckets, error } = await supabase.storage.listBuckets();
      
      if (error) {
        console.error('Error listing buckets:', error);
        setErrorMessage(`Error listing buckets: ${error.message}`);
        setBucketStatus('error');
        return;
      }
      
      const bucketExists = buckets?.some(bucket => bucket.name === STORAGE_BUCKET);
      
      if (bucketExists) {
        console.log(`Bucket "${STORAGE_BUCKET}" exists`);
        setBucketStatus('exists');
      } else {
        console.log(`Bucket "${STORAGE_BUCKET}" does not exist`);
        setBucketStatus('not-exists');
      }
    } catch (err) {
      console.error('Error checking bucket:', err);
      setErrorMessage(`Error checking bucket: ${err instanceof Error ? err.message : String(err)}`);
      setBucketStatus('error');
    }
  }
  
  // Create bucket
  async function createBucket() {
    try {
      console.log(`Creating bucket "${STORAGE_BUCKET}"...`);
      
      const { error } = await supabase.storage.createBucket(STORAGE_BUCKET, {
        public: true,
        fileSizeLimit: 52428800 // 50MB
      });
      
      if (error) {
        console.error('Error creating bucket:', error);
        setErrorMessage(`Error creating bucket: ${error.message}`);
        toast.error(`Failed to create bucket: ${error.message}`);
        return;
      }
      
      console.log(`Bucket "${STORAGE_BUCKET}" created successfully`);
      toast.success(`Bucket "${STORAGE_BUCKET}" created successfully`);
      setBucketStatus('exists');
    } catch (err) {
      console.error('Error creating bucket:', err);
      setErrorMessage(`Error creating bucket: ${err instanceof Error ? err.message : String(err)}`);
      toast.error(`Error creating bucket: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  
  // Handle file selection
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  }
  
  // Upload file
  async function uploadFile() {
    if (!selectedFile) {
      toast.error('Please select a file first');
      return;
    }
    
    if (bucketStatus !== 'exists') {
      toast.error(`Bucket "${STORAGE_BUCKET}" does not exist. Please create it first.`);
      return;
    }
    
    setIsUploading(true);
    setUploadedUrl('');
    
    try {
      // Generate a unique filename
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `test-upload-${Date.now()}.${fileExt}`;
      const filePath = `test/${fileName}`;
      
      console.log(`Uploading file ${selectedFile.name} to ${filePath}...`);
      
      // Upload the file
      const { data, error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(filePath, selectedFile, {
          cacheControl: '3600',
          upsert: true
        });
      
      if (error) {
        console.error('Upload error:', error);
        setErrorMessage(`Upload error: ${error.message}`);
        toast.error(`Upload failed: ${error.message}`);
        return;
      }
      
      console.log('Upload successful:', data);
      
      // Get the public URL
      const { data: publicURL } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(data.path);
      
      console.log('Public URL:', publicURL.publicUrl);
      setUploadedUrl(publicURL.publicUrl);
      toast.success('File uploaded successfully!');
    } catch (err) {
      console.error('Error uploading file:', err);
      setErrorMessage(`Error uploading file: ${err instanceof Error ? err.message : String(err)}`);
      toast.error(`Error uploading file: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsUploading(false);
    }
  }
  
  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Supabase Storage Setup</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Connection Status */}
            <div className="flex items-center justify-between p-2 border rounded">
              <span>Supabase Connection:</span>
              <span>
                {connectionStatus === 'checking' && <Spinner className="mr-2 h-4 w-4" />}
                {connectionStatus === 'connected' && <span className="text-green-500">Connected ✓</span>}
                {connectionStatus === 'error' && <span className="text-red-500">Error ✗</span>}
              </span>
            </div>
            
            {/* Bucket Status */}
            <div className="flex items-center justify-between p-2 border rounded">
              <span>Bucket "{STORAGE_BUCKET}":</span>
              <span>
                {bucketStatus === 'checking' && <Spinner className="mr-2 h-4 w-4" />}
                {bucketStatus === 'exists' && <span className="text-green-500">Exists ✓</span>}
                {bucketStatus === 'not-exists' && <span className="text-yellow-500">Does Not Exist</span>}
                {bucketStatus === 'error' && <span className="text-red-500">Error ✗</span>}
              </span>
            </div>
            
            {/* Error Message */}
            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
                <p className="font-semibold">Error:</p>
                <pre className="whitespace-pre-wrap mt-1">{errorMessage}</pre>
              </div>
            )}
            
            {/* Create Bucket Button */}
            {bucketStatus === 'not-exists' && (
              <Button 
                onClick={createBucket}
                className="w-full"
              >
                Create "{STORAGE_BUCKET}" Bucket
              </Button>
            )}
            
            {/* File Upload */}
            {bucketStatus === 'exists' && (
              <div className="space-y-4 p-3 border rounded">
                <p className="font-medium">Test File Upload</p>
                <input 
                  type="file" 
                  onChange={handleFileChange} 
                  className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/90"
                />
                
                <Button 
                  onClick={uploadFile} 
                  disabled={!selectedFile || isUploading}
                  className="w-full"
                >
                  {isUploading ? (
                    <>
                      <Spinner className="mr-2 h-4 w-4" />
                      Uploading...
                    </>
                  ) : (
                    'Upload File'
                  )}
                </Button>
                
                {uploadedUrl && (
                  <div className="mt-4">
                    <p className="font-medium mb-2">Uploaded Successfully:</p>
                    <div className="p-2 bg-gray-50 border rounded break-all">
                      <a 
                        href={uploadedUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline"
                      >
                        {uploadedUrl}
                      </a>
                    </div>
                    {uploadedUrl.endsWith('.jpg') || uploadedUrl.endsWith('.png') || uploadedUrl.endsWith('.gif') ? (
                      <div className="mt-2 border rounded p-2">
                        <img 
                          src={uploadedUrl} 
                          alt="Uploaded file" 
                          className="max-w-full h-auto max-h-64 mx-auto"
                        />
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <div className="text-xs text-gray-500">
            This utility will help diagnose Supabase storage issues.
          </div>
        </CardFooter>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Next Steps</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2">
            <li>Make sure your .env file has valid Supabase credentials</li>
            <li>Ensure the "rocks-minerals" bucket exists (create it if needed)</li>
            <li>Make sure you have proper Row Level Security (RLS) policies set in Supabase</li>
            <li>Test file upload with this utility before using in your application</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
} 