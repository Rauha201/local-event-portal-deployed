// Automated tests for the pure, dependency-free logic in the app —
// deliberately scoped to functions that need no database and no
// browser (see the module.exports guards at the bottom of
// public/js/main.js and public/js/event-details.js, and the
// zero-dependency utils/eventValidation.js).
//
// Run with:  node --test
// (Node's built-in test runner — no npm install required.)

const test = require('node:test');
const assert = require('node:assert/strict');

const { formatDateLabel, formatDateLong, formatTime } = require('../public/js/main.js');
const { calendarTimestamp, buildICS, buildGoogleCalendarUrl } = require('../public/js/event-details.js');
const { validateEventInput, todayDateString } = require('../utils/eventValidation.js');

test('formatDateLabel reads the date string directly — no timezone involved', () => {
  assert.equal(formatDateLabel('2026-08-14'), 'Aug 14');
  assert.equal(formatDateLabel('2026-01-01'), 'Jan 1');
});

test('formatDateLong renders a full date', () => {
  assert.equal(formatDateLong('2026-12-25'), 'December 25, 2026');
});

test('formatTime converts 24-hour time to 12-hour correctly', () => {
  assert.equal(formatTime('00:00'), '12:00 AM');
  assert.equal(formatTime('12:00'), '12:00 PM');
  assert.equal(formatTime('13:05'), '1:05 PM');
  assert.equal(formatTime('23:59'), '11:59 PM');
});

test('calendarTimestamp formats a start time with no offset', () => {
  assert.equal(calendarTimestamp('2026-08-14', '19:00', 0), '20260814T190000');
});

test('calendarTimestamp rolls over into the next day correctly', () => {
  // An 11pm event, +2 hours, should land at 1am the following day —
  // this is the exact case the timezone bug fix needed to keep safe.
  assert.equal(calendarTimestamp('2026-08-14', '23:00', 2), '20260815T010000');
});

test('buildICS includes the fields a calendar app needs', () => {
  const ics = buildICS({
    event_id: 1,
    title: 'Test Event',
    location: 'Test Hall',
    description: 'A test',
    event_date: '2026-08-14',
    event_time: '19:00'
  });
  assert.match(ics, /BEGIN:VCALENDAR/);
  assert.match(ics, /SUMMARY:Test Event/);
  assert.match(ics, /DTSTART:20260814T190000/);
  assert.match(ics, /END:VCALENDAR/);
});

test('buildGoogleCalendarUrl produces a well-formed calendar.google.com link', () => {
  const url = buildGoogleCalendarUrl({
    title: 'Test Event',
    location: 'Test Hall',
    description: '',
    event_date: '2026-08-14',
    event_time: '19:00'
  });
  assert.match(url, /^https:\/\/calendar\.google\.com\/calendar\/render\?/);
  assert.match(url, /text=Test\+Event/);
});

test('validateEventInput rejects a category outside the fixed five', () => {
  const error = validateEventInput({
    title: 'X', category: 'Not A Category', eventDate: '2099-01-01',
    eventTime: '10:00', location: 'Y', organizer: 'Z'
  });
  assert.match(error, /Category must be one of/);
});

test('validateEventInput rejects a past date', () => {
  const error = validateEventInput({
    title: 'X', category: 'Concert', eventDate: '2000-01-01',
    eventTime: '10:00', location: 'Y', organizer: 'Z'
  });
  assert.equal(error, 'Event date cannot be in the past');
});

test('validateEventInput rejects a negative ticket price', () => {
  const error = validateEventInput({
    title: 'X', category: 'Concert', eventDate: '2099-01-01', eventTime: '10:00',
    location: 'Y', organizer: 'Z', ticketPrice: -5
  });
  assert.equal(error, 'Ticket price cannot be negative');
});

test('validateEventInput accepts a valid future event', () => {
  const error = validateEventInput({
    title: 'X', category: 'Concert', eventDate: '2099-01-01', eventTime: '10:00',
    location: 'Y', organizer: 'Z', ticketPrice: 10, maxParticipants: 5
  });
  assert.equal(error, null);
});

test('todayDateString returns a plain YYYY-MM-DD string', () => {
  assert.match(todayDateString(), /^\d{4}-\d{2}-\d{2}$/);
});
