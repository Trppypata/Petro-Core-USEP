import fs from 'fs';
import path from 'path';

/**
 * This function is meant to be used during development/build to copy Excel files
 * from the Server/src/excel directory to the Petro-Core/src/assets directory
 * 
 * Note: This should be executed as a script or build step, not in the browser
 */
export async function copyExcelFilesToAssets() {
  try {
    // Make sure the assets directory exists
    const assetsDir = path.resolve(process.cwd(), 'src/assets');
    if (!fs.existsSync(assetsDir)) {
      fs.mkdirSync(assetsDir, { recursive: true });
    }
    
    // Path to Server Excel files
    const serverExcelDir = path.resolve(process.cwd(), '../Server/src/excel');
    
    if (fs.existsSync(serverExcelDir)) {
      // Read all Excel files
      const files = fs.readdirSync(serverExcelDir).filter(
        (file) => file.endsWith('.xlsx') || file.endsWith('.xls')
      );
      
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
  }
}

/**
 * Returns a list of available Excel files in the assets directory
 */
export function getAvailableExcelFiles(): string[] {
  try {
    const assetsDir = path.resolve(process.cwd(), 'src/assets');
    
    if (fs.existsSync(assetsDir)) {
      return fs.readdirSync(assetsDir).filter(
        (file) => file.endsWith('.xlsx') || file.endsWith('.xls')
      );
    }
  } catch (error) {
    console.error('Error reading assets directory:', error);
  }
  
  return [];
} 