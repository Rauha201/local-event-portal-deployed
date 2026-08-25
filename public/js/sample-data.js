// Fallback data only — used if the API can't be reached (e.g. the
// server isn't running). Field names deliberately match what
// GET /api/events actually returns, so createEventCard() in main.js
// doesn't need to know which source it's rendering.

const SAMPLE_EVENTS = [
  {
    title: 'Riverside Music Night',
    category: 'Concert',
    event_date: '2026-08-14',
    location: 'Riverside Amphitheater',
    ticket_price: 12,
    rating: 4.7,
    image: 'event-placeholder-1.jpg'
  },
  {
    title: 'Handmade Craft Workshop',
    category: 'Workshop',
    event_date: '2026-08-20',
    location: 'Community Arts Center',
    ticket_price: 0,
    rating: 4.5,
    image: 'event-placeholder-2.jpg'
  },
  {
    title: 'Neighborhood Football Cup',
    category: 'Sports',
    event_date: '2026-08-28',
    location: 'Central Sports Ground',
    ticket_price: 5,
    rating: 4.8,
    image: 'event-placeholder-3.jpg'
  }
];
