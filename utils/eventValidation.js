// Pure validation logic, deliberately kept free of any require()
// that touches the database. That's what makes it possible to unit
// test (see tests/unit.test.js) without a live MySQL connection —
// eventController.js used to have this inline, which meant testing
// it dragged in the whole models/config chain.

const CATEGORIES = ['Concert', 'Meetup', 'Workshop', 'Sports', 'Festival'];

function todayDateString() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

function validateEventInput(body) {
  const { title, category, eventDate, eventTime, location, organizer, ticketPrice, maxParticipants } = body;

  if (!title || !category || !eventDate || !eventTime || !location || !organizer) {
    return 'Title, category, date, time, location and organizer are all required';
  }
  if (!CATEGORIES.includes(category)) {
    return `Category must be one of: ${CATEGORIES.join(', ')}`;
  }
  if (eventDate < todayDateString()) {
    return 'Event date cannot be in the past';
  }
  if (ticketPrice !== undefined && Number(ticketPrice) < 0) {
    return 'Ticket price cannot be negative';
  }
  if (maxParticipants !== undefined && Number(maxParticipants) < 1) {
    return 'Maximum participants must be at least 1';
  }
  return null;
}

module.exports = { CATEGORIES, todayDateString, validateEventInput };
