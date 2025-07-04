import { supabase } from '../config/supabase';
import * as fs from 'fs';
import * as path from 'path';

async function addOrderColumn() {
  try {
    console.log('Adding order column to fieldwork_sections table...');
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, '../db/add_fieldwork_sections_order_column.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql });
    
    if (error) {
      console.error('Error executing SQL:', error);
      
      // Try to execute directly without the function
      console.log('Trying to execute directly...');
      
      // Split the SQL into separate statements
      const statements = sql.split(';').filter(s => s.trim().length > 0);
      
      for (const statement of statements) {
        if (statement.trim().length === 0) continue;
        
        console.log(`Executing: ${statement.trim().substring(0, 50)}...`);
        const { error: directError } = await supabase.rpc('exec_sql', { 
          sql: statement.trim() 
        });
        
        if (directError) {
          console.error('Error executing statement:', directError);
        } else {
          console.log('Statement executed successfully');
        }
      }
    } else {
      console.log('SQL executed successfully:', data);
    }
    
    // Verify the column was added
    const { data: sections, error: sectionError } = await supabase
      .from('fieldwork_sections')
      .select('id, fieldwork_id, title, order')
      .limit(5);
      
    if (sectionError) {
      console.error('Error verifying column:', sectionError);
    } else {
      console.log('Sample sections with order column:', sections);
    }
  } catch (error) {
    console.error('Error adding order column:', error);
  }
}

// Run the function
addOrderColumn().then(() => {
  console.log('Done!');
  process.exit(0);
}).catch(err => {
  console.error('Script failed:', err);
  process.exit(1);
}); 