import { supabase } from "@/lib/supabase";
import type { IMineral } from "../mineral.interface";
import { toast } from "sonner";

// Direct Supabase service for minerals - bypasses backend completely
export class MineralsSupabaseService {
  // Get all minerals by category
  static async getMinerals(category?: string): Promise<IMineral[]> {
    try {
      console.log("🔍 Fetching minerals directly from Supabase...");

      let query = supabase.from("minerals").select("*");

      // Add category filter if provided and not ALL
      if (category && category !== "ALL" && category.trim() !== "") {
        const normalizedCategory = this.normalizeCategory(category);
        query = query.eq("category", normalizedCategory);
        console.log(`🔍 Filtering by category: ${normalizedCategory}`);
      }

      const { data, error } = await query.order("name", { ascending: true });

      if (error) {
        console.error("❌ Error fetching minerals:", error);
        toast.error(`Failed to fetch minerals: ${error.message}`);
        throw error;
      }

      console.log(`✅ Successfully fetched ${data?.length || 0} minerals`);
      return data || [];
    } catch (error) {
      console.error("❌ Error in getMinerals:", error);
      toast.error("Failed to fetch minerals");
      throw error;
    }
  }

  // Get minerals with pagination
  static async getMineralsWithPagination(
    page: number = 1,
    pageSize: number = 10,
    category?: string,
    searchTerm?: string
  ): Promise<{ data: IMineral[]; total: number; totalPages: number }> {
    try {
      console.log("🔍 Fetching minerals with pagination from Supabase...");
      console.log("📄 Pagination:", { page, pageSize, category, searchTerm });

      let query = supabase.from("minerals").select("*", { count: "exact" });

      // Add category filter
      if (category && category !== "ALL" && category.trim() !== "") {
        const normalizedCategory = this.normalizeCategory(category);
        query = query.eq("category", normalizedCategory);
      }

      // Add search filter
      if (searchTerm && searchTerm.trim() !== "") {
        query = query.or(
          `name.ilike.%${searchTerm}%,formula.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`
        );
      }

      // Add pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to).order("name", { ascending: true });

      const { data, error, count } = await query;

      if (error) {
        console.error("❌ Error fetching minerals with pagination:", error);
        toast.error(`Failed to fetch minerals: ${error.message}`);
        throw error;
      }

      const total = count || 0;
      const totalPages = Math.ceil(total / pageSize);

      console.log(
        `✅ Successfully fetched ${
          data?.length || 0
        } minerals (page ${page}/${totalPages})`
      );

      return {
        data: data || [],
        total,
        totalPages,
      };
    } catch (error) {
      console.error("❌ Error in getMineralsWithPagination:", error);
      toast.error("Failed to fetch minerals");
      throw error;
    }
  }

  // Create a new mineral
  static async createMineral(
    mineralData: Omit<IMineral, "id" | "created_at" | "updated_at">
  ): Promise<IMineral> {
    try {
      console.log("➕ Creating new mineral in Supabase...", mineralData);

      const { data, error } = await supabase
        .from("minerals")
        .insert([mineralData])
        .select()
        .single();

      if (error) {
        console.error("❌ Error creating mineral:", error);
        toast.error(`Failed to create mineral: ${error.message}`);
        throw error;
      }

      console.log("✅ Successfully created mineral:", data);
      toast.success("Mineral created successfully!");
      return data;
    } catch (error) {
      console.error("❌ Error in createMineral:", error);
      toast.error("Failed to create mineral");
      throw error;
    }
  }

