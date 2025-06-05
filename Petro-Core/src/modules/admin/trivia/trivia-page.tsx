import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, Pencil, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import { Spinner } from "@/components/spinner";
import type { Trivia } from "@/services/trivia.service";
import { 
  getTriviaItems, 
  createTrivia, 
  updateTrivia, 
  deleteTrivia 
} from "@/services/trivia.service";
import { supabase } from "@/lib/supabase";

const TriviaPage = () => {
  const [triviaItems, setTriviaItems] = useState<Trivia[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("list");
  const [editingTrivia, setEditingTrivia] = useState<Trivia | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("general");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Check if trivia table exists when component mounts
    ensureTriviaTableExists().then(() => {
      fetchTriviaItems();
    });
  }, []);

  // Function to check and create trivia table if it doesn't exist
  const ensureTriviaTableExists = async () => {
    try {
      // Check if trivia table exists
      const { data, error } = await supabase
        .from('trivia')
        .select('id')
        .limit(1);
      
      // If there's an error related to table not existing, create it
      if (error && error.message.includes('relation "trivia" does not exist')) {
        console.log("Trivia table doesn't exist. Creating it...");
        
        // Create the trivia table
        const { error: createError } = await supabase.rpc('create_trivia_table');
        
        if (createError) {
          // If RPC function doesn't exist, try direct SQL
          const { error: sqlError } = await supabase.from('_exec_sql').select('*').eq('query', `
            CREATE TABLE IF NOT EXISTS trivia (
              id SERIAL PRIMARY KEY,
              title TEXT NOT NULL,
              content TEXT NOT NULL,
              category TEXT DEFAULT 'general',
              image TEXT,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
            );
          `);
          
          if (sqlError) {
            console.error("Failed to create trivia table:", sqlError);
            toast.error("Failed to set up trivia database. Please contact the administrator.");
            return;
          }
        }
        
        toast.success("Trivia system has been set up successfully!");
      }
    } catch (error) {
      console.error("Error checking/creating trivia table:", error);
    }
  };

  const fetchTriviaItems = async () => {
    setLoading(true);
    try {
      const items = await getTriviaItems();
      setTriviaItems(items);
    } catch (error) {
      console.error("Error fetching trivia items:", error);
      toast.error("Failed to load trivia items");
    } finally {
      setLoading(false);
    }
  };

  const handleAddTrivia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) {
      toast.error("Title and content are required");
      return;
    }

    setIsSubmitting(true);
    try {
      const newTriviaData = { title, content, category };
      await createTrivia(newTriviaData);

      toast.success("Trivia added successfully");
      resetForm();
      fetchTriviaItems();
      setActiveTab("list");
    } catch (error) {
      console.error("Error adding trivia:", error);
      toast.error("Failed to add trivia");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditTrivia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTrivia?.id || !title || !content) {
      toast.error("Title and content are required");
      return;
    }

    setIsSubmitting(true);
    try {
      const updatedTriviaData = { title, content, category };
      await updateTrivia(editingTrivia.id, updatedTriviaData);

      toast.success("Trivia updated successfully");
      resetForm();
      fetchTriviaItems();
      setActiveTab("list");
    } catch (error) {
      console.error("Error updating trivia:", error);
      toast.error("Failed to update trivia");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTrivia = async (id: number) => {
    if (!confirm("Are you sure you want to delete this trivia?")) return;

    try {
      await deleteTrivia(id);
      toast.success("Trivia deleted successfully");
      fetchTriviaItems();
    } catch (error) {
      console.error("Error deleting trivia:", error);
      toast.error("Failed to delete trivia");
    }
  };

  const startEdit = (trivia: Trivia) => {
    setEditingTrivia(trivia);
    setTitle(trivia.title);
    setContent(trivia.content);
    setCategory(trivia.category || "general");
    setActiveTab("edit");
  };

  const resetForm = () => {
    setTitle("");
    setContent("");
    setCategory("general");
    setEditingTrivia(null);
  };

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Trivia Management</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="list">Trivia List</TabsTrigger>
          <TabsTrigger value="add">Add New Trivia</TabsTrigger>
          {editingTrivia && <TabsTrigger value="edit">Edit Trivia</TabsTrigger>}
        </TabsList>

        <TabsContent value="list">
          <Card>
            <CardHeader>
              <CardTitle>Existing Trivia</CardTitle>
              <CardDescription>View, edit, or delete existing trivia facts.</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center items-center h-40">
                  <Spinner size="lg" />
                </div>
              ) : triviaItems.length === 0 ? (
                <div className="text-center py-8">
                  <Lightbulb className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">No trivia items found. Create your first one!</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => setActiveTab("add")}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Trivia
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {triviaItems.map((trivia) => (
                    <div 
                      key={trivia.id} 
                      className="p-4 border rounded-lg bg-card hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-lg flex items-center gap-2">
                            <Lightbulb className="h-4 w-4 text-primary" />
                            {trivia.title}
                          </h3>
                          <div className="mt-1">
                            {trivia.category && (
                              <Badge variant="outline" className="mr-2">
                                {trivia.category}
                              </Badge>
                            )}
                          </div>
                          <p className="mt-2 text-muted-foreground">{trivia.content}</p>
                        </div>
                        <div className="flex space-x-2">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => startEdit(trivia)}
                          >
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => trivia.id && handleDeleteTrivia(trivia.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button onClick={() => setActiveTab("add")}>
                <Plus className="h-4 w-4 mr-2" />
                Add New Trivia
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="add">
          <Card>
            <CardHeader>
              <CardTitle>Add New Trivia</CardTitle>
              <CardDescription>Add a new trivia fact to the collection</CardDescription>
            </CardHeader>
            <CardContent>
              <form id="add-trivia-form" onSubmit={handleAddTrivia}>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="title">Title <span className="text-destructive">*</span></Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Did you know..."
                      required
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="content">Content <span className="text-destructive">*</span></Label>
                    <Textarea
                      id="content"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="The fascinating fact about rocks or minerals..."
                      rows={5}
                      required
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="category">Category</Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General</SelectItem>
                        <SelectItem value="rocks">Rocks</SelectItem>
                        <SelectItem value="minerals">Minerals</SelectItem>
                        <SelectItem value="geology">Geology</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Image field removed as the database table doesn't have this column */}
                </div>
              </form>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button 
                variant="outline" 
                onClick={() => {
                  resetForm();
                  setActiveTab("list");
                }}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                form="add-trivia-form"
                disabled={isSubmitting || !title || !content}
              >
                {isSubmitting ? (
                  <>
                    <Spinner size="sm" className="mr-2" />
                    Saving...
                  </>
                ) : (
                  <>Save Trivia</>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="edit">
          <Card>
            <CardHeader>
              <CardTitle>Edit Trivia</CardTitle>
              <CardDescription>Update an existing trivia fact</CardDescription>
            </CardHeader>
            <CardContent>
              <form id="edit-trivia-form" onSubmit={handleEditTrivia}>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-title">Title <span className="text-destructive">*</span></Label>
                    <Input
                      id="edit-title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Did you know..."
                      required
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="edit-content">Content <span className="text-destructive">*</span></Label>
                    <Textarea
                      id="edit-content"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="The fascinating fact about rocks or minerals..."
                      rows={5}
                      required
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="edit-category">Category</Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General</SelectItem>
                        <SelectItem value="rocks">Rocks</SelectItem>
                        <SelectItem value="minerals">Minerals</SelectItem>
                        <SelectItem value="geology">Geology</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Image field removed as the database table doesn't have this column */}
                </div>
              </form>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button 
                variant="outline" 
                onClick={() => {
                  resetForm();
                  setActiveTab("list");
                }}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                form="edit-trivia-form"
                disabled={isSubmitting || !title || !content}
              >
                {isSubmitting ? (
                  <>
                    <Spinner size="sm" className="mr-2" />
                    Updating...
                  </>
                ) : (
                  <>Update Trivia</>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TriviaPage;
