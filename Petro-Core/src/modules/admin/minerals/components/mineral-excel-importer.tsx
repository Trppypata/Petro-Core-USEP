import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/spinner";
import { toast } from "sonner";
import {
  Import,
  File,
  AlertTriangle,
  Database,
  FileText,
  Info,
} from "lucide-react";
import {
  importMineralsFromExcel,
  importDefaultMinerals,
} from "../services/minerals.service";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import axios from "axios";
import * as XLSX from "xlsx";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8001/api" ||
  "http://localhost:8001/api";

interface MineralExcelImporterProps {
  onImportComplete?: () => void;
}

const MineralExcelImporter = ({
  onImportComplete,
}: MineralExcelImporterProps) => {
  const [isImporting, setIsImporting] = useState(false);
  const [isImportingDefault, setIsImportingDefault] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fileAnalysis, setFileAnalysis] = useState<{
    sheets: string[];
    hasCarbonates: boolean;
    hasBorates: boolean;
  } | null>(null);
  const [importProgress, setImportProgress] = useState({
    showProgress: false,
    current: 0,
    total: 0,
    status: "",
  });

  // Function to analyze Excel file contents
  const analyzeExcelFile = async (file: File) => {
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });

      const sheets = workbook.SheetNames;

      // Check for both singular and plural forms
      const hasCarbonates = sheets.some(
        (sheet) =>
          sheet.toUpperCase() === "CARBONATES" ||
          sheet.toUpperCase() === "CARBONATE"
      );

      const hasBorates = sheets.some(
        (sheet) =>
          sheet.toUpperCase() === "BORATES" || sheet.toUpperCase() === "BORATE"
      );

      // Check for sheets with data
      const sheetInfo: Record<string, { rows: number; headers: string[] }> = {};

      for (const sheet of sheets) {
        const worksheet = workbook.Sheets[sheet];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        const headers =
          jsonData.length > 0 ? Object.keys(jsonData[0] as object) : [];

        sheetInfo[sheet] = {
          rows: jsonData.length,
          headers,
        };
      }

      console.log("Excel file analysis:", {
        filename: file.name,
        sheets,
        hasCarbonates,
        hasBorates,
        sheetInfo,
      });

      setFileAnalysis({ sheets, hasCarbonates, hasBorates });

      // Show info toast about the analysis
      toast.info(
        `File contains ${sheets.length} sheets. Carbonate: ${
          hasCarbonates ? "Found" : "Not found"
        }, Borate: ${hasBorates ? "Found" : "Not found"}`
      );

      if (!hasCarbonates || !hasBorates) {
        toast.warning(
          "Warning: Some expected mineral categories are missing from the Excel file."
        );
      }
    } catch (error) {
      console.error("Error analyzing Excel file:", error);
      toast.error("Failed to analyze Excel file structure");
      setFileAnalysis(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage(null);
    setFileAnalysis(null);
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
        toast.error("Please select an Excel file (.xlsx or .xls)");
        return;
      }
      setSelectedFile(file);

      // Analyze the selected file
      analyzeExcelFile(file);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) {
      toast.error("Please select an Excel file first");
      return;
    }

    setIsImporting(true);
    setErrorMessage(null);
    setImportProgress({
      showProgress: true,
      current: 0,
      total: 100,
      status: "Uploading Excel file...",
    });

    try {
      console.log("Starting import with file:", selectedFile.name);

      // Create FormData and append the file
      const formData = new FormData();
      formData.append("file", selectedFile);

      // Send the file directly to the server
      const response = await axios.post(
        `${API_URL}/minerals/import`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / (progressEvent.total || 100)
            );
            setImportProgress({
              showProgress: true,
              current: percentCompleted,
              total: 100,
              status: `Uploading: ${percentCompleted}%`,
            });
          },
        }
      );

      const result = response.data;
      console.log("Import result:", result);

      if (result.success) {
        toast.success(
          `Import complete! ${
            result.message || "Minerals imported successfully."
          }`
        );
        setSelectedFile(null);

        // Reset the file input
        const fileInput = document.getElementById(
          "mineral-excel-file"
        ) as HTMLInputElement;
        if (fileInput) fileInput.value = "";

        if (onImportComplete) onImportComplete();
      } else {
        setErrorMessage(result.message || "Import failed");
        toast.error(`Import failed: ${result.message}`);
      }
    } catch (error: any) {
      console.error("Error importing minerals:", error);
      const errorMessage =
        error.response?.data?.message || error.message || "Unknown error";
      setErrorMessage(errorMessage);
      toast.error(`Failed to import minerals: ${errorMessage}`);
    } finally {
      setIsImporting(false);
      setImportProgress((prev) => ({ ...prev, showProgress: false }));
    }
  };

  const handleImportDefault = async () => {
    setIsImportingDefault(true);
    setErrorMessage(null);
    setImportProgress({
      showProgress: true,
      current: 0,
      total: 100,
      status: "Importing default minerals data...",
    });

    try {
      console.log("Starting import from default Excel file...");

      // Use the service function to import minerals from the default file
      const result = await importDefaultMinerals();
      console.log("Default import result:", result);

      if (result.success) {
        toast.success(`Import complete! ${result.message}`);

        if (onImportComplete) onImportComplete();
      } else {
        setErrorMessage(result.message || "Default import failed");
        toast.error(`Default import failed: ${result.message}`);
      }
    } catch (error: any) {
      console.error("Error importing default minerals:", error);
      const errorMessage =
        error.response?.data?.message || error.message || "Unknown error";
      setErrorMessage(errorMessage);
      toast.error(`Failed to import default minerals: ${errorMessage}`);
    } finally {
      setIsImportingDefault(false);
      setImportProgress((prev) => ({ ...prev, showProgress: false }));
    }
  };

  return (
    <div className="flex flex-col space-y-4 p-4 border rounded-lg">
      <h3 className="text-lg font-medium">Import Minerals from Excel</h3>
      <p className="text-sm text-muted-foreground">
        Upload an Excel file to import mineral data in bulk. The file should
        have columns for Mineral Code, Mineral Name, Chemical Formula, Mineral
        Group, Color, Streak, etc.
      </p>

      {errorMessage && (
        <Alert variant="destructive" className="my-2">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Import Error</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      {fileAnalysis && (
        <Alert className="my-2">
          <Info className="h-4 w-4" />
          <AlertTitle>File Analysis</AlertTitle>
          <AlertDescription>
            <p>Sheets detected: {fileAnalysis.sheets.join(", ")}</p>
            <p>
              Carbonate category:{" "}
              {fileAnalysis.hasCarbonates ? "Present" : "Missing"}
            </p>
            <p>
              Borate category: {fileAnalysis.hasBorates ? "Present" : "Missing"}
            </p>
          </AlertDescription>
        </Alert>
      )}

      {importProgress.showProgress && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>{importProgress.status}</span>
            <span>{Math.round(importProgress.current)}%</span>
          </div>
          <Progress
            value={importProgress.current}
            max={importProgress.total}
            className="h-2"
          />
        </div>
      )}

      <div className="flex items-center space-x-2 flex-wrap gap-2">
        <Button
          variant="outline"
          onClick={() => document.getElementById("mineral-excel-file")?.click()}
          className="flex items-center gap-2"
          disabled={isImporting || isImportingDefault}
        >
          <File className="h-4 w-4" />
          {selectedFile
            ? `${selectedFile.name} (${Math.round(
                selectedFile.size / 1024
              )} KB)`
            : "Select Excel File"}
        </Button>
        <input
          type="file"
          id="mineral-excel-file"
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
          {isImporting ? (
            <Spinner className="h-4 w-4" />
          ) : (
            <Import className="h-4 w-4" />
          )}
          {isImporting ? "Importing..." : "Import Excel File"}
        </Button>

        <Button
          variant="secondary"
          onClick={handleImportDefault}
          disabled={isImporting || isImportingDefault}
          className="flex items-center gap-2"
        >
          {isImportingDefault ? (
            <Spinner className="h-4 w-4" />
          ) : (
            <Database className="h-4 w-4" />
          )}
          {isImportingDefault ? "Importing..." : "Import Default Data"}
        </Button>
      </div>
    </div>
  );
};

export default MineralExcelImporter;
