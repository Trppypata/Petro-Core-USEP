import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import type { IRock } from "../../admin/rocks/rock.interface";
import { SupabaseImage } from "@/components/ui/supabase-image";

// Function to fetch a single rock by ID
const fetchRockById = async (id: string): Promise<IRock | null> => {
  try {
    const API_URL = import.meta.env.VITE_local_url || 'http://localhost:8001/api';
    const response = await fetch(`${API_URL}/rocks/${id}`);
    const data = await response.json();
    
    if (!data.success || !data.data) {
      return null;
    }
    
    return data.data;
  } catch (error) {
    console.error("Error fetching rock details:", error);
    return null;
  }
};

const RockDetailView = () => {
  const { id } = useParams<{ id: string }>();
  const [rock, setRock] = useState<IRock | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadRock = async () => {
      if (!id) {
        setError("No rock ID provided");
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const rockData = await fetchRockById(id);
        if (rockData) {
          setRock(rockData);
        } else {
          setError("Rock not found");
        }
      } catch (err) {
        setError("Failed to load rock details");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadRock();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !rock) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Link to="/rock-minerals">
          <Button variant="outline" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Rocks
          </Button>
        </Link>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <h2 className="text-2xl font-bold text-red-500 mb-2">Error</h2>
              <p className="text-muted-foreground">{error || "Rock not found"}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Link to="/rock-minerals">
        <Button variant="outline" className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Rocks
        </Button>
      </Link>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-2xl">{rock.name}</CardTitle>
            <p className="text-muted-foreground">{rock.category} | Code: {rock.rock_code}</p>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-6">
              {rock.image_url && (
                <div className="w-full md:w-1/3">
                  <SupabaseImage
                    src={rock.image_url}
                    alt={rock.name}
                    className="w-full rounded-lg"
                    height={300}
                    objectFit="cover"
                  />
                </div>
              )}
              <div className="w-full md:w-2/3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InfoItem label="Type" value={rock.type} />
                  <InfoItem label="Category" value={rock.category} />
                  
                  {rock.chemical_formula && (
                    <InfoItem label="Chemical Formula" value={rock.chemical_formula} />
                  )}
                  
                  {rock.hardness && (
                    <InfoItem label="Hardness" value={rock.hardness} />
                  )}
                  
                  {rock.color && (
                    <InfoItem label="Color" value={rock.color} />
                  )}
                  
                  {rock.texture && (
                    <InfoItem label="Texture" value={rock.texture} />
                  )}
                  
                  {rock.grain_size && (
                    <InfoItem label="Grain Size" value={rock.grain_size} />
                  )}
                  
                  {rock.mineral_composition && (
                    <InfoItem label="Mineral Composition" value={rock.mineral_composition} />
                  )}
                </div>
                
                {rock.description && (
                  <div className="mt-4">
                    <h3 className="font-semibold text-lg mb-2">Description</h3>
                    <p>{rock.description}</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Location Information */}
        {(rock.locality || rock.latitude || rock.longitude) && (
          <Card>
            <CardHeader>
              <CardTitle>Location Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4">
                {rock.locality && (
                  <InfoItem label="Locality" value={rock.locality} />
                )}
                
                {(rock.latitude && rock.longitude) && (
                  <InfoItem 
                    label="Coordinates" 
                    value={`${rock.latitude}, ${rock.longitude}`} 
                  />
                )}
                
                {rock.formation && (
                  <InfoItem label="Formation" value={rock.formation} />
                )}
                
                {rock.geological_age && (
                  <InfoItem label="Geological Age" value={rock.geological_age} />
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Additional Information */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Properties</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4">
              {rock.metamorphism_type && (
                <InfoItem label="Metamorphism Type" value={rock.metamorphism_type} />
              )}
              
              {rock.metamorphic_grade && (
                <InfoItem label="Metamorphic Grade" value={rock.metamorphic_grade} />
              )}
              
              {rock.parent_rock && (
                <InfoItem label="Parent Rock" value={rock.parent_rock} />
              )}
              
              {rock.foliation && (
                <InfoItem label="Foliation" value={rock.foliation} />
              )}
              
              {rock.silica_content && (
                <InfoItem label="Silica Content" value={rock.silica_content} />
              )}
              
              {rock.cooling_rate && (
                <InfoItem label="Cooling Rate" value={rock.cooling_rate} />
              )}
              
              {rock.bedding && (
                <InfoItem label="Bedding" value={rock.bedding} />
              )}
              
              {rock.sorting && (
                <InfoItem label="Sorting" value={rock.sorting} />
              )}
              
              {rock.roundness && (
                <InfoItem label="Roundness" value={rock.roundness} />
              )}
              
              {rock.fossil_content && (
                <InfoItem label="Fossil Content" value={rock.fossil_content} />
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Helper component for displaying property-value pairs
const InfoItem = ({ label, value }: { label: string; value: string }) => {
  if (!value) return null;
  
  return (
    <div className="mb-2">
      <h4 className="text-sm font-medium text-muted-foreground">{label}</h4>
      <p>{value}</p>
    </div>
  );
};

export default RockDetailView; 