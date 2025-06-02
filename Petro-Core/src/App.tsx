import { SupabaseTester } from './supabase-tester';

const router = createBrowserRouter([
  // ... existing routes ...
  {
    path: "/supabase-test",
    element: <SupabaseTester />
  },
  // ... existing routes ...
]); 