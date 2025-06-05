import axios from 'axios';
import type { IRock } from '../rock.interface';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';
import Cookies from 'js-cookie';
import { cleanRockData } from './rock.service';

const API_URL = import.meta.env.VITE_local_url || 'http://localhost:8001/api';
console.log('API URL for rocks service:', API_URL);

/**
 * Helper to get auth token
 */
const getAuthToken = () => {
  // Try multiple storage locations for the token
  const token = localStorage.getItem('access_token') || 
         localStorage.getItem('auth_token') || 
         localStorage.getItem('token') || 
         localStorage.getItem('accessToken') ||
         Cookies.get('access_token');
  
  console.log('Auth token exists:', !!token);
  if (token) {
    // Log first and last few characters for debugging
    const firstChars = token.substring(0, 10);
    const lastChars = token.substring(token.length - 5);
    console.log(`Token format check: ${firstChars}...${lastChars} (${token.length} chars)`);
  } else {
    console.error('No authentication token found in any storage location');
  }
  
  return token;
};

/**
 * Get axios instance with auth headers
 */
const getAuthAxios = () => {
  const token = getAuthToken();
  
  if (!token) {
    console.error('No authentication token found');
    toast.error('Authentication required. Please log in again.');
    throw new Error('Authentication token not found');
  }
  
  // Create a fresh axios instance with auth headers
  return axios.create({
    baseURL: API_URL,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    // Add a timeout to avoid hanging requests
    timeout: 10000
  });
};

/**
 * Fetch all rocks or rocks filtered by category
 */
export const fetchRocks = async (category?: string, page: number = 1, pageSize: number = 10) => {
  try {
    console.log('🔍 Fetching rocks from API...');
    console.log('🔗 API URL:', `${API_URL}/rocks`);
    console.log('📄 Pagination:', { page, pageSize });
    
    // Build query parameters
    let params = new URLSearchParams();
    
    // Add category if provided
    if (category && category !== 'ALL') {
      params.append('category', category);
    }
    
    // Add pagination parameters
    params.append('page', page.toString());
    params.append('pageSize', pageSize.toString());
    
    // Construct URL with query parameters
    const url = `${API_URL}/rocks?${params.toString()}`;
    console.log('🔗 Full URL:', url);
    
    const response = await axios.get(url);
    console.log('✅ Raw API Response status:', response.status);
    
    if (!response.data || !response.data.data) {
      console.warn('⚠️ No data received from API');
      return { data: [], pagination: { total: 0, page, pageSize, totalPages: 0 } };
    }
    
    // Extract the data and pagination from the response
    const rocks = response.data.data || [];
    const pagination = response.data.pagination || {
      total: rocks.length,
      page,
      pageSize,
      totalPages: Math.ceil(rocks.length / pageSize)
    };
    
    // Check if rocks is an array
    if (!Array.isArray(rocks)) {
      console.warn('⚠️ Rocks data is not an array', rocks);
      return { data: [], pagination };
    }
    
    console.log('✅ Extracted rocks array:', rocks.length, 'items');
    console.log('✅ Pagination info:', pagination);
    
    // Check for duplicate rock codes in the fetched data
    const rockCodeMap = new Map();
    
    // Define a type for the duplicate entry
    interface DuplicateEntry {
      code: string;
      rock1: {
        id: string;
        name: string;
        category: string;
      };
      rock2: {
        id: string;
        name: string;
        category: string;
      };
    }
    
    const potentialDuplicates: DuplicateEntry[] = [];
    
    rocks.forEach(rock => {
      if (rock.rock_code) {
        const cleanCode = rock.rock_code.replace(/\s+/g, '').toLowerCase();
        if (rockCodeMap.has(cleanCode)) {
          potentialDuplicates.push({
            code: cleanCode,
            rock1: {
              id: rockCodeMap.get(cleanCode).id,
              name: rockCodeMap.get(cleanCode).name,
              category: rockCodeMap.get(cleanCode).category
            },
            rock2: {
              id: rock.id,
              name: rock.name,
              category: rock.category
            }
          });
        } else {
          rockCodeMap.set(cleanCode, rock);
        }
      }
    });
    
    if (potentialDuplicates.length > 0) {
      console.warn('⚠️ Found potential duplicate rock codes in API response:', potentialDuplicates.length);
      console.log('Duplicate details:', potentialDuplicates);
    }
    
    return { data: rocks, pagination };
  } catch (error) {
    console.error('❌ Error fetching rocks:', error);
    throw new Error('Failed to fetch rocks from the database');
  }
};

