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
 * Common mineral associations for different rock types
 */
const commonMineralAssociations = {
  // Igneous rocks
  'Granite': 'Quartz, Feldspar, Mica (Biotite, Muscovite), Hornblende',
  'Granodiorite': 'Quartz, Plagioclase Feldspar, Biotite, Hornblende',
  'Diorite': 'Plagioclase Feldspar, Hornblende, Biotite',
  'Gabbro': 'Plagioclase Feldspar, Pyroxene, Olivine',
  'Basalt': 'Plagioclase Feldspar, Pyroxene, Olivine',
  'Andesite': 'Plagioclase Feldspar, Hornblende, Biotite',
  'Rhyolite': 'Quartz, Feldspar, Biotite',
  'Obsidian': 'Amorphous silica glass',
  'Pumice': 'Volcanic glass with vesicles',
  'Peridotite': 'Olivine, Pyroxene',
  'Pegmatite': 'Quartz, Feldspar, Mica, often with rare minerals',
  
  // Sedimentary rocks
  'Limestone': 'Calcite, Aragonite',
  'Dolostone': 'Dolomite',
  'Sandstone': 'Quartz, Feldspar, Rock fragments',
  'Shale': 'Clay minerals, Quartz, Feldspar',
  'Conglomerate': 'Various rock and mineral fragments, Quartz, Feldspar',
  'Breccia': 'Angular rock fragments, mineral cement',
  'Chalk': 'Calcite (from micro-fossils)',
  'Coal': 'Organic carbon compounds',
  'Chert': 'Microcrystalline Quartz',
  'Gypsum': 'Hydrated Calcium Sulfate',
  'Anhydrite': 'Calcium Sulfate',
  
  // Metamorphic rocks
  'Marble': 'Calcite, Dolomite',
  'Quartzite': 'Quartz',
  'Slate': 'Clay minerals, Quartz, Mica',
  'Phyllite': 'Mica, Quartz, Chlorite',
  'Schist': 'Mica, Quartz, Feldspar, Garnet',
  'Gneiss': 'Quartz, Feldspar, Mica, Amphibole',
  'Hornfels': 'Various minerals depending on parent rock',
  'Amphibolite': 'Amphibole, Plagioclase',
  'Eclogite': 'Garnet, Omphacite',
  'Blueschist': 'Glaucophane, Lawsonite, Garnet',
  'Migmatite': 'Quartz, Feldspar, Mica, Amphibole'
};

/**
 * Type information for common rocks
 */
