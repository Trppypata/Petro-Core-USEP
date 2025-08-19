import express from 'express';
import { 
  login, 
  register, 
  getCurrentUser, 
  logout, 
  resetPassword, 
  updatePassword,
  updateUserPassword,
  updateUserRole
} from '../controllers/auth.controller';

const router = express.Router();

// Auth routes
router.post('/login', login);
router.post('/register', register);
router.post('/current-user', getCurrentUser);
router.post('/logout', logout);
router.post('/reset-password', resetPassword);
router.post('/update-password', updatePassword);
router.post('/update-user-password', updateUserPassword);
router.post('/update-user-role', updateUserRole);

export default router; 