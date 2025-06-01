"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const supabase_1 = require("./config/supabase");
// Simple test object to verify the RPC function
const testRock = {
    rock_code: 'TEST-001',
    name: 'Test Rock',
    category: 'Test',
    type: 'Test Type',
    status: 'active',
};
async function testSupabaseRocks() {
    console.log('Testing Supabase connection for rocks...');
    try {
        // First, check if the rocks table exists
        console.log('Checking if rocks table exists...');
        const { count, error: countError } = await supabase_1.supabase
            .from('rocks')
            .select('*', { count: 'exact', head: true });
        if (countError) {
            console.error('Error accessing rocks table:', countError);
            console.log('This might indicate that the table does not exist or there are permission issues.');
        }
        else {
            console.log(`Success! Found ${count} rocks in the database.`);
        }
        // Test the RPC function
        console.log('\nTesting import_rocks RPC function...');
        try {
            const { data, error } = await supabase_1.supabase.rpc('import_rocks', {
                rocks_data: [testRock]
            });
            if (error) {
                console.error('RPC function error:', error);
            }
            else {
                console.log('RPC function success:', data);
            }
        }
        catch (rpcError) {
            console.error('RPC function not available or error occurred:', rpcError);
        }
        // Test direct insert
        console.log('\nTesting direct insert...');
        const { data: insertData, error: insertError } = await supabase_1.supabase
            .from('rocks')
            .upsert([testRock], {
            onConflict: 'rock_code',
            ignoreDuplicates: false,
        });
        if (insertError) {
            console.error('Direct insert error:', insertError);
            console.log('This might be due to Row Level Security (RLS) policies. Check your Supabase settings.');
        }
        else {
            console.log('Direct insert success!');
        }
    }
    catch (error) {
        console.error('General error during testing:', error);
    }
}
// Run the test
testSupabaseRocks().catch(console.error);
