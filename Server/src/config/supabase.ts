import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

// Configure dotenv with explicit path to .env file
// Try multiple possible locations for the .env file
const possiblePaths = [
  path.resolve(process.cwd(), '.env'),            // Root of the project where npm run is executed
  path.resolve(__dirname, '../../.env'),          // Server directory
  path.resolve(__dirname, '../../../.env'),       // Parent directory
];

console.log('Checking for .env files at:');
possiblePaths.forEach(p => console.log(` - ${p}`));

// Try each path until we find one that works
let envLoaded = false;
for (const envPath of possiblePaths) {
  if (require('fs').existsSync(envPath)) {
    console.log(`Found .env file at: ${envPath}`);
    dotenv.config({ path: envPath });
    
    // Check if it loaded correctly
    if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.log('Successfully loaded environment variables from:', envPath);
      envLoaded = true;
      break;
    } else {
      console.log('Found .env file at', envPath, 'but it did not contain the required variables');
    }
  }
}

if (!envLoaded) {
  console.error('Could not find valid .env file with required variables in any of the checked locations');
  // Instead of immediately failing, let's continue and see if the environment variables
  // might be set by other means (like system environment variables)
}

// Debug environment variables
console.log('Environment variables loaded:');
console.log('SUPABASE_URL exists:', !!process.env.SUPABASE_URL);
console.log('SUPABASE_URL format check:', process.env.SUPABASE_URL?.startsWith('https://'));
console.log('SUPABASE_SERVICE_ROLE_KEY exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
console.log('SUPABASE_SERVICE_ROLE_KEY length:', process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0);

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables:');
  console.error('SUPABASE_URL:', supabaseUrl);
  console.error('SUPABASE_SERVICE_ROLE_KEY length:', supabaseServiceKey ? supabaseServiceKey.length : 0);
  throw new Error('Missing Supabase environment variables')
}

// Create the Supabase client
export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  global: {
    fetch: (...args) => {
      // Add a timeout to fetch requests
      const [resource, config] = args;
      return fetch(resource, {
        ...config,
        signal: AbortSignal.timeout(10000), // 10 second timeout
      }).catch(error => {
        console.error(`Fetch error for ${typeof resource === 'string' ? resource : 'request'}:`, error);
        throw error;
      });
    }
  }
})

// Test the connection
async function testSupabaseConnection() {
  try {
    console.log('Testing Supabase connection...');
    const { data, error } = await supabase.from('students').select('count()', { count: 'exact' });
    
    if (error) {
      console.error('Supabase connection test failed:', error);
      console.warn('This may indicate that the students table does not exist yet or there are connection issues.');
    } else {
      console.log('Supabase connection successful, table exists:', data);
    }
  } catch (err) {
    console.error('Error testing Supabase connection:', err);
  }
}

// Run the test connection (don't await it to avoid blocking server startup)
testSupabaseConnection(); 