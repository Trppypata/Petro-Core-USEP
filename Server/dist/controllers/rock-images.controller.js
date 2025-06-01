"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteRockImagesByRockId = exports.deleteRockImage = exports.updateRockImage = exports.addRockImages = exports.getRockImage = exports.getRockImages = void 0;
const supabase_1 = require("../config/supabase");
// Get all images for a specific rock
const getRockImages = async (req, res) => {
    try {
        const { rockId } = req.params;
        if (!rockId) {
            return res.status(400).json({
                success: false,
                message: 'Rock ID is required',
            });
        }
        // Query rock images
        const { data, error } = await supabase_1.supabase
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
    }
    catch (error) {
        console.error('Error fetching rock images:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Internal server error',
        });
    }
};
exports.getRockImages = getRockImages;
// Get a specific rock image
const getRockImage = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'Image ID is required',
            });
        }
        // Query rock image
        const { data, error } = await supabase_1.supabase
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
    }
    catch (error) {
        console.error('Error fetching rock image:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Internal server error',
        });
    }
};
exports.getRockImage = getRockImage;
// Add images to a rock
const addRockImages = async (req, res) => {
    try {
        const { images } = req.body;
        if (!images || !Array.isArray(images) || images.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Images array is required',
            });
        }
        // Insert images
        const { data, error } = await supabase_1.supabase
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
    }
    catch (error) {
        console.error('Error adding rock images:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Internal server error',
        });
    }
};
exports.addRockImages = addRockImages;
// Update a rock image
const updateRockImage = async (req, res) => {
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
        const { data, error } = await supabase_1.supabase
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
    }
    catch (error) {
        console.error('Error updating rock image:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Internal server error',
        });
    }
};
exports.updateRockImage = updateRockImage;
// Delete a rock image
const deleteRockImage = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'Image ID is required',
            });
        }
        // Delete rock image
        const { error } = await supabase_1.supabase
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
    }
    catch (error) {
        console.error('Error deleting rock image:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Internal server error',
        });
    }
};
exports.deleteRockImage = deleteRockImage;
// Delete all images for a rock
const deleteRockImagesByRockId = async (req, res) => {
    try {
        const { rockId } = req.params;
        if (!rockId) {
            return res.status(400).json({
                success: false,
                message: 'Rock ID is required',
            });
        }
        // Delete rock images
        const { error } = await supabase_1.supabase
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
    }
    catch (error) {
        console.error('Error deleting rock images:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Internal server error',
        });
    }
};
exports.deleteRockImagesByRockId = deleteRockImagesByRockId;