/**
 * Create a new rock
 */
export const createRock = async (rockData: Omit<IRock, 'id'>) => {
  // Define cleanedData outside the try block so it's accessible in the catch block
  let cleanedData;
  
  try {
    console.log('Creating rock with data:', rockData);
    
    // Clean the data to only include valid fields
    cleanedData = cleanRockData(rockData);
    
    console.log('Cleaned rock data for create:', cleanedData);
    
    // Get axios instance with auth headers
    const authAxios = getAuthAxios();
    
    // Make the request
    console.log('Sending POST request to:', `${API_URL}/rocks`);
    const response = await authAxios.post(`/rocks`, cleanedData);
    
    console.log('Create rock response:', response.status, response.data);
    
    if (!response.data || !response.data.data) {
      throw new Error('Invalid response format');
    }
    
    return response.data.data;
  } catch (error: any) {
    console.error('Error in createRock service:', error);
    
    // Handle token expiration specifically
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      toast.error('Your session has expired. Please log in again.');
      // Redirect to login page if needed
      // window.location.href = '/login';
    }
    
    // Enhanced error logging
    if (error.response) {
      console.error('Error status:', error.response.status);
      console.error('Error data:', error.response.data);
      
      // Extract more detailed error if available
      const detailedError = error.response.data?.error || error.response.data?.message;
      if (detailedError) {
        console.error('Detailed error:', detailedError);
        
        // Check for specific schema errors
        if (detailedError.includes('origin')) {
          throw new Error('Database schema error: The "origin" field is not in the database schema. Please contact the administrator.');
        }
        
        // Handle the specific user column error
        if (detailedError.includes('user column of') || detailedError.includes('user_id')) {
          console.error('User column error detected - this is a known issue with the database schema');
          
          // Try again with the fixed data - remove user fields
          try {
            // Create a clean copy without user fields
            const fixedData = { ...cleanedData };
            delete (fixedData as any).user;
            delete (fixedData as any).user_id;
            delete (fixedData as any).user_metadata;
            
            // Get a fresh axios instance
            const retryAuthAxios = getAuthAxios();
            
            console.log('Retrying with cleaned data (removed user fields)');
            const retryResponse = await retryAuthAxios.post(`/rocks`, fixedData);
            
            if (retryResponse.data && retryResponse.data.data) {
              console.log('Retry successful');
              return retryResponse.data.data;
            }
          } catch (retryError) {
            console.error('Retry also failed:', retryError);
            // Fall through to the error handling below
          }
        }
      }
    }
    
    // Extract error message
    const errorMessage = error.response?.data?.message || error.message || 'Failed to create rock';
    toast.error(errorMessage);
    
    throw new Error(errorMessage);
  }
};

/**
 * Update an existing rock
 */
