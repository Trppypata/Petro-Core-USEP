import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { IMineral } from "@/modules/admin/minerals/mineral.interface";
import { SupabaseImage } from "@/components/ui/supabase-image";

// Function to fetch a single mineral by ID
const fetchMineralById = async (id: string): Promise<IMineral | null> => {
  try {
    const API_URL = 'https://petro-core-usep.onrender.com/api';
    const response = await fetch(`${API_URL}/minerals/${id}`, {
      credentials: 'include'
    });
    const data = await response.json();
    
    if (!data.success || !data.data) {
      return null;
    }
    
    return data.data;
  } catch (error) {
    console.error("Error fetching mineral details:", error);
    return null;
  }
};

const MineralDetailView = () => {
  const { id } = useParams<{ id: string }>();
  const [mineral, setMineral] = useState<IMineral | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadMineral = async () => {
      if (!id) {
        setError("No mineral ID provided");
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const mineralData = await fetchMineralById(id);
        if (mineralData) {
          setMineral(mineralData);
        } else {
          setError("Mineral not found");
        }
      } catch (err) {
        setError("Failed to load mineral details");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadMineral();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !mineral) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Link to="/rock-minerals">
          <Button variant="outline" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Minerals
          </Button>
        </Link>
        <div className="text-center py-8 bg-white rounded-lg shadow">
          <h2 className="text-2xl font-bold text-red-500 mb-2">Error</h2>
          <p className="text-muted-foreground">{error || "Mineral not found"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Link to="/rock-minerals">
        <Button variant="outline" className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Minerals
        </Button>
      </Link>
      
      <Card className="p-8 mb-6">
        <h1 className="text-3xl font-bold mb-2">{mineral.mineral_name}</h1>
        <p className="text-muted-foreground mb-6">
          {mineral.category} | {mineral.mineral_group} {mineral.mineral_code && `| Code: ${mineral.mineral_code}`}
        </p>
        
        <div className="flex flex-col md:flex-row gap-8">
          {/* Left: Mineral Image */}
          <div className="w-full md:w-1/2">
            {mineral.image_url ? (
              <div className="flex justify-center items-center bg-gray-50 rounded-lg" style={{ minHeight: "400px", width: "100%" }}>
                <SupabaseImage 
                  src={mineral.image_url} 
                  alt={mineral.mineral_name}
                  height={400}
                  objectFit="contain"
                  className="w-full max-w-md"
                />
              </div>
            ) : (
              <div className="flex items-center justify-center bg-muted rounded-lg" style={{ height: "400px", width: "100%" }}>
                <p className="text-muted-foreground">No image available</p>
              </div>
            )}
          </div>
          
          {/* Right: Mineral Properties */}
          <div className="w-full md:w-1/2">
            {mineral.chemical_formula && (
              <div className="mb-6">
                <h3 className="text-base font-medium">Chemical Formula</h3>
                <p className="text-lg">{mineral.chemical_formula}</p>
              </div>
            )}
            
            {mineral.color && (
              <div className="mb-6">
                <h3 className="text-base font-medium">Color</h3>
                <p className="text-lg">{mineral.color}</p>
              </div>
            )}
            
            {mineral.streak && (
              <div className="mb-6">
                <h3 className="text-base font-medium">Streak</h3>
                <p className="text-lg">{mineral.streak}</p>
              </div>
            )}
            
            {mineral.luster && (
              <div className="mb-6">
                <h3 className="text-base font-medium">Luster</h3>
                <p className="text-lg">{mineral.luster}</p>
              </div>
            )}
            
            {mineral.hardness && (
              <div className="mb-6">
                <h3 className="text-base font-medium">Hardness</h3>
                <p className="text-lg">{mineral.hardness}</p>
              </div>
            )}
          </div>
        </div>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Crystal Information */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Crystal Properties</h2>
          
          {mineral.crystal_system && (
            <div className="mb-4">
              <h3 className="text-base font-medium">Crystal System</h3>
              <p className="text-lg">{mineral.crystal_system}</p>
            </div>
          )}
          
          {mineral.cleavage && (
            <div className="mb-4">
              <h3 className="text-base font-medium">Cleavage</h3>
              <p className="text-lg">{mineral.cleavage}</p>
            </div>
          )}
          
          {mineral.fracture && (
            <div className="mb-4">
              <h3 className="text-base font-medium">Fracture</h3>
              <p className="text-lg">{mineral.fracture}</p>
            </div>
          )}
          
          {mineral.habit && (
            <div className="mb-4">
              <h3 className="text-base font-medium">Habit</h3>
              <p className="text-lg">{mineral.habit}</p>
            </div>
          )}
          
          {!mineral.crystal_system && !mineral.cleavage && !mineral.fracture && !mineral.habit && (
            <p className="text-muted-foreground">No crystal property information available</p>
          )}
        </Card>

        {/* Additional Properties */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Additional Properties</h2>
          
          <div className="space-y-4">
            {mineral.specific_gravity && (
              <div className="mb-4">
                <h3 className="text-base font-medium">Specific Gravity</h3>
                <p className="text-lg">{mineral.specific_gravity}</p>
              </div>
            )}
            
            {mineral.transparency && (
              <div className="mb-4">
                <h3 className="text-base font-medium">Transparency</h3>
                <p className="text-lg">{mineral.transparency}</p>
              </div>
            )}
            
            {mineral.occurrence && (
              <div className="mb-4">
                <h3 className="text-base font-medium">Occurrence</h3>
                <p className="text-lg">{mineral.occurrence}</p>
              </div>
            )}
            
            {mineral.uses && (
              <div className="mb-4">
                <h3 className="text-base font-medium">Uses</h3>
                <p className="text-lg">{mineral.uses}</p>
              </div>
            )}
            
            {!mineral.specific_gravity && !mineral.transparency && !mineral.occurrence && !mineral.uses && (
              <p className="text-muted-foreground">No additional property information available</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default MineralDetailView; 