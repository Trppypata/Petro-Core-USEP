import { useState, useEffect } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import RocksMineralsGrid from "../../../components/Rocks-Minerals-Grid";
import { SearchBar } from "../../../components/search/SearchBar";
import { getRocks, getMinerals } from "./services/rocks-minerals.service";
import type { RocksMineralsItem } from "./types";
import RockMineralFilters from "./filters/RockMineralFilters";
import type { FiltersState } from "./filters/RockMineralFilters";
import { MapPin } from "lucide-react";
import { Trivia } from "../../home/hero/trivia";

const RockMinerals = () => {
  const location = useLocation();
  const [items, setItems] = useState<RocksMineralsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [displayType, setDisplayType] = useState<"rocks" | "minerals" | "all">("rocks");
  const [filters, setFilters] = useState<FiltersState>({
    rockType: [],
    mineralCategory: [],
    colors: [],
    associatedMinerals: []
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Determine whether to show rocks or minerals based on the URL
        let fetchedItems: RocksMineralsItem[] = [];
        
        if (displayType === "rocks") {
          fetchedItems = await getRocks(searchTerm, filters);
        } else if (displayType === "minerals") {
          fetchedItems = await getMinerals(searchTerm, filters);
        } else {
          // Future expansion for "all" option
          const rocks = await getRocks(searchTerm, filters);
          const minerals = await getMinerals(searchTerm, filters);
          fetchedItems = [...rocks, ...minerals];
        }
        
        setItems(fetchedItems);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [searchTerm, displayType, filters]);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  const handleDisplayTypeChange = (type: "rocks" | "minerals" | "all") => {
    setDisplayType(type);
  };

  const handleFiltersChange = (newFilters: FiltersState) => {
    setFilters(newFilters);
  };

  // Get trivia category based on display type
  const getTriviaCategory = () => {
    switch (displayType) {
      case "rocks":
        return "rocks";
      case "minerals":
        return "minerals";
      default:
        return "all";
    }
  };

  return (
    <div className="min-h-screen bg-background py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold tracking-tight text-primary mb-6">
            Rocks and Minerals
          </h1>
          
          {/* Trivia component - shows as toast notifications */}
          <Trivia category={getTriviaCategory()} />
          
          <div className="flex justify-center mb-6">
            <SearchBar 
              onSearch={handleSearch} 
              initialValue={searchTerm} 
              className="max-w-md w-full"
            />
          </div>

          <div className="flex flex-wrap gap-2 mb-4 justify-center">
            <button
              onClick={() => handleDisplayTypeChange("rocks")}
              className={`rounded-full px-6 py-2 transition-all duration-200 shadow-sm flex items-center gap-2 ${
                displayType === "rocks" 
                  ? "bg-primary text-primary-foreground shadow-md" 
                  : "bg-card hover:bg-muted border border-border"
              }`}
            >
              Rocks
            </button>
            <button
              onClick={() => handleDisplayTypeChange("minerals")}
              className={`rounded-full px-6 py-2 transition-all duration-200 shadow-sm flex items-center gap-2 ${
                displayType === "minerals" 
                  ? "bg-primary text-primary-foreground shadow-md" 
                  : "bg-card hover:bg-muted border border-border"
              }`}
            >
              Minerals
            </button>
            <Link
              to="/rock-minerals/map"
              className={`rounded-full px-6 py-2 transition-all duration-200 shadow-sm flex items-center gap-2 ${
                location.pathname === "/rock-minerals/map" 
                  ? "bg-primary text-primary-foreground shadow-md" 
                  : "bg-card hover:bg-muted border border-border"
              }`}
            >
              <MapPin className="h-4 w-4" />
              Map
            </Link>
          </div>
        </div>
        
        {location.pathname === "/rock-minerals" && (
          <div className="space-y-6">
            <RockMineralFilters 
              displayType={displayType} 
              onFiltersChange={handleFiltersChange} 
            />
            
            <div className="bg-card rounded-xl p-6 shadow-sm border border-muted">
              <RocksMineralsGrid 
                items={items} 
                isLoading={loading} 
              />
            </div>
          </div>
        )}
      </div>
      <Outlet />
    </div>
  );
};

export default RockMinerals;