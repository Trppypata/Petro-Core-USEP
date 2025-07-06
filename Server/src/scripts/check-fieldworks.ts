import { supabase } from '../config/supabase';
import fs from 'fs';
import path from 'path';

/**
 * Check if the fieldworks tables and bucket exist and are properly configured.
 * If not, create them and insert sample data.
 */
async function checkAndFixFieldworks() {
  try {
    console.log('Checking fieldworks setup...');
    
    // 1. Check if exec_sql function exists (needed for table creation)
    await checkExecSqlFunction();
    
    // 2. Check if fieldworks tables exist
    await checkFieldworksTables();
    
    // 3. Check if fieldworks bucket exists
    await checkFieldworksBucket();
    
    // 4. Verify sample data exists
    await verifySampleData();
    
    console.log('✅ Fieldworks check completed successfully!');
  } catch (error) {
    console.error('❌ Error checking fieldworks:', error);
    process.exit(1);
  }
}

/**
 * Check if the exec_sql function exists in the database
 */
async function checkExecSqlFunction() {
  console.log('Checking exec_sql function...');
  
  try {
    // Try to call exec_sql with a simple query
    const { error } = await supabase.rpc('exec_sql', { 
      sql_query: 'SELECT 1 as test' 
    });
    
    if (error) {
      console.error('exec_sql function does not exist or there was an error:', error.message);
      console.log('Creating exec_sql function...');
      
      // Read the SQL file for creating the exec_sql function
      const sqlPath = path.join(__dirname, '../db/create_exec_sql_function.sql');
      const sql = fs.readFileSync(sqlPath, 'utf8');
      
      // We can't use exec_sql since it doesn't exist yet
      // Instead, print instructions for manual creation
      console.log('\n⚠️ Please manually create the exec_sql function using the Supabase SQL Editor.');
      console.log('Copy and paste the following SQL:');
      console.log('\n' + sql + '\n');
      
      throw new Error('exec_sql function needs to be created manually');
    } else {
      console.log('✅ exec_sql function exists and is working correctly.');
    }
  } catch (err) {
    console.error('Error checking exec_sql function:', err);
    throw err;
  }
}

/**
 * Check if the fieldworks tables exist and create them if they don't
 */
async function checkFieldworksTables() {
  console.log('Checking fieldworks tables...');
  
  try {
    // Check if fieldworks table exists by trying to query it
    const { error } = await supabase
      .from('fieldworks')
      .select('count')
      .limit(1)
      .single();
    
    if (error && error.code === 'PGRST116') {
      console.log('Fieldworks tables do not exist. Creating them now...');
      
      // Read the SQL file for creating tables
      const sqlPath = path.join(__dirname, '../db/create_fieldworks_tables.sql');
      const sql = fs.readFileSync(sqlPath, 'utf8');
      
      // Execute the SQL statements to create tables
      const { error: sqlError } = await supabase.rpc('exec_sql', { sql_query: sql });
      
      if (sqlError) {
        console.error('Error creating fieldworks tables:', sqlError);
        throw new Error('Failed to create fieldworks tables');
      } else {
        console.log('✅ Fieldworks tables created successfully!');
      }
    } else if (error) {
      console.error('Error checking if fieldworks tables exist:', error);
      throw error;
    } else {
      console.log('✅ Fieldworks tables already exist.');
    }
  } catch (error) {
    console.error('Error checking fieldworks tables:', error);
    throw error;
  }
}

/**
 * Check if the fieldworks bucket exists and create it if it doesn't
 */
