import express from 'express';
import { 
  login, 
  register, 
  getCurrentUser, 
  logout, 
  resetPassword, 
  updatePassword 
} from '../controllers/auth.controller';

const router = express.Router();

// Auth routes
router.post('/login', login);
router.post('/register', register);
router.post('/current-user', getCurrentUser);
router.post('/logout', logout);
router.post('/reset-password', resetPassword);
router.post('/update-password', updatePassword);

export default router; 