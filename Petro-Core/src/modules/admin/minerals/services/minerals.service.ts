import axios from "axios";
import type { IMineral } from "../mineral.interface";
import Cookies from "js-cookie";
import { toast } from "sonner";

const API_URL = "http://localhost:8001/api";

// Helper function to get the authentication token
const getAuthToken = (): string | null => {
  // Try to get token from multiple possible sources
  return (
    localStorage.getItem("access_token") ||
    Cookies.get("access_token") ||
    localStorage.getItem("token") ||
    localStorage.getItem("auth_token")
  );
};

// Get all minerals by category
export const getMinerals = async (category: string): Promise<IMineral[]> => {
  try {
    console.log("🔍 Fetching minerals from API...");
    console.log("🔗 API URL:", `${API_URL}/minerals`);

    // Normalize category name if it's Borate/Borates or Carbonate/Carbonates
    let normalizedCategory = category;

    if (category) {
      // First trim any whitespace
      const trimmedCategory = category.trim();
      const categoryUpper = trimmedCategory.toUpperCase();

      if (categoryUpper === "BORATE" || categoryUpper === "BORATES") {
        console.log(`Normalizing category from ${category} to Borate`);
        normalizedCategory = "Borate";
      } else if (
        categoryUpper === "CARBONATE" ||
        categoryUpper === "CARBONATES"
      ) {
        console.log(`Normalizing category from ${category} to Carbonate`);
        normalizedCategory = "Carbonate";
      } else {
        // For other categories, just use the trimmed version
        normalizedCategory = trimmedCategory;
      }
    }

    // Add category as a query parameter if provided and not ALL
    const url =
      normalizedCategory && normalizedCategory !== "ALL"
        ? `${API_URL}/minerals?category=${encodeURIComponent(
            normalizedCategory
          )}`
        : `${API_URL}/minerals`;

    console.log("🔍 Request URL with normalized category:", url);

    const response = await axios.get(url);
    console.log("✅ Raw API Response status:", response.status);
    console.log(
      "✅ Response data length:",
      response.data?.data?.length || "unknown"
    );

    if (!response.data || !response.data.data) {
      console.warn("⚠️ No data received from API");
      return [];
    }

    // Extract the data from the response
    const minerals = response.data.data || [];

    // Check if minerals is an array
    if (!Array.isArray(minerals)) {
      console.warn("⚠️ Minerals data is not an array", minerals);
      return [];
    }

    console.log("✅ Extracted minerals array:", minerals.length, "items");
    return minerals;
  } catch (error) {
    console.error("❌ Error fetching minerals:", error);
    throw new Error("Failed to fetch minerals from the database");
  }
};