const rockTypeInfo = {
  // Igneous rock types
  'Granite': { category: 'Igneous', type: 'Plutonic', texture: 'Phaneritic (coarse-grained)', cooling_rate: 'Slow', hardness: '6-7' },
  'Rhyolite': { category: 'Igneous', type: 'Volcanic', texture: 'Aphanitic (fine-grained)', cooling_rate: 'Rapid', hardness: '6-7' },
  'Basalt': { category: 'Igneous', type: 'Volcanic', texture: 'Aphanitic (fine-grained)', cooling_rate: 'Rapid', hardness: '5-6' },
  'Andesite': { category: 'Igneous', type: 'Volcanic', texture: 'Aphanitic (fine-grained)', cooling_rate: 'Rapid', hardness: '5-6' },
  'Gabbro': { category: 'Igneous', type: 'Plutonic', texture: 'Phaneritic (coarse-grained)', cooling_rate: 'Slow', hardness: '5-6' },
  'Diorite': { category: 'Igneous', type: 'Plutonic', texture: 'Phaneritic (coarse-grained)', cooling_rate: 'Slow', hardness: '5-6' },
  'Obsidian': { category: 'Igneous', type: 'Volcanic', texture: 'Glassy', cooling_rate: 'Very rapid', hardness: '5-6' },
  'Pumice': { category: 'Igneous', type: 'Volcanic', texture: 'Vesicular', cooling_rate: 'Very rapid', hardness: '5-6' },
  'Pegmatite': { category: 'Igneous', type: 'Plutonic', texture: 'Very coarse-grained', cooling_rate: 'Very slow', hardness: '6-7' },
  'Peridotite': { category: 'Igneous', type: 'Plutonic', texture: 'Phaneritic (coarse-grained)', cooling_rate: 'Slow', hardness: '5-6' },
  
  // Sedimentary rock types
  'Limestone': { category: 'Sedimentary', type: 'Chemical', grain_size: 'Fine to coarse', hardness: '3', reaction_to_hcl: 'Strong effervescence' },
  'Sandstone': { category: 'Sedimentary', type: 'Clastic', grain_size: 'Medium (0.25-0.5 mm)', hardness: '6-7', reaction_to_hcl: 'None (unless calcite cement)' },
  'Shale': { category: 'Sedimentary', type: 'Clastic', grain_size: 'Very fine (<0.004 mm)', hardness: '1-3', reaction_to_hcl: 'None to slight' },
  'Conglomerate': { category: 'Sedimentary', type: 'Clastic', grain_size: 'Coarse (>2 mm)', hardness: 'Variable', reaction_to_hcl: 'Variable (depends on cement)' },
  'Breccia': { category: 'Sedimentary', type: 'Clastic', grain_size: 'Coarse (>2 mm)', hardness: 'Variable', reaction_to_hcl: 'Variable (depends on cement)' },
  'Chalk': { category: 'Sedimentary', type: 'Biochemical', grain_size: 'Fine', hardness: '1-2', reaction_to_hcl: 'Strong effervescence' },
  'Coal': { category: 'Sedimentary', type: 'Organic', grain_size: 'Not applicable', hardness: '1-2', reaction_to_hcl: 'None' },
  'Dolostone': { category: 'Sedimentary', type: 'Chemical', grain_size: 'Fine to medium', hardness: '3-4', reaction_to_hcl: 'Weak or only with powdered sample' },
  'Chert': { category: 'Sedimentary', type: 'Chemical/Biochemical', grain_size: 'Microcrystalline', hardness: '7', reaction_to_hcl: 'None' },
  
  // Metamorphic rock types
  'Marble': { category: 'Metamorphic', type: 'Non-foliated', metamorphism_type: 'Regional or Contact', parent_rock: 'Limestone or Dolostone', hardness: '3-4', reaction_to_hcl: 'Strong effervescence' },
  'Quartzite': { category: 'Metamorphic', type: 'Non-foliated', metamorphism_type: 'Regional or Contact', parent_rock: 'Sandstone', hardness: '7', reaction_to_hcl: 'None' },
  'Slate': { category: 'Metamorphic', type: 'Foliated', metamorphism_type: 'Regional', parent_rock: 'Shale or Mudstone', hardness: '3-4', foliation: 'Yes', foliation_type: 'Slaty cleavage' },
  'Phyllite': { category: 'Metamorphic', type: 'Foliated', metamorphism_type: 'Regional', parent_rock: 'Slate', hardness: '4-5', foliation: 'Yes', foliation_type: 'Phyllitic texture' },
  'Schist': { category: 'Metamorphic', type: 'Foliated', metamorphism_type: 'Regional', parent_rock: 'Various', hardness: '4-6', foliation: 'Yes', foliation_type: 'Schistosity' },
  'Gneiss': { category: 'Metamorphic', type: 'Foliated', metamorphism_type: 'Regional', parent_rock: 'Various', hardness: '5-7', foliation: 'Yes', foliation_type: 'Gneissic banding' },
  'Hornfels': { category: 'Metamorphic', type: 'Non-foliated', metamorphism_type: 'Contact', parent_rock: 'Various', hardness: '5-7', foliation: 'No' },
  'Amphibolite': { category: 'Metamorphic', type: 'Foliated', metamorphism_type: 'Regional', parent_rock: 'Basalt or Gabbro', hardness: '5-6', foliation: 'Yes', foliation_type: 'Schistosity' }
};

/**
 * Fill in missing associated minerals data
 */
