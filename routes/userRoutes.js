const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getProfile } = require('../controllers/userController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/profile', protect, authorize('user'), getProfile);

module.exports = router;
