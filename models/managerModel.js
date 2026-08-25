// Deliberately a mirror of userModel.js. Managers and users are
// separate tables (see database/schema.sql) so keeping their model
// files parallel — same method names, same shapes — makes the
// codebase predictable: once you understand one, you understand
// the other.

const pool = require('../config/db');

const ManagerModel = {
  async create({ fullName, email, hashedPassword }) {
    const [result] = await pool.query(
      'INSERT INTO managers (full_name, email, password) VALUES (?, ?, ?)',
      [fullName, email, hashedPassword]
    );
    return result.insertId;
  },

  async findByEmail(email) {
    const [rows] = await pool.query('SELECT * FROM managers WHERE email = ?', [email]);
    return rows[0];
  },

  async findById(id) {
    const [rows] = await pool.query(
      'SELECT manager_id, full_name, email, status, created_at FROM managers WHERE manager_id = ?',
      [id]
    );
    return rows[0];
  },

  // --- Admin System additions below ---
  // findAll()/count() power Admin > Managers; updateStatus() backs
  // Approve/Reject; delete() backs "Delete manager". ON DELETE CASCADE
  // on events (see database/schema.sql) means deleting a manager also
  // removes their events (and, transitively, those events'
  // registrations), so no extra cleanup queries are needed here.
  async findAll(search) {
    if (search) {
      const [rows] = await pool.query(
        `SELECT manager_id, full_name, email, status, created_at FROM managers
         WHERE full_name LIKE ? OR email LIKE ?
         ORDER BY created_at DESC`,
        [`%${search}%`, `%${search}%`]
      );
      return rows;
    }
    const [rows] = await pool.query(
      'SELECT manager_id, full_name, email, status, created_at FROM managers ORDER BY created_at DESC'
    );
    return rows;
  },

  async count() {
    const [rows] = await pool.query('SELECT COUNT(*) AS count FROM managers');
    return rows[0].count;
  },

  async updateStatus(id, status) {
    await pool.query('UPDATE managers SET status = ? WHERE manager_id = ?', [status, id]);
  },

  async delete(id) {
    await pool.query('DELETE FROM managers WHERE manager_id = ?', [id]);
  }
};

module.exports = ManagerModel;
