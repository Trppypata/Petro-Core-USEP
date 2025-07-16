import axios from "axios";
import type { IRock } from "../rock.interface";

const API_URL = "https://petro-core-usep.onrender.com/api";

// Get all rocks by category
export const getRocks = async (category: string): Promise<IRock[]> => {
  try {
    // For development, we'll first try to load from a mock source
    if (process.env.NODE_ENV === "development") {
      return mockGetRocks(category);
    }

    const response = await axios.get(`${API_URL}/rocks`, {
      params: { category },
    });
    return response.data.data;
  } catch (error) {
    console.error("Error fetching rocks:", error);
    // For now, return mock data if API fails
    return mockGetRocks(category);
  }
};

// Add a new rock
export const addRock = async (rockData: Omit<IRock, "id">): Promise<IRock> => {
  try {
    // For development, we'll use mock data
    if (process.env.NODE_ENV === "development") {
      return mockAddRock(rockData);
    }

    const response = await axios.post(`${API_URL}/rocks`, rockData);
    return response.data.data;
  } catch (error) {
    console.error("Error adding rock:", error);

    // For development only
    if (process.env.NODE_ENV === "development") {
      return mockAddRock(rockData);
    }

    throw new Error("Failed to add rock. Please try again.");
  }
};

// Mock data for development
const mockRocks: IRock[] = [
  {
    id: "r-001",
    name: "Granite",
    rock_code: "I-0001",
    chemical_formula: "Complex mixture",
    hardness: "6-7",
    category: "Igneous",
    type: "igneous",
    status: "active",
  },
  {
    id: "r-002",
    name: "Basalt",
    rock_code: "I-0002",
    chemical_formula: "Complex mixture",
    hardness: "5-6",
    category: "Igneous",
    type: "igneous",
    status: "active",
  },
  {
    id: "r-003",
    name: "Limestone",
    rock_code: "S-0001",
    chemical_formula: "CaCO₃",
    hardness: "3",
    category: "Sedimentary",
    type: "sedimentary",
    status: "active",
  },
  {
    id: "r-004",
    name: "Marble",
    rock_code: "M-0001",
    chemical_formula: "CaCO₃",
    hardness: "3-4",
    category: "Metamorphic",
    type: "metamorphic",
    status: "active",
  },
  // Ore samples from Database.xlsx
  {
    id: "r-005",
    name: "Gold Copper Ore",
    rock_code: "O-0001",
    commodity_type: "Gold, Copper",
    ore_group: "Hydrothermal (ISE)",
    mining_company: "Lepanto Consolidated Mining Company",
    chemical_formula: "Complex mixture",
    hardness: "3-4",
    category: "Ore Samples",
    type: "gold_copper",
    status: "active",
    locality: "Mankayan, Benguet",
    description: "Enargite-Luzonite Intergrown with Disseminated Pyrite",
    latitude: "16° 51' 35\" N",
    longitude: "120° 49' 30\" E",
  },
  {
    id: "r-006",
    name: "Gold Ore",
    rock_code: "O-0002",
    commodity_type: "Gold",
    ore_group: "Hydrothermal (ISE)",
    mining_company: "Apex Mining Company, Inc.",
    chemical_formula: "Complex mixture",
    hardness: "2.5-3",
    category: "Ore Samples",
    type: "gold ore",
    status: "active",
    locality: "Masara, Maco, Davao de Oro",
    description:
      "Crustiform-Colloform Banded Quartz + Rhodonite + Rhodochrosite",
    latitude: "7° 22' 26\" N",
    longitude: "126° 6' 56\" E",
  },
  {
    id: "r-007",
    name: "Nickel Ore",
    rock_code: "O-0003",
    commodity_type: "Nickel",
    ore_group: "Residual",
    mining_company: "Taganito Mining Corporation",
    chemical_formula: "Fe-Ni oxides and silicates",
    hardness: "2-5",
    category: "Ore Samples",
    type: "nickel ore",
    status: "active",
    locality: "Claver, Surigao del Norte",
    description: "Lateritic Nickel Ore with fractures",
    latitude: "9°32'09.25\" N",
    longitude: "125°54'16.43\" E",
  },
  {
    id: "r-008",
    name: "Gangue",
    rock_code: "O-0004",
    commodity_type: "Gangue",
    ore_group: "Hydrothermal (LSE)",
    mining_company: "Philsaga Mining Corporation",
    chemical_formula: "CaCO3, SiO2, etc.",
    hardness: "3-4",
    category: "Ore Samples",
    type: "gangue",
    status: "active",
    locality: "Consuelo, Agusan del Sur",
    description: "Hydrothermal Breccia with Calcite as matrix",
    latitude: "8°16'04.26\" N",
    longitude: "126°00'19.63\" E",
  },
  {
    id: "r-009",
    name: "Gold Silver Ore",
    rock_code: "O-0005",
    commodity_type: "Gold, Silver",
    ore_group: "Hydrothermal",
    mining_company: "Philsaga Mining Corporation",
    chemical_formula: "Complex mixture",
    hardness: "2.5-4",
    category: "Ore Samples",
    type: "gold_silver",
    status: "active",
    locality: "Mankayan, Benguet",
    description:
      "Pyrite Intergrown within Drusy Quartz; Chalcopyrite and Sphalerite",
    latitude: "16° 51' 35\" N",
    longitude: "120° 49' 30\" E",
  },
  {
    id: "r-010",
    name: "Gangue",
    rock_code: "O-0006",
    commodity_type: "Gangue",
    ore_group: "Hydrothermal",
    mining_company: "Carmen Copper Corporation",
    chemical_formula: "Complex mixture",
    hardness: "2-3",
    category: "Ore Samples",
    type: "gangue",
    status: "active",
    locality: "Toledo City, Cebu",
    description: "Anhydrite with Disseminated Pyrite",
    latitude: "10° 20' 8\" N",
    longitude: "123° 40' 14\" E",
  },
];

// Mock function to get rocks by category
const mockGetRocks = (category: string): Promise<IRock[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (category === "ALL") {
        resolve(mockRocks);
      } else {
        const filtered = mockRocks.filter((rock) => rock.category === category);
        resolve(filtered);
      }
    }, 500);
  });
};

// Mock function to add a new rock
const mockAddRock = (rockData: Omit<IRock, "id">): Promise<IRock> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const newRock: IRock = {
        ...rockData,
        id: `r-${Math.random().toString(36).substr(2, 9)}`,
      };
      mockRocks.push(newRock);
      resolve(newRock);
    }, 500);
  });
};
