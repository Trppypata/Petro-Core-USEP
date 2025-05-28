import { Router } from 'express';
import { 
  registerStudent, 
  fetchUserDetails, 
  updateUser, 
  deleteUser,
  getTeams
} from '../controllers/users.controller';

const router = Router();

// Register new student
router.post('/registerStudent', registerStudent);

// Get all users
router.get('/fetchUserDetails', fetchUserDetails);

// Get all teams/courses
router.get('/teams', getTeams);

// Update user
router.put('/:id', updateUser);

// Delete user
router.delete('/:id', deleteUser);

export default router; 