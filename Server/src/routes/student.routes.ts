import express from 'express';
import { verifyToken } from '../middleware/auth.middleware';
import { isAdminOrStudent } from '../middleware/role.middleware';

const router = express.Router();

// All routes in this file require authentication and student role (or admin)
router.use(verifyToken);
router.use(isAdminOrStudent);

// Sample student dashboard endpoint
router.get('/dashboard', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Student dashboard data retrieved successfully',
    data: {
      courses: [
        { id: 1, name: 'Introduction to Petrology', progress: 45 },
        { id: 2, name: 'Mineral Identification', progress: 60 },
        { id: 3, name: 'Field Work Basics', progress: 20 }
      ]
    }
  });
});

// Get rocks catalog endpoint
router.get('/rocks', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Rocks catalog retrieved successfully',
    data: {
      rocks: [
        { id: 1, name: 'Basalt', type: 'Igneous', rarity: 'Common' },
        { id: 2, name: 'Granite', type: 'Igneous', rarity: 'Common' },
        { id: 3, name: 'Limestone', type: 'Sedimentary', rarity: 'Common' },
        { id: 4, name: 'Marble', type: 'Metamorphic', rarity: 'Uncommon' }
      ]
    }
  });
});

// Get minerals catalog endpoint
router.get('/minerals', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Minerals catalog retrieved successfully',
    data: {
      minerals: [
        { id: 1, name: 'Quartz', formula: 'SiO2', hardness: 7 },
        { id: 2, name: 'Feldspar', formula: 'KAlSi3O8', hardness: 6 },
        { id: 3, name: 'Calcite', formula: 'CaCO3', hardness: 3 },
        { id: 4, name: 'Fluorite', formula: 'CaF2', hardness: 4 }
      ]
    }
  });
});

export default router; 