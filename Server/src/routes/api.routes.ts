import express from 'express';
import multer from 'multer';
import * as mineralsController from '../controllers/minerals.controller';
import * as rocksController from '../controllers/rocks.controller';
import * as authController from '../controllers/auth.controller';
import * as usersController from '../controllers/users.controller';
import { verifyToken } from '../middleware/auth.middleware';

const router = express.Router();
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// Auth routes
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.post('/auth/forgot-password', authController.resetPassword);
router.post('/auth/reset-password', authController.resetPassword);
router.get('/auth/me', verifyToken, authController.getCurrentUser);

// User routes
router.get('/users', verifyToken, usersController.fetchUserDetails);
router.post('/users', verifyToken, usersController.registerStudent);
router.get('/users/:id', verifyToken, usersController.fetchUserDetails);
router.put('/users/:id', verifyToken, usersController.updateUser);
router.delete('/users/:id', verifyToken, usersController.deleteUser);

// Mineral routes
router.get('/minerals', mineralsController.getAllMinerals);
router.post('/minerals', verifyToken, mineralsController.addMineral);
router.put('/minerals/:id', verifyToken, mineralsController.updateMineral);
router.delete('/minerals/:id', verifyToken, mineralsController.deleteMineral);
router.post('/minerals/import', verifyToken, upload.single('file'), mineralsController.importMineralsFromExcel);
router.post('/minerals/import-default', verifyToken, mineralsController.importDefaultMinerals);

// Rock routes
router.get('/rocks', rocksController.getAllRocks);
router.post('/rocks', verifyToken, rocksController.addRock);
router.put('/rocks/:id', verifyToken, rocksController.updateRock);
router.delete('/rocks/:id', verifyToken, rocksController.deleteRock);
router.post('/rocks/import', verifyToken, upload.single('file'), rocksController.importRocksFromExcel);

export default router; 