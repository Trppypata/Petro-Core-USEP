import { Request, Response } from 'express';
import { supabase } from '../config/supabase';

// Get all images for a specific rock
export const getRockImages = async (req: Request, res: Response) => {
  try {
    const { rockId } = req.params;
    
    if (!rockId) {
      return res.status(400).json({
        success: false,
        message: 'Rock ID is required',
      });
    }
    
    // Query rock images
    const { data, error } = await supabase
      .from('rock_images')
      .select('*')
      .eq('rock_id', rockId)
      .order('display_order', { ascending: true });
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
    
    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error('Error fetching rock images:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
};

// Get a specific rock image
export const getRockImage = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Image ID is required',
      });
    }
    
    // Query rock image
    const { data, error } = await supabase
      .from('rock_images')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
    
    if (!data) {
      return res.status(404).json({
        success: false,
        message: 'Rock image not found',
      });
    }
    
    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error('Error fetching rock image:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
};

// Add images to a rock
export const addRockImages = async (req: Request, res: Response) => {
  try {
    const { images } = req.body;
    
    if (!images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Images array is required',
      });
    }
    
    // Insert images
    const { data, error } = await supabase
      .from('rock_images')
      .insert(images)
      .select();
    
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
  } catch (error: any) {
    console.error('Error adding rock images:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
};

// Update a rock image
export const updateRockImage = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Image ID is required',
      });
    }
    
    // Update rock image
    const { data, error } = await supabase
      .from('rock_images')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
    
    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error('Error updating rock image:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
};

// Delete a rock image
export const deleteRockImage = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Image ID is required',
      });
    }
    
    // Delete rock image
    const { error } = await supabase
      .from('rock_images')
      .delete()
      .eq('id', id);
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Rock image deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting rock image:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
};

// Delete all images for a rock
export const deleteRockImagesByRockId = async (req: Request, res: Response) => {
  try {
    const { rockId } = req.params;
    
    if (!rockId) {
      return res.status(400).json({
        success: false,
        message: 'Rock ID is required',
      });
    }
    
    // Delete rock images
    const { error } = await supabase
      .from('rock_images')
      .delete()
      .eq('rock_id', rockId);
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Rock images deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting rock images:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
}; 