import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Not authorized' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      return res.status(401).json({ message: 'User no longer exists' });
    }

    // Check if user account is active
    if (!req.user.isActive) {
      return res.status(403).json({ message: 'Account deactivated. Contact admin.' });
    }

    // Single Session Enforcement: Check if JWT sessionId matches the one in DB
    if (decoded.sessionId && req.user.currentSessionId && decoded.sessionId !== req.user.currentSessionId) {
      return res.status(401).json({ message: 'SESSION_EXPIRED', detail: 'Logged in from another device' });
    }

    // Keep session alive by updating lastActive
    req.user.lastActive = new Date();
    await req.user.save();

    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token invalid' });
  }
};

export const adminOnly = (req, res, next) => {
  if (req.user?.role !== 'admin') return res.status(403).json({ message: 'Admin only' });
  next();
};
