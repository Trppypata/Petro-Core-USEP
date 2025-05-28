import { useState } from 'react';
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
import MineralContentForm from './components/mineral-content-form';

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
  
  const filteredMinerals = minerals?.filter(mineral => 
    mineral.mineral_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    mineral.mineral_code.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
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
      return (
        <TableRow>
          <TableCell colSpan={13} className="h-24 text-center text-red-500">
            Error loading minerals. Please try again later.
          </TableCell>
        </TableRow>
      );
    }
    
    if (!filteredMinerals || filteredMinerals.length === 0) {
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
          <MineralContentForm />
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