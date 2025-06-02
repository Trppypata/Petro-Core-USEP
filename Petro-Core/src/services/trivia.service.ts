import * as XLSX from 'xlsx';
import { mockTriviaData } from '@/data/trivia-data';

export interface Trivia {
  id?: number;
  title: string;
  content: string;
  category?: string;
  image?: string;
}

/**
 * Parses the TRIVIAS.xlsx file and returns an array of trivia items
 */
export const getTriviaItems = async (): Promise<Trivia[]> => {
  try {
    // Dynamically import the Excel file
    const response = await fetch('/src/assets/TRIVIAS.xlsx');
    const arrayBuffer = await response.arrayBuffer();
    
    // Parse the Excel file
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    
    // Convert to JSON
    const data = XLSX.utils.sheet_to_json<any>(worksheet);
    
    // Map to Trivia interface
    const triviaItems: Trivia[] = data.map((row, index) => ({
      id: index + 1,
      title: row.Title || 'Trivia Time!',
      content: row.Content || row.Description || row.Trivia || '',
      category: row.Category || 'general',
      image: row.Image || '',
    }));
    
    // Return only items with non-empty content
    const validItems = triviaItems.filter(item => item.content.trim() !== '');
    
    // If we have valid items, return them; otherwise fall back to mock data
    return validItems.length > 0 ? validItems : mockTriviaData;
  } catch (error) {
    console.error('Error parsing trivia data:', error);
    // Return mock trivia data if Excel parsing fails
    return mockTriviaData;
  }
};

/**
 * Returns a random trivia item from the list
 */
export const getRandomTrivia = async (): Promise<Trivia> => {
  const triviaItems = await getTriviaItems();
  const randomIndex = Math.floor(Math.random() * triviaItems.length);
  return triviaItems[randomIndex];
};

/**
 * Returns a random trivia item for a specific category
 */
export const getRandomTriviaByCategory = async (category: string): Promise<Trivia | null> => {
  const triviaItems = await getTriviaItems();
  const filteredItems = triviaItems.filter(item => 
    item.category?.toLowerCase() === category.toLowerCase()
  );
  
  if (filteredItems.length === 0) {
    // If no items found for this category, return a random trivia instead
    return getRandomTrivia();
  }
  
  const randomIndex = Math.floor(Math.random() * filteredItems.length);
  return filteredItems[randomIndex];
}; 