import express from 'express';
import multer from 'multer';
import * as mineralsController from '../controllers/minerals.controller';
import * as rocksController from '../controllers/rocks.controller';
import * as authController from '../controllers/auth.controller';
import * as usersController from '../controllers/users.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Auth routes
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.post('/auth/forgot-password', authController.forgotPassword);
router.post('/auth/reset-password', authController.resetPassword);
router.get('/auth/me', authenticateToken, authController.getCurrentUser);

// User routes
router.get('/users', authenticateToken, usersController.getAllUsers);
router.post('/users', authenticateToken, usersController.createUser);
router.get('/users/:id', authenticateToken, usersController.getUserById);
router.put('/users/:id', authenticateToken, usersController.updateUser);
router.delete('/users/:id', authenticateToken, usersController.deleteUser);

// Mineral routes
router.get('/minerals', mineralsController.getAllMinerals);
router.post('/minerals', authenticateToken, mineralsController.addMineral);
router.put('/minerals/:id', authenticateToken, mineralsController.updateMineral);
router.delete('/minerals/:id', authenticateToken, mineralsController.deleteMineral);
router.post('/minerals/import', authenticateToken, upload.single('file'), mineralsController.importMineralsFromExcel);
router.post('/minerals/import-default', authenticateToken, mineralsController.importDefaultMinerals);

// Rock routes
router.get('/rocks', rocksController.getAllRocks);
router.post('/rocks', authenticateToken, rocksController.addRock);
router.put('/rocks/:id', authenticateToken, rocksController.updateRock);
router.delete('/rocks/:id', authenticateToken, rocksController.deleteRock);
router.post('/rocks/import', authenticateToken, upload.single('file'), rocksController.importRocksFromExcel);

export default router; 