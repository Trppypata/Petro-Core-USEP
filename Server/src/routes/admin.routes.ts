import express from 'express';
import { verifyToken } from '../middleware/auth.middleware';
import { isAdmin } from '../middleware/role.middleware';

const router = express.Router();

// All routes in this file require authentication and admin role
router.use(verifyToken);
router.use(isAdmin);

// Sample admin-only endpoint
router.get('/dashboard', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Admin dashboard data retrieved successfully',
    data: {
      stats: {
        totalStudents: 120,
        activeStudents: 95,
        totalRocks: 210,
        totalMinerals: 150
      }
    }
  });
});

// Manage users endpoint
router.get('/users', (req, res) => {
  // In a real app, you would fetch users from the database
  res.status(200).json({
    success: true,
    message: 'Users retrieved successfully',
    data: {
      users: [
        { id: 1, name: 'John Doe', email: 'john@example.com', role: 'student' },
        { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'student' },
        { id: 3, name: 'Admin User', email: 'admin@example.com', role: 'admin' }
      ]
    }
  });
});

export default router; 