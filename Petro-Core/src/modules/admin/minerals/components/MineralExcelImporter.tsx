import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/spinner';
import { toast } from 'sonner';
import { Import, File, AlertTriangle } from 'lucide-react';
import { importMineralsFromExcel } from '../services/minerals.service';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface MineralExcelImporterProps {
  onImportComplete?: () => void;
}

export function MineralExcelImporter({ onImportComplete }: MineralExcelImporterProps) {
  const [isImporting, setIsImporting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
    
    try {
      console.log('Starting import with file:', selectedFile.name);
      
      // Use the service function to import minerals
      const result = await importMineralsFromExcel(selectedFile);
      console.log('Import result:', result);

      if (result.success) {
        toast.success(`Import complete! ${result.message}`);
        setSelectedFile(null);
        
        // Reset the file input
        const fileInput = document.getElementById('mineral-excel-file') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
        
        if (onImportComplete) onImportComplete();
      } else {
        setErrorMessage(result.message || 'Import failed');
        toast.error(`Import failed: ${result.message}`);
      }
    } catch (error: any) {
      console.error('Error importing minerals:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
      setErrorMessage(errorMessage);
      toast.error(`Failed to import minerals: ${errorMessage}`);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="flex flex-col space-y-4 p-4 border rounded-lg">
      <h3 className="text-lg font-medium">Import Minerals from Excel</h3>
      <p className="text-sm text-muted-foreground">
        Upload an Excel file to import mineral data in bulk. The file should have columns for 
        Mineral Code, Mineral Name, Chemical Formula, Mineral Group, Color, Streak, etc.
      </p>
      
      {errorMessage && (
        <Alert variant="destructive" className="my-2">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Import Error</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}
      
      <div className="flex items-center space-x-2 flex-wrap gap-2">
        <Button
          variant="outline"
          onClick={() => document.getElementById('mineral-excel-file')?.click()}
          className="flex items-center gap-2"
          disabled={isImporting}
        >
          <File className="h-4 w-4" />
          {selectedFile ? `${selectedFile.name} (${Math.round(selectedFile.size / 1024)} KB)` : 'Select Excel File'}
        </Button>
        <input
          type="file"
          id="mineral-excel-file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={handleFileChange}
          disabled={isImporting}
        />
        
        <Button 
          onClick={handleImport}
          disabled={!selectedFile || isImporting}
          className="flex items-center gap-2"
        >
          {isImporting ? (
            <Spinner className="h-4 w-4" />
          ) : (
            <Import className="h-4 w-4" />
          )}
          {isImporting ? 'Importing...' : 'Import Excel File'}
        </Button>
      </div>
    </div>
  );
} 