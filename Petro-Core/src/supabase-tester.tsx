import { useState, useEffect } from "react";
import { supabase } from "./lib/supabase";
import { Button } from "./components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./components/ui/card";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "./components/ui/alert";
import { InfoIcon, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import { MultiFileUpload } from "./components/ui/file-upload";
import { RockImageUploader } from "./components/ui/rock-image-uploader";
import { uploadMultipleFiles } from "./services/storage.service";
import { getRealAuthToken } from "./modules/admin/minerals/services/minerals.service";

const STORAGE_BUCKET = "rocks-minerals";

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
  const [testRockId, setTestRockId] = useState<string>("test-rock-001");
  const [files, setFiles] = useState<File[]>([]);
  const [session, setSession] = useState<any>(null);
  const [authStatus, setAuthStatus] = useState<
    "loading" | "authenticated" | "unauthenticated"
  >("loading");
  const [buckets, setBuckets] = useState<BucketItem[]>([]);
  const [rocksMineralsBucketExists, setRocksMineralsBucketExists] = useState<
    boolean | null
  >(null);
  const [manualAuthToken, setManualAuthToken] = useState<string>("");
  const [useManualToken, setUseManualToken] = useState<boolean>(false);

  useEffect(() => {
    checkSession();
    checkBuckets();
  }, []);

  const addLog = (message: string) => {
    setLogs((prev) => [...prev, `[${new Date().toISOString()}] ${message}`]);
    console.log(message);
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const checkSession = async () => {
    try {
      addLog("Checking Supabase session...");
      setAuthStatus("loading");

      const { data, error } = await supabase.auth.getSession();

      if (error) {
        addLog(`Session error: ${error.message}`);
        setAuthStatus("unauthenticated");
        return;
      }

      if (data?.session) {
        addLog(`Session found: ${data.session.user.id}`);
        setSession(data.session);
        setAuthStatus("authenticated");
      } else {
        addLog("No active session");
        setAuthStatus("unauthenticated");

        // Try to get token from localStorage
        const token = getRealAuthToken();

        if (token) {
          addLog(`Found token in storage: ${token.substring(0, 15)}...`);
          setManualAuthToken(token);
          setUseManualToken(true);
        }
      }
    } catch (error: any) {
      addLog(`Session check error: ${error.message}`);
      setAuthStatus("unauthenticated");
    }
  };

  const checkBuckets = async () => {
    try {
      addLog("Checking Supabase storage buckets...");

      const { data, error } = await supabase.storage.listBuckets();

      if (error) {
        addLog(`Bucket list error: ${error.message}`);
        return;
      }

      if (data) {
        setBuckets(data);
        addLog(`Found ${data.length} buckets`);

        // Check if rocks-minerals bucket exists
        const rocksMineralsBucket = data.find(
          (bucket) => bucket.name === "rocks-minerals"
        );
        setRocksMineralsBucketExists(!!rocksMineralsBucket);

        if (rocksMineralsBucket) {
          addLog("rocks-minerals bucket exists!");

          // Check bucket contents
          try {
            const { data: folderData, error: folderError } =
              await supabase.storage.from("rocks-minerals").list("rocks");

            if (folderError) {
              addLog(`Error listing rocks folder: ${folderError.message}`);
            } else {
              addLog(`Found ${folderData.length} items in rocks folder`);
            }
          } catch (folderErr: any) {
            addLog(`Exception listing folder: ${folderErr.message}`);
          }
        } else {
          addLog("rocks-minerals bucket does not exist!");
        }
      }
    } catch (error: any) {
      addLog(`Bucket check error: ${error.message}`);
    }
  };

  const setAuthSessionManually = async () => {
    if (!manualAuthToken) {
      addLog("No manual token provided");
      return;
    }

    try {
      addLog("Setting Supabase session manually...");

      const { data, error } = await supabase.auth.setSession({
        access_token: manualAuthToken,
        refresh_token: manualAuthToken, // Using the same token as refresh token
      });

      if (error) {
        addLog(`Manual session error: ${error.message}`);
        return;
      }

      if (data?.session) {
        addLog("Manual session set successfully!");
        setSession(data.session);
        setAuthStatus("authenticated");
        // Store in localStorage too
        localStorage.setItem("access_token", manualAuthToken);
      } else {
        addLog("No session returned after manual set");
      }
    } catch (error: any) {
      addLog(`Manual session exception: ${error.message}`);
    }
  };

  const createBucket = async () => {
    try {
      addLog("Creating rocks-minerals bucket...");

      const { data, error } = await supabase.storage.createBucket(
        "rocks-minerals",
        {
          public: true,
        }
      );

      if (error) {
        addLog(`Create bucket error: ${error.message}`);
        return;
      }

      addLog("Bucket created successfully!");
      checkBuckets(); // Refresh bucket list
    } catch (error: any) {
      addLog(`Create bucket exception: ${error.message}`);
    }
  };

  const handleFilesChange = (newFiles: File[]) => {
    setFiles(newFiles);
    addLog(`Selected ${newFiles.length} files`);
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      addLog("No files selected");
      return;
    }

    try {
      addLog(`Starting direct upload of ${files.length} files...`);

      // Try setting session if using manual token
      if (useManualToken && manualAuthToken) {
        await setAuthSessionManually();
      }

      const urls = await uploadMultipleFiles(files, "rocks");

      if (urls.length > 0) {
        addLog(`Successfully uploaded ${urls.length} files:`);
        urls.forEach((url) => addLog(url));
      } else {
        addLog("No files were uploaded");
      }
    } catch (error: any) {
      addLog(`Upload error: ${error.message}`);
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Supabase Authentication Tester</CardTitle>
          <CardDescription>
            Test Supabase authentication and storage functionality
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="font-medium">Authentication Status:</div>
            {authStatus === "loading" && (
              <span className="flex items-center">
                <RefreshCw className="animate-spin h-4 w-4 mr-1" /> Checking...
              </span>
            )}
            {authStatus === "authenticated" && (
              <span className="flex items-center text-green-600">
                <CheckCircle className="h-4 w-4 mr-1" /> Authenticated
              </span>
            )}
            {authStatus === "unauthenticated" && (
              <span className="flex items-center text-red-600">
                <XCircle className="h-4 w-4 mr-1" /> Not authenticated
              </span>
            )}
          </div>

          {authStatus === "unauthenticated" && (
            <Alert>
              <InfoIcon className="h-4 w-4" />
              <AlertTitle>Not authenticated</AlertTitle>
              <AlertDescription>
                You need to be authenticated to use storage functionality
              </AlertDescription>
            </Alert>
          )}

          <div className="flex items-center gap-2">
            <div className="font-medium">Rocks-Minerals Bucket:</div>
            {rocksMineralsBucketExists === null && (
              <span className="flex items-center">
                <RefreshCw className="animate-spin h-4 w-4 mr-1" /> Checking...
              </span>
            )}
            {rocksMineralsBucketExists === true && (
              <span className="flex items-center text-green-600">
                <CheckCircle className="h-4 w-4 mr-1" /> Exists
              </span>
            )}
            {rocksMineralsBucketExists === false && (
              <span className="flex items-center text-red-600">
                <XCircle className="h-4 w-4 mr-1" /> Does not exist
              </span>
            )}
          </div>

          <div className="grid gap-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="rock-id">Test Rock ID</Label>
              <Input
                id="rock-id"
                value={testRockId}
                onChange={(e) => setTestRockId(e.target.value)}
                placeholder="Enter a test rock ID"
              />
            </div>

            {authStatus === "unauthenticated" && (
              <div className="space-y-2">
                <Label htmlFor="manual-token">Manual Auth Token</Label>
                <div className="flex gap-2">
                  <Input
                    id="manual-token"
                    value={manualAuthToken}
                    onChange={(e) => setManualAuthToken(e.target.value)}
                    placeholder="Paste your auth token here"
                  />
                  <Button onClick={setAuthSessionManually}>Set Session</Button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="file-upload">Test File Upload</Label>
              <MultiFileUpload
                onFilesChange={handleFilesChange}
                accept="image/*"
                multiple={true}
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <div>
            <Button variant="outline" onClick={checkSession} className="mr-2">
              Check Session
            </Button>
            <Button variant="outline" onClick={checkBuckets} className="mr-2">
              Check Buckets
            </Button>
            {rocksMineralsBucketExists === false && (
              <Button variant="outline" onClick={createBucket}>
                Create Bucket
              </Button>
            )}
          </div>
          <Button onClick={handleUpload} disabled={files.length === 0}>
            Upload Files
          </Button>
        </CardFooter>
      </Card>

      {testRockId && (
        <Card>
          <CardHeader>
            <CardTitle>RockImageUploader Component Test</CardTitle>
            <CardDescription>
              Testing the RockImageUploader component with Rock ID: {testRockId}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RockImageUploader
              rockId={testRockId}
              onSuccess={(images) =>
                addLog(
                  `RockImageUploader success: ${images.length} images uploaded`
                )
              }
            />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Debug Logs</CardTitle>
          <CardDescription>
            <Button variant="outline" size="sm" onClick={clearLogs}>
              Clear Logs
            </Button>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-slate-100 p-4 rounded-md h-96 overflow-y-auto font-mono text-xs">
            {logs.length === 0 ? (
              <div className="text-slate-500 italic">No logs yet</div>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="mb-1">
                  {log}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
