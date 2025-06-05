import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, ChevronDown, ChevronUp, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

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

  useEffect(() => {
    if (fieldId) {
      fetchFieldWorkData();
    }
  }, [fieldId]);

  const fetchFieldWorkData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch the field work details
      const { data: fieldWorkData, error: fieldWorkError } = await supabase
        .from('fieldworks')
        .select('*')
        .eq('id', fieldId)
        .single();
      
      if (fieldWorkError) {
        throw fieldWorkError;
      }
      
      if (!fieldWorkData) {
        setError('Field work not found');
        setLoading(false);
        return;
      }
      
      setFieldWork(fieldWorkData);
      
      // Fetch sections for this field work
      const { data: sectionsData, error: sectionsError } = await supabase
        .from('fieldwork_sections')
        .select('*')
        .eq('fieldwork_id', fieldId)
        .order('order');
      
      if (sectionsError) {
        throw sectionsError;
      }
      
      setSections(sectionsData || []);
      
      // Fetch PDF files for this field work
      const { data: pdfFilesData, error: pdfFilesError } = await supabase
        .from('fieldwork_files')
        .select('*')
        .eq('fieldwork_id', fieldId);
      
      if (pdfFilesError) {
        throw pdfFilesError;
      }
      
      setPdfFiles(pdfFilesData || []);
      
      // Expand the first section by default if there are sections
      if (sectionsData && sectionsData.length > 0) {
        setExpandedSections({
          [sectionsData[0].id]: true
        });
      }
    } catch (err) {
      console.error('Error fetching field work data:', err);
      setError('Failed to load field work data');
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

  // Group PDF files by section and type
  const getPDFsForSection = (sectionId: string, fileType: 'chapter' | 'assignment') => {
    return pdfFiles.filter(pdf => pdf.section_id === sectionId && pdf.file_type === fileType);
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
        <div className="text-center py-8 bg-card rounded-lg shadow">
          <h2 className="text-2xl font-bold text-destructive mb-2">Error</h2>
          <p className="text-muted-foreground">{error || 'Field work not found'}</p>
        </div>
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
                            href={chapter.file_url} 
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
                              href={assignment.file_url} 
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