// Import minerals from Excel
export const importMineralsFromExcel = async (
  file: File
): Promise<{ success: boolean; message: string }> => {
  try {
    console.log(`Uploading Excel file: ${file.name}, size: ${file.size} bytes`);

    const formData = new FormData();
    formData.append("file", file);

    console.log(
      "Making request to API endpoint:",
      `${API_URL}/minerals/import`
    );

    const response = await axios.post(`${API_URL}/minerals/import`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    console.log("Import response received:", response.data);

    // Log sheet information if available
    if (response.data.counts) {
      console.log("Imported sheet counts:", response.data.counts);
      // Check if BORATES and CARBONATES were processed
      if (response.data.counts["BORATES"]) {
        console.log("BORATES sheet stats:", response.data.counts["BORATES"]);
      } else {
        console.warn("WARNING: BORATES sheet was not processed");
      }

      if (response.data.counts["CARBONATES"]) {
        console.log(
          "CARBONATES sheet stats:",
          response.data.counts["CARBONATES"]
        );
      } else {
        console.warn("WARNING: CARBONATES sheet was not processed");
      }
    }

    return response.data;
  } catch (error: any) {
    console.error("Error importing minerals from Excel:", error);
    throw new Error(
      error.response?.data?.message || "Failed to import minerals"
    );
  }
};

// Import default minerals from built-in database
export const importDefaultMinerals = async (): Promise<{
  success: boolean;
  message: string;
}> => {
  try {
    console.log("Starting import from default minerals database...");

    // Make request to the default import endpoint
    console.log(
      "Making request to API endpoint:",
      `${API_URL}/minerals/import-default`
    );
    const response = await axios.post(`${API_URL}/minerals/import-default`);

    console.log("Default minerals import response:", response.data);

    // Log sheet information if available
    if (response.data.counts) {
      console.log("Imported sheet counts:", response.data.counts);
      // Check if BORATES and CARBONATES were processed
      if (response.data.counts["BORATES"]) {
        console.log("BORATES sheet stats:", response.data.counts["BORATES"]);
      } else {
        console.warn("WARNING: BORATES sheet was not processed");
      }

      if (response.data.counts["CARBONATES"]) {
        console.log(
          "CARBONATES sheet stats:",
          response.data.counts["CARBONATES"]
        );
      } else {
        console.warn("WARNING: CARBONATES sheet was not processed");
      }
    }

    return response.data;
  } catch (error: any) {
    console.error("Error importing default minerals data:", error);
    throw new Error(
      error.response?.data?.message || "Failed to import default minerals data"
    );
  }
};

// Add a new mineral
export const addMineral = async (
  mineralData: Omit<IMineral, "id">
): Promise<IMineral> => {
  try {
    // Get token using the helper function
    const token = getAuthToken();

    if (!token) {
      throw new Error("Authentication token not found. Please log in again.");
    }

    // Set headers with the token for authorization
    const headers = {
      Authorization: `Bearer ${token}`,
    };

    console.log("Add mineral headers:", headers);
    console.log("Add mineral data before cleaning:", mineralData);

    // Clean the data to remove any problematic fields
    const cleanedData = cleanMineralData(mineralData);
    console.log("Add mineral data after cleaning:", cleanedData);

    // Create a fresh axios instance with auth headers
    const authAxios = axios.create({
      baseURL: API_URL,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      withCredentials: false,
      // Add a timeout to avoid hanging requests
      timeout: 10000,
    });

    console.log("Sending POST request to:", `${API_URL}/minerals`);
    const response = await authAxios.post("/minerals", cleanedData);
    console.log("Response status:", response.status);

    if (!response.data || !response.data.data) {
      throw new Error("Invalid response format");
    }

    return response.data.data;
  } catch (error) {
    console.error("Error adding mineral:", error);

    // Enhanced error handling to provide more details
    if (axios.isAxiosError(error)) {
      const statusCode = error.response?.status;
      const responseData = error.response?.data;

      console.error(`API Error (${statusCode}):`, responseData);

      // Handle token expiration specifically
      if (statusCode === 401) {
        localStorage.removeItem("access_token");
        toast.error("Your session has expired. Please log in again.");
      }

      if (responseData?.message) {
        throw new Error(`Failed to add mineral: ${responseData.message}`);
      }
    }

    throw new Error("Failed to add mineral. Please try again.");
  }
};

/**
 * Cleans mineral data to include only valid fields from the schema
 */
export const cleanMineralData = (mineralData: any): Partial<IMineral> => {
  // Only include fields that are in the IMineral interface
  const validKeys = [
    "id",
    "mineral_code",
    "mineral_name",
    "chemical_formula",
    "mineral_group",
    "color",
    "streak",
    "luster",
    "hardness",
    "cleavage",
    "fracture",
    "habit",
    "crystal_system",
    "category",
    "type",
    "image_url",
    "specific_gravity",
    "transparency",
    "occurrence",
    "uses",
    "created_at",
    "updated_at",
  ];

  // Create a new object with only valid fields
  const cleanedData: Partial<IMineral> = {};

  // Add each valid field if it exists in the input data
  for (const key of validKeys) {
    if (mineralData[key] !== undefined) {
      // Fix the TypeScript error by using type assertion
      (cleanedData as any)[key] = mineralData[key];
    }
  }

  // Explicitly remove any user-related fields
  delete (cleanedData as any).user;
  delete (cleanedData as any).user_id;
  delete (cleanedData as any).user_metadata;

  return cleanedData;
};

// Update a mineral
export const updateMineral = async (
  id: string,
  mineralData: Partial<IMineral>
): Promise<IMineral> => {
  try {
    console.log("⭐ Update mineral service called with ID:", id);
    console.log(
      "⭐ Update mineral data before cleaning:",
      JSON.stringify(mineralData, null, 2)
    );

    // Clean the data to remove problematic fields
    const cleanedData = cleanMineralData(mineralData);
    console.log(
      "🧹 Update mineral data after cleaning:",
      JSON.stringify(cleanedData, null, 2)
    );

    // Get token using the helper function
    const token = getAuthToken();

    if (!token) {
      throw new Error("Authentication token not found. Please log in again.");
    }

    // Create a fresh axios instance with auth headers
    const authAxios = axios.create({
      baseURL: API_URL,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      withCredentials: false,
      timeout: 10000,
    });

    console.log("📤 Sending update request...");
    const response = await authAxios.put(`/minerals/${id}`, cleanedData);

    console.log("📥 Update response status:", response.status);
    console.log("📥 Update response data:", response.data);

    if (!response.data || !response.data.data) {
      throw new Error("Invalid response format");
    }

    return response.data.data;
  } catch (error) {
    console.error("❌ Error updating mineral:", error);

    // Enhanced error handling to provide more details
    if (axios.isAxiosError(error)) {
      const statusCode = error.response?.status;
      const responseData = error.response?.data;

      console.error(`❌ Error status:`, statusCode);
      console.error(`❌ Error data:`, responseData);

      // Handle token expiration specifically
      if (statusCode === 401) {
        localStorage.removeItem("access_token");
        toast.error("Your session has expired. Please log in again.");
      }

      if (responseData?.message) {
        throw new Error(`Failed to update mineral: ${responseData.message}`);
      }
    }

    throw new Error("Failed to update mineral. Please try again.");
  }
};

// Delete a mineral
export const deleteMineral = async (id: string): Promise<void> => {
  try {
    // Get token using the helper function
    const token = getAuthToken();

    if (!token) {
      throw new Error("Authentication token not found. Please log in again.");
    }

    // Set headers with the token for authorization
    const headers = {
      Authorization: `Bearer ${token}`,
    };

    console.log("Delete mineral headers:", headers);
    console.log("Deleting mineral ID:", id);

    await axios.delete(`${API_URL}/minerals/${id}`, {
      headers,
      withCredentials: false,
    });
  } catch (error) {
    console.error("Error deleting mineral:", error);
    throw new Error("Failed to delete mineral. Please try again.");
  }
};

// Mock functions for development until the API is implemented
const mockMinerals: IMineral[] = [
  {
    id: "M-SFS-001",
    mineral_code: "M-SFS-001",
    mineral_name: "Enargite",
    chemical_formula: "Cu₃AsS₄",
    mineral_group: "Sulfosalt",
    color: "Gray-black",
    streak: "Black",
    luster: "Metallic",
    hardness: "3",
    cleavage: "Perfect",
    fracture: "Uneven",
    habit: "Prismatic, striated",
    crystal_system: "Orthorhombic",
    category: "SULFOSALTS",
    type: "mineral",
  },
  {
    id: "M-SFS-002",
    mineral_code: "M-SFS-002",
    mineral_name: "Tetrahedrite",
    chemical_formula: "(Cu,Fe)₁₂Sb₄S₁₃",
    mineral_group: "Sulfosalt",
    color: "Black to gray",
    streak: "Black",
    luster: "Metallic",
    hardness: "3-4",
    cleavage: "None",
    fracture: "Uneven",
    habit: "Tetrahedral, massive",
    crystal_system: "Cubic",
    category: "SULFOSALTS",
    type: "mineral",
  },
];

const mockGetMinerals = (category: string): Promise<IMineral[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (category === "ALL") {
        resolve(mockMinerals);
      } else {
        const filtered = mockMinerals.filter(
          (mineral) => mineral.category === category
        );
        resolve(filtered);
      }
    }, 500);
  });
};

