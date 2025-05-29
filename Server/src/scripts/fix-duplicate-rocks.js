const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

/**
 * Find and fix duplicate rock entries based on name and similar rock_code
 */
async function fixDuplicateRocks() {
  try {
    console.log('Checking for duplicate rock entries...');
    
    // Get all rocks
    const { data: rocks, error } = await supabase
      .from('rocks')
      .select('*')
      .order('name');
    
    if (error) {
      console.error('Error fetching rocks:', error);
      return;
    }
    
    console.log(`Found ${rocks.length} total rocks in database`);
    
    // Group rocks by name
    const rocksByName = {};
    rocks.forEach(rock => {
      if (!rocksByName[rock.name]) {
        rocksByName[rock.name] = [];
      }
      rocksByName[rock.name].push(rock);
    });
    
    // Find duplicates (same name, multiple entries)
    const duplicates = Object.entries(rocksByName)
      .filter(([_, rocks]) => rocks.length > 1)
      .map(([name, rocks]) => ({ name, rocks }));
    
    console.log(`Found ${duplicates.length} rocks with duplicate entries`);
    
    // Process each set of duplicates
    for (const { name, rocks } of duplicates) {
      console.log(`\nProcessing duplicate set for: ${name} (${rocks.length} entries)`);
      
      // Sort rocks by data completeness (most complete first)
      const rankedRocks = rocks.map(rock => {
        // Count non-empty fields as a simple completeness metric
        let completeness = 0;
        Object.entries(rock).forEach(([key, value]) => {
          if (value && value !== '' && key !== 'id' && key !== 'created_at' && key !== 'updated_at') {
            completeness++;
          }
        });
        return { rock, completeness };
      }).sort((a, b) => b.completeness - a.completeness);
      
      // Keep the most complete record
      const primary = rankedRocks[0].rock;
      const duplicatesToMerge = rankedRocks.slice(1).map(r => r.rock);
      
      console.log(`Selected primary record: ${primary.rock_code} (completeness: ${rankedRocks[0].completeness})`);
      duplicatesToMerge.forEach(dup => {
        console.log(`  Will merge: ${dup.rock_code} (completeness: ${rankedRocks.find(r => r.rock.id === dup.id).completeness})`);
      });
      
      // Merge data from duplicates into the primary record
      for (const duplicate of duplicatesToMerge) {
        for (const [key, value] of Object.entries(duplicate)) {
          // Skip certain fields
          if (['id', 'created_at', 'updated_at', 'rock_code', 'name'].includes(key)) {
            continue;
          }
          
          // Only use the duplicate's value if the primary's is empty
          if ((!primary[key] || primary[key] === '' || primary[key] === '-') && 
              (value && value !== '' && value !== '-')) {
            console.log(`  Updating ${key} from "${primary[key]}" to "${value}"`);
            primary[key] = value;
          }
        }
      }
      
      // Fix rock code format if needed
      if (primary.rock_code && primary.rock_code.includes(' ')) {
        const oldCode = primary.rock_code;
        primary.rock_code = primary.rock_code.replace(/\s+/g, '');
        console.log(`  Fixed rock code format from "${oldCode}" to "${primary.rock_code}"`);
      }
      
      // Update the primary record with merged data
      const { error: updateError } = await supabase
        .from('rocks')
        .update(primary)
        .eq('id', primary.id);
      
      if (updateError) {
        console.error(`  Error updating primary record:`, updateError);
        continue;
      }
      
      console.log(`  Updated primary record ${primary.rock_code}`);
      
      // Delete the duplicate records
      for (const duplicate of duplicatesToMerge) {
        const { error: deleteError } = await supabase
          .from('rocks')
          .delete()
          .eq('id', duplicate.id);
        
        if (deleteError) {
          console.error(`  Error deleting duplicate ${duplicate.rock_code}:`, deleteError);
        } else {
          console.log(`  Deleted duplicate ${duplicate.rock_code}`);
        }
      }
    }
    
    console.log('\nDuplicate rock cleanup completed!');
    
  } catch (error) {
    console.error('Error in fixDuplicateRocks:', error);
  }
}

/**
 * Fill in missing data for rocks using heuristics
 */
