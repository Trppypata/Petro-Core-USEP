import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables. Please check your .env file.');
  console.error('You need to create a .env file in the Petro-Core directory with the following variables:');
  console.error('VITE_SUPABASE_URL=your_supabase_project_url');
  console.error('VITE_SUPABASE_ANON_KEY=your_supabase_anon_key');
}

// Create a mock client if credentials are missing to prevent crashes
const createSupabaseClient = () => {
  try {
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase credentials');
    }
    return createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        storage: localStorage
      }
    });
  } catch (error) {
    console.error('Failed to initialize Supabase client:', error);
    
    // Return a mock client that will show clear errors instead of crashing
    return {
      storage: {
        from: () => ({
          upload: async () => ({ error: new Error('Supabase not configured') }),
          getPublicUrl: () => ({ data: { publicUrl: '' } }),
          remove: async () => ({ error: new Error('Supabase not configured') })
        })
      },
      auth: {
        signIn: async () => ({ error: new Error('Supabase not configured') }),
        signOut: async () => ({ error: new Error('Supabase not configured') }),
        getSession: async () => ({ data: { session: null }, error: new Error('Supabase not configured') }),
        setSession: async () => ({ data: { session: null }, error: new Error('Supabase not configured') })
      }
    } as any;
  }
};

export const supabase = createSupabaseClient(); 