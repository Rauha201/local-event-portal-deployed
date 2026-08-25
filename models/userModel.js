// Every function here is a plain SQL query — no ORM. That keeps
// the data layer easy to read, easy to explain in a viva, and
// easy to extend later (e.g. adding a "findRegisteredEvents" query
// once Part 3 builds registrations).

const pool = require('../config/db');

const UserModel = {
  async create({ fullName, email, hashedPassword }) {
    const [result] = await pool.query(
      'INSERT INTO users (full_name, email, password) VALUES (?, ?, ?)',
      [fullName, email, hashedPassword]
    );
    return result.insertId;
  },

  async findByEmail(email) {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    return rows[0];
  },

  async findById(id) {
    const [rows] = await pool.query(
      'SELECT user_id, full_name, email, created_at FROM users WHERE user_id = ?',
      [id]
    );
    return rows[0];
  },

  // --- Admin System additions below ---
  // findAll()/count() power Admin > Users; delete() powers the
  // "Delete user" action there. ON DELETE CASCADE on registrations
  // (see database/schema.sql) means deleting a user also removes
  // their registrations automatically, no extra query needed.
  async findAll(search) {
    if (search) {
      const [rows] = await pool.query(
        `SELECT user_id, full_name, email, created_at FROM users
         WHERE full_name LIKE ? OR email LIKE ?
         ORDER BY created_at DESC`,
        [`%${search}%`, `%${search}%`]
      );
      return rows;
    }
    const [rows] = await pool.query(
      'SELECT user_id, full_name, email, created_at FROM users ORDER BY created_at DESC'
    );
    return rows;
  },

  async count() {
    const [rows] = await pool.query('SELECT COUNT(*) AS count FROM users');
    return rows[0].count;
  },

  async delete(id) {
    await pool.query('DELETE FROM users WHERE user_id = ?', [id]);
  }
};

module.exports = UserModel;
