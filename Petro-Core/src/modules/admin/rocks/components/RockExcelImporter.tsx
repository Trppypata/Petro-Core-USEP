import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/spinner';
import { toast } from 'sonner';
import { Import, File, AlertTriangle, Database, FileText, Zap } from 'lucide-react';
import { importRocksFromExcel, getRockStats, importDefaultRocks } from '../services';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Progress } from '@/components/ui/progress';
import axios from 'axios';

const API_URL = import.meta.env.VITE_local_url || 'http://localhost:8000/api';

interface RockExcelImporterProps {
  onImportComplete?: () => void;
}

export function RockExcelImporter({ onImportComplete }: RockExcelImporterProps) {
  const [isImporting, setIsImporting] = useState(false);
  const [isImportingDefault, setIsImportingDefault] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showStats, setShowStats] = useState(false);
  const [stats, setStats] = useState<{
    totalCount: number;
    categoryCounts: Record<string, number>;
    samples: Record<string, any[]>;
  } | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [importProgress, setImportProgress] = useState({
    showProgress: false,
    current: 0,
    total: 0,
    status: ''
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage(null);
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
        toast.error('Please select an Excel file (.xlsx or .xls)');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) {
      toast.error('Please select an Excel file first');
      return;
    }

    setIsImporting(true);
    setErrorMessage(null);
    setImportProgress({
      showProgress: true,
      current: 0,
      total: 100,
      status: 'Uploading Excel file...'
    });
    
    try {
      console.log('Starting direct server import with file:', selectedFile.name);
      
      // Create FormData and append the file
      const formData = new FormData();
      formData.append('file', selectedFile);
      
      // Send the file directly to the server
      const response = await axios.post(`${API_URL}/rocks/import`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / (progressEvent.total || 100)
          );
          setImportProgress({
            showProgress: true,
            current: percentCompleted,
            total: 100,
            status: `Uploading: ${percentCompleted}%`
          });
        }
      });
      
      const result = response.data;
      console.log('Import result:', result);

      if (result.success) {
        toast.success(`Import complete! ${result.message || 'Rocks imported successfully.'}`);
        setSelectedFile(null);
        
        // Reset the file input
        const fileInput = document.getElementById('rock-excel-file') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
        
        if (onImportComplete) onImportComplete();
      } else {
        setErrorMessage(result.message || 'Import failed');
        toast.error(`Import failed: ${result.message}`);
      }
    } catch (error: any) {
      console.error('Error importing rocks:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
      setErrorMessage(errorMessage);
      toast.error(`Failed to import rocks: ${errorMessage}`);
    } finally {
      setIsImporting(false);
      setImportProgress(prev => ({ ...prev, showProgress: false }));
    }
  };

  const handleImportDefault = async () => {
    setIsImportingDefault(true);
    setErrorMessage(null);
    setImportProgress({
      showProgress: true,
      current: 0,
      total: 100,
      status: 'Importing default data...'
    });
    
    try {
      console.log('Starting import from default Excel file...');
      
      // Use the service function to import rocks from the default file
      const result = await importDefaultRocks();
      console.log('Default import result:', result);

      if (result.success) {
        toast.success(`Import complete! ${result.message}`);
        
        if (onImportComplete) onImportComplete();
      } else {
        setErrorMessage(result.message || 'Default import failed');
        toast.error(`Default import failed: ${result.message}`);
      }
    } catch (error: any) {
      console.error('Error importing default rocks:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
      setErrorMessage(errorMessage);
      toast.error(`Failed to import default rocks: ${errorMessage}`);
    } finally {
      setIsImportingDefault(false);
      setImportProgress(prev => ({ ...prev, showProgress: false }));
    }
  };

  const fetchStats = async () => {
    setIsLoadingStats(true);
    try {
      const data = await getRockStats();
      setStats(data);
    } catch (error) {
      console.error('Error fetching rock stats:', error);
      toast.error('Failed to load rock statistics');
    } finally {
      setIsLoadingStats(false);
    }
  };

  return (
    <div className="flex flex-col space-y-4 p-4 border rounded-lg">
      <h3 className="text-lg font-medium">Import Rocks from Excel</h3>
      <p className="text-sm text-muted-foreground">
        Upload an Excel file to import rock data in bulk. The file should have columns for 
        Rock Code, Rock Name, Type, Depositional Environment, Grain Size, etc.
      </p>
      
      {errorMessage && (
        <Alert variant="destructive" className="my-2">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Import Error</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}
      
      {importProgress.showProgress && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>{importProgress.status}</span>
            <span>{Math.round(importProgress.current)}%</span>
          </div>
          <Progress value={importProgress.current} max={importProgress.total} className="h-2" />
        </div>
      )}
      
      <div className="flex items-center space-x-2 flex-wrap gap-2">
        <Button
          variant="outline"
          onClick={() => document.getElementById('rock-excel-file')?.click()}
          className="flex items-center gap-2"
          disabled={isImporting || isImportingDefault}
        >
          <File className="h-4 w-4" />
          {selectedFile ? `${selectedFile.name} (${Math.round(selectedFile.size / 1024)} KB)` : 'Select Excel File'}
        </Button>
        <input
          type="file"
          id="rock-excel-file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={handleFileChange}
          disabled={isImporting || isImportingDefault}
        />
        
        <Button 
          onClick={handleImport}
          disabled={!selectedFile || isImporting || isImportingDefault}
          className="flex items-center gap-2"
        >
          {isImporting ? <Spinner className="h-4 w-4" /> : <Import className="h-4 w-4" />}
          {isImporting ? 'Importing...' : 'Import Excel File'}
        </Button>
        
        <Button 
          variant="secondary"
          onClick={handleImportDefault}
          disabled={isImporting || isImportingDefault}
          className="flex items-center gap-2"
        >
          {isImportingDefault ? <Spinner className="h-4 w-4" /> : <Database className="h-4 w-4" />}
          {isImportingDefault ? 'Importing...' : 'Import Default Data'}
        </Button>
        
        <Dialog open={showStats} onOpenChange={setShowStats}>
          <DialogTrigger asChild>
            <Button 
              variant="outline" 
              className="flex items-center gap-2"
              onClick={() => {
                setShowStats(true);
                fetchStats();
              }}
            >
              <FileText className="h-4 w-4" />
              View Database Stats
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Rock Database Statistics</DialogTitle>
              <DialogDescription>
                Current database statistics for the rocks collection
              </DialogDescription>
            </DialogHeader>
            {isLoadingStats ? (
              <div className="flex justify-center py-8">
                <Spinner />
              </div>
            ) : stats ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Total Rocks:</span>
                  <span className="text-lg">{stats.totalCount}</span>
                </div>
                
                <h4 className="font-medium text-lg mt-4">Rocks by Category</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {Object.entries(stats.categoryCounts).map(([category, count]) => (
                    <div key={category} className="flex justify-between border p-2 rounded">
                      <span>{category}</span>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
                </div>
                
                <h4 className="font-medium text-lg mt-4">Sample Data</h4>
                <div className="space-y-4">
                  {Object.entries(stats.samples).map(([category, samples]) => (
                    <div key={category} className="border rounded p-2">
                      <h5 className="font-medium">{category} ({samples.length} samples)</h5>
                      <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-2">
                        {samples.map((sample, index) => (
                          <div key={index} className="bg-muted p-2 rounded text-sm">
                            <p><span className="font-medium">Name:</span> {sample.name}</p>
                            <p><span className="font-medium">Code:</span> {sample.rock_code}</p>
                            <p><span className="font-medium">Type:</span> {sample.type || '-'}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-center py-4 text-muted-foreground">No statistics available</p>
            )}
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="mt-4 text-sm text-muted-foreground">
        <p className="font-medium">Important:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Excel sheets should be named by rock category (Igneous, Sedimentary, Metamorphic, Ore Samples)</li>
          <li>Each sheet must have proper column headers matching the field names</li>
          <li>Rock Name and Category are required fields</li>
          <li>Rock Code will be generated if not provided</li>
        </ul>
      </div>
    </div>
  );
} 