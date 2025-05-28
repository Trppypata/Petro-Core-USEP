import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Script to copy Excel files from Server/src/excel to Petro-Core/src/assets
 */
async function copyExcelFiles() {
  try {
    // Make sure the assets directory exists
    const assetsDir = path.resolve(__dirname, '../src/assets');
    if (!fs.existsSync(assetsDir)) {
      fs.mkdirSync(assetsDir, { recursive: true });
    }
    
    // Path to Server Excel files
    const serverExcelDir = path.resolve(__dirname, '../../Server/src/excel');
    
    if (fs.existsSync(serverExcelDir)) {
      // Read all Excel files
      const files = fs.readdirSync(serverExcelDir).filter(
        (file) => file.endsWith('.xlsx') || file.endsWith('.xls')
      );
      
      if (files.length === 0) {
        console.warn('No Excel files found in Server/src/excel');
        return;
      }
      
      // Copy each file to assets
      for (const file of files) {
        const sourcePath = path.join(serverExcelDir, file);
        const destPath = path.join(assetsDir, file);
        
        fs.copyFileSync(sourcePath, destPath);
        console.log(`Copied ${file} to assets directory`);
      }
      
      console.log('All Excel files copied successfully');
    } else {
      console.warn('Server Excel directory not found');
    }
  } catch (error) {
    console.error('Error copying Excel files:', error);
    process.exit(1);
  }
}

// Execute the function
copyExcelFiles(); 