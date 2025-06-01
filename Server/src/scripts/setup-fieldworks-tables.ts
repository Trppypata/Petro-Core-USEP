import { supabase } from '../config/supabase';
import fs from 'fs';
import path from 'path';

async function setupFieldworksTables() {
  try {
    console.log('Setting up fieldworks tables...');
    
    // Read the SQL file for creating tables
    const sqlPath = path.join(__dirname, '../db/create_fieldworks_tables.sql');
    console.log(`Reading SQL file: ${sqlPath}`);
    
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Execute the SQL statements to create tables
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      throw error;
    }
    
    console.log('Tables created successfully. Inserting fieldwork data...');
    
    // Insert fieldwork data directly
    const fieldworks = [
      {
        title: 'Geohazards Assessment',
        description: 'Comprehensive analysis of geological hazards and their potential impacts on human settlements, infrastructure, and the environment.',
        path: '/field-works/geohazard'
      },
      {
        title: 'Hydrogeologic Sampling',
        description: 'Collection and analysis of groundwater samples to assess water quality, aquifer properties, contamination levels, and sustainable management strategies.',
        path: '/field-works/hydrogeologic'
      },
      {
        title: 'Structural Geology Assessment',
        description: 'Detailed examination of rock deformation, fault systems, and tectonic features to understand geological structures and their implications for resource exploration.',
        path: '/field-works/structural-geology'
      },
      {
        title: 'Engineering Geological and Geohazards Assessment Report',
        description: 'Technical evaluation of geological conditions and hazards for engineering projects.',
        path: '/field-works/engineering-geological'
      },
      {
        title: 'Quadrangle Mapping',
        description: 'Systematic field mapping of geological units, structures, and resources within standardized quadrangle areas to create comprehensive geological maps.',
        path: '/field-works/quadrangle-mapping'
      },
      {
        title: 'Research',
        description: 'Geological research studies and academic papers on various earth science topics and findings, contributing to the advancement of geoscience knowledge.',
        path: '/field-works/research'
      }
    ];
    
    // Insert fieldworks one by one to avoid conflicts
    console.log('Inserting fieldworks one by one...');
    for (const fieldwork of fieldworks) {
      // Check if fieldwork already exists
      const { data: existing, error: checkError } = await supabase
        .from('fieldworks')
        .select('id')
        .eq('path', fieldwork.path)
        .maybeSingle();
      
      if (checkError) {
        console.error(`Error checking for existing fieldwork ${fieldwork.path}:`, checkError);
        continue;
      }
      
      if (existing) {
        console.log(`Fieldwork with path ${fieldwork.path} already exists, skipping.`);
        continue;
      }
      
      // Insert new fieldwork
      const { error: insertError } = await supabase
        .from('fieldworks')
        .insert(fieldwork);
      
      if (insertError) {
        console.error(`Error inserting fieldwork ${fieldwork.path}:`, insertError);
      } else {
        console.log(`Successfully inserted fieldwork: ${fieldwork.title}`);
      }
    }
    
    // Verify the tables
    const { data: allFieldworks, error: fieldworksError } = await supabase
      .from('fieldworks')
      .select('*');
      
    if (fieldworksError) {
      throw fieldworksError;
    }
    
    console.log(`Total fieldworks in the database: ${allFieldworks?.length || 0}`);
    
  } catch (error) {
    console.error('Error setting up fieldworks tables:', error);
  }
}

// Run the setup
setupFieldworksTables(); 