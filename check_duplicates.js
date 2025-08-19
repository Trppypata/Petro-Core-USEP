const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkDuplicates() {
  try {
    console.log('🔍 Checking for duplicate rocks...');
    
    const { data: rocks, error } = await supabase
      .from('rocks')
      .select('id, name, rock_code, category');
    
    if (error) {
      console.error('Error fetching rocks:', error);
      return;
    }
    
    const duplicates = {};
    
    // Group rocks by name (case-insensitive)
    rocks.forEach(rock => {
      const key = rock.name.toLowerCase().trim();
      if (!duplicates[key]) {
        duplicates[key] = [];
      }
      duplicates[key].push(rock);
    });
    
    // Find groups with more than one rock
    const duplicateGroups = Object.entries(duplicates).filter(([name, rocks]) => rocks.length > 1);
    
    if (duplicateGroups.length === 0) {
      console.log('✅ No duplicate rocks found!');
      return;
    }
    
    console.log(`\n❌ Found ${duplicateGroups.length} duplicate rock groups:\n`);
    
    for (const [name, rocks] of duplicateGroups) {
      console.log(`📋 "${name}":`);
      
      for (const rock of rocks) {
        // Check how many images each rock has
        const { data: images } = await supabase
          .from('rock_images')
          .select('id')
          .eq('rock_id', rock.id);
        
        const imageCount = images?.length || 0;
        
        console.log(`  - ID: ${rock.id}`);
        console.log(`    Code: ${rock.rock_code}`);
        console.log(`    Category: ${rock.category}`);
        console.log(`    Images: ${imageCount}`);
        console.log('');
      }
    }
    
    console.log('💡 Recommendation: Keep the rock with the most images and delete the others.');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkDuplicates();
