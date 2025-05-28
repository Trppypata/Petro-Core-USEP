import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/spinner';
import { toast } from 'sonner';
import { Import, File } from 'lucide-react';
import { parseExcelToRocks } from '../utils/excel-parser';
import { useAddRock } from '../hooks/useAddRock';
import type { IRock } from '../rock.interface';

interface ExcelImporterProps {
  onImportComplete?: () => void;
}

export function ExcelImporter({ onImportComplete }: ExcelImporterProps) {
  const [isImporting, setIsImporting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { addRock } = useAddRock();

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

  const handleImport = async () => {
    if (!selectedFile) {
      toast.error('Please select an Excel file first');
      return;
    }

    setIsImporting(true);
    try {
      const rocks = await parseExcelToRocks(selectedFile);
      
      // Batch import rocks
      let successCount = 0;
      let failCount = 0;

      for (const rock of rocks) {
        try {
          await addRock(rock);
          successCount++;
        } catch (error) {
          console.error('Error adding rock:', error);
          failCount++;
        }
      }

      toast.success(
        `Import complete! ${successCount} rocks imported successfully` + 
        (failCount > 0 ? `, ${failCount} failed` : '')
      );
      setSelectedFile(null);
      
      // Reset the file input
      const fileInput = document.getElementById('excel-file') as HTMLInputElement;
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
      <h3 className="text-lg font-medium">Import Rocks from Excel</h3>
      <p className="text-sm text-muted-foreground">
        Upload an Excel file to import rock data in bulk. The file should have columns for 
        Rock Code, Rock Name, Type, Depositional Environment, etc.
      </p>
      
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          onClick={() => document.getElementById('excel-file')?.click()}
          className="flex items-center gap-2"
        >
          <File className="h-4 w-4" />
          {selectedFile ? `${selectedFile.name} (${Math.round(selectedFile.size / 1024)} KB)` : 'Select Excel File'}
        </Button>
        <input
          type="file"
          id="excel-file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={handleFileChange}
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
          {isImporting ? 'Importing...' : 'Import Data'}
        </Button>
      </div>
    </div>
  );
} 