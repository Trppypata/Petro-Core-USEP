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

// Common sedimentary rocks information for enhancing data
const sedimentaryRockInfo = {
  'Anhydrite': {
    type: 'Chemical (sulfates)',
    hardness: '3.5',
    color: 'Colorless to white or gray',
    texture: 'Crystalline',
    grain_size: 'Fine to medium crystalline',
    bedding: 'Massive or banded',
    sorting: 'Not applicable (chemical precipitate)',
    roundness: 'Not applicable (chemical precipitate)',
    depositional_environment: 'Evaporitic marine environments'
  },
  'Breccia': {
    type: 'Detrital (Coarse Sediment)',
    hardness: 'Variable (depends on clasts)',
    color: 'Variable (depends on clasts)',
    texture: 'Angular, Poorly sorted',
    grain_size: '1/16 in (2 mm) to 1 in (several cm) in finer matrix',
    bedding: 'Massive or poorly defined',
    sorting: 'Poorly sorted',
    roundness: 'Angular clasts',
    depositional_environment: 'High-energy environments, rockfalls, or sedimentary processes'
  },
  'Limestone': {
    type: 'Chemical/Biochemical',
    hardness: '3',
    color: 'White to gray',
    texture: 'Variable (can be crystalline, fossiliferous, or oolitic)',
    grain_size: 'Variable (micrite to grainstone)',
    bedding: 'Well-defined, often with fossils',
    sorting: 'Well-sorted (for oolitic varieties)',
    roundness: 'Rounded (for oolitic varieties)',
    depositional_environment: 'Shallow marine environments'
  },
  'Sandstone': {
    type: 'Clastic',
    hardness: '6-7',
    color: 'Tan, brown, yellow, red, gray, or white',
    texture: 'Granular',
    grain_size: 'Medium (0.25-0.5 mm)',
    bedding: 'Well-defined, often with cross-bedding',
    sorting: 'Well to moderately sorted',
    roundness: 'Sub-rounded to rounded',
    depositional_environment: 'Beach, river, or desert environments'
  },
  'Shale': {
    type: 'Clastic',
    hardness: '1-3',
    color: 'Gray, black, brown, or red',
    texture: 'Fine-grained, fissile',
    grain_size: 'Very fine (<0.004 mm)',
    bedding: 'Thinly laminated',
    sorting: 'Well-sorted',
    roundness: 'Not applicable (clay-sized particles)',
    depositional_environment: 'Low-energy marine or lacustrine environments'
  },
  'Conglomerate': {
    type: 'Clastic',
    hardness: 'Variable (depends on clasts)',
    color: 'Variable (depends on clasts)',
    texture: 'Rounded clasts in matrix',
    grain_size: 'Coarse (>2 mm)',
    bedding: 'Massive or poorly defined',
    sorting: 'Poorly sorted',
    roundness: 'Rounded to well-rounded',
    depositional_environment: 'High-energy rivers, beaches, or alluvial fans'
  },
  'Siltstone': {
    type: 'Clastic',
    hardness: '4-5',
    color: 'Gray, brown, or red',
    texture: 'Fine-grained',
    grain_size: 'Fine (0.004-0.062 mm)',
    bedding: 'Well-defined, often laminated',
    sorting: 'Well-sorted',
    roundness: 'Sub-angular to sub-rounded',
    depositional_environment: 'Low to moderate energy fluvial or marine environments'
  },
  'Claystone': {
    type: 'Clastic',
    hardness: '1-2',
    color: 'Gray, red, brown, or green',
    texture: 'Very fine-grained',
    grain_size: 'Very fine (<0.004 mm)',
    bedding: 'Massive or poorly defined',
    sorting: 'Well-sorted',
    roundness: 'Not applicable (clay-sized particles)',
    depositional_environment: 'Low-energy lacustrine or marine environments'
  }
};

