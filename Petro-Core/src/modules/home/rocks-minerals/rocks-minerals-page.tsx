import { useState, useEffect } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import RocksMineralsGrid from "../../../components/Rocks-Minerals-Grid";
import { SearchBar } from "../../../components/search/SearchBar";
import { getRocks, getMinerals } from "./services/rocks-minerals.service";
import type { RocksMineralsItem } from "./types";

const RockMinerals = () => {
  const location = useLocation();
  const [items, setItems] = useState<RocksMineralsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [displayType, setDisplayType] = useState<"rocks" | "minerals" | "all">("rocks");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Determine whether to show rocks or minerals based on the URL
        let fetchedItems: RocksMineralsItem[] = [];
        
        if (displayType === "rocks") {
          fetchedItems = await getRocks(searchTerm);
        } else if (displayType === "minerals") {
          fetchedItems = await getMinerals(searchTerm);
        } else {
          // Future expansion for "all" option
          const rocks = await getRocks(searchTerm);
          const minerals = await getMinerals(searchTerm);
          fetchedItems = [...rocks, ...minerals];
        }
        
        setItems(fetchedItems);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [searchTerm, displayType]);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  const handleDisplayTypeChange = (type: "rocks" | "minerals" | "all") => {
    setDisplayType(type);
  };

  return (
    <div className="min-h-screen bg-background py-24 px-4 sm:px-6 lg:px-8">
         <div className="text-center space-y-8">
          <h1 className="text-4xl font-bold tracking-tight">Rocks and Minerals</h1>
        <div className="flex justify-center">
          <SearchBar onSearch={handleSearch} initialValue={searchTerm} />
          </div>

        <div className="flex gap-4 mb-12 justify-center">
          <button
            onClick={() => handleDisplayTypeChange("rocks")}
            className={`rounded-full px-8 py-2 transition ${
              displayType === "rocks" ? "bg-gray-800 text-white" : "bg-gray-200"
            }`}
        >
          Rocks
          </button>
          <button
            onClick={() => handleDisplayTypeChange("minerals")}
            className={`rounded-full px-8 py-2 transition ${
              displayType === "minerals" ? "bg-gray-800 text-white" : "bg-gray-200"
            }`}
          >
            Minerals
          </button>
        <Link
          to="/rock-minerals/map"
            className={`rounded-full px-8 py-2 transition ${
              location.pathname === "/rock-minerals/map" ? "bg-gray-800 text-white" : "bg-gray-200"
            }`}
          >
          Map
        </Link>
      </div>
        
        {location.pathname === "/rock-minerals" && (
          <RocksMineralsGrid items={items} isLoading={loading} />
        )}
      </div>
      <Outlet />
    </div>
  );
};

export default RockMinerals;