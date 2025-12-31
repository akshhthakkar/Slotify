const express = require('express');
const {
  createService,
  getServices,
  getServiceById,
  updateService,
  toggleServiceStatus,
  deleteService
} = require('../controllers/serviceController');
const { authenticate, requireRole, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Public/optional auth routes
router.get('/', optionalAuth, getServices);
router.get('/:id', optionalAuth, getServiceById);

// Protected routes (Admin only)
router.post('/', authenticate, requireRole('admin'), createService);
router.put('/:id', authenticate, requireRole('admin'), updateService);
router.patch('/:id/toggle', authenticate, requireRole('admin'), toggleServiceStatus);
router.delete('/:id', authenticate, requireRole('admin'), deleteService);

module.exports = router;
