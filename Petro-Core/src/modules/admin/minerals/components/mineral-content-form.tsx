import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Upload } from 'lucide-react';
import { importDefaultMinerals, importMineralsFromExcel } from '../services/minerals.service';
import { toast } from 'sonner';

const MineralContentForm = () => {
  const [isImporting, setIsImporting] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleImportDefault = async () => {
    try {
      setIsImporting(true);
      const result = await importDefaultMinerals();
      
      toast.success("Import Successful", {
        description: result.message || "Default minerals imported successfully"
      });
      
      // Reload the page to refresh data
      window.location.reload();
    } catch (error: any) {
      toast.error("Import Failed", {
        description: error.message || "Failed to import default minerals"
      });
    } finally {
      setIsImporting(false);
      setShowImportDialog(false);
    }
  };

  const handleImportFromExcel = async () => {
    if (!selectedFile) {
      toast.error("No File Selected", {
        description: "Please select an Excel file to import"
      });
      return;
    }

    try {
      setIsImporting(true);
      const result = await importMineralsFromExcel(selectedFile);
      
      toast.success("Import Successful", {
        description: result.message || "Minerals imported successfully"
      });
      
      // Reload the page to refresh data
      window.location.reload();
    } catch (error: any) {
      toast.error("Import Failed", {
        description: error.message || "Failed to import minerals from Excel"
      });
    } finally {
      setIsImporting(false);
      setShowImportDialog(false);
    }
  };

  return (
    <div className="flex gap-2">
      <Button 
        variant="outline" 
        className="flex items-center gap-2"
        onClick={() => setShowImportDialog(true)}
      >
        <Plus className="w-4 h-4" />
        Add Mineral
      </Button>
      
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Minerals</DialogTitle>
            <DialogDescription>
              Import minerals from an Excel file or use the default database.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="excel-file">Upload Excel File</Label>
              <Input
                id="excel-file"
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowImportDialog(false)}
              disabled={isImporting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleImportFromExcel}
              disabled={!selectedFile || isImporting}
              className="ml-2"
            >
              {isImporting ? 'Importing...' : 'Import from Excel'}
            </Button>
            <Button
              onClick={handleImportDefault}
              disabled={isImporting}
              className="ml-2"
            >
              {isImporting ? 'Importing...' : 'Import Default Data'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MineralContentForm; 