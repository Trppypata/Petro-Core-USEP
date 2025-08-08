/**
 * Script to clean up duplicate rocks in the database
 * Run with: node cleanup-duplicates.js
 */
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = 'https://tobjghstopxuntbewrxu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRvYmpnaHN0b3B4dW50YmV3cnh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzMTE5NjYsImV4cCI6MjA2Mzg4Nzk2Nn0.lJAbvvhwbqfOj9ChVOp1pI_lpT5gUsD_6YmgyB6OFho';

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanupDuplicates() {
  try {
    console.log('🔍 Finding duplicate rocks...');
    
    // Get all rocks
    const { data: rocks, error } = await supabase
      .from('rocks')
      .select('*')
      .order('name', { ascending: true });
    
    if (error) {
      console.error('❌ Error fetching rocks:', error);
      return;
    }
    
    console.log(`📊 Found ${rocks.length} total rocks`);
    
    // Group by name and category
    const groupedRocks = {};
    rocks.forEach(rock => {
      const key = `${rock.name.toLowerCase().trim()}-${rock.category.toLowerCase().trim()}`;
      if (!groupedRocks[key]) {
        groupedRocks[key] = [];
      }
      groupedRocks[key].push(rock);
    });
    
    // Find duplicates
    const duplicates = [];
    Object.entries(groupedRocks).forEach(([key, rockGroup]) => {
      if (rockGroup.length > 1) {
        duplicates.push({
          key,
          rocks: rockGroup
        });
      }
    });
    
    console.log(`🔍 Found ${duplicates.length} groups with duplicates`);
    
    if (duplicates.length === 0) {
      console.log('✅ No duplicates found!');
      return;
    }
    
    // Process each duplicate group
    for (const duplicateGroup of duplicates) {
      console.log(`\n📋 Processing: ${duplicateGroup.key}`);
      console.log(`   Found ${duplicateGroup.rocks.length} entries:`);
      
      duplicateGroup.rocks.forEach((rock, index) => {
        console.log(`   ${index + 1}. ID: ${rock.id}, Code: ${rock.rock_code}, Created: ${rock.created_at}`);
      });
      
      // Keep the first one (usually the oldest), delete the rest
      const toKeep = duplicateGroup.rocks[0];
      const toDelete = duplicateGroup.rocks.slice(1);
      
      console.log(`   ✅ Keeping: ID ${toKeep.id} (Code: ${toKeep.rock_code})`);
      
      // Delete the duplicates
      for (const rockToDelete of toDelete) {
        console.log(`   🗑️  Deleting: ID ${rockToDelete.id} (Code: ${rockToDelete.rock_code})`);
        
        const { error: deleteError } = await supabase
          .from('rocks')
          .delete()
          .eq('id', rockToDelete.id);
        
        if (deleteError) {
          console.error(`   ❌ Error deleting ${rockToDelete.id}:`, deleteError);
        } else {
          console.log(`   ✅ Successfully deleted ${rockToDelete.id}`);
        }
      }
    }
    
    console.log('\n🎉 Duplicate cleanup completed!');
    
  } catch (error) {
    console.error('❌ Error in cleanup:', error);
  }
}

// Run the cleanup
cleanupDuplicates();
