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

async function checkMineralsData() {
  try {
    console.log('Checking minerals data in the database...');
    
    // Get total count
    const { count: totalCount, error: countError } = await supabase
      .from('minerals')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('Error getting minerals count:', countError);
      return;
    }
    
    console.log(`Total minerals in database: ${totalCount}`);
    
    if (totalCount === 0) {
      console.log('No minerals found in the database. You may need to import the minerals data.');
      return;
    }
    
    // Get all categories
    const { data: categories, error: categoriesError } = await supabase
      .from('minerals')
      .select('category')
      .order('category');
    
    if (categoriesError) {
      console.error('Error getting mineral categories:', categoriesError);
      return;
    }
    
    // Count minerals by category
    const uniqueCategories = [...new Set(categories.map(m => m.category))];
    console.log(`\nFound ${uniqueCategories.length} unique categories:`);
    
    for (const category of uniqueCategories) {
      const { count, error } = await supabase
        .from('minerals')
        .select('*', { count: 'exact', head: true })
        .eq('category', category);
      
      if (error) {
        console.error(`Error counting minerals in category ${category}:`, error);
        continue;
      }
      
      console.log(`- ${category}: ${count} minerals`);
    }
    
    // Get sample minerals from each category
    console.log('\nSample minerals from each category:');
    for (const category of uniqueCategories) {
      const { data, error } = await supabase
        .from('minerals')
        .select('*')
        .eq('category', category)
        .limit(1);
      
      if (error) {
        console.error(`Error getting sample for category ${category}:`, error);
        continue;
      }
      
      if (data && data.length > 0) {
        const sample = data[0];
        console.log(`\n${category}:`);
        console.log(`- Mineral Code: ${sample.mineral_code}`);
        console.log(`- Mineral Name: ${sample.mineral_name}`);
        console.log(`- Chemical Formula: ${sample.chemical_formula || 'N/A'}`);
        console.log(`- Group: ${sample.mineral_group || 'N/A'}`);
      }
    }
    
    // Check if any minerals are missing category
    const { data: missingCategory, error: missingError } = await supabase
      .from('minerals')
      .select('id, mineral_name')
      .is('category', null);
    
    if (missingError) {
      console.error('Error checking for minerals missing category:', missingError);
    } else if (missingCategory && missingCategory.length > 0) {
      console.log(`\n⚠️ Found ${missingCategory.length} minerals missing category information:`);
      missingCategory.forEach(mineral => {
        console.log(`- ${mineral.mineral_name} (${mineral.id})`);
      });
    } else {
      console.log('\n✅ All minerals have category information');
    }
    
  } catch (error) {
    console.error('Error checking minerals data:', error);
  }
}

checkMineralsData(); 