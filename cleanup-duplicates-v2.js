/**
 * Script to remove duplicate rocks from database
 * Keeps the oldest entry for each unique rock name + category combination
 * Run with: node cleanup-duplicates-v2.js
 */
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = 'https://tobjghstopxuntbewrxu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRvYmpnaHN0b3B4dW50YmV3cnh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzMTE5NjYsImV4cCI6MjA2Mzg4Nzk2Nn0.lJAbvvhwbqfOj9ChVOp1pI_lpT5gUsD_6YmgyB6OFho';

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanupDuplicates() {
  try {
    console.log('🧹 Starting duplicate cleanup...');
    
    // Get all rocks
    const { data: allRocks, error: fetchError } = await supabase
      .from('rocks')
      .select('*')
      .order('created_at', { ascending: true });
    
    if (fetchError) {
      console.error('❌ Error fetching rocks:', fetchError);
      return;
    }
    
    console.log(`📊 Found ${allRocks.length} total rocks`);
    
    // Group by name and category to find duplicates
    const groups = {};
    const duplicates = [];
    
    allRocks.forEach(rock => {
      const key = `${rock.name.toLowerCase().trim()}-${rock.category.toLowerCase().trim()}`;
      
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(rock);
    });
    
    // Find groups with more than one rock (duplicates)
    Object.entries(groups).forEach(([key, rocks]) => {
      if (rocks.length > 1) {
        console.log(`\n🔍 Found ${rocks.length} duplicates for: ${key}`);
        rocks.forEach(rock => {
          console.log(`   - ${rock.name} (${rock.rock_code}) - Created: ${rock.created_at}`);
        });
        
        // Keep the oldest (first) rock, mark others for deletion
        const [keepRock, ...duplicateRocks] = rocks;
        console.log(`   ✅ Keeping: ${keepRock.name} (${keepRock.rock_code})`);
        
        duplicateRocks.forEach(rock => {
          duplicates.push(rock.id);
          console.log(`   🗑️  Marking for deletion: ${rock.name} (${rock.rock_code})`);
        });
      }
    });
    
    if (duplicates.length === 0) {
      console.log('\n✅ No duplicates found!');
      return;
    }
    
    console.log(`\n🗑️  Found ${duplicates.length} duplicate rocks to delete`);
    
    // Delete duplicates
    const { error: deleteError } = await supabase
      .from('rocks')
      .delete()
      .in('id', duplicates);
    
    if (deleteError) {
      console.error('❌ Error deleting duplicates:', deleteError);
      return;
    }
    
    console.log(`✅ Successfully deleted ${duplicates.length} duplicate rocks`);
    
    // Verify the cleanup
    const { data: remainingRocks, error: verifyError } = await supabase
      .from('rocks')
      .select('*');
    
    if (verifyError) {
      console.error('❌ Error verifying cleanup:', verifyError);
      return;
    }
    
    console.log(`\n📊 After cleanup: ${remainingRocks.length} rocks remaining`);
    
    // Show breakdown by category
    const categoryCount = {};
    remainingRocks.forEach(rock => {
      categoryCount[rock.category] = (categoryCount[rock.category] || 0) + 1;
    });
    
    console.log('\n📋 Rocks by category:');
    Object.entries(categoryCount).forEach(([category, count]) => {
      console.log(`   - ${category}: ${count}`);
    });
    
  } catch (error) {
    console.error('❌ Error in cleanup:', error);
  }
}

// Run the cleanup
cleanupDuplicates();
