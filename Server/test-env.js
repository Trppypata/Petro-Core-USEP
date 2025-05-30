const dotenv = require('dotenv');
const path = require('path');

const envPath = path.resolve(__dirname, '.env');
console.log('Loading .env file from:', envPath);
dotenv.config({ path: envPath });

console.log('Environment variables loaded:');
console.log('SUPABASE_URL exists:', !!process.env.SUPABASE_URL);
console.log('SUPABASE_URL value (first 5 chars):', process.env.SUPABASE_URL ? process.env.SUPABASE_URL.substring(0, 5) + '...' : 'undefined');
console.log('SUPABASE_SERVICE_ROLE_KEY exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
console.log('SUPABASE_SERVICE_ROLE_KEY length:', process.env.SUPABASE_SERVICE_ROLE_KEY ? process.env.SUPABASE_SERVICE_ROLE_KEY.length : 0); 