// Sample .env file for Petro-Core application
// Rename this file to .env and place it in the Petro-Core directory

# Supabase Configuration
# Get these values from your Supabase dashboard > Project Settings > API
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# API Configuration
VITE_API_URL=http://localhost:8001/api

# Additional Configuration
# NODE_ENV=development
# VITE_DEBUG=true 

import { BrowserRouter } from 'react-router-dom';
import { AppRoutes } from './routes/router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from './components/ui/sonner';
import { SupabaseSetup } from './supabase-setup';
import { SupabaseTester } from './supabase-tester';

// Create a client for React Query
const queryClient = new QueryClient();

function App() {
  // Check if we're in test mode - add ?test=true to URL to test Supabase
  const params = new URLSearchParams(window.location.search);
  const testMode = params.get('test');
  
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {testMode === 'setup' ? (
          <SupabaseSetup />
        ) : testMode === 'tester' ? (
          <SupabaseTester />
        ) : (
          <AppRoutes />
        )}
      </BrowserRouter>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App; 