import express from 'express';
import {
  getAllUsers,
  getUserById,
  updateUserStatus,
  updateUserRole,
  deleteUser,
  getDashboardStats,
  getLeaderboard
} from '../controllers/userController.js';
import { authenticateToken, adminOnly } from '../middleware/auth.js';
import { validateMongoId, validatePagination, handleValidationErrors } from '../middleware/validation.js';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Specific routes first
router.get('/leaderboard', getLeaderboard);
router.get('/dashboard-stats', adminOnly, getDashboardStats);
router.get('/', adminOnly, validatePagination, handleValidationErrors, getAllUsers);

// Routes with parameters (more specific first)
router.patch('/:id/status', adminOnly, validateMongoId('id'), handleValidationErrors, updateUserStatus);
router.patch('/:id/role', adminOnly, validateMongoId('id'), handleValidationErrors, updateUserRole);
router.get('/:id', adminOnly, validateMongoId('id'), handleValidationErrors, getUserById);
router.delete('/:id', adminOnly, validateMongoId('id'), handleValidationErrors, deleteUser);

export default router; 