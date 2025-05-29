import express from 'express';
import multer from 'multer';
import {
  importRocksFromExcel,
  getAllRocks,
  addRock,
  updateRock,
  deleteRock,
  getRockStats,
  importDefaultRocks,
  importRocksDirectly
} from '../controllers/rocks.controller';
import { verifyToken } from '../middleware/auth.middleware';

const router = express.Router();

// Configure multer storage for Excel file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
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
router.get('/', getAllRocks);
router.get('/stats', getRockStats);
router.post('/import', upload.single('file'), importRocksFromExcel); // Import without auth
router.post('/import-default', importDefaultRocks); // Import from default excel file
router.post('/import-direct', importRocksDirectly);

// Protected routes (authentication required)
router.post('/', verifyToken, addRock);
router.put('/:id', verifyToken, updateRock);
router.delete('/:id', verifyToken, deleteRock);

export default router; 