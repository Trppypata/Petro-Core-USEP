// Simple script to compile and run the migration
const { exec } = require('child_process');
const path = require('path');

console.log('Compiling migration script...');

// Compile the TypeScript file
exec('npx tsc src/migrations/add-protolith-column.ts --outDir dist', (compileError, stdout, stderr) => {
  if (compileError) {
    console.error(`Compilation error: ${compileError}`);
    return;
  }
  
  if (stderr) {
    console.error(`Compilation stderr: ${stderr}`);
  }
  
  console.log('Compilation successful. Running migration...');
  
  // Run the compiled JavaScript file
  exec('node dist/migrations/add-protolith-column.js', (runError, runStdout, runStderr) => {
    if (runError) {
      console.error(`Migration error: ${runError}`);
      return;
    }
    
    if (runStderr) {
      console.error(`Migration stderr: ${runStderr}`);
    }
    
    console.log(runStdout);
    console.log('Migration process completed.');
  });
}); 