async function fillMissingData() {
  try {
    console.log('\nChecking for rocks with missing data...');
    
    // Get all rocks
    const { data: rocks, error } = await supabase
      .from('rocks')
      .select('*');
    
    if (error) {
      console.error('Error fetching rocks:', error);
      return;
    }
    
    let updatedCount = 0;
    
    // Process each rock
    for (const rock of rocks) {
      let needsUpdate = false;
      const updates = {};
      
      // Missing type - derive from name and category
      if (!rock.type || rock.type === '') {
        if (rock.category === 'Igneous') {
          if (rock.name.toLowerCase().includes('granite')) {
            updates.type = 'Plutonic';
          } else if (rock.name.toLowerCase().includes('basalt')) {
            updates.type = 'Volcanic';
          } else if (rock.name.toLowerCase().includes('andesite')) {
            updates.type = 'Volcanic';
          } else if (rock.name.toLowerCase().includes('gabbro')) {
            updates.type = 'Plutonic';
          } else if (rock.name.toLowerCase().includes('rhyolite')) {
            updates.type = 'Volcanic';
          } else if (rock.name.toLowerCase().includes('obsidian')) {
            updates.type = 'Volcanic';
          } else if (rock.name.toLowerCase().includes('pumice')) {
            updates.type = 'Volcanic';
          } else if (rock.name.toLowerCase().includes('diorite')) {
            updates.type = 'Plutonic';
          } else {
            updates.type = 'Igneous Rock';
          }
          needsUpdate = true;
        } else if (rock.category === 'Sedimentary') {
          if (rock.name.toLowerCase().includes('limestone')) {
            updates.type = 'Chemical';
          } else if (rock.name.toLowerCase().includes('sandstone')) {
            updates.type = 'Clastic';
          } else if (rock.name.toLowerCase().includes('shale')) {
            updates.type = 'Clastic';
          } else if (rock.name.toLowerCase().includes('conglomerate')) {
            updates.type = 'Clastic';
          } else if (rock.name.toLowerCase().includes('breccia')) {
            updates.type = 'Clastic';
          } else if (rock.name.toLowerCase().includes('chalk')) {
            updates.type = 'Biochemical';
          } else if (rock.name.toLowerCase().includes('coal')) {
            updates.type = 'Organic';
          } else {
            updates.type = 'Sedimentary Rock';
          }
          needsUpdate = true;
        } else if (rock.category === 'Metamorphic') {
          if (rock.name.toLowerCase().includes('marble')) {
            updates.type = 'Non-foliated';
          } else if (rock.name.toLowerCase().includes('slate')) {
            updates.type = 'Foliated';
          } else if (rock.name.toLowerCase().includes('schist')) {
            updates.type = 'Foliated';
          } else if (rock.name.toLowerCase().includes('gneiss')) {
            updates.type = 'Foliated';
          } else if (rock.name.toLowerCase().includes('quartzite')) {
            updates.type = 'Non-foliated';
          } else if (rock.name.toLowerCase().includes('hornfels')) {
            updates.type = 'Non-foliated';
          } else {
            updates.type = 'Metamorphic Rock';
          }
          needsUpdate = true;
        } else if (rock.category === 'Ore Samples') {
          updates.type = rock.commodity_type || 'Ore Sample';
          needsUpdate = true;
        }
      }
      
      // Fix rock code format if needed
      if (rock.rock_code && rock.rock_code.includes(' ')) {
        updates.rock_code = rock.rock_code.replace(/\s+/g, '');
        needsUpdate = true;
      }
      
      // Apply updates if needed
      if (needsUpdate) {
        const { error: updateError } = await supabase
          .from('rocks')
          .update(updates)
          .eq('id', rock.id);
        
        if (updateError) {
          console.error(`Error updating rock ${rock.name}:`, updateError);
        } else {
          updatedCount++;
          console.log(`Updated rock ${rock.name} with: ${JSON.stringify(updates)}`);
        }
      }
    }
    
    console.log(`\nFilled in missing data for ${updatedCount} rocks`);
    
  } catch (error) {
    console.error('Error in fillMissingData:', error);
  }
}

// Run the fix operations
async function main() {
  await fixDuplicateRocks();
  await fillMissingData();
  console.log('\nFinished database cleanup tasks!');
}

main(); 