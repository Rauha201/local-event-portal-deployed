const express = require('express');
const router = express.Router();
const {
  loginAdmin,
  getProfile,
  getDashboardStats,
  getAllUsers,
  getUserById,
  deleteUser,
  getAllManagers,
  getManagerById,
  approveManager,
  rejectManager,
  deleteManager,
  getAllEvents,
  getEventById,
  deleteEvent,
  getAllRegistrations,
  deleteRegistration
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Public — mirrors POST /api/users/login and /api/managers/login so
// auth.js's role-tab pattern (`${role}s/login`) works unchanged for
// the admin role too. There is no POST /register here on purpose —
// see controllers/adminController.js for why.
router.post('/login', loginAdmin);

router.get('/profile', protect, authorize('admin'), getProfile);
router.get('/stats', protect, authorize('admin'), getDashboardStats);

// Users
router.get('/users', protect, authorize('admin'), getAllUsers);
router.get('/users/:id', protect, authorize('admin'), getUserById);
router.delete('/users/:id', protect, authorize('admin'), deleteUser);

// Managers
router.get('/managers', protect, authorize('admin'), getAllManagers);
router.get('/managers/:id', protect, authorize('admin'), getManagerById);
router.put('/managers/:id/approve', protect, authorize('admin'), approveManager);
router.put('/managers/:id/reject', protect, authorize('admin'), rejectManager);
router.delete('/managers/:id', protect, authorize('admin'), deleteManager);

// Events
router.get('/events', protect, authorize('admin'), getAllEvents);
router.get('/events/:id', protect, authorize('admin'), getEventById);
router.delete('/events/:id', protect, authorize('admin'), deleteEvent);

// Registrations
router.get('/registrations', protect, authorize('admin'), getAllRegistrations);
router.delete('/registrations/:id', protect, authorize('admin'), deleteRegistration);

module.exports = router;
