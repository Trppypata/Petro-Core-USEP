import * as XLSX from 'xlsx';
import { mockTriviaData } from '@/data/trivia-data';
import { supabase } from '@/lib/supabase';

export interface Trivia {
  id?: number;
  title: string;
  content: string;
  category?: string;
  image?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Fetch all trivia items
 */
export const getTriviaItems = async (): Promise<Trivia[]> => {
  try {
    const { data, error } = await supabase
      .from('trivia')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching trivia:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in trivia service:', error);
    return [];
  }
};

/**
 * Get a single trivia item by ID
 */
export const getTriviaById = async (id: number): Promise<Trivia | null> => {
  try {
    const { data, error } = await supabase
      .from('trivia')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching trivia by ID:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in trivia service:', error);
    return null;
  }
};

/**
 * Get a random trivia from all categories
 */
export const getRandomTrivia = async (): Promise<Trivia> => {
  try {
    const triviaItems = await getTriviaItems();
    if (triviaItems.length === 0) {
      return { title: 'Did you know?', content: 'The Earth contains a wide variety of rocks and minerals!' };
    }
    const randomIndex = Math.floor(Math.random() * triviaItems.length);
    return triviaItems[randomIndex];
  } catch (error) {
    console.error('Error getting random trivia:', error);
    return { title: 'Did you know?', content: 'The Earth contains a wide variety of rocks and minerals!' };
  }
};

/**
 * Get a random trivia from a specific category
 */
export const getRandomTriviaByCategory = async (category: string): Promise<Trivia | null> => {
  try {
    const { data, error } = await supabase
      .from('trivia')
      .select('*')
      .eq('category', category);
    
    if (error) throw error;
    
    if (data && data.length > 0) {
      const randomIndex = Math.floor(Math.random() * data.length);
      return data[randomIndex];
    }
    return null;
  } catch (error) {
    console.error('Error getting trivia by category:', error);
    return null;
  }
};

/**
 * Create a new trivia item
 */
export const createTrivia = async (triviaData: Omit<Trivia, 'id'>): Promise<Trivia> => {
  try {
    // Remove image field if it exists, as it's not in the database schema
    const { image, ...dataWithoutImage } = triviaData;
    
    const { data, error } = await supabase
      .from('trivia')
      .insert([dataWithoutImage])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating trivia:', error);
    throw error;
  }
};

/**
 * Update an existing trivia item
 */
export const updateTrivia = async (id: number, triviaData: Partial<Trivia>): Promise<Trivia> => {
  try {
    // Remove image field if it exists, as it's not in the database schema
    const { image, ...dataWithoutImage } = triviaData;
    
    const { data, error } = await supabase
      .from('trivia')
      .update(dataWithoutImage)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating trivia:', error);
    throw error;
  }
};

/**
 * Delete a trivia item
 */
export const deleteTrivia = async (id: number): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('trivia')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting trivia:', error);
    throw error;
  }
}; 