import { supabase } from '../config/supabase';

async function setupFieldworksBucket() {
  try {
    console.log('Setting up fieldworks bucket...');
    
    // List existing buckets
    const { data: buckets, error: getBucketsError } = await supabase
      .storage
      .listBuckets();
    
    if (getBucketsError) {
      console.error('Error listing storage buckets:', getBucketsError);
      return;
    }
    
    const bucketNames = buckets.map(bucket => bucket.name);
    console.log('Existing buckets:', bucketNames);
    
    // Check if fieldworks bucket exists
    if (!bucketNames.includes('fieldworks')) {
      console.log('Creating fieldworks bucket...');
      
      const { data, error } = await supabase
        .storage
        .createBucket('fieldworks', {
          public: true,
          fileSizeLimit: 10485760, // 10MB
          allowedMimeTypes: ['application/pdf']
        });
      
      if (error) {
        console.error('Error creating fieldworks bucket:', error);
      } else {
        console.log('fieldworks bucket created successfully:', data);
        
        // Note: Setting up policies must be done through the Supabase dashboard
        // or using the SQL editor with the appropriate queries since the JS client
        // doesn't support direct policy creation
        console.log('Note: Please set up bucket policies through the Supabase dashboard:');
        console.log('1. Go to Storage in the Supabase dashboard');
        console.log('2. Click on the fieldworks bucket');
        console.log('3. Go to the Policies tab');
        console.log('4. Set up policies for SELECT, INSERT, UPDATE, and DELETE operations');
        
        // Test bucket access
        const { error: accessError } = await supabase
          .storage
          .from('fieldworks')
          .upload('test-file.txt', new Blob(['This is a test file']), {
            upsert: true
          });
          
        if (accessError) {
          console.warn('Note: Could not upload test file to fieldworks bucket:', accessError);
        } else {
          console.log('Successfully uploaded test file to fieldworks bucket');
          
          // Clean up test file
          await supabase
            .storage
            .from('fieldworks')
            .remove(['test-file.txt']);
        }
      }
    } else {
      console.log('fieldworks bucket already exists');
      
      // Update bucket settings if needed
      const { error: updateError } = await supabase
        .storage
        .updateBucket('fieldworks', {
          public: true,
          fileSizeLimit: 10485760 // 10MB
        });
      
      if (updateError) {
        console.error('Error updating fieldworks bucket settings:', updateError);
      } else {
        console.log('fieldworks bucket settings updated successfully');
      }
    }
    
    console.log('Fieldworks bucket setup completed');
    
  } catch (error) {
    console.error('Error setting up fieldworks bucket:', error);
  }
}

// Run the setup
setupFieldworksBucket().then(() => {
  console.log('Done!');
  process.exit(0);
}).catch(err => {
  console.error('Script failed:', err);
  process.exit(1);
}); 