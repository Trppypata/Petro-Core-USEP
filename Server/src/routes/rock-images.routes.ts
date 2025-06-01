import express from 'express';
import {
  getRockImages,
  getRockImage,
  addRockImages,
  updateRockImage,
  deleteRockImage,
  deleteRockImagesByRockId
} from '../controllers/rock-images.controller';
import { verifyToken } from '../middleware/auth.middleware';

const router = express.Router();

// Public routes (no authentication required)
router.get('/:rockId', getRockImages);
router.get('/image/:id', getRockImage);

// Protected routes (authentication required)
router.post('/', verifyToken, addRockImages);
router.put('/:id', verifyToken, updateRockImage);
router.delete('/:id', verifyToken, deleteRockImage);
router.delete('/rock/:rockId', verifyToken, deleteRockImagesByRockId);

export default router; 