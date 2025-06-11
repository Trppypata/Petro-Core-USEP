import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { Button } from './components/ui/button';

function TestFieldworksBucket() {
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadResult, setUploadResult] = useState<string>('');

  useEffect(() => {
    testBucketAccess();
  }, []);

  const createFieldworkPdfFolder = async () => {
    try {
      setResult(prev => prev + '\n\nCreating fieldworkpdf folder...');
      
      // Create a small placeholder file to create the folder
      const { data, error } = await supabase.storage
        .from('fieldworks')
        .upload('fieldworkpdf/.folder', new Blob([''], { type: 'text/plain' }), {
          upsert: true
        });
        
      if (error) {
        console.error('Error creating fieldworkpdf folder:', error);
        setResult(prev => prev + `\n❌ Failed to create fieldworkpdf folder: ${error.message}`);
      } else {
        console.log('fieldworkpdf folder created or already exists');
        setResult(prev => prev + '\n✅ fieldworkpdf folder created or already exists');
        
        // Check if we can list files in the folder
        const { data: folderFiles, error: listError } = await supabase.storage
          .from('fieldworks')
          .list('fieldworkpdf');
          
        if (listError) {
          console.error('Error listing fieldworkpdf folder:', listError);
          setResult(prev => prev + `\n❌ Cannot list fieldworkpdf folder: ${listError.message}`);
        } else {
          console.log('Files in fieldworkpdf folder:', folderFiles);
          setResult(prev => prev + `\n✅ Successfully listed fieldworkpdf folder: ${folderFiles.length} files found`);
        }
      }
    } catch (error) {
      console.error('Error creating fieldworkpdf folder:', error);
      setResult(prev => prev + `\n❌ Exception creating folder: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const testBucketAccess = async () => {
    setLoading(true);
    setResult('');
    
    try {
      console.log('Testing fieldworks bucket access...');
      
      // Test 1: Check if bucket exists by listing
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
      
      if (bucketsError) {
        console.error('Error listing buckets:', bucketsError);
        setResult(prev => prev + `\n❌ Cannot list buckets: ${bucketsError.message}`);
      } else {
        const fieldworksBucket = buckets.find((bucket: { name: string }) => bucket.name === 'fieldworks');
        console.log('Buckets:', buckets);
        
        if (fieldworksBucket) {
          setResult(prev => prev + `\n✅ Fieldworks bucket found in listBuckets`);
        } else {
          setResult(prev => prev + `\n❌ Fieldworks bucket NOT found in listBuckets`);
        }
      }
      
      // Test 2: Try to list files in the fieldworks bucket root
      const { data: rootFiles, error: rootError } = await supabase.storage
        .from('fieldworks')
        .list();
        
      if (rootError) {
        console.error('Error listing root files:', rootError);
        setResult(prev => prev + `\n❌ Cannot list files in fieldworks bucket root: ${rootError.message}`);
      } else {
        console.log('Files in fieldworks bucket root:', rootFiles);
        setResult(prev => prev + `\n✅ Successfully listed files in fieldworks bucket root: ${rootFiles.length} files found`);
        
        // Check if fieldworkpdf folder exists
        const pdfFolder = rootFiles.find((file: any) => file.name === 'fieldworkpdf');
        if (pdfFolder) {
          setResult(prev => prev + `\n✅ fieldworkpdf folder exists in the bucket`);
        } else {
          setResult(prev => prev + `\n❌ fieldworkpdf folder does not exist in the bucket`);
          
          // Create the folder
          await createFieldworkPdfFolder();
        }
      }
      
      // Test 3: Try to list files in the fieldworkpdf folder
      const { data: filesList, error: listError } = await supabase.storage
        .from('fieldworks')
        .list('fieldworkpdf');
        
      if (listError) {
        console.error('Error listing files in fieldworkpdf:', listError);
        setResult(prev => prev + `\n❌ Cannot list files in fieldworkpdf folder: ${listError.message}`);
      } else {
        console.log('Files in fieldworkpdf folder:', filesList);
        setFiles(filesList || []);
        setResult(prev => prev + `\n✅ Successfully listed files in fieldworkpdf folder: ${filesList.length} files found`);
      }
      
      // Test 4: Try to get a signed URL for the first file
      if (filesList && filesList.length > 0) {
        const firstFile = filesList[0];
        const { data: signedURL, error: signedError } = await supabase.storage
          .from('fieldworks')
          .createSignedUrl(`fieldworkpdf/${firstFile.name}`, 60);
          
        if (signedError) {
          console.error('Error getting signed URL:', signedError);
          setResult(prev => prev + `\n❌ Cannot create signed URL: ${signedError.message}`);
        } else {
          console.log('Signed URL:', signedURL);
          setResult(prev => prev + `\n✅ Successfully created signed URL for ${firstFile.name}`);
        }
      }
    } catch (error) {
      console.error('Error testing bucket access:', error);
      setResult(prev => prev + `\n❌ Exception: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const uploadTestFile = async () => {
    if (!selectedFile) {
      setUploadResult('Please select a file first');
      return;
    }
    
    setUploadResult('Uploading...');
    
    try {
      const fileName = `test-upload-${Date.now()}.${selectedFile.name.split('.').pop()}`;
      
      const { data, error } = await supabase.storage
        .from('fieldworks')
        .upload(`fieldworkpdf/${fileName}`, selectedFile, {
          cacheControl: '3600',
          upsert: false
        });
        
      if (error) {
        console.error('Upload error:', error);
        setUploadResult(`❌ Upload failed: ${error.message}`);
      } else {
        console.log('Upload successful:', data);
        setUploadResult(`✅ File uploaded successfully: ${fileName}`);
        
        // Refresh file list
        testBucketAccess();
      }
    } catch (error) {
      console.error('Error uploading:', error);
      setUploadResult(`❌ Upload exception: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Fieldworks Bucket Test</h1>
      
      <div className="mb-6">
        <Button 
          onClick={testBucketAccess} 
          disabled={loading}
          className="mr-4"
        >
          {loading ? 'Testing...' : 'Test Bucket Access'}
        </Button>
        
        <Button 
          onClick={createFieldworkPdfFolder} 
          disabled={loading}
          variant="outline"
        >
          Create fieldworkpdf Folder
        </Button>
        
        <pre className="mt-4 p-4 bg-gray-100 rounded whitespace-pre-wrap">
          {result || 'Click "Test Bucket Access" to start the test'}
        </pre>
      </div>
      
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-2">Files in fieldworkpdf folder:</h2>
        {files.length === 0 ? (
          <p>No files found</p>
        ) : (
          <ul className="list-disc pl-6">
            {files.map((file, index) => (
              <li key={index}>
                {file.name} ({Math.round(file.metadata?.size / 1024)} KB)
              </li>
            ))}
          </ul>
        )}
      </div>
      
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-2">Test File Upload</h2>
        <div className="flex items-center gap-4">
          <input
            type="file"
            onChange={handleFileChange}
            className="py-2"
          />
          <Button 
            onClick={uploadTestFile} 
            disabled={!selectedFile}
          >
            Upload Test File
          </Button>
        </div>
        {uploadResult && (
          <p className="mt-2">{uploadResult}</p>
        )}
      </div>
    </div>
  );
}

export default TestFieldworksBucket; 