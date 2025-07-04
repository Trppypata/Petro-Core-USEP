import { supabase } from './supabase';

/**
 * Creates the necessary storage buckets for the application if they don't exist
 */
export const setupStorageBuckets = async () => {
  try {
    console.log('Setting up storage buckets...');
    
    // Create rocks-minerals bucket if it doesn't exist
    const { data: buckets, error: getBucketsError } = await supabase
      .storage
      .listBuckets();
    
    if (getBucketsError) {
      console.error('Error listing storage buckets:', getBucketsError);
      return;
    }
    
    const bucketNames = buckets.map(bucket => bucket.name);
    console.log('Existing buckets:', bucketNames);
    
    // Check if rocks-minerals bucket exists
    if (!bucketNames.includes('rocks-minerals')) {
      console.log('Creating rocks-minerals bucket...');
      
      const { data, error } = await supabase
        .storage
        .createBucket('rocks-minerals', {
          public: true,
          fileSizeLimit: 10485760, // 10MB
          allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp']
        });
      
      if (error) {
        console.error('Error creating rocks-minerals bucket:', error);
      } else {
        console.log('rocks-minerals bucket created successfully:', data);
        
        // Set up public access for the bucket
        const { error: policyError } = await supabase
          .storage
          .from('rocks-minerals')
          .createSignedUrl('dummy.txt', 1); // Just to test bucket access
        
        if (policyError) {
          console.warn('Note: Need to set up storage permissions in Supabase dashboard:', policyError);
        }
      }
    } else {
      console.log('rocks-minerals bucket already exists');
    }
    
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
        
        // Test bucket access
        try {
          const testBlob = new Blob(['Test content'], { type: 'text/plain' });
          const { error: uploadError } = await supabase
            .storage
            .from('fieldworks')
            .upload('test-access.txt', testBlob, { upsert: true });
          
          if (uploadError) {
            console.warn('Note: Could not upload test file to fieldworks bucket:', uploadError);
          } else {
            console.log('Successfully uploaded test file to fieldworks bucket');
            
            // Clean up test file
            await supabase
              .storage
              .from('fieldworks')
              .remove(['test-access.txt']);
          }
        } catch (testError) {
          console.error('Error testing fieldworks bucket access:', testError);
        }
      }
    } else {
      console.log('fieldworks bucket already exists');
    }
    
    // Create folders within the bucket
    console.log('Creating folders...');
    
    // Create rocks folder
    const { error: rocksFolderError } = await supabase
      .storage
      .from('rocks-minerals')
      .upload('rocks/.keep', new Blob([''], { type: 'text/plain' }), {
        upsert: true
      });
      
    if (rocksFolderError && !rocksFolderError.message.includes('The resource already exists')) {
      console.error('Error creating rocks folder:', rocksFolderError);
    } else {
      console.log('rocks folder created or already exists');
    }
    
    // Create minerals folder
    const { error: mineralsFolderError } = await supabase
      .storage
      .from('rocks-minerals')
      .upload('minerals/.keep', new Blob([''], { type: 'text/plain' }), {
        upsert: true
      });
      
    if (mineralsFolderError && !mineralsFolderError.message.includes('The resource already exists')) {
      console.error('Error creating minerals folder:', mineralsFolderError);
    } else {
      console.log('minerals folder created or already exists');
    }
    
    console.log('Storage setup completed');
    
  } catch (error) {
    console.error('Error setting up storage:', error);
  }
}; 