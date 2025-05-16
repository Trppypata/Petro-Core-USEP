import { Link } from "react-router-dom";
import { WorkCard } from "./cards/WorkCard";
import { FieldWork } from "../modules/fieldworkpage/types";

interface FieldWorkGridProps {
  works: FieldWork[];
}

export function FieldWorkGrid({ works }: FieldWorkGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {works.map((work, index) => (
        work.path ? (
          <Link 
            key={index}
            to={work.path}
            className="transition-transform hover:scale-105 "
          >
            <WorkCard
              title={work.title}
              description={work.description}
            />
          </Link>
        ) : (
          <div key={index}>
            <WorkCard
              title={work.title}
              description={work.description}
            />
          </div>
        )
      ))}
    </div>
  );
}