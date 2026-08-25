// Runs once at boot (called from server.js, after the DB connects
// and before the server starts accepting requests). If no admin
// account exists yet, creates the default one from the brief so
// there's always at least one way into the Admin System.
//
// Uses the project's own bcryptjs dependency and salt rounds — the
// same way every other password in this app is hashed — instead of a
// hardcoded hash sitting in a SQL file. Safe to call on every
// restart: findByEmail() short-circuits once the account exists, so
// it never re-creates or re-hashes anything.

const bcrypt = require('bcryptjs');
const AdminModel = require('../models/adminModel');

const DEFAULT_ADMIN = {
  fullName: 'Site Administrator',
  email: 'admin@example.com',
  password: 'admin123'
};

async function seedDefaultAdmin() {
  const existing = await AdminModel.findByEmail(DEFAULT_ADMIN.email);
  if (existing) return;

  const hashedPassword = await bcrypt.hash(DEFAULT_ADMIN.password, 10);
  await AdminModel.create({
    fullName: DEFAULT_ADMIN.fullName,
    email: DEFAULT_ADMIN.email,
    hashedPassword
  });

  console.log(`Default admin created — email: ${DEFAULT_ADMIN.email}  password: ${DEFAULT_ADMIN.password}`);
  console.log('Change this password after first login in a real deployment.');
}

module.exports = seedDefaultAdmin;
