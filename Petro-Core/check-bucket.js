/**
 * This script checks if the required Supabase storage bucket exists and creates it if needed
 * Run with: node check-bucket.js
 */
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

// Load environment variables
dotenv.config();

const BUCKET_NAME = 'rocks-minerals';
const FOLDERS = ['rocks', 'minerals'];

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('ERROR: Missing Supabase credentials. Make sure to run setup-supabase.js first.');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkBucketExists() {
  try {
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error('ERROR: Failed to list buckets:', error.message);
      return false;
    }
    
    const bucket = buckets.find(b => b.name === BUCKET_NAME);
    return !!bucket;
  } catch (err) {
    console.error('ERROR: Failed to check bucket existence:', err.message);
    return false;
  }
}

async function createBucket() {
  try {
    const { data, error } = await supabase.storage.createBucket(BUCKET_NAME, {
      public: true,
      fileSizeLimit: 52428800 // 50MB
    });
    
    if (error) {
      console.error('ERROR: Failed to create bucket:', error.message);
      return false;
    }
    
    console.log(`✅ Bucket "${BUCKET_NAME}" created successfully`);
    return true;
  } catch (err) {
    console.error('ERROR: Failed to create bucket:', err.message);
    return false;
  }
}

async function main() {
  console.log('Checking Supabase configuration...');
  console.log(`- Supabase URL: ${supabaseUrl}`);
  console.log(`- API Key: ${supabaseKey.substring(0, 10)}...`);
  
  try {
    // Check if the bucket exists
    const bucketExists = await checkBucketExists();
    
    if (bucketExists) {
      console.log(`✅ Bucket "${BUCKET_NAME}" already exists`);
    } else {
      console.log(`⚠️ Bucket "${BUCKET_NAME}" does not exist. Creating...`);
      const created = await createBucket();
      
      if (!created) {
        console.error('❌ Failed to create bucket. Please check your Supabase console and create it manually.');
        return;
      }
    }
    
    console.log('\n🎉 Setup complete!');
    console.log('\nIMPORTANT: Make sure to set the bucket permissions in the Supabase dashboard:');
    console.log('1. Go to Storage > Buckets > rocks-minerals');
    console.log('2. Click on "Bucket Settings"');
    console.log('3. Set "Public" to ON');
    console.log('4. Under RLS, add policies to allow select for anon and authenticated users');
    
  } catch (err) {
    console.error('❌ An error occurred:', err.message);
  }
}

main(); 