  // Update an existing mineral
  static async updateMineral(
    id: string,
    mineralData: Partial<IMineral>
  ): Promise<IMineral> {
    try {
      console.log("✏️ Updating mineral in Supabase...", { id, mineralData });

      const { data, error } = await supabase
        .from("minerals")
        .update(mineralData)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error("❌ Error updating mineral:", error);
        toast.error(`Failed to update mineral: ${error.message}`);
        throw error;
      }

      console.log("✅ Successfully updated mineral:", data);
      toast.success("Mineral updated successfully!");
      return data;
    } catch (error) {
      console.error("❌ Error in updateMineral:", error);
      toast.error("Failed to update mineral");
      throw error;
    }
  }

  // Delete a mineral
  static async deleteMineral(id: string): Promise<void> {
    try {
      console.log("🗑️ Deleting mineral from Supabase...", id);

      const { error } = await supabase.from("minerals").delete().eq("id", id);

      if (error) {
        console.error("❌ Error deleting mineral:", error);
        toast.error(`Failed to delete mineral: ${error.message}`);
        throw error;
      }

      console.log("✅ Successfully deleted mineral");
      toast.success("Mineral deleted successfully!");
    } catch (error) {
      console.error("❌ Error in deleteMineral:", error);
      toast.error("Failed to delete mineral");
      throw error;
    }
  }

  // Get mineral by ID
  static async getMineralById(id: string): Promise<IMineral | null> {
    try {
      console.log("🔍 Fetching mineral by ID from Supabase...", id);

      const { data, error } = await supabase
        .from("minerals")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          console.log("ℹ️ Mineral not found");
          return null;
        }
        console.error("❌ Error fetching mineral by ID:", error);
        throw error;
      }

      console.log("✅ Successfully fetched mineral:", data);
      return data;
    } catch (error) {
      console.error("❌ Error in getMineralById:", error);
      toast.error("Failed to fetch mineral");
      throw error;
    }
  }

  // Get unique categories
  static async getCategories(): Promise<string[]> {
    try {
      console.log("🔍 Fetching mineral categories from Supabase...");

      const { data, error } = await supabase
        .from("minerals")
        .select("category")
        .not("category", "is", null);

      if (error) {
        console.error("❌ Error fetching categories:", error);
        throw error;
      }

      // Extract unique categories
      const categories = [
        ...new Set(data?.map((item) => item.category).filter(Boolean)),
      ] as string[];
      console.log("✅ Successfully fetched categories:", categories);

      return categories.sort();
    } catch (error) {
      console.error("❌ Error in getCategories:", error);
      toast.error("Failed to fetch categories");
      return [];
    }
  }

  // Helper method to normalize category names
  private static normalizeCategory(category: string): string {
    const trimmed = category.trim();
    const upper = trimmed.toUpperCase();

    // Handle common variations
    if (upper === "BORATE" || upper === "BORATES") {
      return "Borate";
    }
    if (upper === "CARBONATE" || upper === "CARBONATES") {
      return "Carbonate";
    }
    if (upper === "SILICATE" || upper === "SILICATES") {
      return "Silicate";
    }
    if (upper === "OXIDE" || upper === "OXIDES") {
      return "Oxide";
    }
    if (upper === "SULFIDE" || upper === "SULFIDES") {
      return "Sulfide";
    }
    if (upper === "HALIDE" || upper === "HALIDES") {
      return "Halide";
    }
    if (upper === "PHOSPHATE" || upper === "PHOSPHATES") {
      return "Phosphate";
    }
    if (upper === "SULFATE" || upper === "SULFATES") {
      return "Sulfate";
    }

    // Return as-is for other categories
    return trimmed;
  }

  // Bulk import minerals (for Excel import functionality)
  static async bulkImportMinerals(
    minerals: Omit<IMineral, "id" | "created_at" | "updated_at">[]
  ): Promise<IMineral[]> {
    try {
      console.log(
        `📥 Bulk importing ${minerals.length} minerals to Supabase...`
      );

      const { data, error } = await supabase
        .from("minerals")
        .insert(minerals)
        .select();

      if (error) {
        console.error("❌ Error bulk importing minerals:", error);
        toast.error(`Failed to import minerals: ${error.message}`);
        throw error;
      }

      console.log(`✅ Successfully imported ${data?.length || 0} minerals`);
      toast.success(`Successfully imported ${data?.length || 0} minerals!`);
      return data || [];
    } catch (error) {
      console.error("❌ Error in bulkImportMinerals:", error);
      toast.error("Failed to import minerals");
      throw error;
    }
  }
}
