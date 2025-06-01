import { SearchBar } from "@/components/search/SearchBar";
import { FieldWorkGrid } from "@/components/FieldWorkGrid";
import { fieldWorksList } from "./types";
import { Outlet, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";

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
    <div className="min-h-screen bg-background py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight mb-6">Field Works</h1>
          <div className="flex justify-center mb-8">
            <SearchBar onSearch={handleSearch} placeholder="Search field works..." />
          </div>
        </div>
        
        {location.pathname === "/field-works" && (
          <div className="bg-white rounded-lg shadow p-6 border border-muted">
            <FieldWorkGrid works={filteredWorks} />
          </div>
        )}
        
        <Outlet />
      </div>
    </div>
  );
}