async function enhanceSedimentaryRocks() {
  try {
    console.log('Enhancing sedimentary rock data...');
    
    // Get all sedimentary rocks
    const { data: sedimentaryRocks, error } = await supabase
      .from('rocks')
      .select('*')
      .eq('category', 'Sedimentary');
    
    if (error) {
      console.error('Error fetching sedimentary rocks:', error);
      return;
    }
    
    console.log(`Found ${sedimentaryRocks.length} sedimentary rocks in database`);
    
    let updatedCount = 0;
    
    // Process each rock
    for (const rock of sedimentaryRocks) {
      const rockName = rock.name.trim();
      
      // Find best match in our reference data
      let bestMatch = null;
      let bestMatchScore = 0;
      
      for (const [refRockName, refRockData] of Object.entries(sedimentaryRockInfo)) {
        // Simple string matching - can be improved with fuzzy matching if needed
        if (rockName.toLowerCase().includes(refRockName.toLowerCase())) {
          // Longer matches are better (avoids partial matches)
          const matchScore = refRockName.length;
          if (matchScore > bestMatchScore) {
            bestMatch = { name: refRockName, data: refRockData };
            bestMatchScore = matchScore;
          }
        }
      }
      
      // If no direct match, try substring matches
      if (!bestMatch) {
        for (const [refRockName, refRockData] of Object.entries(sedimentaryRockInfo)) {
          // Check if reference rock name is part of the actual rock name
          if (refRockName.toLowerCase().includes(rockName.toLowerCase())) {
            const matchScore = rockName.length;
            if (matchScore > bestMatchScore) {
              bestMatch = { name: refRockName, data: refRockData };
              bestMatchScore = matchScore;
            }
          }
        }
      }
      
      // If we found a match, enhance the rock data
      if (bestMatch) {
        console.log(`Found match for "${rockName}": ${bestMatch.name}`);
        
        const updates = {};
        
        // Fill in missing data from our reference
        for (const [field, value] of Object.entries(bestMatch.data)) {
          if (!rock[field] || rock[field] === '' || rock[field] === '-') {
            updates[field] = value;
          }
        }
        
        // If we have updates to make
        if (Object.keys(updates).length > 0) {
          console.log(`Updating ${rockName} with:`, updates);
          
          const { error: updateError } = await supabase
            .from('rocks')
            .update(updates)
            .eq('id', rock.id);
          
          if (updateError) {
            console.error(`Error updating ${rockName}:`, updateError);
          } else {
            updatedCount++;
            console.log(`Updated ${rockName} successfully`);
          }
        } else {
          console.log(`No updates needed for ${rockName}`);
        }
      } else {
        console.log(`No match found for "${rockName}"`);
      }
    }
    
    console.log(`\nEnhanced ${updatedCount} sedimentary rocks with additional data`);
    
  } catch (error) {
    console.error('Error enhancing sedimentary rocks:', error);
  }
}

// Fix any specific issues with rock codes
async function fixRockCodes() {
  try {
    console.log('\nFixing rock code format issues...');
    
    // Find rocks with spaces in their codes
    const { data: rocksWithSpaces, error } = await supabase
      .from('rocks')
      .select('id, rock_code, name')
      .like('rock_code', '% %');
    
    if (error) {
      console.error('Error fetching rocks with spaces in codes:', error);
      return;
    }
    
    console.log(`Found ${rocksWithSpaces?.length || 0} rocks with spaces in their codes`);
    
    // Fix each rock code
    for (const rock of (rocksWithSpaces || [])) {
      const oldCode = rock.rock_code;
      const newCode = oldCode.replace(/\s+/g, '');
      
      console.log(`Fixing rock code for "${rock.name}": "${oldCode}" -> "${newCode}"`);
      
      const { error: updateError } = await supabase
        .from('rocks')
        .update({ rock_code: newCode })
        .eq('id', rock.id);
      
      if (updateError) {
        console.error(`Error updating rock code for ${rock.name}:`, updateError);
      } else {
        console.log(`Fixed rock code for ${rock.name}`);
      }
    }
    
    console.log('Rock code fixes completed');
    
  } catch (error) {
    console.error('Error fixing rock codes:', error);
  }
}

// Main function to run all enhancements
async function main() {
  await fixRockCodes();
  await enhanceSedimentaryRocks();
  console.log('\nSedimentary rock enhancement completed!');
}

main(); 