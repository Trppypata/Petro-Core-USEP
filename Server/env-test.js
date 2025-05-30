const fs = require('fs');
const dotenv = require('dotenv');
const path = require('path');

// Read the .env file directly to check its format
const envPath = path.resolve(__dirname, '.env');
console.log('Looking for .env file at:', envPath);

if (fs.existsSync(envPath)) {
  console.log('Found .env file!');
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  // Print the file content without revealing sensitive information
  const sanitizedContent = envContent
    .split('\n')
    .map(line => {
      const [key, ...valueParts] = line.split('=');
      if (!key || key.startsWith('#')) return line;
      return key + '=' + (valueParts.join('=') ? '***' : '');
    })
    .join('\n');
  
  console.log('Sanitized .env content:');
  console.log(sanitizedContent);
  
  // Try loading with dotenv
  dotenv.config({ path: envPath });
  console.log('\nLoaded environment variables:');
  console.log('SUPABASE_URL exists:', !!process.env.SUPABASE_URL);
  console.log('SUPABASE_URL starts with https:', process.env.SUPABASE_URL?.startsWith('https://'));
  console.log('SUPABASE_SERVICE_ROLE_KEY exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
  console.log('SUPABASE_SERVICE_ROLE_KEY length:', process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0);
} else {
  console.error('.env file not found at path:', envPath);
} 