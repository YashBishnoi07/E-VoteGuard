const jwt = require('jsonwebtoken');
const Voter = require('../models/Voter');

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided. Authorization denied.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const voter = await Voter.findById(decoded.id).select('-password');
    if (!voter) {
      return res.status(401).json({ message: 'Token is invalid. User not found.' });
    }

    if (voter.isBlocked) {
      return res.status(403).json({ message: 'Account has been blocked due to suspicious activity.' });
    }

    req.user = voter;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired. Please login again.' });
    }
    return res.status(401).json({ message: 'Token is invalid.' });
  }
};

const adminMiddleware = async (req, res, next) => {
  await authMiddleware(req, res, () => {
    if (req.user && req.user.role === 'admin') {
      next();
    } else {
      return res.status(403).json({ message: 'Admin access required.' });
    }
  });
};

module.exports = { authMiddleware, adminMiddleware };
