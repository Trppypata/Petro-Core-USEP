/**
 * Script to check the current state of rocks in the database
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tobjghstopxuntbewrxu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRvYmpnaHN0b3B4dW50YmV3cnh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzMTE5NjYsImV4cCI6MjA2Mzg4Nzk2Nn0.lJAbvvhwbqfOj9ChVOp1pI_lpT5gUsD_6YmgyB6OFho';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRocks() {
  try {
    console.log('🔍 Checking current rocks in database...');
    
    // Get all rocks
    const { data: rocks, error } = await supabase
      .from('rocks')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Error fetching rocks:', error);
      return;
    }
    
    console.log(`📊 Found ${rocks.length} total rocks`);
    
    // Show recent rocks
    console.log('\n📋 Recent rocks (last 10):');
    rocks.slice(0, 10).forEach((rock, index) => {
      console.log(`${index + 1}. ${rock.name} (${rock.rock_code}) - Created: ${rock.created_at}`);
    });
    
    // Count by category
    const categoryCounts = {};
    rocks.forEach(rock => {
      const category = rock.category || 'Unknown';
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    });
    
    console.log('\n📊 Rocks by category:');
    Object.entries(categoryCounts).forEach(([category, count]) => {
      console.log(`- ${category}: ${count}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkRocks();
