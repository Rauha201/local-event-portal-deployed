const EventModel = require('../models/eventModel');
const { validateEventInput } = require('../utils/eventValidation');

// Public — anyone can browse events, no token needed.
async function getAllEvents(req, res, next) {
  try {
    res.json(await EventModel.findAll());
  } catch (err) {
    next(err);
  }
}

// Public — single event (Part 3's Event Details page will call this too).
async function getEventById(req, res, next) {
  try {
    const event = await EventModel.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    res.json(event);
  } catch (err) {
    next(err);
  }
}

// Manager-only — powers the dashboard's "Your Events" list.
async function getMyEvents(req, res, next) {
  try {
    res.json(await EventModel.findByManager(req.user.id));
  } catch (err) {
    next(err);
  }
}

async function createEvent(req, res, next) {
  try {
    const error = validateEventInput(req.body);
    if (error) return res.status(400).json({ message: error });

    const eventId = await EventModel.create({
      managerId: req.user.id, // taken from the JWT, never trusted from the request body
      title: req.body.title,
      description: req.body.description || '',
      category: req.body.category,
      eventDate: req.body.eventDate,
      eventTime: req.body.eventTime,
      location: req.body.location,
      organizer: req.body.organizer,
      ticketPrice: req.body.ticketPrice || 0,
      image: req.body.image || null,
      maxParticipants: req.body.maxParticipants || 50
    });

    res.status(201).json(await EventModel.findById(eventId));
  } catch (err) {
    next(err);
  }
}

async function updateEvent(req, res, next) {
  try {
    const existing = await EventModel.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: 'Event not found' });
    if (existing.manager_id !== req.user.id) {
      return res.status(403).json({ message: 'You can only edit your own events' });
    }

    const error = validateEventInput(req.body);
    if (error) return res.status(400).json({ message: error });

    await EventModel.update(req.params.id, {
      title: req.body.title,
      description: req.body.description || '',
      category: req.body.category,
      eventDate: req.body.eventDate,
      eventTime: req.body.eventTime,
      location: req.body.location,
      organizer: req.body.organizer,
      ticketPrice: req.body.ticketPrice || 0,
      image: req.body.image || null,
      maxParticipants: req.body.maxParticipants || 50
    });

    res.json(await EventModel.findById(req.params.id));
  } catch (err) {
    next(err);
  }
}

async function deleteEvent(req, res, next) {
  try {
    const existing = await EventModel.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: 'Event not found' });
    if (existing.manager_id !== req.user.id) {
      return res.status(403).json({ message: 'You can only delete your own events' });
    }
    await EventModel.delete(req.params.id);
    res.json({ message: 'Event deleted' });
  } catch (err) {
    next(err);
  }
}

module.exports = { getAllEvents, getEventById, getMyEvents, createEvent, updateEvent, deleteEvent };
