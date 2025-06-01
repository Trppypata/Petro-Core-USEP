import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getRocks } from "../rocks-minerals/services/rocks-minerals.service";
import type { RocksMineralsItem } from "../rocks-minerals/types";
import { ArrowLeft } from "lucide-react";
import { Button } from "../../../components/ui/button";
import LeafletMap from "./LeafletMap";
import MapErrorBoundary from "./MapErrorBoundary";

const RocksMineralsMap = () => {
  const [rocks, setRocks] = useState<RocksMineralsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRocks = async () => {
      setLoading(true);
      try {
        // Fetch all rocks data
        const rocksData = await getRocks();
        // Filter rocks that have coordinates
        const rocksWithCoordinates = rocksData.filter(
          (rock) => rock.id && (rock.coordinates || (rock.latitude && rock.longitude))
        );
        
        setRocks(rocksWithCoordinates);
      } catch (err) {
        console.error("Error fetching rock data:", err);
        setError("Failed to load rock data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchRocks();
  }, []);

  return (
    <div className="min-h-screen bg-background py-24 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <Link to="/rock-minerals">
          <Button variant="outline" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Rock Minerals
          </Button>
        </Link>
        <h2 className="text-3xl font-bold text-center">Rock Minerals Map</h2>
        <p className="text-center text-muted-foreground mt-2">
          Explore rock minerals found across different locations
        </p>
      </div>

      {loading && (
        <div className="flex justify-center items-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      )}

      {error && (
        <div className="text-center text-red-500 p-4">{error}</div>
      )}

      {!loading && !error && rocks.length > 0 && (
        <MapErrorBoundary>
          <LeafletMap rocks={rocks} />
        </MapErrorBoundary>
      )}

      {!loading && !error && rocks.length === 0 && (
        <div className="text-center p-12">
          <p className="text-lg text-muted-foreground">No rock minerals with location data found.</p>
        </div>
      )}
    </div>
  );
};

export default RocksMineralsMap;