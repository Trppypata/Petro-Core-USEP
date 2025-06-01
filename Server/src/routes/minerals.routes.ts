import express from 'express';
import multer from 'multer';
import {
  importMineralsFromExcel,
  getAllMinerals,
  addMineral,
  updateMineral,
  deleteMineral,
  getMineralById
} from '../controllers/minerals.controller';
import { verifyToken } from '../middleware/auth.middleware';

const router = express.Router();

// Configure multer storage for Excel file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit (increased from 10MB)
  fileFilter: (_req, file, cb) => {
    // Check file type
    if (
      file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.mimetype === 'application/vnd.ms-excel'
    ) {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files are allowed'));
    }
  }
});

// Routes
// Public routes (no authentication required)
router.get('/', getAllMinerals);
router.get('/:id', getMineralById);
router.post('/import', upload.single('file'), importMineralsFromExcel); // Import without auth

// Protected routes (authentication required)
router.post('/', verifyToken, addMineral);
router.put('/:id', verifyToken, updateMineral);
router.delete('/:id', verifyToken, deleteMineral);

export default router; 