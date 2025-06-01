import { Link, Outlet, useLocation } from "react-router-dom";
import { SearchBar } from "@/components/search/SearchBar";
import { FieldWorkGrid } from "@/components/FieldWorkGrid";
import { fieldWorksList } from "./types";
import { useState } from "react";

const FieldWorks = () => {
  const location = useLocation();
  const [filteredWorks, setFilteredWorks] = useState(fieldWorksList);
  
  const handleSearch = (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setFilteredWorks(fieldWorksList);
      return;
    }
    
    const lowercasedSearch = searchTerm.toLowerCase();
    const filtered = fieldWorksList.filter(work => 
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
          <div className="bg-white rounded-lg shadow-sm p-6">
            <FieldWorkGrid works={filteredWorks} />
          </div>
        )}
        
        <Outlet />
      </div>
    </div>
  );
};

export default FieldWorks;
