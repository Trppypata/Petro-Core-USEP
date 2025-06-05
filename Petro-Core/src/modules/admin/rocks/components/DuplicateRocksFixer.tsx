import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, Check } from 'lucide-react';
import { Spinner } from '@/components/spinner';
import { fetchRocks } from '../services';
import type { IRock } from '../rock.interface';
import { updateRock, deleteRock } from '../services';
import { toast } from 'sonner';

export function DuplicateRocksFixer() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isFixing, setIsFixing] = useState(false);
  const [duplicates, setDuplicates] = useState<{
    byCode: { [key: string]: IRock[] };
    byName: { [key: string]: IRock[] };
  }>({ byCode: {}, byName: {} });
  const [selectedRocks, setSelectedRocks] = useState<{ [id: string]: boolean }>({});
  const [results, setResults] = useState<string[]>([]);

  const findDuplicates = async () => {
    setIsAnalyzing(true);
    setResults([]);
    
    try {
      // Fetch all rocks with a large page size
      const { data: rocks } = await fetchRocks('ALL', 1, 1000);
      
      const duplicatesByCode: { [key: string]: IRock[] } = {};
      const duplicatesByName: { [key: string]: IRock[] } = {};
      
      // First pass: Group by rock_code
      rocks.forEach(rock => {
        if (rock.rock_code) {
          const cleanCode = rock.rock_code.replace(/\s+/g, '').toLowerCase();
          if (!duplicatesByCode[cleanCode]) {
            duplicatesByCode[cleanCode] = [];
          }
          duplicatesByCode[cleanCode].push(rock);
        }
      });
      
      // Second pass: Group by name (within same category)
      rocks.forEach(rock => {
        if (rock.name) {
          const key = `${rock.name.toLowerCase()}_${rock.category.toLowerCase()}`;
          if (!duplicatesByName[key]) {
            duplicatesByName[key] = [];
          }
          duplicatesByName[key].push(rock);
        }
      });
      
      // Filter out non-duplicates
      Object.keys(duplicatesByCode).forEach(code => {
        if (duplicatesByCode[code].length <= 1) {
          delete duplicatesByCode[code];
        }
      });
      
      Object.keys(duplicatesByName).forEach(name => {
        if (duplicatesByName[name].length <= 1) {
          delete duplicatesByName[name];
        }
      });
      
      setDuplicates({
        byCode: duplicatesByCode,
        byName: duplicatesByName
      });
      
      // Log results
      const codeCount = Object.keys(duplicatesByCode).length;
      const nameCount = Object.keys(duplicatesByName).length;
      
      if (codeCount === 0 && nameCount === 0) {
        setResults(['No duplicates found! Your database is clean.']);
      } else {
        setResults([
          `Found ${codeCount} duplicate rock codes affecting ${
            Object.values(duplicatesByCode).flat().length
          } rocks.`,
          `Found ${nameCount} duplicate rock names (within same category) affecting ${
            Object.values(duplicatesByName).flat().length
          } rocks.`
        ]);
      }
    } catch (error) {
      console.error('Error analyzing duplicates:', error);
      setResults(['Error analyzing duplicates. Please try again.']);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFixDuplicates = async () => {
    setIsFixing(true);
    const fixResults: string[] = [];
    
    try {
      // Handle duplicates by code first
      for (const code of Object.keys(duplicates.byCode)) {
        const dupeRocks: IRock[] = duplicates.byCode[code];
        if (dupeRocks.length <= 1) continue;
        
        // Sort by data completeness and last updated
        const sortedRocks: IRock[] = [...dupeRocks].sort((a, b) => {
          // Count non-empty fields
          const getCompleteness = (rock: IRock) => {
            return Object.entries(rock).filter(([_, val]) => 
              val !== null && val !== undefined && val !== ''
            ).length;
          };
          
          const aComplete = getCompleteness(a);
          const bComplete = getCompleteness(b);
          
          // Primary sort by completeness
          if (aComplete !== bComplete) {
            return bComplete - aComplete;
          }
          
          // Secondary sort by update date
          if (a.updated_at && b.updated_at) {
            return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
          }
          
          return 0;
        });
        
        // Keep the first one (most complete/recent) and merge/delete others
        const primary = sortedRocks[0];
        const duplicateRocks: IRock[] = sortedRocks.slice(1);
        
        // Only process rocks that are selected
        const selectedDuplicates = duplicateRocks.filter((r: IRock) => r.id && selectedRocks[r.id]);
        
        if (selectedDuplicates.length === 0) continue;
        
        // Merge data from duplicates into primary
        let merged = { ...primary };
        
        for (const duplicate of selectedDuplicates) {
          for (const [key, value] of Object.entries(duplicate)) {
            // Skip id and metadata fields
            if (['id', 'created_at', 'updated_at', 'rock_code'].includes(key)) continue;
            
            // If primary doesn't have this value, use the duplicate's
            if (!merged[key as keyof IRock] && value) {
              merged = { ...merged, [key]: value };
            }
          }
          
          // Delete the duplicate
          if (duplicate.id) {
            try {
              await deleteRock(duplicate.id);
              fixResults.push(`✅ Deleted duplicate rock: ${duplicate.name} (${duplicate.rock_code})`);
            } catch (err) {
              console.error('Error deleting rock:', err);
              fixResults.push(`❌ Failed to delete: ${duplicate.name} (${duplicate.rock_code})`);
            }
          }
        }
        
        // Update the primary rock with merged data
        if (primary.id) {
          try {
            await updateRock(primary.id, merged);
            fixResults.push(`✅ Updated primary rock: ${primary.name} (${primary.rock_code}) with merged data`);
          } catch (err) {
            console.error('Error updating rock:', err);
            fixResults.push(`❌ Failed to update: ${primary.name} (${primary.rock_code})`);
          }
        }
      }
      
      // Update results
      setResults(prev => [...prev, ...fixResults]);
      toast.success(`Fixed ${fixResults.filter(r => r.startsWith('✅')).length} duplicates`);
      
      // Refresh duplicate list
      await findDuplicates();
    } catch (error) {
      console.error('Error fixing duplicates:', error);
      setResults(prev => [...prev, 'Error fixing duplicates. Please try again.']);
      toast.error('Error fixing duplicates');
    } finally {
      setIsFixing(false);
    }
  };

  const toggleSelectAll = (dupes: IRock[]) => {
    const allSelected = dupes.every(r => r.id && selectedRocks[r.id]);
    
    // If all are selected, unselect all except the first one
    // If not all are selected, select all except the first one
    const newSelected = { ...selectedRocks };
    
    dupes.forEach((rock, index) => {
      if (index === 0) return; // Skip the first one (primary)
      if (rock.id) {
        newSelected[rock.id] = !allSelected;
      }
    });
    
    setSelectedRocks(newSelected);
  };

  const toggleRock = (rockId: string) => {
    setSelectedRocks({
      ...selectedRocks,
      [rockId]: !selectedRocks[rockId]
    });
  };

  return (
    <div className="p-4 space-y-4 bg-white rounded-lg shadow-sm border">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Duplicate Rocks Finder & Fixer</h2>
        <Button 
          onClick={findDuplicates} 
          disabled={isAnalyzing}
        >
          {isAnalyzing && <Spinner className="mr-2 h-4 w-4" />}
          Analyze Database
        </Button>
      </div>
      
      {results.length > 0 && (
        <div className="p-3 bg-gray-50 rounded border space-y-1">
          <h3 className="font-medium">Results:</h3>
          {results.map((result, i) => (
            <p key={i} className="text-sm">{result}</p>
          ))}
        </div>
      )}
      
      {Object.keys(duplicates.byCode).length > 0 && (
        <div>
          <h3 className="text-lg font-medium mt-4 mb-2">Duplicate Rock Codes</h3>
          <p className="text-sm text-gray-500 mb-2">
            The first rock in each group will be kept, and the others will be merged and deleted.
            Select the duplicates you want to process.
          </p>
          
          {Object.entries(duplicates.byCode).map(([code, dupes]) => (
            <div key={code} className="mb-4 border rounded-md overflow-hidden">
              <div className="bg-gray-100 p-2 flex justify-between items-center">
                <span className="font-medium">Code: {code} ({dupes.length} rocks)</span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => toggleSelectAll(dupes)}
                >
                  {dupes.every((r, i) => i === 0 || (r.id && selectedRocks[r.id])) 
                    ? 'Unselect All' 
                    : 'Select All'}
                </Button>
              </div>
              
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="p-2 text-left">Keep</th>
                    <th className="p-2 text-left">Process</th>
                    <th className="p-2 text-left">ID</th>
                    <th className="p-2 text-left">Name</th>
                    <th className="p-2 text-left">Category</th>
                    <th className="p-2 text-left">Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {dupes.map((rock, index) => (
                    <tr key={rock.id} className={`border-b ${index === 0 ? 'bg-green-50' : ''}`}>
                      <td className="p-2">
                        {index === 0 ? <Check className="text-green-500 h-4 w-4" /> : null}
                      </td>
                      <td className="p-2">
                        {index > 0 && (
                          <input 
                            type="checkbox" 
                            checked={!!rock.id && !!selectedRocks[rock.id]} 
                            onChange={() => rock.id && toggleRock(rock.id)}
                          />
                        )}
                      </td>
                      <td className="p-2 font-mono text-xs">{rock.id?.substring(0, 8)}...</td>
                      <td className="p-2">{rock.name}</td>
                      <td className="p-2">{rock.category}</td>
                      <td className="p-2">{rock.updated_at ? new Date(rock.updated_at).toLocaleDateString() : 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
          
          <div className="flex justify-end mt-4">
            <Button 
              onClick={handleFixDuplicates} 
              disabled={isFixing || Object.keys(selectedRocks).filter(id => selectedRocks[id]).length === 0}
            >
              {isFixing && <Spinner className="mr-2 h-4 w-4" />}
              Fix Selected Duplicates
            </Button>
          </div>
        </div>
      )}
      
      {Object.keys(duplicates.byName).length > 0 && (
        <div className="mt-6 pt-6 border-t">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-medium">Potential Duplicate Names</h3>
            <span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded text-xs">
              Review manually
            </span>
          </div>
          <p className="text-sm text-gray-500 mb-2">
            These rocks have the same name within the same category, but different rock codes.
            They might be legitimate separate rocks or duplicates. Please review manually.
          </p>
          
          {Object.entries(duplicates.byName).map(([nameKey, dupes]) => (
            <div key={nameKey} className="mb-4 border rounded-md overflow-hidden">
              <div className="bg-yellow-50 p-2">
                <span className="font-medium">Name: {dupes[0]?.name} (Category: {dupes[0]?.category})</span>
              </div>
              
              <div className="p-2 flex items-center gap-2 bg-gray-50 border-b">
                <AlertCircle className="text-yellow-500 h-4 w-4" />
                <span className="text-sm">
                  These {dupes.length} rocks have the same name but different codes.
                  Check if they're actual duplicates.
                </span>
              </div>
              
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="p-2 text-left">Rock Code</th>
                    <th className="p-2 text-left">ID</th>
                    <th className="p-2 text-left">Name</th>
                    <th className="p-2 text-left">Category</th>
                    <th className="p-2 text-left">Locality</th>
                    <th className="p-2 text-left">Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {dupes.map(rock => (
                    <tr key={rock.id} className="border-b">
                      <td className="p-2 font-medium">{rock.rock_code}</td>
                      <td className="p-2 font-mono text-xs">{rock.id?.substring(0, 8)}...</td>
                      <td className="p-2">{rock.name}</td>
                      <td className="p-2">{rock.category}</td>
                      <td className="p-2">{rock.locality || 'N/A'}</td>
                      <td className="p-2">{rock.updated_at ? new Date(rock.updated_at).toLocaleDateString() : 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 