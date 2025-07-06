import { useState, useEffect } from 'react';
import { 
  Select, 
  SelectContent, 
  SelectGroup,
  SelectItem, 
  SelectTrigger, 
  SelectLabel,
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
  'Hematite', 'Halite', 'Biotite', 'Muscovite', 'Chlorite', 'Serpentine',
  'Plagioclase', 'Orthoclase', 'Hornblende', 'Augite', 'Apatite', 'Zircon',
  'Tourmaline', 'Rutile', 'Epidote', 'Andalusite', 'Sillimanite', 'Kyanite'
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

  // Group mineral categories for better organization
  const groupedMineralCategories = {
    'Native Elements': ['NATIVE ELEMENTS'],
    'Sulfides and Related': ['SULFIDES', 'SULFOSALTS', 'TELLURIDES', 'SELENIDES', 'ARSENIDES', 'ANTIMONIDES'],
    'Oxides and Hydroxides': ['OXIDES', 'HYDROXIDES'],
    'Halides': ['HALIDES'],
    'Carbonates and Nitrates': ['CARBONATES', 'NITRATES'],
    'Borates and Sulfates': ['BORATES', 'SULFATES'],
    'Phosphates and Related': ['PHOSPHATES', 'CHROMATES', 'MOLYBDATES', 'TUNGSTATES', 'VANADATES', 'ARSENATES'],
    'Silicates': ['SILICATES'],
    'Organic Compounds': ['ORGANICS']
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
        className="flex items-center justify-between bg-muted p-4 rounded-t-xl shadow-sm cursor-pointer border border-b-0 border-muted"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-primary" />
          <h3 className="font-medium">Filters</h3>
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="bg-primary/20 text-primary">
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
              className="text-xs hover:bg-primary/10"
            >
              Clear all
            </Button>
          )}
          <ChevronDown className={`h-5 w-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {/* Filter Content */}
      {isExpanded && (
        <div className="bg-card p-4 rounded-b-xl shadow-sm border border-t-0 border-muted">
          <Accordion type="multiple" className="w-full" defaultValue={['rock-type', 'color']}>
            {/* Rock Type Filter - show only for rocks or all */}
            {(displayType === 'rocks' || displayType === 'all') && (
              <AccordionItem value="rock-type" className="border-b-0 mb-2">
                <AccordionTrigger className="text-sm font-medium py-2 hover:bg-muted/50 px-2 rounded-lg transition-colors">
                  Rock Type
                </AccordionTrigger>
                <AccordionContent className="pt-2">
                  <div className="space-y-3">
                    <div>
                      <Select 
                        onValueChange={(value) => addFilter('rockType', value)}
                      >
                        <SelectTrigger className="w-full bg-background border-input">
                          <SelectValue placeholder="Select rock type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectLabel>Main Categories</SelectLabel>
                            {ROCK_CATEGORIES.map(category => (
                              <SelectItem key={category} value={category}>
                                {category}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                          <SelectGroup>
                            <SelectLabel>Subcategories</SelectLabel>
                            <SelectItem value="Volcanic">Volcanic</SelectItem>
                            <SelectItem value="Plutonic">Plutonic</SelectItem>
                            <SelectItem value="Foliated">Foliated</SelectItem>
                            <SelectItem value="Non-foliated">Non-foliated</SelectItem>
                            <SelectItem value="Clastic">Clastic</SelectItem>
                            <SelectItem value="Chemical">Chemical</SelectItem>
                            <SelectItem value="Organic">Organic</SelectItem>
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-2">
                      {filters.rockType.map(type => (
                        <Badge 
                          key={type} 
                          variant="outline"
                          className="px-3 py-1 flex items-center gap-1 transition-colors"
                          style={{
                            backgroundColor: type.toLowerCase() === 'igneous' ? 'hsl(var(--igneous)/0.2)' : 
                                            type.toLowerCase() === 'metamorphic' ? 'hsl(var(--metamorphic)/0.2)' : 
                                            type.toLowerCase() === 'sedimentary' ? 'hsl(var(--sedimentary)/0.2)' : 
                                            type.toLowerCase() === 'ore samples' ? 'hsl(var(--ore)/0.2)' : 
                                            'hsl(var(--muted))',
                            color: type.toLowerCase() === 'igneous' ? 'hsl(var(--igneous))' : 
                                  type.toLowerCase() === 'metamorphic' ? 'hsl(var(--metamorphic))' : 
                                  type.toLowerCase() === 'sedimentary' ? 'hsl(var(--sedimentary))' : 
                                  type.toLowerCase() === 'ore samples' ? 'hsl(var(--ore))' : 
                                  'hsl(var(--foreground))',
                          }}
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
                <AccordionTrigger className="text-sm font-medium py-2 hover:bg-muted/50 px-2 rounded-lg transition-colors">
                  Mineral Category
                </AccordionTrigger>
                <AccordionContent className="pt-2">
                  <div className="space-y-3">
                    <div>
                      <Select 
                        onValueChange={(value) => addFilter('mineralCategory', value)}
                      >
                        <SelectTrigger className="w-full bg-background border-input">
                          <SelectValue placeholder="Select mineral category" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(groupedMineralCategories).map(([group, categories]) => (
                            <SelectGroup key={group}>
                              <SelectLabel>{group}</SelectLabel>
                              {categories.map(category => (
                                <SelectItem key={category} value={category}>
                                  {category}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* Quick selection buttons for common mineral categories */}
                    <div className="flex flex-wrap gap-2 mt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs px-3 py-1"
                        onClick={() => addFilter('mineralCategory', 'SILICATES')}
                      >
                        Silicates
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs px-3 py-1"
                        onClick={() => addFilter('mineralCategory', 'OXIDES')}
                      >
                        Oxides
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs px-3 py-1"
                        onClick={() => addFilter('mineralCategory', 'SULFIDES')}
                      >
                        Sulfides
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs px-3 py-1"
                        onClick={() => addFilter('mineralCategory', 'CARBONATES')}
                      >
                        Carbonates
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs px-3 py-1"
                        onClick={() => addFilter('mineralCategory', 'HALIDES')}
                      >
                        Halides
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs px-3 py-1"
                        onClick={() => addFilter('mineralCategory', 'PHOSPHATES')}
                      >
                        Phosphates
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs px-3 py-1"
                        onClick={() => addFilter('mineralCategory', 'SULFATES')}
                      >
                        Sulfates
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs px-3 py-1"
                        onClick={() => addFilter('mineralCategory', 'NATIVE ELEMENTS')}
                      >
                        Native Elements
                      </Button>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs px-3 py-1"
                        onClick={() => addFilter('mineralCategory', 'HYDROXIDES')}
                      >
                        Hydroxides
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs px-3 py-1"
                        onClick={() => addFilter('mineralCategory', 'SULFOSALTS')}
                      >
                        Sulfosalts
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs px-3 py-1"
                        onClick={() => addFilter('mineralCategory', 'BORATES')}
                      >
                        Borates
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs px-3 py-1"
                        onClick={() => addFilter('mineralCategory', 'NITRATES')}
                      >
                        Nitrates
                      </Button>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-2">
                      {filters.mineralCategory.map(category => (
                        <Badge 
                          key={category} 
                          variant="outline" 
                          className="bg-primary/20 text-primary border-primary/30 px-3 py-1 flex items-center gap-1 transition-colors"
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
              <AccordionTrigger className="text-sm font-medium py-2 hover:bg-muted/50 px-2 rounded-lg transition-colors">
                Color
              </AccordionTrigger>
              <AccordionContent className="pt-2">
                <div className="space-y-3">
                  <div>
                    <Select 
                      onValueChange={(value) => addFilter('colors', value)}
                    >
                      <SelectTrigger className="w-full bg-background border-input">
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
                        variant="outline"
                        className="px-3 py-1 flex items-center gap-2 border-muted transition-colors"
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
              <AccordionTrigger className="text-sm font-medium py-2 hover:bg-muted/50 px-2 rounded-lg transition-colors">
                Associated Minerals
              </AccordionTrigger>
              <AccordionContent className="pt-2">
                <div className="space-y-3">
                  <div>
                    <Select 
                      onValueChange={(value) => addFilter('associatedMinerals', value)}
                    >
                      <SelectTrigger className="w-full bg-background border-input">
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
                        variant="outline" 
                        className="bg-accent/20 text-accent border-accent/30 px-3 py-1 flex items-center gap-1 transition-colors"
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