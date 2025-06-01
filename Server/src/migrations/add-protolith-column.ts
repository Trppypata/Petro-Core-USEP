import { supabase } from '../config/supabase';

/**
 * Migration script to add the protolith column to the rocks table
 */
const addProtolithColumn = async () => {
  try {
    console.log('Starting migration: Adding protolith column to rocks table');
    
    // Check if column already exists
    const { data, error } = await supabase.rpc('pg_query', { 
      query_text: "SELECT column_name FROM information_schema.columns WHERE table_name = 'rocks' AND column_name = 'protolith'" 
    });
    
    if (error) {
      console.error('Error checking for protolith column:', error);
      return;
    }
    
    if (data && data.length > 0) {
      console.log('Protolith column already exists, skipping migration');
      return;
    }
    
    // Add the column
    const { error: alterError } = await supabase.rpc('pg_query', { 
      query_text: "ALTER TABLE rocks ADD COLUMN IF NOT EXISTS protolith TEXT" 
    });
    
    if (alterError) {
      console.error('Error adding protolith column:', alterError);
      return;
    }
    
    console.log('Successfully added protolith column to rocks table');
  } catch (error) {
    console.error('Migration failed:', error);
  }
};

// Execute the migration
addProtolithColumn()
  .then(() => console.log('Migration completed'))
  .catch((error) => console.error('Migration failed:', error)); 