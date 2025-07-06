import { useState, useEffect } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import RocksMineralsGrid from "../../../components/Rocks-Minerals-Grid";
import { SearchBar } from "@/components/search/SearchBar";
import { getRocks, getMinerals, getRocksAndMinerals } from "./services/rocks-minerals.service";
import type { RocksMineralsItem } from "./types";
import type { FiltersState } from "./filters/RockMineralFilters";
import { MapPin, Filter, Layers, Palette, X, ChevronDown } from "lucide-react";
import { TriviaToast } from "@/components/trivia/TriviaToast";
import { Spinner } from '@/components/spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { TriviaButton } from '@/components/trivia/TriviaButton';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { IMineral } from "@/modules/admin/minerals/mineral.interface";

// List of predefined colors for filters
const COLORS = [
  "White", "Black", "Gray", "Red", "Green", "Blue", "Yellow", 
  "Brown", "Pink", "Purple", "Orange", "Colorless"
];

// List of predefined rock types
const ROCK_TYPES = [
  "Igneous", "Sedimentary", "Metamorphic", "Ore Samples", "Volcanic", "Plutonic", 
  "Clastic", "Chemical", "Organic", "Foliated", "Non-foliated"
];

// List of predefined mineral categories
const MINERAL_CATEGORIES = [
  "Silicates", "Oxides", "Hydroxides", "Sulfides", "Carbonates", 
  "Halides", "Phosphates", "Sulfates", "Native Elements", "Sulfosalts",
  "Borates", "Chromates", "Molybdates", "Tungstates", "Vanadates",
  "Arsenates", "Tellurides", "Selenides", "Antimonides", "Arsenides", 
  "Organics", "Nitrates"
];

