// Plain SQL, same style as userModel.js / managerModel.js. findAll()
// and findById() join in the manager's name — small enough not to
// need a separate query, and Part 3's Event Details page can reuse
// findById() as-is.

const pool = require('../config/db');

const EventModel = {
  async create(event) {
    const {
      managerId, title, description, category, eventDate, eventTime,
      location, organizer, ticketPrice, image, maxParticipants
    } = event;
    const [result] = await pool.query(
      `INSERT INTO events
        (manager_id, title, description, category, event_date, event_time, location, organizer, ticket_price, image, max_participants)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [managerId, title, description, category, eventDate, eventTime, location, organizer, ticketPrice, image, maxParticipants]
    );
    return result.insertId;
  },

  // `search` is optional — existing callers (public browse/search on
  // events.html) keep calling findAll() with no arguments and are
  // completely unaffected. Admin > Events is the only caller that
  // passes a term.
  async findAll(search) {
    if (search) {
      const [rows] = await pool.query(
        `SELECT e.*, m.full_name AS manager_name
         FROM events e JOIN managers m ON e.manager_id = m.manager_id
         WHERE e.title LIKE ? OR e.category LIKE ? OR e.location LIKE ?
         ORDER BY e.event_date ASC`,
        [`%${search}%`, `%${search}%`, `%${search}%`]
      );
      return rows;
    }
    const [rows] = await pool.query(
      `SELECT e.*, m.full_name AS manager_name
       FROM events e JOIN managers m ON e.manager_id = m.manager_id
       ORDER BY e.event_date ASC`
    );
    return rows;
  },

  async findById(id) {
    const [rows] = await pool.query(
      `SELECT e.*, m.full_name AS manager_name,
              (SELECT COUNT(*) FROM registrations r WHERE r.event_id = e.event_id) AS registered_count
       FROM events e JOIN managers m ON e.manager_id = m.manager_id
       WHERE e.event_id = ?`,
      [id]
    );
    return rows[0];
  },

  async findByManager(managerId) {
    const [rows] = await pool.query(
      'SELECT * FROM events WHERE manager_id = ? ORDER BY event_date ASC',
      [managerId]
    );
    return rows;
  },

  async update(id, event) {
    const {
      title, description, category, eventDate, eventTime,
      location, organizer, ticketPrice, image, maxParticipants
    } = event;
    await pool.query(
      `UPDATE events SET
        title = ?, description = ?, category = ?, event_date = ?, event_time = ?,
        location = ?, organizer = ?, ticket_price = ?, image = ?, max_participants = ?
       WHERE event_id = ?`,
      [title, description, category, eventDate, eventTime, location, organizer, ticketPrice, image, maxParticipants, id]
    );
  },

  async delete(id) {
    await pool.query('DELETE FROM events WHERE event_id = ?', [id]);
  },

  // --- Admin System addition ---
  async count() {
    const [rows] = await pool.query('SELECT COUNT(*) AS count FROM events');
    return rows[0].count;
  }
};

module.exports = EventModel;
