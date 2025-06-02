import { SearchBar } from "@/components/search/SearchBar";
import { FieldWorkGrid } from "@/components/FieldWorkGrid";
import { fieldWorksList } from "./types";
import { Outlet, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { TriviaToast } from "@/components/trivia/TriviaToast";

export default function FieldWorks() { 
  const location = useLocation();
  
  // Create a complete list including Research explicitly
  const completeWorksList = [
    ...fieldWorksList,
    // Ensure Research is included by adding it explicitly if not already present
    ...(fieldWorksList.some(work => work.title === "Research") 
      ? [] 
      : [{
          title: "Research",
          description: "Geological research studies and academic papers on various earth science topics and findings.",
          path: "/field-works/research",
        }]
    )
  ];
  
  const [filteredWorks, setFilteredWorks] = useState(completeWorksList);

  useEffect(() => {
    // Debug log to see if Research is included in the list
    console.log("FieldWorks - fieldWorksList:", fieldWorksList);
    console.log("FieldWorks - completeWorksList:", completeWorksList);
  }, []);

  const handleSearch = (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setFilteredWorks(completeWorksList);
      return;
    }
    
    const lowercasedSearch = searchTerm.toLowerCase();
    const filtered = completeWorksList.filter(work => 
      work.title.toLowerCase().includes(lowercasedSearch) || 
      work.description.toLowerCase().includes(lowercasedSearch)
    );
    
    setFilteredWorks(filtered);
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
        
        {location.pathname === "/field-works" && (
          <div className="space-y-6">
            <div className="bg-card rounded-xl p-6 shadow-sm border border-muted">
              <FieldWorkGrid works={filteredWorks} />
            </div>
          </div>
        )}
        
        <Outlet />
      </div>
    </div>
  );
}