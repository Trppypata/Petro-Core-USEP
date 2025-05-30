import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import type { IMineral } from "../../admin/minerals/mineral.interface";

// Function to fetch a single mineral by ID
const fetchMineralById = async (id: string): Promise<IMineral | null> => {
  try {
    const API_URL = import.meta.env.VITE_local_url || 'http://localhost:8001/api';
    const response = await fetch(`${API_URL}/minerals/${id}`);
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
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <h2 className="text-2xl font-bold text-red-500 mb-2">Error</h2>
              <p className="text-muted-foreground">{error || "Mineral not found"}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Default image for minerals
  const defaultImage = "/images/rocks-minerals/default-mineral.jpg";
  
  return (
    <div className="container mx-auto px-4 py-8">
      <Link to="/rock-minerals">
        <Button variant="outline" className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Minerals
        </Button>
      </Link>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-2xl">{mineral.mineral_name}</CardTitle>
            <p className="text-muted-foreground">
              {mineral.category} | Code: {mineral.mineral_code}
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-6">
              {/* Use image if available, otherwise use default */}
              <div className="w-full md:w-1/3">
                <img 
                  src={mineral.image_url || defaultImage} 
                  alt={mineral.mineral_name} 
                  className="w-full h-auto rounded-lg object-cover"
                />
              </div>
              <div className="w-full md:w-2/3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InfoItem label="Mineral Group" value={mineral.mineral_group} />
                  <InfoItem label="Category" value={mineral.category} />
                  
                  {mineral.chemical_formula && (
                    <InfoItem label="Chemical Formula" value={mineral.chemical_formula} />
                  )}
                  
                  {mineral.hardness && (
                    <InfoItem label="Hardness" value={mineral.hardness} />
                  )}
                  
                  {mineral.color && (
                    <InfoItem label="Color" value={mineral.color} />
                  )}
                  
                  {mineral.luster && (
                    <InfoItem label="Luster" value={mineral.luster} />
                  )}
                  
                  {mineral.streak && (
                    <InfoItem label="Streak" value={mineral.streak} />
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Crystal Properties */}
        <Card>
          <CardHeader>
            <CardTitle>Crystal Properties</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4">
              {mineral.crystal_system && (
                <InfoItem label="Crystal System" value={mineral.crystal_system} />
              )}
              
              {mineral.cleavage && (
                <InfoItem label="Cleavage" value={mineral.cleavage} />
              )}
              
              {mineral.fracture && (
                <InfoItem label="Fracture" value={mineral.fracture} />
              )}
              
              {mineral.habit && (
                <InfoItem label="Habit" value={mineral.habit} />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Additional Information */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4">
              {mineral.specific_gravity && (
                <InfoItem label="Specific Gravity" value={mineral.specific_gravity} />
              )}
              
              {mineral.transparency && (
                <InfoItem label="Transparency" value={mineral.transparency} />
              )}
              
              {mineral.occurrence && (
                <InfoItem label="Occurrence" value={mineral.occurrence} />
              )}
              
              {mineral.uses && (
                <InfoItem label="Uses" value={mineral.uses} />
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

export default MineralDetailView; 