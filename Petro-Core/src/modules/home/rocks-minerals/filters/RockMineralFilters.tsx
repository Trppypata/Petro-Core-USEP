import { useState, useEffect } from 'react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X, Filter, ChevronDown } from 'lucide-react';
import { ROCK_CATEGORIES } from '@/modules/admin/rocks/rock.interface';
import { MINERAL_CATEGORIES } from '@/modules/admin/minerals/mineral.interface';

// Common colors found in rocks and minerals
const COMMON_COLORS = [
  'White', 'Black', 'Gray', 'Brown', 'Red', 'Pink', 'Orange', 
  'Yellow', 'Green', 'Blue', 'Purple', 'Colorless', 'Multi-colored'
];

// Color mapping for visual indicators
const COLOR_MAP: Record<string, string> = {
  'White': 'bg-white border border-gray-200',
  'Black': 'bg-black',
  'Gray': 'bg-gray-400',
  'Brown': 'bg-amber-800',
  'Red': 'bg-red-600',
  'Pink': 'bg-pink-400',
  'Orange': 'bg-orange-500',
  'Yellow': 'bg-yellow-400',
  'Green': 'bg-green-500',
  'Blue': 'bg-blue-500',
  'Purple': 'bg-purple-600',
  'Colorless': 'bg-transparent border border-dashed border-gray-300',
  'Multi-colored': 'bg-gradient-to-r from-purple-500 via-yellow-400 to-blue-500'
};

// Common associated minerals
const COMMON_ASSOCIATED_MINERALS = [
  'Quartz', 'Feldspar', 'Mica', 'Olivine', 'Pyroxene', 'Amphibole', 
  'Garnet', 'Calcite', 'Dolomite', 'Gypsum', 'Pyrite', 'Magnetite',
  'Hematite', 'Halite', 'Biotite', 'Muscovite', 'Chlorite', 'Serpentine'
];

export interface FiltersState {
  rockType: string[];
  mineralCategory: string[];
  colors: string[];
  associatedMinerals: string[];
}

interface RockMineralFiltersProps {
  displayType: 'rocks' | 'minerals' | 'all';
  onFiltersChange: (filters: FiltersState) => void;
}

