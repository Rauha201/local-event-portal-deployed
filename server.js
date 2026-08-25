require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

// CODE OPTIMIZATION (Part 4): fail immediately with a message that
// actually tells you what to do, instead of letting the app start
// and then throw a cryptic "secret or public key must be provided"
// error the first time someone logs in.
if (!process.env.JWT_SECRET || !process.env.DB_NAME) {
  console.error(
    'Missing required environment variables. Copy .env.example to .env ' +
    'and fill in DB_PASSWORD and JWT_SECRET before starting the server.'
  );
  process.exit(1);
}

const pool = require('./config/db');
const userRoutes = require('./routes/userRoutes');
const managerRoutes = require('./routes/managerRoutes');
const eventRoutes = require('./routes/eventRoutes');
const registrationRoutes = require('./routes/registrationRoutes');
const adminRoutes = require('./routes/adminRoutes');
const seedDefaultAdmin = require('./utils/seedAdmin');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

const app = express();

// --- Core middleware ---
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- API routes ---
app.use('/api/users', userRoutes);
app.use('/api/managers', managerRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/registrations', registrationRoutes);
app.use('/api/admins', adminRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// --- Error handling (always registered last) ---
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Confirm the database is reachable before accepting traffic —
// fail loudly and immediately rather than serving broken requests.
pool.query('SELECT 1')
  .then(async () => {
    console.log('MySQL connected');
    await seedDefaultAdmin();
    app.listen(PORT, () => console.log(`Server running: http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error('Could not connect to MySQL:', err.message);
    process.exit(1);
  });
