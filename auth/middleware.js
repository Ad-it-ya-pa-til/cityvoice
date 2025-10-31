/**
 * Authentication Middleware
 * Protects routes and checks permissions
 */

const Auth = require('./auth');

/**
 * Require authentication
 */
function requireAuth(req, res, next) {
  try {
    // Get token from header
    const token = req.headers['x-auth-token'] || 
                  req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'No token, authorization denied' });
    }

    // Verify token
    const user = Auth.getUserFromToken(token);
    if (!user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Add user to request
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ error: 'Token is not valid' });
  }
}

/**
 * Require admin role
 */
function requireAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if (!Auth.isAdmin(req.user)) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    next();
  });
}

/**
 * Optional auth (doesn't block if no token)
 */
function optionalAuth(req, res, next) {
  try {
    const token = req.headers['x-auth-token'] || 
                  req.headers.authorization?.replace('Bearer ', '');

    if (token) {
      const user = Auth.getUserFromToken(token);
      if (user) {
        req.user = user;
      }
    }
    next();
  } catch (error) {
    next();
  }
}

module.exports = {
  requireAuth,
  requireAdmin,
  optionalAuth
};
