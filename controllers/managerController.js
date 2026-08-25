const bcrypt = require('bcryptjs');
const ManagerModel = require('../models/managerModel');
const generateToken = require('../utils/generateToken');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function registerManager(req, res, next) {
  try {
    const { fullName, email, password } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({ message: 'Full name, email and password are all required' });
    }
    if (!EMAIL_REGEX.test(email)) {
      return res.status(400).json({ message: 'Please enter a valid email address' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const existingManager = await ManagerModel.findByEmail(email);
    if (existingManager) {
      return res.status(400).json({ message: 'An account with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const managerId = await ManagerModel.create({ fullName, email, hashedPassword });
    const token = generateToken(managerId, 'manager');

    res.status(201).json({
      token,
      user: { id: managerId, fullName, email, role: 'manager' }
    });
  } catch (err) {
    next(err);
  }
}

async function loginManager(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const manager = await ManagerModel.findByEmail(email);
    const passwordMatches = manager && (await bcrypt.compare(password, manager.password));

    if (!passwordMatches) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Added for the Admin System: managers default to 'approved' on
    // self-registration (see database/schema.sql), so this only ever
    // blocks someone an admin has explicitly rejected — everyone else
    // logs in exactly as before.
    if (manager.status === 'rejected') {
      return res.status(403).json({ message: 'Your manager account has been rejected by the administrator' });
    }

    const token = generateToken(manager.manager_id, 'manager');
    res.json({
      token,
      user: { id: manager.manager_id, fullName: manager.full_name, email: manager.email, role: 'manager' }
    });
  } catch (err) {
    next(err);
  }
}

async function getProfile(req, res, next) {
  try {
    const manager = await ManagerModel.findById(req.user.id);
    res.json(manager);
  } catch (err) {
    next(err);
  }
}

module.exports = { registerManager, loginManager, getProfile };