const mockAddMineral = (
  mineralData: Omit<IMineral, "id">
): Promise<IMineral> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const newMineral = {
        ...mineralData,
        id: `M-${Math.random().toString(36).substr(2, 9)}`,
      };
      mockMinerals.push(newMineral);
      resolve(newMineral);
    }, 500);
  });
};

// Paginated fetch for minerals
export const fetchMinerals = async (
  category: string,
  page: number = 1,
  pageSize: number = 10
): Promise<{
  data: IMineral[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}> => {
  try {
    console.log("🔍 Fetching minerals with pagination...");
    console.log("🔗 API URL:", `${API_URL}/minerals`);
    console.log("📄 Pagination:", { page, pageSize });

    // Normalize category name if it's Borate/Borates or Carbonate/Carbonates
    let normalizedCategory = category;

    if (category) {
      // First trim any whitespace
      const trimmedCategory = category.trim();
      const categoryUpper = trimmedCategory.toUpperCase();

      if (categoryUpper === "BORATE" || categoryUpper === "BORATES") {
        console.log(`Normalizing category from ${category} to Borate`);
        normalizedCategory = "Borate";
      } else if (
        categoryUpper === "CARBONATE" ||
        categoryUpper === "CARBONATES"
      ) {
        console.log(`Normalizing category from ${category} to Carbonate`);
        normalizedCategory = "Carbonate";
      } else {
        // For other categories, just use the trimmed version
        normalizedCategory = trimmedCategory;
      }
    }

    // Build query parameters
    let params = new URLSearchParams();

    // Add category if provided
    if (normalizedCategory && normalizedCategory !== "ALL") {
      params.append("category", normalizedCategory);
      console.log(
        "🔍 Using normalized category for filtering:",
        normalizedCategory
      );
    }

    // Add pagination parameters
    params.append("page", page.toString());
    params.append("pageSize", pageSize.toString());

    // Construct URL with query parameters
    const url = `${API_URL}/minerals?${params.toString()}`;
    console.log("🔗 Full URL:", url);

    const response = await axios.get(url);

    if (!response.data || !response.data.data) {
      return {
        data: [],
        pagination: { total: 0, page, pageSize, totalPages: 0 },
      };
    }
    const minerals = response.data.data || [];
    const pagination = response.data.pagination || {
      total: minerals.length,
      page,
      pageSize,
      totalPages: Math.ceil(minerals.length / pageSize),
    };
    return { data: minerals, pagination };
  } catch (error) {
    console.error("Error fetching minerals:", error);
    throw new Error("Failed to fetch minerals from the database");
  }
};
