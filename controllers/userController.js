const bcrypt = require('bcryptjs');
const UserModel = require('../models/userModel');
const generateToken = require('../utils/generateToken');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function registerUser(req, res, next) {
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

    const existingUser = await UserModel.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: 'An account with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = await UserModel.create({ fullName, email, hashedPassword });
    const token = generateToken(userId, 'user');

    res.status(201).json({
      token,
      user: { id: userId, fullName, email, role: 'user' }
    });
  } catch (err) {
    next(err);
  }
}

async function loginUser(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await UserModel.findByEmail(email);
    const passwordMatches = user && (await bcrypt.compare(password, user.password));

    if (!passwordMatches) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = generateToken(user.user_id, 'user');
    res.json({
      token,
      user: { id: user.user_id, fullName: user.full_name, email: user.email, role: 'user' }
    });
  } catch (err) {
    next(err);
  }
}

async function getProfile(req, res, next) {
  try {
    const user = await UserModel.findById(req.user.id);
    res.json(user);
  } catch (err) {
    next(err);
  }
}

module.exports = { registerUser, loginUser, getProfile };
