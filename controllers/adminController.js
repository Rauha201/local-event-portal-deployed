const bcrypt = require('bcryptjs');
const AdminModel = require('../models/adminModel');
const UserModel = require('../models/userModel');
const ManagerModel = require('../models/managerModel');
const EventModel = require('../models/eventModel');
const RegistrationModel = require('../models/registrationModel');
const generateToken = require('../utils/generateToken');

// ---------------------------------------------------------------
// Auth — same shape as userController/managerController so login.html
// and auth.js work with the admin role without any special-casing.
// There is deliberately no registerAdmin(): the only admin account is
// the one seeded at boot (see utils/seedAdmin.js). Opening a public
// self-registration endpoint for the highest-privileged role would
// undercut the whole point of having one.
// ---------------------------------------------------------------

async function loginAdmin(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const admin = await AdminModel.findByEmail(email);
    const passwordMatches = admin && (await bcrypt.compare(password, admin.password));

    if (!passwordMatches) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = generateToken(admin.admin_id, 'admin');
    res.json({
      token,
      user: { id: admin.admin_id, fullName: admin.full_name, email: admin.email, role: 'admin' }
    });
  } catch (err) {
    next(err);
  }
}

async function getProfile(req, res, next) {
  try {
    const admin = await AdminModel.findById(req.user.id);
    res.json(admin);
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------

async function getDashboardStats(req, res, next) {
  try {
    const [totalUsers, totalManagers, totalEvents, totalRegistrations] = await Promise.all([
      UserModel.count(),
      ManagerModel.count(),
      EventModel.count(),
      RegistrationModel.count()
    ]);

    // Recent Activities: pull the last few rows from each table and
    // merge them into one timeline. Four small queries instead of one
    // UNION, because the tables don't share a column shape — this
    // keeps each query readable and lets every activity carry the
    // fields it actually needs.
    const [recentUsers, recentManagers, recentEvents, recentRegistrations] = await Promise.all([
      UserModel.findAll(),
      ManagerModel.findAll(),
      EventModel.findAll(),
      RegistrationModel.findAll()
    ]);

    const activities = [
      ...recentUsers.slice(0, 5).map((u) => ({
        type: 'user',
        message: `${u.full_name} registered as a user`,
        at: u.created_at
      })),
      ...recentManagers.slice(0, 5).map((m) => ({
        type: 'manager',
        message: `${m.full_name} registered as an event manager`,
        at: m.created_at
      })),
      ...recentEvents.slice(0, 5).map((e) => ({
        type: 'event',
        message: `${e.manager_name} posted "${e.title}"`,
        at: e.created_at
      })),
      ...recentRegistrations.slice(0, 5).map((r) => ({
        type: 'registration',
        message: `${r.user_name} registered for "${r.event_title}"`,
        at: r.registered_at
      }))
    ]
      .sort((a, b) => new Date(b.at) - new Date(a.at))
      .slice(0, 10);

    res.json({
      totalUsers,
      totalManagers,
      totalEvents,
      totalRegistrations,
      recentActivities: activities
    });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------
// User Management
// ---------------------------------------------------------------

async function getAllUsers(req, res, next) {
  try {
    res.json(await UserModel.findAll(req.query.search));
  } catch (err) {
    next(err);
  }
}

async function getUserById(req, res, next) {
  try {
    const user = await UserModel.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    next(err);
  }
}

async function deleteUser(req, res, next) {
  try {
    const user = await UserModel.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    await UserModel.delete(req.params.id);
    res.json({ message: 'User deleted' });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------
// Manager Management
// ---------------------------------------------------------------

async function getAllManagers(req, res, next) {
  try {
    res.json(await ManagerModel.findAll(req.query.search));
  } catch (err) {
    next(err);
  }
}

async function getManagerById(req, res, next) {
  try {
    const manager = await ManagerModel.findById(req.params.id);
    if (!manager) return res.status(404).json({ message: 'Manager not found' });
    res.json(manager);
  } catch (err) {
    next(err);
  }
}

async function approveManager(req, res, next) {
  try {
    const manager = await ManagerModel.findById(req.params.id);
    if (!manager) return res.status(404).json({ message: 'Manager not found' });
    await ManagerModel.updateStatus(req.params.id, 'approved');
    res.json({ message: 'Manager approved' });
  } catch (err) {
    next(err);
  }
}

async function rejectManager(req, res, next) {
  try {
    const manager = await ManagerModel.findById(req.params.id);
    if (!manager) return res.status(404).json({ message: 'Manager not found' });
    await ManagerModel.updateStatus(req.params.id, 'rejected');
    res.json({ message: 'Manager rejected' });
  } catch (err) {
    next(err);
  }
}

async function deleteManager(req, res, next) {
  try {
    const manager = await ManagerModel.findById(req.params.id);
    if (!manager) return res.status(404).json({ message: 'Manager not found' });
    // ON DELETE CASCADE (database/schema.sql) removes this manager's
    // events, and transitively their registrations, automatically.
    await ManagerModel.delete(req.params.id);
    res.json({ message: 'Manager deleted' });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------
// Event Management
// ---------------------------------------------------------------

async function getAllEvents(req, res, next) {
  try {
    res.json(await EventModel.findAll(req.query.search));
  } catch (err) {
    next(err);
  }
}

async function getEventById(req, res, next) {
  try {
    const event = await EventModel.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    res.json(event);
  } catch (err) {
    next(err);
  }
}

async function deleteEvent(req, res, next) {
  try {
    const event = await EventModel.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    // Unlike the manager-only delete in eventController.js, the admin
    // route has no ownership check by design — an admin can remove
    // any event.
    await EventModel.delete(req.params.id);
    res.json({ message: 'Event deleted' });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------
// Registration Management
// ---------------------------------------------------------------

async function getAllRegistrations(req, res, next) {
  try {
    res.json(await RegistrationModel.findAll(req.query.search));
  } catch (err) {
    next(err);
  }
}

async function deleteRegistration(req, res, next) {
  try {
    await RegistrationModel.delete(req.params.id);
    res.json({ message: 'Registration deleted' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  loginAdmin,
  getProfile,
  getDashboardStats,
  getAllUsers,
  getUserById,
  deleteUser,
  getAllManagers,
  getManagerById,
  approveManager,
  rejectManager,
  deleteManager,
  getAllEvents,
  getEventById,
  deleteEvent,
  getAllRegistrations,
  deleteRegistration
};
