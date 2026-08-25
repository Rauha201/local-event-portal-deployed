const express = require('express');
const router = express.Router();
const {
  getAllEvents, getEventById, getMyEvents, createEvent, updateEvent, deleteEvent
} = require('../controllers/eventController');
const { protect, authorize } = require('../middleware/authMiddleware');

// NOTE: '/mine' is registered before '/:id' on purpose. Both are a
// single path segment after /api/events, so if '/:id' came first,
// Express would match a request for '/mine' as if "mine" were an
// :id value — a classic Express ordering mistake.
router.get('/mine', protect, authorize('manager'), getMyEvents);

router.get('/', getAllEvents);
router.get('/:id', getEventById);
router.post('/', protect, authorize('manager'), createEvent);
router.put('/:id', protect, authorize('manager'), updateEvent);
router.delete('/:id', protect, authorize('manager'), deleteEvent);

module.exports = router;
