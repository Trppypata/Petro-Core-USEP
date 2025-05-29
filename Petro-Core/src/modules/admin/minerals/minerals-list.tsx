import { useState, useEffect } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { Spinner } from '@/components/spinner';
import type { IMineral, MineralCategory } from './mineral.interface';
import { useReadMinerals } from './hooks/useReadMinerals';
import { MineralContentForm } from './components';

interface MineralsListProps {
  category: MineralCategory | string;
  searchTerm?: string;
  hideControls?: boolean;
}

const MineralsList = ({ 
  category,
  searchTerm: externalSearchTerm, 
  hideControls = false 
}: MineralsListProps) => {
  const [internalSearchTerm, setInternalSearchTerm] = useState('');
  
  // Use external search term if provided, otherwise use internal
  const searchTerm = externalSearchTerm !== undefined ? externalSearchTerm : internalSearchTerm;
  
  // This will be implemented in the hooks folder
  const { data: minerals, isLoading, error } = useReadMinerals(category);
  
  // Enhanced debugging for minerals data
  useEffect(() => {
    console.log('MineralsList received data:', minerals);
    console.log('MineralsList category:', category);
    console.log('MineralsList error:', error);
    
    if (minerals && Array.isArray(minerals)) {
      console.log(`Found ${minerals.length} total minerals`);
      
      // Count minerals by category
      const categories = [...new Set(minerals.map(m => m.category))];
      console.log('Categories in data:', categories);
      
      const categoryCounts = categories.reduce((acc, cat) => {
        acc[cat] = minerals.filter(m => m.category === cat).length;
        return acc;
      }, {} as Record<string, number>);
      console.log('Minerals per category:', categoryCounts);
      
      // Check if we have minerals in the requested category
      const inRequestedCategory = minerals.filter(m => 
        m.category?.toLowerCase() === category?.toLowerCase()
      ).length;
      console.log(`Minerals in requested category "${category}": ${inRequestedCategory}`);
      
      // Log sample mineral data
      if (minerals.length > 0) {
        console.log('Sample mineral data:', minerals[0]);
      }
    } else {
      console.warn('No minerals data or data is not an array');
    }
  }, [minerals, category, error]);
  
  const filteredMinerals = minerals?.filter(mineral => {
    // If searching, filter by name or code
    if (searchTerm) {
      const nameMatch = mineral.mineral_name?.toLowerCase().includes(searchTerm.toLowerCase());
      const codeMatch = mineral.mineral_code?.toLowerCase().includes(searchTerm.toLowerCase());
      return nameMatch || codeMatch;
    }
    
    // If not searching, return all minerals (ALL category) or just this category
    // Using case-insensitive comparison for more reliable matching
    return category === 'ALL' || 
           mineral.category?.toLowerCase() === category?.toLowerCase();
  }) || [];
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInternalSearchTerm(e.target.value);
  };
  
  const renderTableContent = () => {
    if (isLoading) {
      return (
        <TableRow>
          <TableCell colSpan={13} className="h-24 text-center">
            <Spinner className="mx-auto" />
            <span className="sr-only">Loading minerals...</span>
          </TableCell>
        </TableRow>
      );
    }
    
    if (error) {
      console.error('Error loading minerals:', error);
      return (
        <TableRow>
          <TableCell colSpan={13} className="h-24 text-center text-red-500">
            Error loading minerals: {error.message || 'Please try again later.'}
          </TableCell>
        </TableRow>
      );
    }
    
    if (!minerals) {
      console.warn('No minerals data received');
      return (
        <TableRow>
          <TableCell colSpan={13} className="h-24 text-center">
            No minerals data available.
          </TableCell>
        </TableRow>
      );
    }
    
    if (!Array.isArray(minerals)) {
      console.warn('Minerals data is not an array:', minerals);
      return (
        <TableRow>
          <TableCell colSpan={13} className="h-24 text-center">
            Invalid minerals data format.
          </TableCell>
        </TableRow>
      );
    }
    
    console.log('Rendering minerals:', filteredMinerals.length, 'of', minerals.length, 'items');
    
    if (filteredMinerals.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={13} className="h-24 text-center">
            No minerals found{category !== 'ALL' ? ` in ${category}` : ''}.
          </TableCell>
        </TableRow>
      );
    }
    
    return filteredMinerals.map((mineral: IMineral) => (
      <TableRow key={mineral.id || mineral.mineral_code}>
        <TableCell className="font-medium">{mineral.mineral_code}</TableCell>
        <TableCell>{mineral.mineral_name}</TableCell>
        <TableCell>{mineral.chemical_formula}</TableCell>
        <TableCell>{mineral.mineral_group}</TableCell>
        <TableCell>{mineral.color}</TableCell>
        <TableCell>{mineral.streak}</TableCell>
        <TableCell>{mineral.luster}</TableCell>
        <TableCell>{mineral.hardness}</TableCell>
        <TableCell>{mineral.cleavage}</TableCell>
        <TableCell>{mineral.fracture}</TableCell>
        <TableCell>{mineral.habit}</TableCell>
        <TableCell>{mineral.crystal_system}</TableCell>
      </TableRow>
    ));
  };
  
  return (
    <>
      {!hideControls && (
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-2">
            <Search className="w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search minerals..."
              value={internalSearchTerm}
              onChange={handleSearchChange}
              className="w-64"
            />
          </div>
          <MineralContentForm category={category as MineralCategory} />
        </div>
      )}
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Chemical Formula</TableHead>
              <TableHead>Group</TableHead>
              <TableHead>Color</TableHead>
              <TableHead>Streak</TableHead>
              <TableHead>Luster</TableHead>
              <TableHead>Hardness</TableHead>
              <TableHead>Cleavage</TableHead>
              <TableHead>Fracture</TableHead>
              <TableHead>Habit</TableHead>
              <TableHead>Crystal System</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {renderTableContent()}
          </TableBody>
        </Table>
      </div>
    </>
  );
};

export default MineralsList; 