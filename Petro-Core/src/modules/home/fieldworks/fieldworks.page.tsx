import { SearchBar } from "@/components/search/SearchBar";
import { FieldWorkGrid } from "@/components/FieldWorkGrid";
import { Outlet, useLocation, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { TriviaToast } from "@/components/trivia/TriviaToast";
import { supabase } from "@/lib/supabase";
import { Loader2, AlertTriangle, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface FieldWork {
  id: string;
  title: string;
  description: string;
  path: string;
}

export default function FieldWorks() { 
  const location = useLocation();
  const [fieldWorks, setFieldWorks] = useState<FieldWork[]>([]);
  const [filteredWorks, setFilteredWorks] = useState<FieldWork[]>([]);
  const [loading, setLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchFieldWorks();
  }, [retryCount]);

  const fetchFieldWorks = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Fetching fieldworks...');
      
      // Check authentication status
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session) {
        console.log('No active Supabase session, proceeding as anonymous user');
      } else {
        console.log('Active session with user:', sessionData.session.user.id);
      }
      
      // Check if the fieldworks table exists
      try {
        // Try to count rows to verify table exists
        const { count, error: tableError } = await supabase
          .from('fieldworks')
          .select('*', { count: 'exact', head: true });
          
        if (tableError) {
          console.error('Error checking fieldworks table:', tableError);
          throw tableError;
        } else {
          console.log(`Fieldworks table exists with approximately ${count} rows`);
        }
      } catch (tableErr) {
        console.error('Error verifying fieldworks table:', tableErr);
        throw tableErr;
      }
      
      // Perform the main query
      const { data, error } = await supabase
        .from('fieldworks')
        .select('*')
        .order('title');
      
      if (error) {
        console.error('Error fetching fieldworks:', error);
        throw error;
      }
      
      console.log("Fetched fieldworks:", data);
      setFieldWorks(data || []);
      setFilteredWorks(data || []);
    } catch (err: any) {
      console.error('Error fetching fieldworks:', err);
      setError(err?.message || 'Failed to load field works data');
      toast.error('Failed to load field works data');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setFilteredWorks(fieldWorks);
      return;
    }
    
    const lowercasedSearch = searchTerm.toLowerCase();
    const filtered = fieldWorks.filter(work => 
      work.title.toLowerCase().includes(lowercasedSearch) || 
      (work.description && work.description.toLowerCase().includes(lowercasedSearch))
    );
    
    setFilteredWorks(filtered);
  };
  
  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    toast.info('Retrying connection...');
  };

  const renderSetupInstructions = () => {
    if (!error) return null;
    
    return (
      <Alert className="my-4">
        <AlertTriangle className="h-5 w-5" />
        <AlertTitle>Database Connection Issue</AlertTitle>
        <AlertDescription className="space-y-4">
          <p>There appears to be an issue with the fieldworks database setup:</p>
          <p className="text-sm text-muted-foreground">{error}</p>
          <div className="flex space-x-2">
            <Button onClick={handleRetry} size="sm" className="mt-2">
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry Connection
            </Button>
            <Link to="/admin/files">
              <Button variant="outline" size="sm" className="mt-2">
                Go to Admin File Manager
              </Button>
            </Link>
          </div>
        </AlertDescription>
      </Alert>
    );
  };
  
  return (
    <div className="min-h-screen bg-background py-24 px-4 sm:px-6 lg:px-8">
      <TriviaToast 
        autoShow={true} 
        delay={4000} 
        category="fieldwork" 
        position="bottom-right"
      />
      
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold tracking-tight text-primary mb-6">Field Works</h1>
          <div className="flex justify-center mb-6">
            <SearchBar 
              onSearch={handleSearch} 
              placeholder="Search field works..." 
              className="max-w-md w-full"
            />
          </div>
        </div>
        
        {error && renderSetupInstructions()}
        
        {location.pathname === "/field-works" && (
          <div className="space-y-6">
            <div className="bg-card rounded-xl p-6 shadow-sm border border-muted">
              {loading ? (
                <div className="flex justify-center items-center h-40">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredWorks.length > 0 ? (
                <FieldWorkGrid works={filteredWorks} />
              ) : !error ? (
                <div className="text-center py-8">
                  <p className="text-lg font-semibold">No field works found</p>
                  <p className="text-muted-foreground mb-4">There might be an issue connecting to the database.</p>
                  <Button onClick={handleRetry} variant="outline">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Retry
                  </Button>
                </div>
              ) : null}
            </div>
          </div>
        )}
        
        <Outlet />
      </div>
    </div>
  );
}