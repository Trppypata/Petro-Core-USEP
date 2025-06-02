import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, FileText, UploadCloud, Trash2, Plus, ChevronDown, ChevronUp, Save } from "lucide-react";
import { toast } from "sonner";
import { uploadFile, deleteFile } from '@/services/storage.service';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/lib/supabase';

// Interface for PDF file entry
interface PDFFile {
  id: string;
  title: string;
  description: string;
  fieldwork_id: string;
  section_id: string;
  file_url: string;
  file_type: 'chapter' | 'assignment';
  created_at: string;
}

// Interface for fieldwork section
interface FieldworkSection {
  id: string;
  title: string;
  fieldwork_id: string;
  order: number;
}

// Interface for fieldwork
interface Fieldwork {
  id: string;
  title: string;
  description: string;
  path: string;
}

const FilePage = () => {
  const [pdfs, setPdfs] = useState<PDFFile[]>([]);
  const [sections, setSections] = useState<FieldworkSection[]>([]);
  const [fieldworks, setFieldworks] = useState<Fieldwork[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("upload");
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  
  // Form states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedFieldwork, setSelectedFieldwork] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [fileType, setFileType] = useState<"chapter" | "assignment">("chapter");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  
  // New section form states
  const [newSectionTitle, setNewSectionTitle] = useState("");
  const [newSectionFieldworkId, setNewSectionFieldworkId] = useState("");

  useEffect(() => {
    console.log('Component mounted, fetching data...');
    fetchFieldworks();
    fetchSections();
    fetchPDFs();
  }, []);

  const fetchFieldworks = async () => {
    try {
      console.log('Fetching fieldworks...');
      const { data, error } = await supabase
        .from('fieldworks')
        .select('*')
        .order('title');
      
      if (error) {
        console.error('Error fetching fieldworks:', error);
        throw error;
      }
      
      console.log('Fieldworks fetched successfully:', data);
      setFieldworks(data || []);
    } catch (error) {
      console.error('Error fetching fieldworks:', error);
      toast.error('Failed to load fieldworks.');
    }
  };

  const fetchSections = async () => {
    try {
      console.log('Fetching sections...');
      const { data, error } = await supabase
        .from('fieldwork_sections')
        .select('*')
        .order('order');
      
      if (error) {
        console.error('Error fetching sections:', error);
        throw error;
      }
      
      console.log('Sections fetched successfully:', data);
      setSections(data || []);
    } catch (error) {
      console.error('Error fetching sections:', error);
      toast.error('Failed to load sections.');
    }
  };

  const fetchPDFs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('fieldwork_files')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setPdfs(data || []);
    } catch (error) {
      console.error('Error fetching PDFs:', error);
      toast.error('Failed to load PDF files.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Check if file is PDF
      if (file.type !== 'application/pdf') {
        setErrorMessage('Only PDF files are allowed.');
        setSelectedFile(null);
        return;
      }
      
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setErrorMessage('File size exceeds the maximum limit of 10MB.');
        setSelectedFile(null);
        return;
      }
      
      setErrorMessage("");
      setSelectedFile(file);
    }
  };

  const handleFieldworkChange = (value: string) => {
    console.log("Selected fieldwork:", value);
    setSelectedFieldwork(value);
    setSelectedSection("");
  };
  
  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const createNewSection = async () => {
    if (!newSectionTitle || !newSectionFieldworkId) {
      toast.error('Please enter a section title and select a fieldwork.');
      return;
    }

    try {
      // Get the highest order for this fieldwork
      const { data: existingSections } = await supabase
        .from('fieldwork_sections')
        .select('order')
        .eq('fieldwork_id', newSectionFieldworkId)
        .order('order', { ascending: false })
        .limit(1);

      const nextOrder = existingSections && existingSections.length > 0 
        ? existingSections[0].order + 1 
        : 1;

      const { data, error } = await supabase
        .from('fieldwork_sections')
        .insert({
          title: newSectionTitle,
          fieldwork_id: newSectionFieldworkId,
          order: nextOrder
        })
        .select()
        .single();

      if (error) throw error;
      
      // Add new section to the state
      setSections(prev => [...prev, data]);
      
      // Clear the form
      setNewSectionTitle("");
      toast.success('Section created successfully.');
      
      // Set the newly created section as the selected section
      if (data.id) {
        setSelectedSection(data.id);
      }
    } catch (error) {
      console.error('Error creating section:', error);
      toast.error('Failed to create section.');
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile || !title || !selectedFieldwork || !selectedSection || !fileType) {
      setErrorMessage("Please fill all required fields.");
      return;
    }

    setIsUploading(true);
    setErrorMessage("");
    
    try {
      // Upload file to Supabase Storage
      const fileUrl = await uploadFile(selectedFile, 'fieldworks');
      
      if (!fileUrl) {
        throw new Error('File upload failed');
      }
      
      // Save metadata to database
      const { error } = await supabase
        .from('fieldwork_files')
        .insert({
          title,
          description,
          fieldwork_id: selectedFieldwork,
          section_id: selectedSection,
          file_url: fileUrl,
          file_type: fileType
        });
      
      if (error) throw error;
      
      // Refresh PDFs list
      fetchPDFs();
      
      // Reset form
      setSelectedFile(null);
      setTitle("");
      setDescription("");
      setSelectedFieldwork("");
      setSelectedSection("");
      setFileType("chapter");
      
      toast.success('PDF file uploaded successfully.');
      setActiveTab("manage");
    } catch (error) {
      console.error('Error uploading PDF:', error);
      setErrorMessage('Failed to upload PDF. Please try again.');
      toast.error('Failed to upload PDF.');
    } finally {
      setIsUploading(false);
    }
  };

  const deletePDF = async (pdf: PDFFile) => {
    if (!confirm(`Are you sure you want to delete "${pdf.title}"?`)) {
      return;
    }

    try {
      // Delete from database
      const { error } = await supabase
        .from('fieldwork_files')
        .delete()
        .eq('id', pdf.id);
      
      if (error) throw error;
      
      // Delete file from storage
      await deleteFile(pdf.file_url);
      
      // Update state
      setPdfs(pdfs.filter(p => p.id !== pdf.id));
      
      toast.success('PDF file deleted successfully.');
    } catch (error) {
      console.error('Error deleting PDF:', error);
      toast.error('Failed to delete PDF.');
    }
  };

  // Filter sections based on selected fieldwork
  const filteredSections = sections.filter(
    section => section.fieldwork_id === selectedFieldwork
  );

  // Group PDFs by fieldwork and section for display
  const groupedPDFs: Record<string, Record<string, PDFFile[]>> = {};
  
  pdfs.forEach(pdf => {
    // Initialize fieldwork group if it doesn't exist
    if (!groupedPDFs[pdf.fieldwork_id]) {
      groupedPDFs[pdf.fieldwork_id] = {};
    }
    
    // Initialize section group if it doesn't exist
    if (!groupedPDFs[pdf.fieldwork_id][pdf.section_id]) {
      groupedPDFs[pdf.fieldwork_id][pdf.section_id] = [];
    }
    
    // Add PDF to the appropriate group
    groupedPDFs[pdf.fieldwork_id][pdf.section_id].push(pdf);
  });

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Fieldwork Files Management</h1>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="upload">Upload PDF</TabsTrigger>
          <TabsTrigger value="section">Manage Sections</TabsTrigger>
          <TabsTrigger value="manage">Manage Files</TabsTrigger>
        </TabsList>
        
        <TabsContent value="upload">
          <Card>
            <CardHeader>
              <CardTitle>Upload PDF File</CardTitle>
              <CardDescription>Upload PDF files for fieldwork courses.</CardDescription>
            </CardHeader>
            <CardContent>
              {errorMessage && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{errorMessage}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-4">
                <div className="grid w-full max-w-sm items-center gap-1.5">
                  <Label htmlFor="pdf-file">PDF File</Label>
                  <div 
                    className={`border-2 border-dashed rounded-md p-6 flex flex-col items-center justify-center h-40 ${
                      selectedFile ? 'border-primary' : 'border-border'
                    } hover:border-primary cursor-pointer`}
                    onClick={() => document.getElementById('pdf-file')?.click()}
                  >
                    {selectedFile ? (
                      <div className="flex flex-col items-center text-center">
                        <FileText className="h-10 w-10 text-primary mb-2" />
                        <p className="font-medium">{selectedFile.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center text-center">
                        <UploadCloud className="h-10 w-10 text-muted-foreground mb-2" />
                        <p className="font-medium">Click to upload PDF</p>
                        <p className="text-sm text-muted-foreground">PDF up to 10MB</p>
                      </div>
                    )}
                  </div>
                  <input
                    id="pdf-file"
                    type="file"
                    accept="application/pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
                
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="title">Title <span className="text-destructive">*</span></Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g., Chapter 1: Introduction to Geohazards"
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Brief description of the content"
                      rows={3}
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="fieldwork">Fieldwork <span className="text-destructive">*</span></Label>
                    <Select 
                      value={selectedFieldwork} 
                      onValueChange={handleFieldworkChange}
                      name="fieldwork"
                    >
                      <SelectTrigger id="fieldwork">
                        <SelectValue placeholder="Select a fieldwork" />
                      </SelectTrigger>
                      <SelectContent>
                        {fieldworks.map((fieldwork) => (
                          <SelectItem key={fieldwork.id} value={fieldwork.id}>
                            {fieldwork.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="section">Section <span className="text-destructive">*</span></Label>
                    <Select 
                      value={selectedSection} 
                      onValueChange={setSelectedSection}
                      disabled={!selectedFieldwork}
                      name="section"
                    >
                      <SelectTrigger id="section">
                        <SelectValue placeholder={selectedFieldwork ? "Select a section" : "Select a fieldwork first"} />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredSections.map((section) => (
                          <SelectItem key={section.id} value={section.id}>
                            {section.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="file-type">File Type <span className="text-destructive">*</span></Label>
                    <Select 
                      value={fileType} 
                      onValueChange={(value) => setFileType(value as "chapter" | "assignment")}
                      name="file-type"
                    >
                      <SelectTrigger id="file-type">
                        <SelectValue placeholder="Select file type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="chapter">Chapter/Material</SelectItem>
                        <SelectItem value="assignment">Assignment</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button 
                onClick={handleSubmit} 
                disabled={isUploading || !selectedFile || !title || !selectedFieldwork || !selectedSection}
              >
                {isUploading ? "Uploading..." : "Upload PDF"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="section">
          <Card>
            <CardHeader>
              <CardTitle>Manage Sections</CardTitle>
              <CardDescription>Create and organize sections for fieldwork courses.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">Create New Section</h3>
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="new-section-title">Section Title <span className="text-destructive">*</span></Label>
                      <Input
                        id="new-section-title"
                        value={newSectionTitle}
                        onChange={(e) => setNewSectionTitle(e.target.value)}
                        placeholder="e.g., Introduction and Fundamentals"
                      />
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="new-section-fieldwork">For Fieldwork <span className="text-destructive">*</span></Label>
                      <Select 
                        value={newSectionFieldworkId} 
                        onValueChange={setNewSectionFieldworkId}
                        name="new-section-fieldwork"
                      >
                        <SelectTrigger id="new-section-fieldwork">
                          <SelectValue placeholder="Select a fieldwork" />
                        </SelectTrigger>
                        <SelectContent>
                          {fieldworks.map((fieldwork) => (
                            <SelectItem key={fieldwork.id} value={fieldwork.id}>
                              {fieldwork.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <Button 
                      onClick={createNewSection}
                      disabled={!newSectionTitle || !newSectionFieldworkId}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create Section
                    </Button>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="text-lg font-medium mb-4">Existing Sections</h3>
                  
                  {fieldworks.map(fieldwork => {
                    const fieldworkSections = sections.filter(
                      section => section.fieldwork_id === fieldwork.id
                    );
                    
                    return (
                      <div key={fieldwork.id} className="mb-4">
                        <h4 className="font-medium text-md mb-2">{fieldwork.title}</h4>
                        
                        {fieldworkSections.length > 0 ? (
                          <div className="space-y-2 pl-4">
                            {fieldworkSections.map(section => (
                              <div key={section.id} className="flex items-center justify-between p-2 rounded bg-muted/50">
                                <span>{section.title}</span>
                                <span className="text-sm text-muted-foreground">Order: {section.order}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground pl-4">No sections yet</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="manage">
          <Card>
            <CardHeader>
              <CardTitle>Manage PDF Files</CardTitle>
              <CardDescription>View, organize, and delete uploaded PDF files.</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <p>Loading files...</p>
                </div>
              ) : pdfs.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No PDF files uploaded yet.</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => setActiveTab("upload")}
                  >
                    <UploadCloud className="h-4 w-4 mr-2" />
                    Upload your first PDF
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  {fieldworks.map(fieldwork => {
                    // Skip if no PDFs for this fieldwork
                    if (!groupedPDFs[fieldwork.id]) return null;
                    
                    return (
                      <div key={fieldwork.id} className="space-y-2">
                        <h3 className="text-xl font-medium">{fieldwork.title}</h3>
                        
                        {Object.entries(groupedPDFs[fieldwork.id]).map(([sectionId, sectionPdfs]) => {
                          const section = sections.find(s => s.id === sectionId);
                          
                          return (
                            <Card key={sectionId} className="mb-4 overflow-hidden">
                              <div 
                                className="p-4 bg-white flex justify-between items-center cursor-pointer"
                                onClick={() => toggleSection(sectionId)}
                              >
                                <h4 className="font-medium">{section?.title || "Unnamed Section"}</h4>
                                {expandedSections[sectionId] ? (
                                  <ChevronUp className="h-4 w-4" />
                                ) : (
                                  <ChevronDown className="h-4 w-4" />
                                )}
                              </div>
                              
                              {expandedSections[sectionId] && (
                                <div className="p-4 border-t">
                                  <div className="space-y-4">
                                    {sectionPdfs.map(pdf => (
                                      <div key={pdf.id} className="flex items-center justify-between p-2 rounded hover:bg-muted">
                                        <div className="flex items-center gap-3">
                                          <FileText className="h-5 w-5 text-primary" />
                                          <div>
                                            <a 
                                              href={pdf.file_url} 
                                              target="_blank" 
                                              rel="noopener noreferrer"
                                              className="font-medium hover:underline"
                                            >
                                              {pdf.title}
                                            </a>
                                            <p className="text-sm text-muted-foreground">
                                              {pdf.file_type === "chapter" ? "Material" : "Assignment"}
                                              {pdf.description && ` - ${pdf.description}`}
                                            </p>
                                          </div>
                                        </div>
                                        <Button 
                                          variant="ghost" 
                                          size="icon"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            deletePDF(pdf);
                                          }}
                                        >
                                          <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </Card>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FilePage;