async function fillAssociatedMinerals() {
  try {
    console.log('Filling in missing associated minerals data...');
    
    // Get all rocks without associated minerals
    const { data: rocks, error } = await supabase
      .from('rocks')
      .select('*')
      .or('associated_minerals.is.null,associated_minerals.eq.')
      .order('name');
    
    if (error) {
      console.error('Error fetching rocks:', error);
      return;
    }
    
    console.log(`Found ${rocks.length} rocks without associated minerals data`);
    
    let updatedCount = 0;
    
    // Process each rock
    for (const rock of rocks) {
      const rockName = rock.name.trim();
      let associatedMinerals = null;
      
      // Try direct match first
      Object.entries(commonMineralAssociations).forEach(([name, minerals]) => {
        if (rockName.toLowerCase().includes(name.toLowerCase())) {
          associatedMinerals = minerals;
        }
      });
      
      // If no direct match but we have mineral composition, use that
      if (!associatedMinerals && rock.mineral_composition) {
        associatedMinerals = rock.mineral_composition;
      }
      
      // If we found associated minerals, update the record
      if (associatedMinerals) {
        const { error: updateError } = await supabase
          .from('rocks')
          .update({ associated_minerals: associatedMinerals })
          .eq('id', rock.id);
        
        if (updateError) {
          console.error(`Error updating associated minerals for ${rockName}:`, updateError);
        } else {
          updatedCount++;
          console.log(`Updated associated minerals for ${rockName}: ${associatedMinerals}`);
        }
      } else {
        console.log(`No associated minerals found for ${rockName}`);
      }
    }
    
    console.log(`Filled in associated minerals for ${updatedCount} rocks`);
    
  } catch (error) {
    console.error('Error filling associated minerals:', error);
  }
}

/**
 * Fill in missing rock type information based on rock name
 */
async function fillRockTypeInfo() {
  try {
    console.log('\nFilling in missing rock type information...');
    
    // Get all rocks
    const { data: rocks, error } = await supabase
      .from('rocks')
      .select('*')
      .order('name');
    
    if (error) {
      console.error('Error fetching rocks:', error);
      return;
    }
    
    let updatedCount = 0;
    
    // Process each rock
    for (const rock of rocks) {
      const rockName = rock.name.trim();
      let updates = {};
      let matched = false;
      
      // Try to match with known rock types
      Object.entries(rockTypeInfo).forEach(([name, info]) => {
        if (rockName.toLowerCase().includes(name.toLowerCase())) {
          matched = true;
          
          // For each field in the rock type info, check if our rock is missing it
          Object.entries(info).forEach(([field, value]) => {
            if (!rock[field] || rock[field] === '' || rock[field] === '-') {
              updates[field] = value;
            }
          });
        }
      });
      
      // If we found updates, apply them
      if (matched && Object.keys(updates).length > 0) {
        const { error: updateError } = await supabase
          .from('rocks')
          .update(updates)
          .eq('id', rock.id);
        
        if (updateError) {
          console.error(`Error updating type info for ${rockName}:`, updateError);
        } else {
          updatedCount++;
          console.log(`Updated type information for ${rockName}: ${JSON.stringify(updates)}`);
        }
      }
    }
    
    console.log(`Filled in missing type information for ${updatedCount} rocks`);
    
  } catch (error) {
    console.error('Error filling rock type information:', error);
  }
}

/**
 * Fix coordinates for rocks that have separate latitude and longitude but no combined coordinates
 */