async function checkFieldworksBucket() {
  console.log('Checking fieldworks bucket...');
  
  try {
    // List existing buckets
    const { data: buckets, error: getBucketsError } = await supabase
      .storage
      .listBuckets();
    
    if (getBucketsError) {
      console.error('Error listing storage buckets:', getBucketsError);
      throw getBucketsError;
    }
    
    const bucketNames = buckets.map(bucket => bucket.name);
    
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
        throw error;
      } else {
        console.log('✅ fieldworks bucket created successfully!');
        console.log('\n⚠️ Important: You need to set up bucket policies through the Supabase dashboard:');
        console.log('1. Go to Storage in the Supabase dashboard');
        console.log('2. Click on the fieldworks bucket');
        console.log('3. Go to the Policies tab');
        console.log('4. Set up policies for SELECT, INSERT, UPDATE, and DELETE operations');
      }
    } else {
      console.log('✅ fieldworks bucket already exists.');
    }
  } catch (error) {
    console.error('Error checking fieldworks bucket:', error);
    throw error;
  }
}

/**
 * Verify that sample data exists in the fieldworks table
 */
async function verifySampleData() {
  console.log('Verifying sample fieldworks data...');
  
  try {
    // Check if fieldworks data exists
    const { data: fieldworks, error: fieldworksError } = await supabase
      .from('fieldworks')
      .select('*');
      
    if (fieldworksError) {
      console.error('Error fetching fieldworks:', fieldworksError);
      throw fieldworksError;
    }
    
    if (!fieldworks || fieldworks.length === 0) {
      console.log('No fieldworks found. Inserting sample data...');
      
      // Sample fieldwork data to insert
      const sampleFieldworks = [
        {
          title: 'Geohazards Assessment',
          description: 'Comprehensive analysis of geological hazards and their potential impacts on human settlements, infrastructure, and the environment.',
          path: 'geohazard'
        },
        {
          title: 'Hydrogeologic Sampling',
          description: 'Collection and analysis of groundwater samples to assess water quality, aquifer properties, contamination levels, and sustainable management strategies.',
          path: 'hydrogeologic'
        },
        {
          title: 'Structural Geology Assessment',
          description: 'Detailed examination of rock deformation, fault systems, and tectonic features to understand geological structures and their implications for resource exploration.',
          path: 'structural-geology'
        },
        {
          title: 'Engineering Geological and Geohazards Assessment Report',
          description: 'Technical evaluation of geological conditions and hazards for engineering projects.',
          path: 'engineering-geological'
        },
        {
          title: 'Quadrangle Mapping',
          description: 'Systematic field mapping of geological units, structures, and resources within standardized quadrangle areas to create comprehensive geological maps.',
          path: 'quadrangle-mapping'
        },
        {
          title: 'Research',
          description: 'Geological research studies and academic papers on various earth science topics and findings, contributing to the advancement of geoscience knowledge.',
          path: 'research'
        }
      ];
      
      // Insert each fieldwork
      for (const fieldwork of sampleFieldworks) {
        const { error } = await supabase
          .from('fieldworks')
          .insert(fieldwork);
          
        if (error) {
          console.error(`Error inserting fieldwork ${fieldwork.path}:`, error);
        } else {
          console.log(`Inserted fieldwork: ${fieldwork.title}`);
        }
      }
      
      console.log('✅ Sample fieldworks data inserted successfully!');
    } else {
      console.log(`✅ Found ${fieldworks.length} existing fieldworks.`);
    }
    
    // Check if any fieldworks have sections
    const { data: sections, error: sectionsError } = await supabase
      .from('fieldwork_sections')
      .select('*');
      
    if (sectionsError) {
      console.error('Error fetching fieldwork sections:', sectionsError);
    } else if (!sections || sections.length === 0) {
      console.log('No fieldwork sections found. Consider adding sample sections and files.');
      console.log('You can do this manually through the admin interface or add a feature to upload PDF files.');
    } else {
      console.log(`✅ Found ${sections.length} existing fieldwork sections.`);
    }
  } catch (error) {
    console.error('Error verifying sample data:', error);
    throw error;
  }
}

// Run the check
checkAndFixFieldworks().then(() => {
  console.log('Done!');
  process.exit(0);
}).catch(err => {
  console.error('Script failed:', err);
  process.exit(1);
}); 