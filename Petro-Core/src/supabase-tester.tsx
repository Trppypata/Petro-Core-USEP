import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { Button } from './components/ui/button';
import { Alert, AlertDescription } from './components/ui/alert';
import { FileUpload } from './components/ui/file-upload';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';

const STORAGE_BUCKET = 'rocks-minerals';

// Define types for bucket and folder items
interface BucketItem {
  id: string;
  name: string;
  owner: string;
  created_at: string;
  updated_at: string;
  public: boolean;
}

interface FolderItem {
  id: string;
  name: string;
  metadata: Record<string, any>;
}

export function SupabaseTester() {
  const [logs, setLogs] = useState<string[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [bucketName, setBucketName] = useState('rocks-minerals');
  const [sessionInfo, setSessionInfo] = useState<any>(null);
  const [bucketInfo, setBucketInfo] = useState<any>(null);
  const [storageStatus, setStorageStatus] = useState<'unknown' | 'ok' | 'error'>('unknown');
  const [policies, setPolicies] = useState<any[]>([]);

  useEffect(() => {
    checkSession();
    checkBuckets();
  }, []);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `[${new Date().toISOString()}] ${message}`]);
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const checkSession = async () => {
    addLog('Checking Supabase session...');
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        addLog(`ERROR: Session check failed - ${error.message}`);
        setSessionInfo({ error: error.message });
      } else {
        const isAuthenticated = !!data.session;
        addLog(`Session check: User is ${isAuthenticated ? 'authenticated' : 'not authenticated'}`);
        if (isAuthenticated) {
          addLog(`User ID: ${data.session?.user.id}`);
          addLog(`User email: ${data.session?.user.email}`);
        }
        setSessionInfo(data);
      }
    } catch (err) {
      addLog(`ERROR: Session check exception - ${err instanceof Error ? err.message : String(err)}`);
      setSessionInfo({ error: String(err) });
    }
  };

  const checkBuckets = async () => {
    addLog('Checking Supabase storage buckets...');
    try {
      // List all buckets
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
      
      if (bucketsError) {
        addLog(`ERROR: Failed to list buckets - ${bucketsError.message}`);
        setStorageStatus('error');
        setBucketInfo({ error: bucketsError.message });
        return;
      }
      
      addLog(`Found ${buckets.length} buckets: ${buckets.map((b: BucketItem) => b.name).join(', ')}`);
      
      // Check if our bucket exists
      const ourBucket = buckets.find((b: BucketItem) => b.name === STORAGE_BUCKET);
      if (!ourBucket) {
        addLog(`WARNING: Bucket "${STORAGE_BUCKET}" not found!`);
        setStorageStatus('error');
        setBucketInfo({ buckets, error: `Bucket "${STORAGE_BUCKET}" not found` });
        return;
      }
      
      addLog(`Bucket "${STORAGE_BUCKET}" exists with ID: ${ourBucket.id}`);
      setStorageStatus('ok');
      setBucketInfo({ buckets, currentBucket: ourBucket });
      
      // Now check the policies for this bucket
      await checkPolicies();
      
      // Try to list the folders in the bucket
      const { data: folders, error: foldersError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .list();
        
      if (foldersError) {
        addLog(`ERROR: Failed to list folders - ${foldersError.message}`);
      } else {
        addLog(`Bucket contains ${folders.length} items: ${folders.map((f: FolderItem) => f.name).join(', ')}`);
      }
    } catch (err) {
      addLog(`ERROR: Bucket check exception - ${err instanceof Error ? err.message : String(err)}`);
      setStorageStatus('error');
      setBucketInfo({ error: String(err) });
    }
  };
  
  const checkPolicies = async () => {
    addLog('Checking storage policies...');
    try {
      // This is a mock since Supabase JS client doesn't have a direct way to get policies
      // In a real app, you would check this via the Supabase dashboard
      addLog('NOTE: Policy check requires manual verification in Supabase dashboard');
      addLog('Make sure you have these policies for the rocks-minerals bucket:');
      addLog('1. INSERT policy for authenticated users');
      addLog('2. SELECT policy for public access if images should be publicly viewable');
      
      // We'll use our knowledge of expected policies for this app
      setPolicies([
        { name: 'Authenticated users can upload', type: 'INSERT', definition: "auth.role() = 'authenticated'" },
        { name: 'Public Access', type: 'SELECT', definition: "true" }
      ]);
    } catch (err) {
      addLog(`ERROR: Policy check exception - ${err instanceof Error ? err.message : String(err)}`);
    }
  };
  
  const createBucket = async () => {
    addLog(`Creating bucket "${bucketName}"...`);
    
    try {
      const { data, error } = await supabase.storage.createBucket(bucketName, {
        public: true,
        fileSizeLimit: 52428800 // 50MB
      });
      
      if (error) {
        addLog(`ERROR: Failed to create bucket - ${error.message}`);
        return;
      }
      
      addLog(`Bucket "${bucketName}" created successfully!`);
      
      // Refresh bucket list
      checkBuckets();
    } catch (err) {
      addLog(`ERROR: ${err instanceof Error ? err.message : String(err)}`);
    }
  };
  
  const handleUpload = async () => {
    if (!file) {
      addLog("Please select a file first");
      return;
    }
    
    setIsLoading(true);
    addLog(`Uploading file: ${file.name} (${Math.round(file.size / 1024)} KB)`);
    
    try {
      // First check auth status
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        addLog("ERROR: No active session. Please log in first!");
        toast.error("Authentication required for upload");
        setIsLoading(false);
        return;
      }
      
      addLog(`Uploading as user: ${sessionData.session.user.email}`);
      
      // Generate a unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `test-${Date.now()}.${fileExt}`;
      const filePath = `test/${fileName}`;
      
      addLog(`File path: ${filePath}`);
      
      // First try to check/create the folder
      try {
        addLog(`Checking if 'test' folder exists...`);
        const { data: folderData, error: folderError } = await supabase.storage
          .from(bucketName)
          .list('test');
          
        if (folderError && !folderError.message.includes("The resource was not found")) {
          addLog(`WARNING: Folder check failed - ${folderError.message}`);
        } else {
          addLog(`Folder check successful`);
        }
      } catch (folderErr) {
        addLog(`WARNING: Folder check exception - ${folderErr instanceof Error ? folderErr.message : String(folderErr)}`);
      }
      
      // Upload the file
      addLog(`Starting upload...`);
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });
      
      if (error) {
        addLog(`ERROR: Upload failed - ${error.message}`);
        toast.error(`Upload failed: ${error.message}`);
        
        if (error.statusCode === 400) {
          addLog(`ERROR 400: This is likely a permissions issue. Check your bucket policies!`);
          addLog(`Make sure your bucket has an INSERT policy for authenticated users.`);
        }
        
        return;
      }
      
      addLog(`Upload successful! Path: ${data.path}`);
      
      // Get the public URL
      const { data: publicURL } = supabase.storage
        .from(bucketName)
        .getPublicUrl(data.path);
      
      addLog(`Public URL: ${publicURL.publicUrl}`);
      setUploadedUrl(publicURL.publicUrl);
      toast.success('File uploaded successfully!');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      addLog(`ERROR: Exception during upload - ${errorMsg}`);
      toast.error(`Upload error: ${errorMsg}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-4">Supabase Tester</h1>
      <p className="mb-6">Use this tool to test Supabase connectivity and storage functionality</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Session Status</CardTitle>
          </CardHeader>
          <CardContent>
            {sessionInfo ? (
              sessionInfo.error ? (
                <Alert variant="destructive">
                  <AlertDescription>Error: {sessionInfo.error}</AlertDescription>
                </Alert>
              ) : (
                <div>
                  <p>Status: {sessionInfo.session ? 'Authenticated' : 'Not authenticated'}</p>
                  {sessionInfo.session && (
                    <>
                      <p>User ID: {sessionInfo.session.user.id}</p>
                      <p>Email: {sessionInfo.session.user.email}</p>
                    </>
                  )}
                </div>
              )
            ) : (
              <p>Checking session...</p>
            )}
            <Button 
              variant="outline" 
              className="mt-4" 
              onClick={checkSession}
            >
              Refresh Session Info
            </Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Storage Status</CardTitle>
          </CardHeader>
          <CardContent>
            {bucketInfo ? (
              bucketInfo.error ? (
                <Alert variant="destructive">
                  <AlertDescription>Error: {bucketInfo.error}</AlertDescription>
                </Alert>
              ) : (
                <div>
                  <p>Status: {storageStatus === 'ok' ? 'OK' : 'Error'}</p>
                  <p>Buckets found: {bucketInfo.buckets?.length || 0}</p>
                  {bucketInfo.currentBucket && (
                    <p>"{bucketInfo.currentBucket.name}" bucket exists</p>
                  )}
                </div>
              )
            ) : (
              <p>Checking storage...</p>
            )}
            <Button 
              variant="outline" 
              className="mt-4" 
              onClick={checkBuckets}
            >
              Refresh Storage Info
            </Button>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Storage Policies</CardTitle>
          </CardHeader>
          <CardContent>
            {policies.length > 0 ? (
              <div className="space-y-2">
                {policies.map((policy, index) => (
                  <div key={index} className="p-2 bg-muted rounded-md">
                    <p><strong>{policy.name}</strong> ({policy.type})</p>
                    <p className="text-sm text-muted-foreground">Definition: {policy.definition}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p>No policy information available.</p>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Create Bucket</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={bucketName}
                onChange={(e) => setBucketName(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                placeholder="Bucket name"
              />
              <Button onClick={createBucket}>Create</Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Use this to create a new storage bucket if it doesn't exist
            </p>
          </CardContent>
        </Card>
      </div>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Test File Upload</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div>
              <FileUpload 
                onFileChange={setFile}
                maxSizeMB={50}
              />
            </div>
            
            <Button 
              onClick={handleUpload} 
              disabled={!file || isLoading}
            >
              {isLoading ? 'Uploading...' : 'Upload File'}
            </Button>
            
            {uploadedUrl && (
              <div className="mt-4">
                <h3 className="font-medium mb-2">Uploaded File:</h3>
                <img 
                  src={uploadedUrl} 
                  alt="Uploaded file" 
                  className="max-w-full h-auto max-h-40 object-contain bg-slate-100 rounded-md" 
                />
                <p className="text-sm mt-2 break-all">{uploadedUrl}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>
            Debug Logs
            <Button 
              variant="outline" 
              size="sm" 
              className="ml-2" 
              onClick={clearLogs}
            >
              Clear
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-muted p-4 rounded-md h-80 overflow-y-auto text-sm font-mono">
            {logs.length === 0 ? (
              <p className="text-muted-foreground">No logs yet. Actions will be logged here.</p>
            ) : (
              logs.map((log, i) => (
                <div key={i} className="mb-1">
                  {log.includes('ERROR') ? (
                    <p className="text-red-500">{log}</p>
                  ) : log.includes('WARNING') ? (
                    <p className="text-yellow-500">{log}</p>
                  ) : (
                    <p>{log}</p>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 