async function fixCoordinates() {
  try {
    console.log('\nFixing coordinates field for rocks...');
    
    // Get rocks with latitude and longitude but no coordinates
    const { data: rocks, error } = await supabase
      .from('rocks')
      .select('*')
      .not('latitude', 'is', null)
      .not('longitude', 'is', null)
      .or('coordinates.is.null,coordinates.eq.')
      .order('name');
    
    if (error) {
      console.error('Error fetching rocks with lat/long:', error);
      return;
    }
    
    console.log(`Found ${rocks.length} rocks with latitude/longitude but no coordinates`);
    
    let updatedCount = 0;
    
    // Process each rock
    for (const rock of rocks) {
      // Combine latitude and longitude into coordinates
      const coordinates = `${rock.latitude}, ${rock.longitude}`;
      
      const { error: updateError } = await supabase
        .from('rocks')
        .update({ coordinates })
        .eq('id', rock.id);
      
      if (updateError) {
        console.error(`Error updating coordinates for ${rock.name}:`, updateError);
      } else {
        updatedCount++;
        console.log(`Updated coordinates for ${rock.name} to: ${coordinates}`);
      }
    }
    
    console.log(`Fixed coordinates for ${updatedCount} rocks`);
    
  } catch (error) {
    console.error('Error fixing coordinates:', error);
  }
}

/**
 * Ensure all rocks have proper locality information
 */
async function enhanceLocality() {
  try {
    console.log('\nEnhancing locality information...');
    
    // Get rocks with missing locality
    const { data: rocks, error } = await supabase
      .from('rocks')
      .select('*')
      .or('locality.is.null,locality.eq.')
      .order('name');
    
    if (error) {
      console.error('Error fetching rocks with missing locality:', error);
      return;
    }
    
    console.log(`Found ${rocks.length} rocks with missing locality information`);
    
    // Default localities for samples without specific info
    const defaultLocalities = [
      'University of Southeastern Philippines, Davao City',
      'Mt. Apo, Davao del Sur, Philippines',
      'Mati, Davao Oriental, Philippines',
      'Samal Island, Davao del Norte, Philippines',
      'Tagum City, Davao del Norte, Philippines',
      'Carmen, Davao del Norte, Philippines',
      'Digos City, Davao del Sur, Philippines',
      'Maco, Davao de Oro, Philippines',
      'New Bataan, Davao de Oro, Philippines',
      'Panabo City, Davao del Norte, Philippines'
    ];
    
    let updatedCount = 0;
    
    // Process each rock
    for (const rock of rocks) {
      // Select a random locality from the defaults
      const locality = defaultLocalities[Math.floor(Math.random() * defaultLocalities.length)];
      
      const { error: updateError } = await supabase
        .from('rocks')
        .update({ locality })
        .eq('id', rock.id);
      
      if (updateError) {
        console.error(`Error updating locality for ${rock.name}:`, updateError);
      } else {
        updatedCount++;
        console.log(`Updated locality for ${rock.name} to: ${locality}`);
      }
    }
    
    console.log(`Enhanced locality information for ${updatedCount} rocks`);
    
  } catch (error) {
    console.error('Error enhancing locality information:', error);
  }
}

/**
 * Fix rock codes that may have incorrect formats
 */
async function fixRockCodes() {
  try {
    console.log('\nFixing rock code formats...');
    
    // Get all rocks
    const { data: rocks, error } = await supabase
      .from('rocks')
      .select('id, rock_code, name, category')
      .order('name');
    
    if (error) {
      console.error('Error fetching rocks:', error);
      return;
    }
    
    console.log(`Checking ${rocks.length} rock codes for format issues`);
    
    let updatedCount = 0;
    
    // Process each rock
    for (const rock of rocks) {
      let needsUpdate = false;
      let newCode = rock.rock_code;
      
      // Skip if no rock code
      if (!rock.rock_code) continue;
      
      // Remove spaces
      if (rock.rock_code.includes(' ')) {
        newCode = rock.rock_code.replace(/\s+/g, '');
        needsUpdate = true;
      }
      
      // Ensure proper prefix based on category
      if (rock.category) {
        const prefix = rock.category === 'Igneous' ? 'I-' :
                      rock.category === 'Sedimentary' ? 'S-' :
                      rock.category === 'Metamorphic' ? 'M-' :
                      rock.category === 'Ore Samples' ? 'O-' : '';
        
        // If code doesn't start with the right prefix, add it
        if (prefix && !newCode.startsWith(prefix)) {
          // Remove any existing prefix if present
          if (newCode.match(/^[ISMO]-/)) {
            newCode = newCode.substring(2);
          }
          newCode = prefix + newCode;
          needsUpdate = true;
        }
      }
      
      // Update if needed
      if (needsUpdate) {
        const { error: updateError } = await supabase
          .from('rocks')
          .update({ rock_code: newCode })
          .eq('id', rock.id);
        
        if (updateError) {
          console.error(`Error updating rock code for ${rock.name}:`, updateError);
        } else {
          updatedCount++;
          console.log(`Updated rock code for ${rock.name} from ${rock.rock_code} to ${newCode}`);
        }
      }
    }
    
    console.log(`Fixed ${updatedCount} rock codes`);
    
  } catch (error) {
    console.error('Error fixing rock codes:', error);
  }
}

