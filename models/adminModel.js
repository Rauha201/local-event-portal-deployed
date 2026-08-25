// Deliberately a mirror of userModel.js / managerModel.js — same
// method names, same shapes — so it fits the existing pattern instead
// of inventing a new one. There is no self-registration endpoint for
// admins (see utils/seedAdmin.js): count()/findByEmail() exist so the
// server can seed exactly one default admin on first boot.

const pool = require('../config/db');

const AdminModel = {
  async create({ fullName, email, hashedPassword }) {
    const [result] = await pool.query(
      'INSERT INTO admins (full_name, email, password) VALUES (?, ?, ?)',
      [fullName, email, hashedPassword]
    );
    return result.insertId;
  },

  async findByEmail(email) {
    const [rows] = await pool.query('SELECT * FROM admins WHERE email = ?', [email]);
    return rows[0];
  },

  async findById(id) {
    const [rows] = await pool.query(
      'SELECT admin_id, full_name, email, created_at FROM admins WHERE admin_id = ?',
      [id]
    );
    return rows[0];
  },

  async count() {
    const [rows] = await pool.query('SELECT COUNT(*) AS count FROM admins');
    return rows[0].count;
  }
};

module.exports = AdminModel;