export const updateRock = async (id: string, rockData: Partial<IRock>) => {
  try {
    console.log('⭐ Update rock service called with ID:', id);
    console.log('⭐ Update rock data:', JSON.stringify(rockData, null, 2));
    
    // Remove problematic fields that don't exist in the database schema
    // Use type assertion to handle potential extra properties
    const { user, user_id, ...filteredData } = rockData as Partial<IRock> & { 
      user?: any; 
      user_id?: any;
    };
    
    console.log('🧹 Filtered problematic fields (user, user_id)');
    console.log('🧹 Cleaned data for update:', JSON.stringify(filteredData, null, 2));
    
    // Get a fresh axios instance with auth headers
    const authAxios = getAuthAxios();
    
    // Make the request
    console.log('📤 Sending update request...');
    const response = await authAxios.put(`/rocks/${id}`, filteredData);
    
    console.log('📥 Update response status:', response.status);
    console.log('📥 Update response data:', response.data);
    
    if (!response.data || !response.data.data) {
      throw new Error('Invalid response format');
    }
    
    return response.data.data;
  } catch (error: any) {
    console.error('❌ Error in updateRock service:', error);
    
    // Handle token expiration specifically
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      toast.error('Your session has expired. Please log in again.');
    }
    
    // Enhanced error logging
    if (error.response) {
      console.error('❌ Error status:', error.response.status);
      console.error('❌ Error data:', error.response.data);
      
      // Extract more detailed error if available
      const detailedError = error.response.data?.error || error.response.data?.message;
      if (detailedError) {
        console.error('❌ Detailed error:', detailedError);
      }
    }
    
    // Extract error message
    const errorMessage = error.response?.data?.message || error.message || 'Failed to update rock';
    throw new Error(errorMessage);
  }
};

/**
 * Delete a rock
 */
export const deleteRock = async (id: string) => {
  try {
    console.log('Deleting rock with ID:', id);
    
    // Get axios instance with auth headers
    const authAxios = getAuthAxios();
    
    // Make the request
    await authAxios.delete(`/rocks/${id}`);
    return true;
  } catch (error: any) {
    console.error('Error in deleteRock service:', error);
    
    // Handle token expiration specifically
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      toast.error('Your session has expired. Please log in again.');
    }
    
    // Extract error message
    const errorMessage = error.response?.data?.message || error.message || 'Failed to delete rock';
    toast.error(errorMessage);
    
    throw new Error(errorMessage);
  }
};

/**
 * Import rocks from Excel file
 */
export const importRocksFromExcel = async (file: File) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    console.log('Importing rocks from Excel file:', file.name);
    
    const response = await axios.post(`${API_URL}/rocks/import`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    console.log('Import response:', response.data);
    
    return response.data;
  } catch (error: any) {
    console.error('Error importing rocks from Excel:', error);
    throw new Error(error.response?.data?.message || 'Failed to import rocks');
  }
};

/**
 * Import rocks directly via API (bypassing Excel upload)
 * This processes the Excel file in the browser and sends the data directly to the API
 */
