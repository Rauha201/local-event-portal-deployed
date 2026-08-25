// protect()   confirms the request carries a valid JWT.
// authorize() confirms that token belongs to an allowed role.
// Used together on a route, e.g.:
//   router.get('/dashboard', protect, authorize('manager'), handler)

const jwt = require('jsonwebtoken');

function protect(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Not authorized, no token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET); // { id, role, iat, exp }
    next();
  } catch (err) {
    res.status(401).json({ message: 'Not authorized, token invalid or expired' });
  }
}

function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'You do not have access to this resource' });
    }
    next();
  };
}

module.exports = { protect, authorize };
