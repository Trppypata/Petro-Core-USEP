import { Link } from "react-router-dom";
import { WorkCard } from "./cards/WorkCard";
import { useEffect } from "react";

// Define the interface locally to avoid import issues
interface FieldWork {
  id: string;
  title: string;
  description: string;
  path?: string;
}

interface FieldWorkGridProps {
  works: FieldWork[];
}

export function FieldWorkGrid({ works }: FieldWorkGridProps) {
  useEffect(() => {
    // Debug log to see what works array is received
    console.log("FieldWorkGrid - works received:", works);
  }, [works]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 py-4">
      {works && works.length > 0 ? (
        works.map((work) => {
          // Ensure we have a valid path - use the ID if path is missing
          const workPath = work.path || `/field-works/${work.id}`;
          
          return (
            <Link 
              key={work.id || work.title}
              to={workPath}
              className="transition-transform hover:scale-105 h-full"
            >
              <WorkCard
                title={work.title}
                description={work.description || 'No description available'}
              />
            </Link>
          );
        })
      ) : (
        <div className="col-span-3 text-center py-8">
          <p>No field works available</p>
        </div>
      )}
    </div>
  );
}