export const importRocksDirectlyFromExcel = async (file: File) => {
  try {
    console.log('Processing Excel file directly:', file.name);
    
    // Read the Excel file in the browser
    const fileBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(fileBuffer, { type: 'array' });
    const rocks: Partial<IRock>[] = [];
    
    console.log(`Excel file contains ${workbook.SheetNames.length} sheets:`, workbook.SheetNames);
    
    // Process each sheet
    workbook.SheetNames.forEach((sheetName) => {
      // Skip special sheets (starting with _)
      if (sheetName.startsWith('_')) {
        console.log(`Skipping special sheet: ${sheetName}`);
        return;
      }
      
      console.log(`Processing sheet: ${sheetName}`);
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      console.log(`Found ${jsonData.length} rows in sheet ${sheetName}`);
      
      // Debug the first row's headers to see what we're working with
      if (jsonData.length > 0) {
        console.log(`Headers in ${sheetName}:`, Object.keys(jsonData[0] as object));
      }
      
      // Determine category based on sheet name
      let category: string;
      if (sheetName.toLowerCase().includes('igneous')) category = 'Igneous';
      else if (sheetName.toLowerCase().includes('sedimentary special')) category = 'Sedimentary';
      else if (sheetName.toLowerCase().includes('sedimentary')) category = 'Sedimentary';
      else if (sheetName.toLowerCase().includes('metamorphic')) category = 'Metamorphic';
      else if (sheetName.toLowerCase().includes('ore') || 
               sheetName.toLowerCase().includes('economic')) category = 'Ore Samples';
      else category = sheetName; // Default to sheet name if no match
      
      console.log(`Identified category: ${category}`);
      
      // Process each row
      jsonData.forEach((row: any, index: number) => {
        // Log the first row for debugging
        if (index === 0) {
          console.log(`Sample row data for ${sheetName}:`, row);
        }
        
        // Extract rock name with fallbacks
        let rockName = row['Rock Name'] || row['Name'] || row['Sample Name'] || row['Rock'] || '';
        
        // Special handling for Ore Samples
        if (category === 'Ore Samples' && !rockName && row['Type of Commodity']) {
          rockName = `${row['Type of Commodity']} Ore Sample`;
        }
        
        // Skip if no name found (unless it's an ore sample)
        if (!rockName && category !== 'Ore Samples') {
          console.log(`Skipping row ${index+1} - no rock name found`);
          return;
        }
        
        // For Ore Samples without a name, generate one
        if (!rockName && category === 'Ore Samples') {
          rockName = `Ore Sample ${index + 1}`;
        }
        
        // Format coordinates
        let coordinates = '';
        if (row['Coordinates'] && row['Coordinates'].toString().trim() !== '') {
          coordinates = row['Coordinates'].toString().trim();
        } else if ((row['Latitude'] || row['LAT']) && (row['Longitude'] || row['LONG']) && 
                 (row['Latitude'] || row['LAT']).toString().trim() !== '' && 
                 (row['Longitude'] || row['LONG']).toString().trim() !== '') {
          const lat = (row['Latitude'] || row['LAT']).toString().trim();
          const long = (row['Longitude'] || row['LONG']).toString().trim();
          coordinates = `${lat}, ${long}`;
        }
        
        // Create base rock object
        const rock: Partial<IRock> = {
          rock_code: row['Rock Code'] || '',
          name: rockName,
          category: category,
          status: 'active',
        };
        
        // Ensure rock code is present
        if (!rock.rock_code || rock.rock_code.trim() === '') {
          // Generate based on category
          const prefix = category === 'Igneous' ? 'I-' : 
                         category === 'Sedimentary' ? 'S-' :
                         category === 'Metamorphic' ? 'M-' : 'O-';
          rock.rock_code = `${prefix}${String(index + 1).padStart(4, '0')}`;
        }
        
        // Add common fields (for all rock types)
        rock.chemical_formula = row['Chemical Formula'] || row['Chemical'] || '';
        rock.color = row['Color'] || row['Colour'] || '';
        rock.hardness = row['Hardness'] || '';
        rock.texture = row['Texture'] || '';
        rock.grain_size = row['Grain Size'] || '';
        rock.locality = row['Locality'] || row['Location'] || '';
        
        // Add category-specific fields based on the category
        if (category === 'Igneous') {
          // Igneous rock specific fields
          rock.type = row['Type'] || '';
          rock.texture = row['Texture'] || '';
          rock.locality = row['Locality'] || '';
          rock.coordinates = coordinates;
          rock.associated_minerals = row['Associated Minerals'] || '';
          rock.color = row['Color'] || '';
          rock.luster = row['Luster'] || '';
          rock.streak = row['Streak'] || '';
          rock.hardness = row['Hardness'] || '';
          rock.type = row['Type'] || '';
          rock.origin = row['Origin'] || '';
          rock.magnetism = row['Magnetism'] || '';
          rock.mineral_composition = row['Associated Minerals'] || '';
        } 
        else if (category === 'Sedimentary') {
          // Handle both regular Sedimentary and Sedimentary Special
          if (sheetName.toLowerCase().includes('sedimentary special')) {
            // Sedimentary Special specific fields
            rock.type = row['Type'] || '';
            rock.hardness = row['Hardness'] || '';
            rock.color = row['Color'] || '';
            rock.streak = row['Streak'] || '';
            rock.luster = row['Luster'] || '';
            rock.locality = row['Locality'] || '';
            rock.reaction_to_hcl = row['Reaction to HCL'] || '';
          } else {
            // Regular Sedimentary fields - make sure these exactly match the Excel headers
            rock.type = row['Type'] || '';
            rock.depositional_environment = row['Depositional Environment'] || row['Depositional Env.'] || '';
            rock.grain_size = row['Grain Size'] || '';
            rock.texture = row['Texture'] || '';
            
            // Specifically map the fields we see in the screenshot
            rock.bedding = row['Bedding'] || '';
            rock.sorting = row['Sorting'] || '';
            rock.roundness = row['Roundness'] || '';
            rock.fossil_content = row['Fossil Content'] || row['Fossils'] || '';
            rock.sediment_source = row['Sediment Source'] || '';
            
            rock.associated_minerals = row['Associated Minerals'] || '';
            rock.color = row['Color'] || '';
            rock.reaction_to_hcl = row['Reaction to HCL'] || '';
            rock.locality = row['Locality'] || '';
            rock.latitude = row['LAT'] || row['Latitude'] || '';
            rock.longitude = row['LONG'] || row['Longitude'] || '';
            rock.coordinates = coordinates;
          }
        }
        else if (category === 'Metamorphic') {
          // Metamorphic rock specific fields
          rock.type = 'Metamorphic';
          rock.foliation = row['Foliation'] || '';
          rock.foliation_type = row['Foliation Type'] || '';
          rock.grain_size = row['Grain Size'] || '';
          rock.color = row['Color'] || '';
          rock.associated_minerals = row['Associated Minerals'] || '';
          rock.metamorphism_type = row['Metamorpism'] || '';
          rock.metamorphic_grade = row['Metamorphic Grade'] || '';
          rock.reaction_to_hcl = row['Reaction to HCl'] || '';
          rock.magnetism = row['Magnetism'] || '';
          rock.protolith = row['Protolith'] || '';
          rock.coordinates = row['Coordinates'] || coordinates;
          rock.locality = row['Locality'] || '';
        }
        else if (category === 'Ore Samples') {
          // Ore Samples specific fields
          rock.type = 'Ore';
          rock.commodity_type = row['Type of Commodity'] || '';
          rock.ore_group = row['Type of Deposit'] || row['Ore Group'] || '';
          rock.description = row['Overall Description'] || '';
          rock.locality = row['Locality'] || '';
          rock.mining_company = row['Mining Company/Donated by'] || '';
          rock.coordinates = row['Coordinates'] || coordinates;
        }
        
        // Debug log for sedimentary rock fields
        if (category === 'Sedimentary' && index === 0) {
          console.log('Sedimentary rock fields for first row:', {
            bedding: rock.bedding,
            sorting: rock.sorting,
            roundness: rock.roundness,
            fossil_content: rock.fossil_content,
            sediment_source: rock.sediment_source
          });
        }
        
        rocks.push(rock);
      });
    });
    
    console.log(`Total rocks extracted from Excel: ${rocks.length}`);
    
    if (rocks.length === 0) {
      throw new Error('No valid rocks found in the Excel file');
    }
    
    // Try sending in smaller batches to avoid request size limits
    const BATCH_SIZE = 10; // Reduce batch size further to avoid large payloads
    let successCount = 0;
    let failedCount = 0;
    let failedBatches = [];
    
    console.log(`Sending rocks in batches of ${BATCH_SIZE} to ${API_URL}/rocks/import-direct`);
    
    // Process all batches
    for (let i = 0; i < rocks.length; i += BATCH_SIZE) {
      const batch = rocks.slice(i, i + BATCH_SIZE);
      const batchNumber = Math.floor(i/BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(rocks.length/BATCH_SIZE);
      
      console.log(`Sending batch ${batchNumber} of ${totalBatches}...`);
      
      try {
        // Send the extracted data to the API with increased timeout
        const response = await axios.post(`${API_URL}/rocks/import-direct`, batch, {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 60000 // Increase timeout to 60 seconds
        });
        
        console.log(`Batch ${batchNumber} response:`, response.status, response.data);
        
        if (response.data.success) {
          successCount += response.data.totalProcessed || batch.length;
        } else {
          failedCount += batch.length;
          failedBatches.push({ 
            batchNumber, 
            message: response.data.message,
            startIndex: i,
            endIndex: i + batch.length - 1
          });
          console.error(`Batch ${batchNumber} import error:`, response.data.message);
        }
      } catch (batchError: any) {
        failedCount += batch.length;
        failedBatches.push({ 
          batchNumber, 
          message: batchError.message,
          response: batchError.response?.data,
          startIndex: i,
          endIndex: i + batch.length - 1
        });
        console.error(`Batch ${batchNumber} import failed:`, batchError.message);
        console.error('Response:', batchError.response?.data || 'No response data');
        
        // Add a delay before the next batch to avoid overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      // Add a small delay between batches to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    // Try to re-send failed batches with even smaller size
    if (failedBatches.length > 0) {
      console.log(`Attempting to resend ${failedBatches.length} failed batches with smaller size...`);
      
      // Use an even smaller batch size for retry
      const RETRY_BATCH_SIZE = 5;
      
      for (const failedBatch of failedBatches) {
        const { startIndex, endIndex } = failedBatch;
        const failedRocks = rocks.slice(startIndex, endIndex + 1);
        
        // Split the failed batch into even smaller batches
        for (let j = 0; j < failedRocks.length; j += RETRY_BATCH_SIZE) {
          const retryBatch = failedRocks.slice(j, j + RETRY_BATCH_SIZE);
          
          try {
            console.log(`Retrying with ${retryBatch.length} rocks (batch ${failedBatch.batchNumber}, part ${Math.floor(j/RETRY_BATCH_SIZE) + 1})...`);
            
            const retryResponse = await axios.post(`${API_URL}/rocks/import-direct`, retryBatch, {
              headers: {
                'Content-Type': 'application/json'
              },
              timeout: 60000
            });
            
            if (retryResponse.data.success) {
              successCount += retryResponse.data.totalProcessed || retryBatch.length;
              failedCount -= retryResponse.data.totalProcessed || retryBatch.length;
              console.log(`Retry successful for ${retryResponse.data.totalProcessed || retryBatch.length} rocks`);
            }
          } catch (retryError) {
            console.error('Retry also failed:', retryError);
          }
          
          // Add a delay between retry batches
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }
    }
    
    // After all batches and retries
    const finalResult = {
      success: successCount > 0,
      message: `Imported ${successCount} of ${rocks.length} rocks${failedCount > 0 ? ` (${failedCount} failed)` : ''}`,
      successCount,
      failedCount,
      totalCount: rocks.length,
      failedBatches: failedBatches.length
    };
    
    console.log('Final import result:', finalResult);
    
    return finalResult;
  } catch (error: any) {
    console.error('Error in direct import:', error);
    throw new Error(error.response?.data?.message || error.message || 'Failed to import rocks');
  }
};

/**
 * Get rock statistics from the server
 */
export const getRockStats = async () => {
  try {
    console.log('🔍 Fetching rock statistics...');
    
    const response = await axios.get(`${API_URL}/rocks/stats`);
    console.log('✅ Rock stats response:', response.data);
    
    if (!response.data || !response.data.stats) {
      console.warn('⚠️ No stats received from API');
      return null;
    }
    
    return response.data.stats;
  } catch (error) {
    console.error('❌ Error fetching rock stats:', error);
    throw new Error('Failed to fetch rock statistics');
  }
};

/**
 * Import rocks from the default Excel file on the server
 */
export const importDefaultRocks = async () => {
  try {
    console.log('🔍 Importing rocks from default Excel file...');
    
    const response = await axios.post(`${API_URL}/rocks/import-default`);
    console.log('✅ Import response:', response.data);
    
    return response.data;
  } catch (error: any) {
    console.error('❌ Error importing rocks from default file:', error);
    throw new Error(error.response?.data?.message || 'Failed to import rocks from default file');
  }
}; 