const mongoose = require('mongoose');

const loginAttemptSchema = new mongoose.Schema({
  email: { type: String, trim: true },
  ipAddress: { type: String },
  userAgent: { type: String },
  location: { type: String, default: 'Unknown' },
  timestamp: { type: Date, default: Date.now },
  success: { type: Boolean, default: false },
  roleAttempted: { type: String },
  browser: { type: String, default: 'Unknown' },
  isRouteAccess: { type: Boolean, default: false },
  route: { type: String },
  severity: { type: String, enum: ['INFO', 'WARNING', 'SECURITY', 'SYSTEM', 'CRITICAL'], default: 'INFO' }
});

module.exports = mongoose.model('LoginAttempt', loginAttemptSchema);
