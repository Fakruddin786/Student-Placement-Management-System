const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

/**
 * Authentication Middleware for protected company routes
 */
function authenticateCompany(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. No token provided.',
      });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication token missing.',
      });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error('CRITICAL: JWT_SECRET environment variable is missing.');
      return res.status(500).json({
        success: false,
        message: 'Server security configuration error.',
      });
    }

    jwt.verify(token, secret, (err, decoded) => {
      if (err) {
        if (err.name === 'TokenExpiredError') {
          return res.status(401).json({
            success: false,
            message: 'Session expired. Please log in again.',
          });
        }
        return res.status(401).json({
          success: false,
          message: 'Invalid authentication token.',
        });
      }

      // Attach decoded company details to request
      req.company = {
        id: decoded.id,
        email: decoded.email,
        company_name: decoded.company_name,
      };

      next();
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Internal authorization error.',
      error: error.message,
    });
  }
}

module.exports = {
  authenticateCompany,
};
