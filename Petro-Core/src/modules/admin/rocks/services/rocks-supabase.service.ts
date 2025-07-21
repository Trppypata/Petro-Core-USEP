import { supabase } from "@/lib/supabase";
import type { IRock } from "../rock.interface";
import { toast } from "sonner";

// Direct Supabase service for rocks - bypasses backend completely
export class RocksSupabaseService {
  // Get all rocks by category
  static async getRocks(category?: string): Promise<IRock[]> {
    try {
      console.log("🔍 Fetching rocks directly from Supabase...");

      let query = supabase.from("rocks").select("*");

      // Add category filter if provided and not ALL
      if (category && category !== "ALL" && category.trim() !== "") {
        query = query.eq("category", category.trim());
        console.log(`🔍 Filtering by category: ${category}`);
      }

      const { data, error } = await query.order("name", { ascending: true });

      if (error) {
        console.error("❌ Error fetching rocks:", error);
        toast.error(`Failed to fetch rocks: ${error.message}`);
        throw error;
      }

      console.log(`✅ Successfully fetched ${data?.length || 0} rocks`);
      return data || [];
    } catch (error) {
      console.error("❌ Error in getRocks:", error);
      toast.error("Failed to fetch rocks");
      throw error;
    }
  }

  // Get rocks with pagination
  static async getRocksWithPagination(
    page: number = 1,
    pageSize: number = 10,
    category?: string,
    searchTerm?: string
  ): Promise<{ data: IRock[]; total: number; totalPages: number }> {
    try {
      console.log("🔍 Fetching rocks with pagination from Supabase...");
      console.log("📄 Pagination:", { page, pageSize, category, searchTerm });

      let query = supabase.from("rocks").select("*", { count: "exact" });

      // Add category filter
      if (category && category !== "ALL" && category.trim() !== "") {
        query = query.eq("category", category.trim());
      }

      // Add search filter
      if (searchTerm && searchTerm.trim() !== "") {
        query = query.or(
          `name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,formation.ilike.%${searchTerm}%`
        );
      }

      // Add pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to).order("name", { ascending: true });

      const { data, error, count } = await query;

      if (error) {
        console.error("❌ Error fetching rocks with pagination:", error);
        toast.error(`Failed to fetch rocks: ${error.message}`);
        throw error;
      }

      const total = count || 0;
      const totalPages = Math.ceil(total / pageSize);

      console.log(
        `✅ Successfully fetched ${
          data?.length || 0
        } rocks (page ${page}/${totalPages})`
      );

      return {
        data: data || [],
        total,
        totalPages,
      };
    } catch (error) {
      console.error("❌ Error in getRocksWithPagination:", error);
      toast.error("Failed to fetch rocks");
      throw error;
    }
  }

  // Create a new rock
  static async createRock(
    rockData: Omit<IRock, "id" | "created_at" | "updated_at">
  ): Promise<IRock> {
    try {
      console.log("➕ Creating new rock in Supabase...", rockData);

      const { data, error } = await supabase
        .from("rocks")
        .insert([rockData])
        .select()
        .single();

      if (error) {
        console.error("❌ Error creating rock:", error);
        toast.error(`Failed to create rock: ${error.message}`);
        throw error;
      }

      console.log("✅ Successfully created rock:", data);
      toast.success("Rock created successfully!");
      return data;
    } catch (error) {
      console.error("❌ Error in createRock:", error);
      toast.error("Failed to create rock");
      throw error;
    }
  }

  // Update an existing rock
  static async updateRock(
    id: string,
    rockData: Partial<IRock>
  ): Promise<IRock> {
    try {
      console.log("✏️ Updating rock in Supabase...", { id, rockData });

      const { data, error } = await supabase
        .from("rocks")
        .update(rockData)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error("❌ Error updating rock:", error);
        toast.error(`Failed to update rock: ${error.message}`);
        throw error;
      }

      console.log("✅ Successfully updated rock:", data);
      toast.success("Rock updated successfully!");
      return data;
    } catch (error) {
      console.error("❌ Error in updateRock:", error);
      toast.error("Failed to update rock");
      throw error;
    }
  }

  // Delete a rock
  static async deleteRock(id: string): Promise<void> {
    try {
      console.log("🗑️ Deleting rock from Supabase...", id);

      const { error } = await supabase.from("rocks").delete().eq("id", id);

      if (error) {
        console.error("❌ Error deleting rock:", error);
        toast.error(`Failed to delete rock: ${error.message}`);
        throw error;
      }

      console.log("✅ Successfully deleted rock");
      toast.success("Rock deleted successfully!");
    } catch (error) {
      console.error("❌ Error in deleteRock:", error);
      toast.error("Failed to delete rock");
      throw error;
    }
  }

  // Get rock by ID
  static async getRockById(id: string): Promise<IRock | null> {
    try {
      console.log("🔍 Fetching rock by ID from Supabase...", id);

      const { data, error } = await supabase
        .from("rocks")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          console.log("ℹ️ Rock not found");
          return null;
        }
        console.error("❌ Error fetching rock by ID:", error);
        throw error;
      }

      console.log("✅ Successfully fetched rock:", data);
      return data;
    } catch (error) {
      console.error("❌ Error in getRockById:", error);
      toast.error("Failed to fetch rock");
      throw error;
    }
  }

  // Get unique categories
  static async getCategories(): Promise<string[]> {
    try {
      console.log("🔍 Fetching rock categories from Supabase...");

      const { data, error } = await supabase
        .from("rocks")
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

  // Bulk import rocks (for Excel import functionality)
  static async bulkImportRocks(
    rocks: Omit<IRock, "id" | "created_at" | "updated_at">[]
  ): Promise<IRock[]> {
    try {
      console.log(`📥 Bulk importing ${rocks.length} rocks to Supabase...`);

      const { data, error } = await supabase
        .from("rocks")
        .insert(rocks)
        .select();

      if (error) {
        console.error("❌ Error bulk importing rocks:", error);
        toast.error(`Failed to import rocks: ${error.message}`);
        throw error;
      }

      console.log(`✅ Successfully imported ${data?.length || 0} rocks`);
      toast.success(`Successfully imported ${data?.length || 0} rocks!`);
      return data || [];
    } catch (error) {
      console.error("❌ Error in bulkImportRocks:", error);
      toast.error("Failed to import rocks");
      throw error;
    }
  }
}
