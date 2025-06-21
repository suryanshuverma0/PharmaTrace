
const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || "pharma-trace-secret";
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is required');
}

const authMiddleware = (roles = []) => {
  return (req, res, next) => {
    try {
      let token = null;

      if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        token = req.headers.authorization.split(' ')[1];
      } else if (req.headers.authorization) {
        token = req.headers.authorization;
      } else if (req.query.token) {
        token = req.query.token;
      }

      if (!token) {
        return res.status(401).json({
          message: 'Authentication required. No token provided.',
          error: 'NO_TOKEN',
        });
      }

      const decoded = jwt.verify(token, JWT_SECRET);

      if (roles.length && !roles.includes(decoded.role)) {
        return res.status(403).json({
          message: 'Access denied. Insufficient permissions.',
          error: 'INVALID_ROLE',
        });
      }

      req.user = {
        userId: decoded.userId,
        role: decoded.role,
        address: decoded.address,
      };

      next();
    } catch (err) {
      if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
          message: 'Invalid token format or signature',
          error: 'INVALID_TOKEN',
          details: err.message,
        });
      } else if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          message: 'Token has expired',
          error: 'TOKEN_EXPIRED',
          details: err.message,
        });
      }

      return res.status(401).json({
        message: 'Authentication failed',
        error: err.message,
      });
    }
  };
};

module.exports = authMiddleware;