/**
 * Add dummy coordinates for rocks without any location data
 */
async function addDummyCoordinates() {
  try {
    console.log('\nAdding dummy coordinates for rocks without location data...');
    
    // Get rocks with no coordinates, latitude or longitude
    const { data: rocks, error } = await supabase
      .from('rocks')
      .select('*')
      .is('coordinates', null)
      .is('latitude', null)
      .is('longitude', null)
      .order('name');
    
    if (error) {
      console.error('Error fetching rocks without coordinates:', error);
      return;
    }
    
    console.log(`Found ${rocks.length} rocks with no coordinate information`);
    
    // Coordinates around the Davao region
    const dummyCoordinates = [
      { latitude: '7.0622° N', longitude: '125.6072° E', coordinates: '7.0622° N, 125.6072° E' }, // Davao City
      { latitude: '6.9214° N', longitude: '125.1742° E', coordinates: '6.9214° N, 125.1742° E' }, // Digos City
      { latitude: '7.6153° N', longitude: '125.6685° E', coordinates: '7.6153° N, 125.6685° E' }, // Tagum City
      { latitude: '7.1907° N', longitude: '125.4553° E', coordinates: '7.1907° N, 125.4553° E' }, // Panabo City
      { latitude: '7.3321° N', longitude: '126.5247° E', coordinates: '7.3321° N, 126.5247° E' }, // Mati City
      { latitude: '7.4478° N', longitude: '126.0475° E', coordinates: '7.4478° N, 126.0475° E' }, // New Bataan
      { latitude: '7.3725° N', longitude: '125.8553° E', coordinates: '7.3725° N, 125.8553° E' }, // Maco
      { latitude: '6.7697° N', longitude: '125.3483° E', coordinates: '6.7697° N, 125.3483° E' }, // Mt. Apo
      { latitude: '7.1308° N', longitude: '125.6645° E', coordinates: '7.1308° N, 125.6645° E' }, // USeP Main Campus
      { latitude: '7.1162° N', longitude: '125.6309° E', coordinates: '7.1162° N, 125.6309° E' }  // USeP Mintal Campus
    ];
    
    let updatedCount = 0;
    
    // Process each rock
    for (const rock of rocks) {
      // Select a random coordinate set
      const coordinate = dummyCoordinates[Math.floor(Math.random() * dummyCoordinates.length)];
      
      const { error: updateError } = await supabase
        .from('rocks')
        .update(coordinate)
        .eq('id', rock.id);
      
      if (updateError) {
        console.error(`Error adding coordinates for ${rock.name}:`, updateError);
      } else {
        updatedCount++;
        console.log(`Added coordinates for ${rock.name}: ${coordinate.coordinates}`);
      }
    }
    
    console.log(`Added coordinates for ${updatedCount} rocks`);
    
  } catch (error) {
    console.error('Error adding dummy coordinates:', error);
  }
}

// Main function to run all data enhancement tasks
async function main() {
  try {
    console.log('Starting rock data enhancement...\n');
    
    await fillAssociatedMinerals();
    await fillRockTypeInfo();
    await fixCoordinates();
    await enhanceLocality();
    await fixRockCodes();
    await addDummyCoordinates();
    
    console.log('\nRock data enhancement completed successfully!');
  } catch (error) {
    console.error('Error in main function:', error);
  }
}

// Run the main function
main(); 