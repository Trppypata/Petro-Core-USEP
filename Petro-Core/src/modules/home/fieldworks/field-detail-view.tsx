import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, ChevronDown, ChevronUp, FileText, Loader2, AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

interface FieldWork {
  id: string;
  title: string;
  description: string;
  path: string;
}

interface FieldworkSection {
  id: string;
  title: string;
  fieldwork_id: string;
  order: number;
}

interface PDFFile {
  id: string;
  title: string;
  description?: string;
  fieldwork_id: string;
  section_id: string;
  file_url: string;
  file_type: 'chapter' | 'assignment';
  created_at: string;
}

const FieldDetailView = () => {
  const { fieldId } = useParams<{ fieldId: string }>();
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [fieldWork, setFieldWork] = useState<FieldWork | null>(null);
  const [sections, setSections] = useState<FieldworkSection[]>([]);
  const [pdfFiles, setPdfFiles] = useState<PDFFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (fieldId) {
      fetchFieldWorkData();
      checkFieldworksBucket();
    }
  }, [fieldId, retryCount]);

  // Check if fieldworks bucket exists and is accessible
  const checkFieldworksBucket = async () => {
    try {
      console.log('Checking if fieldworks bucket exists...');
      
      // Test if we can access the bucket by listing files
      const { data: files, error: listError } = await supabase.storage
        .from('fieldworks')
        .list();
        
      if (listError) {
        console.log('Cannot access fieldworks bucket:', listError);
        toast.warning('Limited access to fieldworks storage. Some files may not be viewable.');
      } else {
        console.log('Successfully accessed fieldworks bucket. Files:', files);
      }
    } catch (err) {
      console.error('Error checking fieldworks bucket:', err);
    }
  };

  const fetchFieldWorkData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log(`Fetching field work data for ID/path: ${fieldId}`);
      
      // Check if the fieldworks table exists first
      try {
        const { count, error: tableError } = await supabase
          .from('fieldworks')
          .select('*', { count: 'exact', head: true });
          
        if (tableError) {
          console.error('Error checking fieldworks table:', tableError);
          toast.error(`Database access error: ${tableError.message}`);
          throw tableError;
        } else {
          console.log(`Fieldworks table exists with approximately ${count} rows`);
        }
      } catch (tableErr: any) {
        console.error('Error verifying fieldworks table:', tableErr);
        setError(`Database table error: ${tableErr.message || 'Unknown error'}`);
        setLoading(false);
        return;
      }
      
      // Determine if fieldId is a UUID or a path/slug
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(fieldId || '');
      
      console.log(`Field ID format: ${isUuid ? 'UUID' : 'path/slug'}`);
      
      // Fetch the field work details using the appropriate field
      let query = supabase.from('fieldworks').select('*');
      
      if (isUuid) {
        query = query.eq('id', fieldId);
      } else {
        // If it's not a UUID, assume it's a path/slug
        query = query.eq('path', fieldId);
      }
      
      const { data: fieldWorkData, error: fieldWorkError } = await query.single();
      
      if (fieldWorkError) {
        console.error('Error fetching field work details:', fieldWorkError);
        setError(`Could not find field work with ID: ${fieldId}`);
        setLoading(false);
        return;
      }
      
      if (!fieldWorkData) {
        setError('Field work not found');
        setLoading(false);
        return;
      }
      
      setFieldWork(fieldWorkData);
      console.log('Field work details fetched:', fieldWorkData);
      
      // Now use the actual field work ID (from the database) for subsequent queries
      const actualFieldWorkId = fieldWorkData.id;
      
      // Fetch sections for this field work
      const { data: sectionsData, error: sectionsError } = await supabase
        .from('fieldwork_sections')
        .select('*')
        .eq('fieldwork_id', actualFieldWorkId)
        .order('order');
      
      if (sectionsError) {
        console.error('Error fetching sections:', sectionsError);
        toast.error(`Failed to load sections: ${sectionsError.message}`);
        // Try to determine if it's a missing column error
        if (sectionsError.message.includes('column') && sectionsError.message.includes('does not exist')) {
          console.error('Column missing error detected. Database schema might need updating.');
          setError('Database schema error: Missing "order" column in fieldwork_sections table');
        }
        setSections([]);
      } else {
        console.log('Sections fetched:', sectionsData);
        setSections(sectionsData || []);
      }
      
      // Fetch PDF files for this field work
      const { data: pdfFilesData, error: pdfFilesError } = await supabase
        .from('fieldwork_files')
        .select('*')
        .eq('fieldwork_id', actualFieldWorkId);
      
      if (pdfFilesError) {
        console.error('Error fetching PDF files:', pdfFilesError);
        toast.error(`Failed to load PDF files: ${pdfFilesError.message}`);
        setPdfFiles([]);
      } else {
        console.log('PDF files fetched:', pdfFilesData);
        
        // Process the PDF files to ensure URLs are correct
        const processedFiles = pdfFilesData?.map(file => {
          // Fix the file URL if needed
          let fileUrl = file.file_url;
          
          // If the URL is not a valid public URL, try to fix it
          if (fileUrl && !fileUrl.includes('/storage/v1/object/public/')) {
            try {
              // Extract the path from the URL
              const url = new URL(fileUrl);
              const pathParts = url.pathname.split('/');
              
              // Find 'fieldworks' in the path
              const bucketIndex = pathParts.findIndex(part => part === 'fieldworks');
              
              if (bucketIndex !== -1) {
                // Get the path after the bucket name
                const filePath = pathParts.slice(bucketIndex + 1).join('/');
                
                // Use Supabase's getPublicUrl method to get a proper public URL
                const { data } = supabase.storage
                  .from('fieldworks')
                  .getPublicUrl(filePath);
                
                if (data && data.publicUrl) {
                  console.log(`Fixed URL for file ${file.id}: ${data.publicUrl}`);
                  fileUrl = data.publicUrl;
                }
              }
            } catch (err) {
              console.error(`Error fixing URL for file ${file.id}:`, err);
            }
          }
          
          return {
            ...file,
            file_url: fileUrl
          };
        }) || [];
        
        setPdfFiles(processedFiles);
      }
      
      // Expand the first section by default if there are sections
      if (sectionsData && sectionsData.length > 0) {
        setExpandedSections({
          [sectionsData[0].id]: true
        });
      }
    } catch (err: any) {
      console.error('Error fetching field work data:', err);
      setError(err.message || 'Failed to load field work data');
      toast.error('Failed to load field work data');
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };
  
  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    toast.info('Retrying connection...');
  };

  // Group PDF files by section and type
  const getPDFsForSection = (sectionId: string, fileType: 'chapter' | 'assignment') => {
    return pdfFiles.filter(pdf => pdf.section_id === sectionId && pdf.file_type === fileType);
  };

  // Helper function to get a correct URL for a PDF file
  const getFixedPdfUrl = (url: string): string => {
    if (!url) return '';
    
    // If it already has the correct format, return as is
    if (url.includes('/storage/v1/object/public/')) {
      return url;
    }
    
    try {
      // Extract the path parts
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      
      // Find the bucket name in the path
      const bucketIndex = pathParts.findIndex(part => part === 'fieldworks');
      
      if (bucketIndex !== -1) {
        // Create a path relative to the bucket
        const filePath = pathParts.slice(bucketIndex + 1).join('/');
        
        // Get a signed URL instead of trying to access directly
        return `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/fieldworks/${filePath}`;
      }
    } catch (e) {
      console.error('Error fixing PDF URL:', e);
    }
    
    // Return the original URL as fallback
    return url;
  };
  
  const renderErrorMessage = () => {
    if (!error) return null;
    
    return (
      <Alert className="my-4 bg-destructive/10 border-destructive/20">
        <AlertTriangle className="h-5 w-5 text-destructive" />
        <AlertTitle className="text-destructive">Error Loading Field Work</AlertTitle>
        <AlertDescription className="space-y-4">
          <p>{error}</p>
          <div className="flex space-x-2">
            <Button 
              onClick={handleRetry} 
              variant="secondary"
              size="sm" 
              className="mt-2"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
            <Link to="/admin/files">
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2"
              >
                Manage Field Works
              </Button>
            </Link>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            If this issue persists, you may need to set up the fieldworks tables and storage in Supabase.
          </p>
        </AlertDescription>
      </Alert>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-40">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (error || !fieldWork) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Link to="/field-works">
          <Button variant="outline" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Field Works
          </Button>
        </Link>
        {renderErrorMessage()}
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Link to="/field-works">
        <Button variant="outline" className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Field Works
        </Button>
      </Link>
      
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">{fieldWork.title}</h1>
        <p className="text-muted-foreground">{fieldWork.description}</p>
      </div>
      
      {sections.length > 0 ? (
        sections.map(section => {
          const chapters = getPDFsForSection(section.id, 'chapter');
          const assignments = getPDFsForSection(section.id, 'assignment');
          
          return (
            <Card key={section.id} className="mb-4 overflow-hidden border-sedimentary/30">
              <div 
                className="p-4 bg-white text-foreground border-b border-sedimentary/30 flex justify-between items-center cursor-pointer"
                onClick={() => toggleSection(section.id)}
              >
                <h2 className="text-xl font-semibold text-gray-800">{section.title}</h2>
                {expandedSections[section.id] ? (
                  <ChevronUp className="h-5 w-5 text-gray-600" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-600" />
                )}
              </div>
              
              {expandedSections[section.id] && (
                <div className="p-4 bg-white text-foreground border-t border-sedimentary/30">
                  {/* Chapters */}
                  {chapters.length > 0 ? (
                    <div className="mb-4">
                      <h3 className="font-medium mb-2">Materials</h3>
                      {chapters.map(chapter => (
                        <div key={chapter.id} className="mb-4 flex items-center">
                          <FileText className="h-5 w-5 mr-2 text-primary" />
                          <a 
                            href={getFixedPdfUrl(chapter.file_url)} 
                            className="text-primary hover:underline flex items-center"
                            target="_blank" 
                            rel="noopener noreferrer"
                          >
                            {chapter.title} <span className="ml-2 text-sm text-muted-foreground">PDF</span>
                          </a>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground mb-4">No materials available for this section yet.</p>
                  )}
                  
                  {/* Assignments */}
                  {assignments.length > 0 && (
                    <div className="mt-6 border-t border-sedimentary/30 pt-4">
                      <h3 className="font-medium mb-2">Assignments</h3>
                      {assignments.map(assignment => (
                        <div key={assignment.id} className="mb-4">
                          <div className="mb-3">
                            <h4 className="text-lg font-semibold text-accent">{assignment.title}</h4>
                            {assignment.description && (
                              <p className="text-sm text-muted-foreground mt-1">{assignment.description}</p>
                            )}
                            <div className="text-sm text-muted-foreground mt-1">
                              <div>Posted: {new Date(assignment.created_at).toLocaleDateString()}</div>
                            </div>
                          </div>
                          
                          <div className="mt-2 flex items-center">
                            <FileText className="h-5 w-5 mr-2 text-primary" />
                            <a 
                              href={getFixedPdfUrl(assignment.file_url)} 
                              className="text-primary hover:underline flex items-center"
                              target="_blank" 
                              rel="noopener noreferrer"
                            >
                              Download Assignment <span className="ml-2 text-sm text-muted-foreground">PDF</span>
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </Card>
          );
        })
      ) : (
        <Card className="p-6">
          <p className="text-center text-muted-foreground">No content available for this field work yet.</p>
        </Card>
      )}
    </div>
  );
};

export default FieldDetailView;
