const express = require('express');
const router = express.Router();
const { registerManager, loginManager, getProfile } = require('../controllers/managerController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/register', registerManager);
router.post('/login', loginManager);
router.get('/profile', protect, authorize('manager'), getProfile);

module.exports = router;
