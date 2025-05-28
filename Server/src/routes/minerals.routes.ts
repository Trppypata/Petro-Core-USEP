import express from 'express';
import multer from 'multer';
import {
  importMineralsFromExcel,
  importDefaultMinerals,
  getAllMinerals,
  addMineral,
  updateMineral,
  deleteMineral
} from '../controllers/minerals.controller';

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
router.post('/import', upload.single('file'), importMineralsFromExcel);
router.post('/import-default', importDefaultMinerals);
router.get('/', getAllMinerals);
router.post('/', addMineral);
router.put('/:id', updateMineral);
router.delete('/:id', deleteMineral);

export default router; 