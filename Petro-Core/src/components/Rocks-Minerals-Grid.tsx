import { Link } from "react-router-dom";
import RockMineralsCard from "../components/custom/customcard";
import { RocksMinerals } from "../modules/rocks-minerals-page/types";

interface RocksMineralsGridProps {
  items: RocksMinerals[];
}
const RocksMineralsGrid = ({ items }: RocksMineralsGridProps) => (
  <>
   <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
    {items.map((item, index) => (
      item.path ? (
        <Link
          key={index}
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
        <div key={index}>
          <RockMineralsCard
            imageUrl={item.imageUrl}
            title={item.title}
            description={item.description}
          />
        </div>
      )
    ))}
  </div>
  </>
 
);

export default RocksMineralsGrid;