const RockMineralFilters = ({ displayType, onFiltersChange }: RockMineralFiltersProps) => {
  const [filters, setFilters] = useState<FiltersState>({
    rockType: [],
    mineralCategory: [],
    colors: [],
    associatedMinerals: []
  });
  
  const [isExpanded, setIsExpanded] = useState(true);

  // Apply filters when they change
  useEffect(() => {
    onFiltersChange(filters);
  }, [filters, onFiltersChange]);

  // Add a filter value
  const addFilter = (filterType: keyof FiltersState, value: string) => {
    if (!value || filters[filterType].includes(value)) return;
    
    setFilters(prev => ({
      ...prev,
      [filterType]: [...prev[filterType], value]
    }));
  };

  // Remove a filter value
  const removeFilter = (filterType: keyof FiltersState, value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: prev[filterType].filter(item => item !== value)
    }));
  };

  // Clear all filters
  const clearAllFilters = () => {
    setFilters({
      rockType: [],
      mineralCategory: [],
      colors: [],
      associatedMinerals: []
    });
  };

  // Count total active filters
  const activeFilterCount = 
    filters.rockType.length + 
    filters.mineralCategory.length + 
    filters.colors.length + 
    filters.associatedMinerals.length;

  return (
    <div className="mb-8">
      {/* Filter Header */}
      <div 
        className="flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 p-4 rounded-t-xl shadow-sm cursor-pointer border border-b-0 border-gray-100 dark:border-gray-800"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <h3 className="font-medium">Filters</h3>
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
              {activeFilterCount}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {activeFilterCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={(e) => {
                e.stopPropagation();
                clearAllFilters();
              }}
              className="text-xs hover:bg-blue-100 dark:hover:bg-blue-900"
            >
              Clear all
            </Button>
          )}
          <ChevronDown className={`h-5 w-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {/* Filter Content */}
      {isExpanded && (
        <div className="bg-gradient-to-br from-white to-blue-50/50 dark:from-gray-900/90 dark:to-blue-950/30 p-4 rounded-b-xl shadow-sm border border-t-0 border-gray-100 dark:border-gray-800 backdrop-blur-sm">
          <Accordion type="multiple" className="w-full" defaultValue={['rock-type', 'color']}>
            {/* Rock Type Filter - show only for rocks or all */}
            {(displayType === 'rocks' || displayType === 'all') && (
              <AccordionItem value="rock-type" className="border-b-0 mb-2">
                <AccordionTrigger className="text-sm font-medium py-2 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 px-2 rounded-lg transition-colors">
                  Rock Type
                </AccordionTrigger>
                <AccordionContent className="pt-2">
                  <div className="space-y-3">
                    <div>
                      <Select 
                        onValueChange={(value) => addFilter('rockType', value)}
                      >
                        <SelectTrigger className="w-full bg-white/80 dark:bg-gray-800/80 border-gray-200 dark:border-gray-700">
                          <SelectValue placeholder="Select rock type" />
                        </SelectTrigger>
                        <SelectContent>
                          {ROCK_CATEGORIES.map(category => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-2">
                      {filters.rockType.map(type => (
                        <Badge 
                          key={type} 
                          className="bg-blue-100 hover:bg-blue-200 text-blue-800 dark:bg-blue-900 dark:hover:bg-blue-800 dark:text-blue-100 px-3 py-1 flex items-center gap-1 transition-colors"
                        >
                          {type}
                          <X 
                            className="h-3 w-3 cursor-pointer ml-1 opacity-70 hover:opacity-100" 
                            onClick={() => removeFilter('rockType', type)} 
                          />
                        </Badge>
                      ))}
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}

            {/* Mineral Category Filter - show only for minerals or all */}
            {(displayType === 'minerals' || displayType === 'all') && (
              <AccordionItem value="mineral-category" className="border-b-0 mb-2">
                <AccordionTrigger className="text-sm font-medium py-2 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 px-2 rounded-lg transition-colors">
                  Mineral Category
                </AccordionTrigger>
                <AccordionContent className="pt-2">
                  <div className="space-y-3">
                    <div>
                      <Select 
                        onValueChange={(value) => addFilter('mineralCategory', value)}
                      >
                        <SelectTrigger className="w-full bg-white/80 dark:bg-gray-800/80 border-gray-200 dark:border-gray-700">
                          <SelectValue placeholder="Select mineral category" />
                        </SelectTrigger>
                        <SelectContent>
                          {MINERAL_CATEGORIES.filter(cat => cat !== 'ALL').map(category => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-2">
                      {filters.mineralCategory.map(category => (
                        <Badge 
                          key={category} 
                          className="bg-indigo-100 hover:bg-indigo-200 text-indigo-800 dark:bg-indigo-900 dark:hover:bg-indigo-800 dark:text-indigo-100 px-3 py-1 flex items-center gap-1 transition-colors"
                        >
                          {category}
                          <X 
                            className="h-3 w-3 cursor-pointer ml-1 opacity-70 hover:opacity-100" 
                            onClick={() => removeFilter('mineralCategory', category)} 
                          />
                        </Badge>
                      ))}
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}

            {/* Color Filter - show for both */}
            <AccordionItem value="color" className="border-b-0 mb-2">
              <AccordionTrigger className="text-sm font-medium py-2 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 px-2 rounded-lg transition-colors">
                Color
              </AccordionTrigger>
              <AccordionContent className="pt-2">
                <div className="space-y-3">
                  <div>
                    <Select 
                      onValueChange={(value) => addFilter('colors', value)}
                    >
                      <SelectTrigger className="w-full bg-white/80 dark:bg-gray-800/80 border-gray-200 dark:border-gray-700">
                        <SelectValue placeholder="Select color" />
                      </SelectTrigger>
                      <SelectContent>
                        {COMMON_COLORS.map(color => (
                          <SelectItem key={color} value={color} className="flex items-center">
                            <div className="flex items-center gap-2">
                              <div className={`w-4 h-4 rounded-full ${COLOR_MAP[color]}`}></div>
                              {color}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-2">
                    {filters.colors.map(color => (
                      <Badge 
                        key={color} 
                        className="bg-white/90 hover:bg-white text-gray-800 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-100 px-3 py-1 flex items-center gap-2 border border-gray-200 dark:border-gray-700 transition-colors"
                      >
                        <div className={`w-3 h-3 rounded-full ${COLOR_MAP[color]}`}></div>
                        {color}
                        <X 
                          className="h-3 w-3 cursor-pointer ml-1 opacity-70 hover:opacity-100" 
                          onClick={() => removeFilter('colors', color)} 
                        />
                      </Badge>
                    ))}
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Associated Minerals - mainly for rocks but could be useful for both */}
            <AccordionItem value="associated-minerals" className="border-b-0 mb-2">
              <AccordionTrigger className="text-sm font-medium py-2 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 px-2 rounded-lg transition-colors">
                Associated Minerals
              </AccordionTrigger>
              <AccordionContent className="pt-2">
                <div className="space-y-3">
                  <div>
                    <Select 
                      onValueChange={(value) => addFilter('associatedMinerals', value)}
                    >
                      <SelectTrigger className="w-full bg-white/80 dark:bg-gray-800/80 border-gray-200 dark:border-gray-700">
                        <SelectValue placeholder="Select mineral" />
                      </SelectTrigger>
                      <SelectContent>
                        {COMMON_ASSOCIATED_MINERALS.map(mineral => (
                          <SelectItem key={mineral} value={mineral}>
                            {mineral}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-2">
                    {filters.associatedMinerals.map(mineral => (
                      <Badge 
                        key={mineral} 
                        className="bg-green-100 hover:bg-green-200 text-green-800 dark:bg-green-900 dark:hover:bg-green-800 dark:text-green-100 px-3 py-1 flex items-center gap-1 transition-colors"
                      >
                        {mineral}
                        <X 
                          className="h-3 w-3 cursor-pointer ml-1 opacity-70 hover:opacity-100" 
                          onClick={() => removeFilter('associatedMinerals', mineral)} 
                        />
                      </Badge>
                    ))}
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      )}
    </div>
  );
};

export default RockMineralFilters; 