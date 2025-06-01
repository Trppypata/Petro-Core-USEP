import { Link } from "react-router-dom";
import RockMineralsCard from "./custom/customcard";
import type { RocksMineralsItem } from "@/modules/home/rocks-minerals/types";
import { Loader2 } from "lucide-react";

interface RocksMineralsGridProps {
  items: RocksMineralsItem[];
  isLoading?: boolean;
}

const RocksMineralsGrid = ({ items, isLoading = false }: RocksMineralsGridProps) => {
  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center py-12 space-y-4">
        <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
        <p className="text-sm text-muted-foreground">Loading items...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12 space-y-2">
        <p className="text-lg font-semibold">No items found</p>
        <p className="text-muted-foreground">Try adjusting your search or filters to find what you're looking for.</p>
      </div>
    );
  }

  return (
    <>
      <p className="text-sm text-muted-foreground mb-4">
        Found {items.length} item{items.length !== 1 ? 's' : ''}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item) => (
          item.path ? (
            <Link
              key={item.id}
              to={item.path}
              className="h-full block transition-transform hover:scale-[1.02] focus:scale-[1.02] focus:outline-none"
            >
              <RockMineralsCard
                imageUrl={item.imageUrl}
                title={item.title}
                description={item.description}
                category={item.category}
              />
            </Link>
          ) : (
            <div key={item.id} className="h-full">
              <RockMineralsCard
                imageUrl={item.imageUrl}
                title={item.title}
                description={item.description}
                category={item.category}
              />
            </div>
          )
        ))}
      </div>
    </>
  );
};

export default RocksMineralsGrid;