import { Link } from "react-router-dom";
import { WorkCard } from "./cards/WorkCard";
import { useEffect } from "react";

// Define the interface locally to avoid import issues
interface FieldWork {
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
        works.map((work, index) => (
          work.path ? (
            <Link 
              key={index}
              to={work.path}
              className="transition-transform hover:scale-105 h-full"
            >
              <WorkCard
                title={work.title}
                description={work.description}
              />
            </Link>
          ) : (
            <div key={index} className="h-full">
              <WorkCard
                title={work.title}
                description={work.description}
              />
            </div>
          )
        ))
      ) : (
        <div className="col-span-3 text-center py-8">
          <p>No field works available</p>
        </div>
      )}
    </div>
  );
}