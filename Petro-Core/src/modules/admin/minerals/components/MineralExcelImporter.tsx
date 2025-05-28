import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/spinner';
import { toast } from 'sonner';
import { Import, File } from 'lucide-react';
import { parseExcelToMinerals } from '../utils/excel-parser';
import { useAddMineral } from '../hooks/useAddMineral';
import type { IMineral } from '../mineral.interface';
import { importMineralsFromExcel, importDefaultMinerals } from '../services/minerals.service';

interface MineralExcelImporterProps {
  onImportComplete?: () => void;
}

export function MineralExcelImporter({ onImportComplete }: MineralExcelImporterProps) {
  const [isImporting, setIsImporting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { addMineral } = useAddMineral();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
        toast.error('Please select an Excel file (.xlsx or .xls)');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleDirectImport = async () => {
    if (!selectedFile) {
      toast.error('Please select an Excel file first');
      return;
    }

    setIsImporting(true);
    try {
      // Use the service function to import minerals
      const result = await importMineralsFromExcel(selectedFile);

      if (result.success) {
        toast.success(`Import complete! ${result.message}`);
      } else {
        toast.error(`Import failed: ${result.message}`);
      }

      setSelectedFile(null);
      
      // Reset the file input
      const fileInput = document.getElementById('mineral-excel-file') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
      if (onImportComplete) onImportComplete();
    } catch (error: any) {
      console.error('Error importing minerals:', error);
      toast.error(`Failed to import minerals: ${error.message}`);
    } finally {
      setIsImporting(false);
    }
  };

  const handleDefaultImport = async () => {
    setIsImporting(true);
    try {
      // Import from default Excel file
      const result = await importDefaultMinerals();

      if (result.success) {
        toast.success(`Import complete! ${result.message}`);
      } else {
        toast.error(`Import failed: ${result.message}`);
      }
      
      if (onImportComplete) onImportComplete();
    } catch (error: any) {
      console.error('Error importing default minerals:', error);
      toast.error(`Failed to import default minerals: ${error.message}`);
    } finally {
      setIsImporting(false);
    }
  };

  const handleClientImport = async () => {
    if (!selectedFile) {
      toast.error('Please select an Excel file first');
      return;
    }

    setIsImporting(true);
    try {
      const minerals = await parseExcelToMinerals(selectedFile);
      
      // Batch import minerals
      let successCount = 0;
      let failCount = 0;

      for (const mineral of minerals) {
        try {
          await addMineral(mineral);
          successCount++;
        } catch (error) {
          console.error('Error adding mineral:', error);
          failCount++;
        }
      }

      toast.success(
        `Import complete! ${successCount} minerals imported successfully` + 
        (failCount > 0 ? `, ${failCount} failed` : '')
      );
      setSelectedFile(null);
      
      // Reset the file input
      const fileInput = document.getElementById('mineral-excel-file') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
      if (onImportComplete) onImportComplete();
    } catch (error) {
      console.error('Error parsing Excel file:', error);
      toast.error('Failed to parse Excel file. Please check the format.');
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
      
      <div className="flex items-center space-x-2 flex-wrap gap-2">
        <Button
          variant="outline"
          onClick={() => document.getElementById('mineral-excel-file')?.click()}
          className="flex items-center gap-2"
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
        />
        
        <Button 
          onClick={handleDirectImport}
          disabled={!selectedFile || isImporting}
          className="flex items-center gap-2"
        >
          {isImporting ? (
            <Spinner className="h-4 w-4" />
          ) : (
            <Import className="h-4 w-4" />
          )}
          {isImporting ? 'Importing...' : 'Import Using API'}
        </Button>
        
        <Button 
          onClick={handleClientImport}
          disabled={!selectedFile || isImporting}
          className="flex items-center gap-2"
          variant="outline"
        >
          {isImporting ? (
            <Spinner className="h-4 w-4" />
          ) : (
            <Import className="h-4 w-4" />
          )}
          {isImporting ? 'Importing...' : 'Import in Browser'}
        </Button>

        <Button 
          onClick={handleDefaultImport}
          disabled={isImporting}
          className="flex items-center gap-2"
          variant="secondary"
        >
          {isImporting ? (
            <Spinner className="h-4 w-4" />
          ) : (
            <Import className="h-4 w-4" />
          )}
          {isImporting ? 'Importing...' : 'Import Default Dataset'}
        </Button>
      </div>
      
      <p className="text-xs text-muted-foreground">
        * API import uses the server to process the Excel file and is more efficient for large files<br />
        * Browser import parses the file in your browser and adds minerals one by one<br />
        * Default Dataset import uses the pre-loaded DK_MINERALS_DATABASE.xlsx file
      </p>
    </div>
  );
} 