const RockMinerals = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [items, setItems] = useState<RocksMineralsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [displayType, setDisplayType] = useState<"rocks" | "minerals" | "all">("all");
  const [filters, setFilters] = useState<FiltersState>({
    rockType: [],
    mineralCategory: [],
    colors: [],
    associatedMinerals: []
  });
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingStage, setLoadingStage] = useState("");
  
  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayType, JSON.stringify(filters)]);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    setLoadingProgress(10);
    setLoadingStage("Initializing...");
    
    try {
      let data: RocksMineralsItem[] = [];
      
      console.log('Fetching data with filters:', { displayType, searchTerm, filters });
      
      // Fetch data based on display type
      if (displayType === "all") {
        setLoadingStage("Fetching rocks and minerals...");
        setLoadingProgress(20);
        // Use dedicated function to get both rocks and minerals
        data = await getRocksAndMinerals(searchTerm, filters);
        setLoadingProgress(70);
      } else if (displayType === "rocks") {
        setLoadingStage("Fetching rocks...");
        setLoadingProgress(20);
        // Get only rocks
        data = await getRocks(searchTerm, filters);
        setLoadingProgress(60);
        // Ensure only rock items are displayed
        data = data.filter(item => item.type === 'rock');
        setLoadingProgress(70);
      } else if (displayType === "minerals") {
        setLoadingStage("Fetching minerals...");
        setLoadingProgress(20);
        // Get only minerals
        data = await getMinerals(searchTerm, filters);
        setLoadingProgress(60);
        // Ensure only mineral items are displayed
        data = data.filter(item => item.type === 'mineral');
        setLoadingProgress(70);
      }
      
      console.log(`Fetched ${data.length} items for display type: ${displayType}`);
      
      // Remove duplicates by ID
      setLoadingStage("Processing results...");
      setLoadingProgress(80);
      const uniqueItems = removeDuplicates(data);
      console.log(`After removing duplicates: ${uniqueItems.length} items`);
      
      setLoadingProgress(90);
      setItems(uniqueItems);
      setLoadingProgress(100);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load items. Please try again later.');
    } finally {
      // Small delay before hiding loading indicator for smoother transition
      setTimeout(() => {
        setIsLoading(false);
        setLoadingProgress(0);
        setLoadingStage("");
      }, 300);
    }
  };
  
  // Function to remove duplicates from items array
  const removeDuplicates = (data: RocksMineralsItem[]): RocksMineralsItem[] => {
    const uniqueMap = new Map<string, RocksMineralsItem>();
    const processedIdentifiers = new Set<string>();
    
    // First pass: group by ID
    data.forEach(item => {
      if (item.id && !uniqueMap.has(item.id)) {
        uniqueMap.set(item.id, item);
      }
    });
    
    // Second pass: check for duplicates by title and category
    data.forEach(item => {
      // Create a composite key that combines title and category
      const titleCategoryKey = `${item.title.toLowerCase()}-${item.category.toLowerCase()}`;
      
      // Skip if we've already processed this exact item (by id or titleCategory)
      if ((item.id && processedIdentifiers.has(item.id)) || 
          processedIdentifiers.has(titleCategoryKey)) {
        return;
      }
      
      // If the item has no ID, or its ID wasn't handled in first pass
      if (!item.id || !uniqueMap.has(item.id)) {
        // Check if we have a similar item by title and category
        const duplicateItem = Array.from(uniqueMap.values()).find(
          existing => 
            existing.title.toLowerCase() === item.title.toLowerCase() && 
            existing.category.toLowerCase() === item.category.toLowerCase()
        );
        
        if (!duplicateItem) {
          // Generate a temporary unique ID if needed
          const tempId = item.id || `temp-${Math.random().toString(36).substr(2, 9)}`;
          uniqueMap.set(tempId, item);
        }
      }
      
      // Mark as processed
      if (item.id) processedIdentifiers.add(item.id);
      processedIdentifiers.add(titleCategoryKey);
    });
    
    return Array.from(uniqueMap.values());
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  useEffect(() => {
    // Debounce search to prevent too many API calls
    const timer = setTimeout(() => {
      searchWithCurrentParams(searchTerm);
    }, 500);
    
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  const searchWithCurrentParams = async (term: string) => {
    setIsLoading(true);
    setError(null);
    setLoadingProgress(10);
    setLoadingStage("Searching...");
    
    try {
      let data: RocksMineralsItem[] = [];
      
      console.log('Searching with term:', term, 'Display type:', displayType);
      
      // Apply the same fetching logic as in fetchData
      if (displayType === "all") {
        setLoadingProgress(20);
        data = await getRocksAndMinerals(term, filters);
        setLoadingProgress(70);
      } else if (displayType === "rocks") {
        setLoadingProgress(20);
        data = await getRocks(term, filters);
        setLoadingProgress(60);
        // Ensure only rock items are displayed
        data = data.filter(item => item.type === 'rock');
        setLoadingProgress(70);
      } else if (displayType === "minerals") {
        setLoadingProgress(20);
        data = await getMinerals(term, filters);
        setLoadingProgress(60);
        // Ensure only mineral items are displayed
        data = data.filter(item => item.type === 'mineral');
        setLoadingProgress(70);
      }
      
      console.log(`Search returned ${data.length} items`);
      
      // Remove duplicates
      setLoadingProgress(80);
      const uniqueItems = removeDuplicates(data);
      setLoadingProgress(90);
      setItems(uniqueItems);
      setLoadingProgress(100);
    } catch (err) {
      console.error('Error during search:', err);
      setError('Failed to search. Please try again.');
    } finally {
      // Small delay before hiding loading indicator for smoother transition
      setTimeout(() => {
        setIsLoading(false);
        setLoadingProgress(0);
        setLoadingStage("");
      }, 300);
    }
  };

  const handleDisplayTypeChange = (type: "rocks" | "minerals" | "all") => {
    setDisplayType(type);
  };

  const handleFiltersChange = (newFilters: Partial<FiltersState>) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters
    }));
  };

  const toggleFilter = (type: keyof FiltersState, value: string) => {
    setFilters(prev => {
      const currentValues = [...prev[type]];
      const index = currentValues.indexOf(value);
      
      if (index >= 0) {
        currentValues.splice(index, 1);
      } else {
        currentValues.push(value);
      }
      
      return {
        ...prev,
        [type]: currentValues
      };
    });
  };

  const clearFilters = () => {
    setFilters({
      rockType: [],
      mineralCategory: [],
      colors: [],
      associatedMinerals: []
    });
  };

  const hasActiveFilters = () => {
    return filters.rockType.length > 0 || 
           filters.mineralCategory.length > 0 || 
           filters.colors.length > 0;
  };

  const countActiveFilters = () => {
    return filters.rockType.length + 
           filters.mineralCategory.length + 
           filters.colors.length;
  };
  
  const handleCardClick = (item: RocksMineralsItem) => {
    if (item.path) {
      navigate(item.path);
    }
  };

  return (
    <div className="min-h-screen bg-background py-24 px-4 sm:px-6 lg:px-8">
      <TriviaToast 
        autoShow={true} 
        delay={5000} 
        category={displayType === "rocks" ? "rocks" : "minerals"} 
        position="bottom-right"
      />
      
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold tracking-tight text-primary mb-6">
            Rocks and Minerals
          </h1>
          
          <div className="relative flex flex-col space-y-4">
            {/* Search and Filters Row */}
            <div className="flex justify-center mb-6">
              <div className="w-full max-w-lg">
                <SearchBar
                  placeholder="Search by name, color, locality, texture, mineral composition..."
                  onSearch={handleSearch}
                  initialValue={searchTerm}
                  className="w-full flex"
                />
              </div>
            </div>

            {/* Type Selection and Filter Buttons */}
            <div className="flex flex-wrap gap-2 mb-6 justify-center">
              <button
                onClick={() => handleDisplayTypeChange("all")}
                className={`rounded-full px-6 py-2 transition-all duration-200 shadow-sm flex items-center gap-2 ${
                  displayType === "all" 
                    ? "bg-primary text-primary-foreground shadow-md" 
                    : "bg-card hover:bg-muted border border-border"
                }`}
              >
                All
              </button>
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
        </div>
        
        {location.pathname === "/rock-minerals" && (
          <div className="space-y-6">
            {/* Modern Filter UI with Dropdowns */}
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-2 flex-wrap">
                {/* Filter Button with Dropdown */}
                <div className="flex gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="flex items-center gap-2">
                        <Filter className="h-4 w-4" />
                        Filters {hasActiveFilters() && (
                          <Badge variant="secondary" className="ml-1">{countActiveFilters()}</Badge>
                        )}
                        <ChevronDown className="h-3 w-3 ml-1" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-80" align="start">
                      <DropdownMenuLabel className="flex justify-between">
                        <span>Filters</span>
                        {hasActiveFilters() && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-7 px-2 text-xs"
                            onClick={clearFilters}
                          >
                            Clear all
                          </Button>
                        )}
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      
                      {/* Rock Types Filter */}
                      {(displayType === 'rocks' || displayType === 'all') && (
                        <DropdownMenuGroup>
                          <DropdownMenuLabel className="flex items-center mb-1">
                            <Layers className="mr-2 h-4 w-4 text-primary" />
                            Rock Type
                          </DropdownMenuLabel>
                          <div className="px-2 py-1 flex flex-wrap gap-1 max-h-48 overflow-y-auto">
                            {ROCK_TYPES.map(type => (
                              <Badge 
                                key={type}
                                variant={filters.rockType.includes(type) ? "default" : "outline"}
                                className="cursor-pointer hover:bg-muted/50 py-1"
                                onClick={() => toggleFilter('rockType', type)}
                              >
                                {type}
                              </Badge>
                            ))}
                          </div>
                        </DropdownMenuGroup>
                      )}
                      
                      {/* Mineral Category Filter */}
                      {(displayType === 'minerals' || displayType === 'all') && (
                        <DropdownMenuGroup>
                          <DropdownMenuLabel className="flex items-center mb-1 mt-2">
                            <Layers className="mr-2 h-4 w-4 text-primary" />
                            Mineral Category
                          </DropdownMenuLabel>
                          <div className="px-2 py-1 flex flex-wrap gap-1 max-h-48 overflow-y-auto">
                            {MINERAL_CATEGORIES.map(category => (
                              <Badge 
                                key={category}
                                variant={filters.mineralCategory.includes(category) ? "default" : "outline"}
                                className="cursor-pointer hover:bg-muted/50 py-1"
                                onClick={() => toggleFilter('mineralCategory', category)}
                              >
                                {category}
                              </Badge>
                            ))}
                          </div>
                        </DropdownMenuGroup>
                      )}
                      
                      {/* Colors Filter */}
                      <DropdownMenuGroup>
                        <DropdownMenuLabel className="flex items-center mb-1 mt-2">
                          <Palette className="mr-2 h-4 w-4 text-primary" />
                          Color
                        </DropdownMenuLabel>
                        <div className="px-2 py-1 flex flex-wrap gap-1 max-h-48 overflow-y-auto">
                          {COLORS.map(color => (
                            <Badge 
                              key={color}
                              variant={filters.colors.includes(color) ? "default" : "outline"}
                              className="cursor-pointer hover:bg-muted/50 py-1"
                              onClick={() => toggleFilter('colors', color)}
                            >
                              {color}
                            </Badge>
                          ))}
                        </div>
                      </DropdownMenuGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Active filter badges */}
                  <div className="flex flex-wrap gap-1 items-center">
                    {[...filters.rockType, ...filters.mineralCategory, ...filters.colors].map(filter => (
                      <Badge 
                        key={filter} 
                        variant="secondary"
                        className="flex items-center gap-1"
                      >
                        {filter}
                        <X 
                          className="h-3 w-3 cursor-pointer" 
                          onClick={() => {
                            if (filters.rockType.includes(filter)) {
                              toggleFilter('rockType', filter);
                            } else if (filters.mineralCategory.includes(filter)) {
                              toggleFilter('mineralCategory', filter);
                            } else if (filters.colors.includes(filter)) {
                              toggleFilter('colors', filter);
                            }
                          }}
                        />
                      </Badge>
                    ))}
                    {hasActiveFilters() && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-7 px-2 text-xs"
                        onClick={clearFilters}
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                </div>
              </div>
              
              <TriviaButton category={displayType === "rocks" ? "rocks" : "minerals"} />
            </div>
            
            {/* Content Area */}
            <div>
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              {isLoading ? (
                <div className="flex flex-col justify-center items-center min-h-[400px]">
                  <div className="w-full max-w-md mb-4">
                    <Progress value={loadingProgress} className="h-2" />
                  </div>
                  <div className="flex items-center gap-3">
                    <Spinner size="md" />
                    <p className="text-muted-foreground">{loadingStage || "Loading..."}</p>
                  </div>
                </div>
              ) : items.length > 0 ? (
                <>
                  <RocksMineralsGrid items={items} onCardClick={handleCardClick} />
                </>
              ) : (
                <div className="text-center py-10 border rounded-lg">
                  <p className="text-muted-foreground">No {displayType === 'all' ? 'items' : displayType === 'rocks' ? 'rocks' : 'minerals'} found{searchTerm ? ` matching "${searchTerm}"` : ''}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      <Outlet />
    </div>
  );
};

export default RockMinerals;