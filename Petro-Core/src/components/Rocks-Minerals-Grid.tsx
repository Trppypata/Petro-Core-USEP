import type { RocksMineralsItem } from "@/modules/home/rocks-minerals/types";
import { Loader2 } from "lucide-react";
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import RockMineralsCard from './custom/customcard';

interface RocksMineralsGridProps {
  items: RocksMineralsItem[];
  isLoading?: boolean;
  onCardClick?: (item: RocksMineralsItem) => void;
}

const RocksMineralsGrid = ({ items, isLoading = false, onCardClick }: RocksMineralsGridProps) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Prevent SSR hydration issues
    return <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"></div>;
  }

  const handleCardClick = (item: RocksMineralsItem) => {
    if (onCardClick) {
      onCardClick(item);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-40">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item, index) => {
          // Ensure each link has a valid path
          const linkTo = item.path || 
                        (item.type === 'mineral' 
                          ? `/rock-minerals/mineral/${item.id || index}` 
                          : `/rock-minerals/rock/${item.id || index}`);

          return (
            <div 
              key={item.id || index}
              onClick={() => handleCardClick(item)}
              className="cursor-pointer transition-transform duration-200 hover:scale-[1.02]"
            >
              <Link to={linkTo}>
                <RockMineralsCard
                  title={item.title}
                  description={item.description}
                  imageUrl={item.imageUrl}
                  category={item.category}
                  type={item.type || 'rock'}
                  texture={item.texture}
                  foliation={item.foliation}
                  rockType={item.rockType}
                />
              </Link>
            </div>
          );
        })}
      </div>
    </>
  );
};

export default RocksMineralsGrid;