import { Request, Response } from "express";
import { supabase } from "../config/supabase";
import * as XLSX from "xlsx";
import fs from "fs";
import path from "path";
import { IRock } from "../models/rock.model";

// Import rocks from Excel file
export const importRocksFromExcel = async (req: Request, res: Response) => {
  try {
    const excelFile = req.file;

    if (!excelFile) {
      return res.status(400).json({
        success: false,
        message: "No Excel file uploaded",
      });
    }

    console.log("Starting Excel import process");
    console.log(
      `File details: ${excelFile.originalname}, ${excelFile.size} bytes, ${excelFile.mimetype}`
    );

    // Process the uploaded Excel file
    const workbook = XLSX.read(excelFile.buffer, { type: "buffer" });
    const rocks: IRock[] = [];
    const sheetCounts: Record<
      string,
      { total: number; processed: number; skipped: number }
    > = {};

    console.log("Excel file contains the following sheets:");
    console.log(workbook.SheetNames);
    console.log(`Total sheets: ${workbook.SheetNames.length}`);

    // Process each sheet
    workbook.SheetNames.forEach((sheetName) => {
      // Skip only special sheets, be more permissive with sheet names
      if (sheetName.startsWith("_")) {
        console.log(`Skipping special sheet: ${sheetName}`);
        return;
      }

      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      console.log(
        `Processing sheet: ${sheetName} with ${jsonData.length} entries`
      );
      sheetCounts[sheetName] = {
        total: jsonData.length,
        processed: 0,
        skipped: 0,
      };

      // Check if the first row exists and log its headers
      if (jsonData.length > 0) {
        console.log(
          `First row headers for ${sheetName}:`,
          Object.keys(jsonData[0] as object)
        );
      }

      // Track if this is a Sedimentary Special sheet which has different fields
      const isSedimentarySpecial = sheetName
        .toLowerCase()
        .includes("sedimentary special");

      jsonData.forEach((row: any, index: number) => {
        // More comprehensive name extraction
        let rockName =
          row["Rock Name"] ||
          row["Name"] ||
          row["Sample Name"] ||
          row["Rock"] ||
          row["Sample"] ||
          "";
        // Try to use Type of Commodity as name for Ore Samples
        const isOreSheet = sheetName.toLowerCase().includes("ore");
        if (isOreSheet && !rockName && row["Type of Commodity"]) {
          rockName = `${row["Type of Commodity"]} Ore Sample`;
        }

        // Enhanced type extraction
        let rockType =
          row["Type"] ||
          row["Rock Type"] ||
          row["Type of Commodity"] ||
          row["Commodity Type"] ||
          row["Ore Group"] ||
          "";

        // Generate default values for missing required fields
        if (!rockName) {
          rockName = `Unknown Rock ${index + 1} (${sheetName})`;
          console.log(
            `Generated default name for row ${index + 1} in sheet ${sheetName}`
          );
        }

        if (!rockType) {
          rockType = sheetName.includes("Igneous")
            ? "Igneous"
            : sheetName.includes("Sedimentary")
            ? "Sedimentary"
            : sheetName.includes("Metamorphic")
            ? "Metamorphic"
            : sheetName.includes("Ore")
            ? "Ore"
            : "Unknown";
          console.log(
            `Generated default type "${rockType}" for row ${
              index + 1
            } in sheet ${sheetName}`
          );
        }

        // Enhanced category detection - more flexible
        let category = sheetName;
        if (
          sheetName.toLowerCase().includes("igneous") ||
          sheetName.toLowerCase().includes("volcanic") ||
          sheetName.toLowerCase().includes("plutonic")
        ) {
          category = "Igneous";
        } else if (
          sheetName.toLowerCase().includes("sedimentary") ||
          sheetName.toLowerCase().includes("sediment")
        ) {
          category = "Sedimentary";
        } else if (
          sheetName.toLowerCase().includes("metamorphic") ||
          sheetName.toLowerCase().includes("metam")
        ) {
          category = "Metamorphic";
        } else if (
          sheetName.toLowerCase().includes("ore") ||
          rockName.toLowerCase().includes("ore") ||
          (row["Type of Commodity"] &&
            row["Type of Commodity"].toString().trim() !== "") ||
          (row["Ore Group"] && row["Ore Group"].toString().trim() !== "") ||
          (row["Type of Deposit"] &&
            row["Type of Deposit"].toString().trim() !== "") ||
          (row["Mining Company"] &&
            row["Mining Company"].toString().trim() !== "") ||
          (row["Mining Company/Donated by"] &&
            row["Mining Company/Donated by"].toString().trim() !== "")
        ) {
          category = "Ore Samples";
        }

        // Enhanced coordinates handling
        let coordinates = "";
        if (row["Coordinates"] && row["Coordinates"].toString().trim() !== "") {
          coordinates = row["Coordinates"].toString().trim();
        } else if (
          (row["Latitude"] || row["LAT"]) &&
          (row["Longitude"] || row["LONG"])
        ) {
          const lat = (row["Latitude"] || row["LAT"]).toString().trim();
          const long = (row["Longitude"] || row["LONG"]).toString().trim();
          coordinates = `${lat}, ${long}`;
        }

        // Generate rock code if not present
        let rockCode = row["Rock Code"] || "";
        if (!rockCode || rockCode.trim() === "") {
          // For ore samples, use O-XXXX format
          if (category === "Ore Samples") {
            rockCode = `O-${String(index + 1).padStart(4, "0")}`;
          } else {
            // For other rocks, use first letter of category + index
            rockCode = `${category.charAt(0)}-${String(index + 1).padStart(
              4,
              "0"
            )}`;
          }
        }

        // Create rock object with comprehensive field mappings
        const rock: IRock = {
          rock_code: rockCode,
          name: rockName,
          chemical_formula: row["Chemical Formula"] || row["Chemical"] || "",
          hardness: row["Hardness"] || "",
          category: category,
          type: rockType,
          depositional_environment:
            row["Depositional Environment"] || row["Depositional Env."] || "",
          grain_size: row["Grain Size"] || "",
          color: row["Color"] || row["Colour"] || row["Color "] || "",
          texture: row["Texture"] || "",
          latitude: row["Latitude"] || row["LAT"] || "",
          longitude: row["Longitude"] || row["LONG"] || "",
          coordinates: coordinates,
          locality: row["Locality"] || row["Location"] || "",
          mineral_composition: row["Mineral Composition"] || "",
          description: row["Description"] || row["Overall Description"] || "",
          formation: row["Formation"] || "",
          geological_age: row["Geological Age"] || row["Age"] || "",
          status: row["Status"] || "active",
          image_url: row["Image URL"] || "",

          // Add all potential fields for all categories with default values
          associated_minerals:
            row["Associated Minerals"] || row["Associated Minerals "] || "",
          metamorphism_type:
            row["Metamorphism Type"] ||
            row["Metamorphism"] ||
            row["Metamorpism"] ||
            "",
          metamorphic_grade: row["Metamorphic Grade"] || "",
          parent_rock: row["Parent Rock"] || "",
          foliation:
            row["Foliation"] || (category === "Metamorphic" ? "Present" : ""),
          foliation_type:
            row["Foliation Type"] ||
            (category === "Metamorphic" ? "Not specified" : ""),

          // Igneous specific
          silica_content: row["Silica Content"] || "",
          cooling_rate: row["Cooling Rate"] || "",
          mineral_content: row["Mineral Content"] || "",
          origin:
            row["Origin"] || (category === "Igneous" ? "Igneous origin" : ""),

          // Sedimentary specific
          bedding: row["Bedding"] || "",
          sorting: row["Sorting"] || row["Sorting "] || "",
          roundness: row["Roundness"] || "",
          fossil_content:
            row["Fossil Content"] || row["Fossils"] || row["Fossils "] || "",
          sediment_source: row["Sediment Source"] || "",

          // Ore samples specific
          commodity_type:
            row["Type of Commodity"] || row["Commodity Type"] || "",
          ore_group: row["Ore Group"] || row["Type of Deposit"] || "",
          mining_company:
            row["Mining Company"] ||
            row["Mining Company/Donated by"] ||
            (category === "Ore Samples" ? "Unspecified mining company" : ""),

          // Common additional fields
          luster: row["Luster"] || row["Luster "] || "",
          reaction_to_hcl:
            row["Reaction to HCl"] || row["Reaction to HCL"] || "",
          magnetism: row["Magnetism"] || row["Magnetism "] || "",
          streak: row["Streak"] || "",
          protolith:
            row["Protolith"] ||
            row["Parent Rock"] ||
            (category === "Metamorphic" ? "Unknown parent rock" : ""),
        };

        // Process category-specific fields and add any missing default values
        if (category === "Metamorphic") {
          // Ensure protolith has a value for metamorphic rocks
          if (!rock.protolith) {
            rock.protolith = rock.parent_rock || "Unknown parent rock";
          }
          // Ensure foliation has a value
          if (!rock.foliation) {
            rock.foliation = "Present";
          }
          // Ensure foliation_type has a value
          if (!rock.foliation_type) {
            rock.foliation_type = "Not specified";
          }
        } else if (category === "Igneous") {
          // Ensure origin has a value for igneous rocks
          if (!rock.origin) {
            rock.origin = "Igneous origin";
          }
        } else if (category === "Ore Samples") {
          // Ensure mining_company has a value for ore samples
          if (!rock.mining_company) {
            if (rock.locality) {
              rock.mining_company = `Mining operation at ${rock.locality}`;
            } else {
              rock.mining_company = "Unspecified mining company";
            }
          }
          // Ensure associated_minerals has a value for ore samples
          if (!rock.associated_minerals) {
            if (rock.mineral_composition) {
              rock.associated_minerals = rock.mineral_composition;
            } else if (rock.commodity_type) {
              rock.associated_minerals = `Minerals associated with ${rock.commodity_type}`;
            } else {
              rock.associated_minerals = "Various ore minerals";
            }
          }
        }

        rocks.push(rock);
        sheetCounts[sheetName].processed++;
      });
    });

    // Log summary before inserting
    console.log(`Total rocks found in Excel: ${rocks.length}`);
    console.log("Sheet counts:", sheetCounts);

    // Use RPC function to bypass RLS if available
    try {
      console.log("Attempting to use RPC function for import...");
      const { data, error } = await supabase.rpc("import_rocks", {
        rocks_data: rocks,
      });

      if (!error) {
        console.log("RPC function result:", data);

        // Check if there were any successful inserts
        if (data.inserted > 0 || data.updated > 0) {
          return res.status(201).json({
            success: true,
            message: `Successfully imported ${data.inserted} rocks (${data.updated} updated) using RPC`,
            counts: sheetCounts,
            data,
          });
        } else if (data.errors > 0) {
          console.warn(
            `RPC function encountered ${data.errors} errors. Error details:`,
            data.error_details
          );
          console.log("Falling back to direct insert...");
        }
      } else {
        console.error("RPC method failed, error:", error);
        console.log("Falling back to direct insert...");
      }
    } catch (rpcError) {
      console.error("RPC not available or errored:", rpcError);
      console.log("Using direct insert with auth...");
    }

    // Insert the rocks into the database
    if (rocks.length > 0) {
      console.log(`Attempting to insert ${rocks.length} rocks...`);

      // Insert rocks in batches
      try {
        const BATCH_SIZE = 50; // Reduce batch size to avoid issues
        let successCount = 0;
        let errorCount = 0;
        let errorDetails = [];

        for (let i = 0; i < rocks.length; i += BATCH_SIZE) {
          const batch = rocks.slice(i, i + BATCH_SIZE);
          console.log(
            `Importing batch ${Math.floor(i / BATCH_SIZE) + 1} of ${Math.ceil(
              rocks.length / BATCH_SIZE
            )}...`
          );

          try {
            const { data, error } = await supabase.from("rocks").upsert(batch, {
              onConflict: "rock_code",
              ignoreDuplicates: false,
            });

            if (error) {
              console.error("Error inserting rocks batch:", error);
              errorCount += batch.length;
              errorDetails.push({
                batchStart: i,
                batchEnd: i + batch.length - 1,
                error: error.message,
              });

              // Instead of failing the entire import, log the error and continue
              console.log(
                `Skipping batch ${Math.floor(i / BATCH_SIZE) + 1} due to error`
              );
            } else {
              successCount += batch.length;
              console.log(
                `Successfully imported ${successCount} of ${rocks.length} rocks so far`
              );
            }
          } catch (batchError: any) {
            console.error(
              `Error processing batch ${Math.floor(i / BATCH_SIZE) + 1}:`,
              batchError
            );
            errorCount += batch.length;
            errorDetails.push({
              batchStart: i,
              batchEnd: i + batch.length - 1,
              error: batchError.message,
            });
          }

          // Add a small delay between batches to avoid overwhelming the database
          await new Promise((resolve) => setTimeout(resolve, 300));
        }

        // Even if some batches failed, return success with details
        return res.status(201).json({
          success: successCount > 0,
          message: `Processed ${rocks.length} rocks: ${successCount} successful, ${errorCount} failed`,
          counts: sheetCounts,
          totalFound: rocks.length,
          successCount,
          errorCount,
          errorDetails: errorDetails.length > 0 ? errorDetails : undefined,
        });
      } catch (error: any) {
        console.error("Import rocks error:", error);
        return res.status(500).json({
          success: false,
          message: error.message || "Internal server error",
          details: error,
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        message: "No valid rocks found in the Excel file",
      });
    }
  } catch (error: any) {
    console.error("Import rocks from Excel error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

// Fetch all rocks
export const getAllRocks = async (req: Request, res: Response) => {
  try {
    // Get the category and pagination parameters from query parameters
    const { category, page = "1", pageSize = "10" } = req.query;
    const pageNum = parseInt(page as string, 10);
    const pageSizeNum = parseInt(pageSize as string, 10);

    console.log("Fetching rocks with category filter:", category);
    console.log("Pagination parameters:", {
      page: pageNum,
      pageSize: pageSizeNum,
    });

    // Build the query for count
    let countQuery = supabase.from("rocks").select("id", { count: "exact" });

    // Apply category filter to count if provided
    if (category && category !== "ALL") {
      countQuery = countQuery.ilike("category", `%${category}%`);
    }

    // Get total count
    const { count, error: countError } = await countQuery;

    if (countError) {
      console.error("Error counting rocks:", countError);
      return res.status(400).json({
        success: false,
        message: countError.message,
      });
    }

    // Build the query for data
    let query = supabase.from("rocks").select("*");

    // Apply category filter if provided
    if (category && category !== "ALL") {
      // Use ilike for case-insensitive matching to prevent issues with casing
      query = query.ilike("category", `%${category}%`);
      console.log(
        `Filtering rocks by category: ${category} (case-insensitive)`
      );
    }

    // Apply pagination
    const from = (pageNum - 1) * pageSizeNum;
    const to = from + pageSizeNum - 1;

    // Execute the query with ordering and pagination
    const { data, error } = await query
      .order("name", { ascending: true })
      .range(from, to);

    if (error) {
      console.error("Error fetching rocks:", error);
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    // Log some information about the results
    if (data && data.length > 0) {
      const categories = [...new Set(data.map((rock) => rock.category))];
      console.log(
        `Found ${data.length} rocks with ${
          categories.length
        } categories (page ${pageNum} of ${Math.ceil(
          (count || 0) / pageSizeNum
        )})`
      );
      console.log("Categories:", categories);

      // Count rocks per category in this page
      const categoryCounts = categories.reduce((acc, category) => {
        acc[category] = data.filter(
          (rock) => rock.category === category
        ).length;
        return acc;
      }, {});
      console.log("Rocks per category on this page:", categoryCounts);
    } else {
      console.log("No rocks found with the provided criteria");
    }

    // If we're filtering by Ore Samples but found none, check for case variations
    if (category === "Ore Samples" && (!data || data.length === 0)) {
      console.log("No Ore Samples found, checking for case variations...");
      const { data: altData, error: altError } = await supabase
        .from("rocks")
        .select("*")
        .or("category.ilike.%ore samples%,category.ilike.%Ore Samples%")
        .order("name", { ascending: true })
        .range(from, to);

      if (!altError && altData && altData.length > 0) {
        console.log(
          `Found ${altData.length} rocks with case-insensitive Ore Samples search`
        );

        // Fix the category to ensure consistent casing
        const fixedData = altData.map((rock) => ({
          ...rock,
          category: "Ore Samples", // Ensure consistent casing
        }));

        return res.status(200).json({
          success: true,
          data: fixedData,
          pagination: {
            total: count || 0,
            page: pageNum,
            pageSize: pageSizeNum,
            totalPages: Math.ceil((count || 0) / pageSizeNum),
          },
        });
      }
    }

    return res.status(200).json({
      success: true,
      data,
      pagination: {
        total: count || 0,
        page: pageNum,
        pageSize: pageSizeNum,
        totalPages: Math.ceil((count || 0) / pageSizeNum),
      },
    });
  } catch (error) {
    console.error("Fetch rocks error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Add a new rock
export const addRock = async (req: Request, res: Response) => {
  try {
    const rockData: IRock = req.body;

    if (!rockData.name || !rockData.category) {
      return res.status(400).json({
        success: false,
        message: "Rock name and category are required",
      });
    }

    // Generate rock code if not provided
    if (!rockData.rock_code) {
      const { data: existingRocks } = await supabase
        .from("rocks")
        .select("rock_code")
        .eq("category", rockData.category);

      const count = (existingRocks?.length || 0) + 1;
      const prefix =
        rockData.category === "Ore Samples" ? "O" : rockData.category.charAt(0);
      rockData.rock_code = `${prefix}-${String(count).padStart(4, "0")}`;
    }

    console.log("rockData", rockData);

    const { data, error } = await supabase
      .from("rocks")
      .insert(rockData)
      .select()
      .single();

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(201).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Add rock error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Update a rock
export const updateRock = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const rockData: Partial<IRock> = req.body;

    console.log("⭐ Update rock request received for id:", id);
    console.log("⭐ Original rock data:", JSON.stringify(rockData, null, 2));

    // EXPLICITLY REMOVE PROBLEMATIC FIELDS - this is critical
    // Create a new object WITHOUT these fields to ensure they don't cause schema errors
    // Using 'as any' to avoid TypeScript errors for fields not in the interface
    const { ...safeRockData } = rockData;

    // Explicitly delete problematic fields that aren't in the IRock interface
    delete (safeRockData as any).user;
    delete (safeRockData as any).user_id;
    delete (safeRockData as any).user_metadata;
    // Note: origin field is needed and should not be deleted

    // Also filter out any undefined or null values
    const cleanedData = Object.fromEntries(
      Object.entries(safeRockData).filter(
        ([_, v]) => v !== null && v !== undefined
      )
    );

    console.log(
      "🧹 CLEANED rock data for update:",
      JSON.stringify(cleanedData, null, 2)
    );

    try {
      // Check if the rock exists first
      const { data: existingRock, error: findError } = await supabase
        .from("rocks")
        .select("*")
        .eq("id", id)
        .single();

      if (findError) {
        console.error("❌ Error finding rock:", findError);
        return res.status(404).json({
          success: false,
          message: `Rock with ID ${id} not found`,
        });
      }

      console.log("✅ Found rock:", existingRock.name);
      console.log("📊 Database columns:", Object.keys(existingRock));

      // Update the rock with our cleaned data
      const { data, error } = await supabase
        .from("rocks")
        .update(cleanedData)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error("❌ Error updating rock in database:", error);
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      return res.status(200).json({
        success: true,
        data,
      });
    } catch (dbError) {
      console.error("❌ Database error:", dbError);
      return res.status(400).json({
        success: false,
        message: "Database error",
      });
    }
  } catch (error) {
    console.error("❌ Error in updateRock controller:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Delete a rock
export const deleteRock = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { error } = await supabase.from("rocks").delete().eq("id", id);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Rock deleted successfully",
    });
  } catch (error) {
    console.error("Delete rock error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get rock statistics
export const getRockStats = async (_req: Request, res: Response) => {
  try {
    // Get total count of rocks
    const { count: totalCount, error: countError } = await supabase
      .from("rocks")
      .select("*", { count: "exact", head: true });

    if (countError) {
      console.error("Error getting rock count:", countError);
      return res.status(400).json({
        success: false,
        message: countError.message,
      });
    }

    // Get counts by category
    const { data: categoryData, error: categoryError } = await supabase
      .from("rocks")
      .select("category");

    if (categoryError) {
      console.error("Error getting rock categories:", categoryError);
      return res.status(400).json({
        success: false,
        message: categoryError.message,
      });
    }

    // Calculate category counts
    const categoryCounts = categoryData.reduce(
      (acc: Record<string, number>, item) => {
        const category = item.category || "Unknown";
        acc[category] = (acc[category] || 0) + 1;
        return acc;
      },
      {}
    );

    // Get sample rocks from each category for verification
    const categories = Object.keys(categoryCounts);
    const samples: Record<string, any[]> = {};

    for (const category of categories) {
      const { data: sampleData, error: sampleError } = await supabase
        .from("rocks")
        .select("*")
        .eq("category", category)
        .limit(3);

      if (!sampleError && sampleData) {
        samples[category] = sampleData;
      }
    }

    return res.status(200).json({
      success: true,
      stats: {
        totalCount,
        categoryCounts,
        samples,
      },
    });
  } catch (error) {
    console.error("Get rock stats error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Import default rocks from the server's excel file
export const importDefaultRocks = async (_req: Request, res: Response) => {
  try {
    const excelPath = path.join(__dirname, "../../src/excel/Database.xlsx");

    if (!fs.existsSync(excelPath)) {
      return res.status(404).json({
        success: false,
        message: "Default rocks Excel file not found at: " + excelPath,
      });
    }

    console.log(`Reading default rocks file from: ${excelPath}`);

    // Read the Excel file
    const workbook = XLSX.read(fs.readFileSync(excelPath), { type: "buffer" });
    const rocks: IRock[] = [];
    const sheetCounts: Record<
      string,
      { total: number; processed: number; skipped: number }
    > = {};

    console.log("Excel file contains the following sheets:");
    console.log(workbook.SheetNames);
    console.log(`Total sheets: ${workbook.SheetNames.length}`);

    // Process each sheet (reusing the same logic as in importRocksFromExcel)
    workbook.SheetNames.forEach((sheetName) => {
      // Skip only special sheets
      if (sheetName.startsWith("_")) {
        console.log(`Skipping special sheet: ${sheetName}`);
        return;
      }

      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      console.log(
        `Processing sheet: ${sheetName} with ${jsonData.length} entries`
      );
      sheetCounts[sheetName] = {
        total: jsonData.length,
        processed: 0,
        skipped: 0,
      };

      if (jsonData.length > 0) {
        console.log(
          `First row headers for ${sheetName}:`,
          Object.keys(jsonData[0] as object)
        );
      }

      jsonData.forEach((row: any, index: number) => {
        // More comprehensive name extraction
        const rockName =
          row["Rock Name"] ||
          row["Name"] ||
          row["Sample Name"] ||
          row["Rock"] ||
          row["Sample"] ||
          "";

        if (!rockName) {
          console.log(
            `Skipping row ${
              index + 1
            } in sheet ${sheetName} - no rock name found`
          );
          sheetCounts[sheetName].skipped++;
          return;
        }

        // Category detection
        let category = sheetName;
        if (
          sheetName.toLowerCase().includes("igneous") ||
          sheetName.toLowerCase().includes("volcanic") ||
          sheetName.toLowerCase().includes("plutonic")
        ) {
          category = "Igneous";
        } else if (
          sheetName.toLowerCase().includes("sedimentary") ||
          sheetName.toLowerCase().includes("sediment")
        ) {
          category = "Sedimentary";
        } else if (
          sheetName.toLowerCase().includes("metamorphic") ||
          sheetName.toLowerCase().includes("metam")
        ) {
          category = "Metamorphic";
        } else if (
          sheetName.toLowerCase().includes("ore") ||
          sheetName.toLowerCase().includes("mineral") ||
          sheetName.toLowerCase().includes("economic") ||
          sheetName.toLowerCase().includes("metal") ||
          sheetName.toLowerCase().includes("mining") ||
          sheetName.toLowerCase().includes("deposit") ||
          rockName.toLowerCase().includes("ore") ||
          (row["Commodity Type"] &&
            row["Commodity Type"].toString().trim() !== "") ||
          (row["Type of Commodity"] &&
            row["Type of Commodity"].toString().trim() !== "") ||
          (row["Ore Group"] && row["Ore Group"].toString().trim() !== "") ||
          (row["Type of Deposit"] &&
            row["Type of Deposit"].toString().trim() !== "") ||
          (row["Mining Company"] &&
            row["Mining Company"].toString().trim() !== "") ||
          (row["Mining Company/Donated by"] &&
            row["Mining Company/Donated by"].toString().trim() !== "") ||
          (row["Mining Company/Donated by:"] &&
            row["Mining Company/Donated by:"].toString().trim() !== "")
        ) {
          category = "Ore Samples";
          console.log(
            `Identified Ore Sample in sheet ${sheetName}, row ${
              index + 1
            }, name: ${rockName}`
          );
        }

        // Enhanced coordinates handling
        let coordinates = "";
        // First check if coordinates are already in the data
        if (row["Coordinates"] && row["Coordinates"].toString().trim() !== "") {
          coordinates = row["Coordinates"].toString().trim();
          console.log(
            `Using explicit coordinates from data: ${coordinates} for rock ${rockName}`
          );
        }
        // Then try to build from latitude and longitude
        else if (
          row["Latitude"] &&
          row["Longitude"] &&
          row["Latitude"].toString().trim() !== "" &&
          row["Longitude"].toString().trim() !== ""
        ) {
          coordinates = `${row["Latitude"].toString().trim()}, ${row[
            "Longitude"
          ]
            .toString()
            .trim()}`;
          console.log(
            `Generated coordinates from lat/long: ${coordinates} for rock ${rockName}`
          );
        }

        const rock: IRock = {
          rock_code: "",
          name: rockName,
          chemical_formula: row["Chemical Formula"] || "",
          hardness: row["Hardness"] || "",
          category: category,
          type: row["Type"] || row["Rock Type"] || "",
          depositional_environment: row["Depositional Environment"] || "",
          grain_size: row["Grain Size"] || "",
          color: row["Color"] || row["Colour"] || "",
          texture: row["Texture"] || "",
          latitude: row["Latitude"] || "",
          longitude: row["Longitude"] || "",
          coordinates: coordinates,
          locality: row["Locality"] || row["Location"] || "",
          mineral_composition:
            row["Mineral Composition"] ||
            row["Associated Minerals"] ||
            row["Associated Minerals "] ||
            "",
          description: row["Description"] || row["Overall Description"] || "",
          formation: row["Formation"] || "",
          geological_age: row["Geological Age"] || row["Age"] || "",
          status: row["Status"] || "active",
          image_url: row["Image URL"] || "",
          // Metamorphic rock specific fields
          associated_minerals:
            row["Associated Minerals"] || row["Associated Minerals "] || "",
          metamorphism_type:
            row["Metamorphism Type"] || row["Metamorphism"] || "",
          metamorphic_grade: row["Metamorphic Grade"] || "",
          parent_rock: row["Parent Rock"] || "",
          foliation: row["Foliation"] || "",
          foliation_type: row["Foliation Type"] || "",
          // Igneous rock specific fields
          silica_content: row["Silica Content"] || "",
          cooling_rate: row["Cooling Rate"] || "",
          mineral_content: row["Mineral Content"] || "",
          origin: row["Origin"] || "",
          // Sedimentary rock specific fields
          bedding: row["Bedding"] || "",
          sorting: row["Sorting"] || "",
          roundness: row["Roundness"] || "",
          fossil_content:
            row["Fossil Content"] || row["Fossils"] || row["Fossils "] || "",
          sediment_source: row["Sediment Source"] || "",
          // Ore samples specific fields
          commodity_type:
            row["Commodity Type"] ||
            row["Type of Commodity"] ||
            row["Metal"] ||
            row["Mineral"] ||
            row["Type"] ||
            "",
          ore_group:
            row["Ore Group"] ||
            row["Type of Deposit"] ||
            row["Deposit Type"] ||
            "",
          mining_company:
            row["Mining Company"] ||
            row["Mining Company/Donated by"] ||
            row["Mining Company/Donated by:"] ||
            row["Source"] ||
            "",
          // Additional fields
          luster: row["Luster"] || row["Luster "] || "",
          reaction_to_hcl:
            row["Reaction to HCl"] || row["Reaction to HCL"] || "",
          magnetism: row["Magnetism"] || row["Magnetism "] || "",
          streak: row["Streak"] || row["Streak "] || "",
          protolith: row["Protolith"] || row["Parent Rock"] || "",
        };

        // Ensure all rocks have a rock_code
        if (!rock.rock_code || rock.rock_code.trim() === "") {
          // For ore samples, use O-XXXX format
          if (category === "Ore Samples") {
            rock.rock_code = `O-${String(index + 1).padStart(4, "0")}`;
          } else {
            // For other rocks, use first letter of category + index
            rock.rock_code = `${category.charAt(0)}-${String(
              index + 1
            ).padStart(4, "0")}`;
          }
          console.log(`Generated rock code ${rock.rock_code} for ${rockName}`);
        }

        // Ensure ore samples always have an O- code
        if (category === "Ore Samples") {
          if (
            !rock.rock_code ||
            rock.rock_code.trim() === "" ||
            !rock.rock_code.startsWith("O-")
          ) {
            rock.rock_code = `O-${String(index + 1).padStart(4, "0")}`;
          }

          console.log(
            `Processing Ore Sample: ${rock.name}, Code: ${rock.rock_code}, Type: ${rock.commodity_type}`
          );
        }

        rocks.push(rock);
        sheetCounts[sheetName].processed++;
      });
    });

    console.log(`Total rocks found in Excel: ${rocks.length}`);
    console.log("Sheet counts:", sheetCounts);

    // Insert the rocks
    if (rocks.length > 0) {
      console.log(`Attempting to insert ${rocks.length} rocks...`);

      // Insert rocks in batches
      try {
        const BATCH_SIZE = 50; // Reduce batch size to avoid issues
        let successCount = 0;
        let errorCount = 0;
        let errorDetails = [];

        for (let i = 0; i < rocks.length; i += BATCH_SIZE) {
          const batch = rocks.slice(i, i + BATCH_SIZE);
          console.log(
            `Importing batch ${Math.floor(i / BATCH_SIZE) + 1} of ${Math.ceil(
              rocks.length / BATCH_SIZE
            )}...`
          );

          try {
            const { data, error } = await supabase.from("rocks").upsert(batch, {
              onConflict: "rock_code",
              ignoreDuplicates: false,
            });

            if (error) {
              console.error("Error inserting rocks batch:", error);
              errorCount += batch.length;
              errorDetails.push({
                batchStart: i,
                batchEnd: i + batch.length - 1,
                error: error.message,
              });

              // Instead of failing the entire import, log the error and continue
              console.log(
                `Skipping batch ${Math.floor(i / BATCH_SIZE) + 1} due to error`
              );
            } else {
              successCount += batch.length;
              console.log(
                `Successfully imported ${successCount} of ${rocks.length} rocks so far`
              );
            }
          } catch (batchError: any) {
            console.error(
              `Error processing batch ${Math.floor(i / BATCH_SIZE) + 1}:`,
              batchError
            );
            errorCount += batch.length;
            errorDetails.push({
              batchStart: i,
              batchEnd: i + batch.length - 1,
              error: batchError.message,
            });
          }

          // Add a small delay between batches to avoid overwhelming the database
          await new Promise((resolve) => setTimeout(resolve, 300));
        }

        // Even if some batches failed, return success with details
        return res.status(201).json({
          success: successCount > 0,
          message: `Processed ${rocks.length} rocks: ${successCount} successful, ${errorCount} failed`,
          counts: sheetCounts,
          totalFound: rocks.length,
          successCount,
          errorCount,
          errorDetails: errorDetails.length > 0 ? errorDetails : undefined,
        });
      } catch (error: any) {
        console.error("Import rocks error:", error);
        return res.status(500).json({
          success: false,
          message: error.message || "Internal server error",
          details: error,
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        message: "No valid rocks found in the default Excel file",
      });
    }
  } catch (error: any) {
    console.error("Import default rocks error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

/**
 * Import rocks directly from client-processed Excel data
 */
export const importRocksDirectly = async (req: Request, res: Response) => {
  try {
    const rocksData = req.body;

    if (!Array.isArray(rocksData) || rocksData.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid request: expected an array of rock data",
      });
    }

    console.log(
      `Received direct import request with ${rocksData.length} rocks`
    );

    // Try RPC function first for batch insert
    try {
      const { data, error } = await supabase.rpc("import_rocks", {
        rocks_data: rocksData,
      });

      if (!error) {
        return res.status(201).json({
          success: true,
          message: `Successfully imported ${rocksData.length} rocks using RPC`,
          totalProcessed: rocksData.length,
          failedItems: 0,
        });
      } else {
        console.log(
          "RPC method failed, falling back to direct batch insert:",
          error
        );
      }
    } catch (rpcError) {
      console.log("RPC not available, using direct batch insert:", rpcError);
    }

    // Fall back to batch insert
    try {
      const BATCH_SIZE = 100;
      let successCount = 0;

      for (let i = 0; i < rocksData.length; i += BATCH_SIZE) {
        const batch = rocksData.slice(i, i + BATCH_SIZE);
        console.log(
          `Importing batch ${Math.floor(i / BATCH_SIZE) + 1} of ${Math.ceil(
            rocksData.length / BATCH_SIZE
          )}...`
        );

        const { data, error } = await supabase.from("rocks").upsert(batch, {
          onConflict: "rock_code",
          ignoreDuplicates: false,
        });

        if (error) {
          console.error("Error inserting rocks batch:", error);
          return res.status(400).json({
            success: false,
            message: `Error: ${error.message}. This may be due to row-level security policies or data format issues.`,
          });
        }

        successCount += batch.length;
        console.log(
          `Successfully imported ${successCount} of ${rocksData.length} rocks so far`
        );
      }

      return res.status(200).json({
        success: true,
        message: `Successfully processed ${successCount} rocks`,
        totalProcessed: successCount,
        failedItems: 0,
      });
    } catch (error: any) {
      console.error("Error in batch import:", error);
      return res.status(500).json({
        success: false,
        message: `Server error: ${error.message}`,
        error: error.message,
      });
    }
  } catch (error: any) {
    console.error("Error in importRocksDirectly:", error);
    return res.status(500).json({
      success: false,
      message: `Server error: ${error.message}`,
      error: error.message,
    });
  }
};

// Get a single rock by ID
export const getRockById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    console.log("[getRockById] Received id:", id);

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Rock ID is required",
      });
    }

    console.log(`Fetching rock with ID: ${id}`);

    // Basic UUID format validation (optional but recommended)
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid rock ID format",
      });
    }

    const { data, error } = await supabase
      .from("rocks")
      .select("*")
      .eq("id", id)
      .single();

    console.log("[getRockById] Supabase data:", data);
    console.log("[getRockById] Supabase error:", error);

    if (error) {
      console.error("Error fetching rock by ID:", error);
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Rock not found",
      });
    }

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Get rock by ID error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
