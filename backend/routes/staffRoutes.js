const express = require('express');
const {
  addStaff,
  getStaffMembers,
  getStaffById,
  updateStaff,
  updateStaffAvailability,
  assignServices,
  removeStaff,
  getStaffSchedule
} = require('../controllers/staffController');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Admin only routes
router.post('/', requireRole('admin'), addStaff);
router.put('/:id', requireRole('admin'), updateStaff);
router.put('/:id/services', requireRole('admin'), assignServices);
router.delete('/:id', requireRole('admin'), removeStaff);

// Admin or Staff routes
router.get('/', requireRole('admin', 'staff'), getStaffMembers);
router.get('/:id', requireRole('admin', 'staff'), getStaffById);
router.put('/:id/availability', requireRole('admin', 'staff'), updateStaffAvailability);
router.get('/:id/schedule', requireRole('admin', 'staff'), getStaffSchedule);

module.exports = router;