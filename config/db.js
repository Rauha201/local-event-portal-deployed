// Creates one shared MySQL connection pool for the whole app.
// A pool (rather than one connection) lets Express handle several
// requests at the same time without queuing behind a single client.
//
// dateStrings: true — BUG FIX (Part 3). By default mysql2 turns DATE
// columns into JS Date objects. Since a DATE has no time zone of its
// own, mysql2 has to pick one, and once that value is later formatted
// with something timezone-aware (like toLocaleDateString()), an event
// stored as "2026-08-14" could display as Aug 13 for someone west of
// UTC. Getting plain "YYYY-MM-DD" strings back instead sidesteps the
// whole problem — see formatDateLabel() in public/js/main.js, which
// parses that string directly instead of building a Date from it.

const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: true
});

module.exports = pool;
