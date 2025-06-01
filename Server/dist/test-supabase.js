"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Load environment variables first
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../.env') });
// For development only - bypass SSL/TLS verification
// WARNING: This should NEVER be used in production
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const supabase_js_1 = require("@supabase/supabase-js");
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
console.log('Environment variables:');
console.log('SUPABASE_URL exists:', !!supabaseUrl);
console.log('SUPABASE_URL format check:', supabaseUrl?.startsWith('https://'));
console.log('SUPABASE_SERVICE_ROLE_KEY exists:', !!supabaseServiceKey);
console.log('SUPABASE_SERVICE_ROLE_KEY length:', supabaseServiceKey?.length || 0);
if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
}
// Create Supabase client
const supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});
// Test connection
async function testConnection() {
    try {
        console.log('Testing Supabase connection...');
        // First, try a simple health check
        console.log('Checking auth service...');
        const { data: authData, error: authError } = await supabase.auth.getSession();
        if (authError) {
            console.error('Auth check failed:', authError);
        }
        else {
            console.log('Auth service check successful');
        }
        // Then try a database query that won't fail even if the table doesn't exist
        console.log('Checking database service...');
        const { data, error } = await supabase.rpc('get_service_status');
        if (error) {
            console.error('Database check failed:', error);
            // Try a simple query to public schema
            const { error: schemaError } = await supabase.from('_schema').select('*').limit(1);
            if (schemaError) {
                console.error('Schema check failed:', schemaError);
            }
        }
        else {
            console.log('Database service check successful:', data);
        }
        console.log('Test completed.');
    }
    catch (err) {
        console.error('Error during connection test:', err);
    }
}
// Run the test
testConnection().then(() => {
    console.log('Test script finished');
});
