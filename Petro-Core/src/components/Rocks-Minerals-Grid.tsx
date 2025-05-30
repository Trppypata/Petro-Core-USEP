import { Link } from "react-router-dom";
import RockMineralsCard from "./custom/customcard";
import type { RocksMineralsItem } from "../modules/home/rocks-minerals/types";

interface RocksMineralsGridProps {
  items: RocksMineralsItem[];
  isLoading?: boolean;
}

const RocksMineralsGrid = ({ items, isLoading = false }: RocksMineralsGridProps) => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No rocks or minerals found. Try a different search term.</p>
      </div>
    );
  }

  return (
   <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.map((item) => (
      item.path ? (
        <Link
            key={item.id}
          to={item.path}
          className="transition hover:scale-10"
        >
          <RockMineralsCard
            imageUrl={item.imageUrl}
            title={item.title}
            description={item.description}
          />
        </Link>
      ) : (
          <div key={item.id}>
          <RockMineralsCard
            imageUrl={item.imageUrl}
            title={item.title}
            description={item.description}
          />
        </div>
      )
    ))}
  </div>
);
};

export default RocksMineralsGrid;