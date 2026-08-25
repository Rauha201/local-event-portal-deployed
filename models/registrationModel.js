// Same plain-SQL style as the other models. findByUser() pulls in
// full event details (e.*) so "My Registrations" has everything it
// needs in one call; findByEventForManager() pulls in the
// registrant's name/email so a manager's participant list is useful
// without a second request.

const pool = require('../config/db');

const RegistrationModel = {
  async create({ userId, eventId, paymentStatus }) {
    const [result] = await pool.query(
      'INSERT INTO registrations (user_id, event_id, payment_status) VALUES (?, ?, ?)',
      [userId, eventId, paymentStatus]
    );
    return result.insertId;
  },

  async countForEvent(eventId) {
    const [rows] = await pool.query(
      'SELECT COUNT(*) AS count FROM registrations WHERE event_id = ?',
      [eventId]
    );
    return rows[0].count;
  },

  // Powers "View Registered Events" (public/registrations.html)
  async findByUser(userId) {
    const [rows] = await pool.query(
      `SELECT r.registration_id, r.payment_status, r.registered_at, e.*
       FROM registrations r JOIN events e ON r.event_id = e.event_id
       WHERE r.user_id = ?
       ORDER BY e.event_date ASC`,
      [userId]
    );
    return rows;
  },

  // Powers the payment receipt PDF (GET /api/registrations/:id/receipt).
  // Scoped to userId so a user can only ever fetch their own receipt —
  // the ownership check lives in the query itself, not just the
  // controller, the same defense-in-depth pattern as
  // getEventParticipants()'s manager_id check in
  // registrationController.js.
  async findByIdForUser(registrationId, userId) {
    const [rows] = await pool.query(
      `SELECT r.registration_id, r.payment_status, r.registered_at,
              u.full_name AS user_name, u.email AS user_email,
              e.title AS event_title, e.event_date, e.event_time,
              e.location, e.organizer, e.ticket_price
       FROM registrations r
       JOIN users u ON r.user_id = u.user_id
       JOIN events e ON r.event_id = e.event_id
       WHERE r.registration_id = ? AND r.user_id = ?`,
      [registrationId, userId]
    );
    return rows[0];
  },

  // Powers "View Participants" on the Manager Dashboard
  async findByEventForManager(eventId) {
    const [rows] = await pool.query(
      `SELECT r.registration_id, r.payment_status, r.registered_at, u.user_id, u.full_name, u.email
       FROM registrations r JOIN users u ON r.user_id = u.user_id
       WHERE r.event_id = ?
       ORDER BY r.registered_at ASC`,
      [eventId]
    );
    return rows;
  },

  // --- Admin System additions below ---
  // Powers Admin > Registrations — every registration in the system,
  // with enough user/event context to search and display without a
  // second round trip per row.
  async findAll(search) {
    const base = `
      SELECT r.registration_id, r.payment_status, r.registered_at,
             u.user_id, u.full_name AS user_name, u.email AS user_email,
             e.event_id, e.title AS event_title
      FROM registrations r
      JOIN users u ON r.user_id = u.user_id
      JOIN events e ON r.event_id = e.event_id`;

    if (search) {
      const [rows] = await pool.query(
        `${base} WHERE u.full_name LIKE ? OR u.email LIKE ? OR e.title LIKE ?
         ORDER BY r.registered_at DESC`,
        [`%${search}%`, `%${search}%`, `%${search}%`]
      );
      return rows;
    }
    const [rows] = await pool.query(`${base} ORDER BY r.registered_at DESC`);
    return rows;
  },

  async count() {
    const [rows] = await pool.query('SELECT COUNT(*) AS count FROM registrations');
    return rows[0].count;
  },

  async delete(id) {
    await pool.query('DELETE FROM registrations WHERE registration_id = ?', [id]);
  }
};

module.exports = RegistrationModel;
