/**
 * This script helps set up Supabase credentials
 * Run with: node setup-supabase.js
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration values
const SUPABASE_URL = 'https://tobjghstopxuntbewrxu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRvYmpnaHN0b3B4dW50YmV3cnh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTcyMDU1MDcsImV4cCI6MjAzMjc4MTUwN30.fOZFqrPtOkE4q6X9X6isgGpC8RO7XgXjpj9jOHQBQYI';

// .env file content
const envContent = `VITE_SUPABASE_URL=${SUPABASE_URL}
VITE_SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
`;

// Path to .env file
const envFilePath = path.join(__dirname, '.env');

// Write .env file
fs.writeFileSync(envFilePath, envContent);

console.log('Supabase configuration created successfully!');
console.log(`- .env file created at: ${envFilePath}`);
console.log('- Contents:');
console.log(envContent);
console.log('\nIMPORTANT NEXT STEPS:');
console.log('1. Make sure you have created a storage bucket named "rocks-minerals" in your Supabase project');
console.log('2. Create folders inside the bucket: "rocks" and "minerals"');
console.log('3. Set the bucket permissions to allow public access for reading');
console.log('4. Restart your application to apply the changes'); 