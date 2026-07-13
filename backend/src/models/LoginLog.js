const mongoose = require('mongoose');

const loginLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  email: { type: String, required: true, index: true },
  role: { type: String, required: true },
  ipAddress: { type: String, default: null },
  userAgent: { type: String, default: null },
  loginTime: { type: Date, default: Date.now },
  logoutTime: { type: Date, default: null },
  sessionDuration: { type: Number, default: 0 }, // in seconds
  location: { type: String, default: 'Unknown' },
  status: { type: String, enum: ['success', 'failed'], default: 'success' },
  deviceType: { type: String, default: 'desktop' },
}, {
  timestamps: true,
});

loginLogSchema.index({ loginTime: -1 });

module.exports = mongoose.model('LoginLog', loginLogSchema);
