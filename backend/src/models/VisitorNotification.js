const mongoose = require('mongoose');

const visitorNotificationSchema = new mongoose.Schema({
  sessionId: { type: String, required: true },
  visitorId: { type: String, required: true },
  country: { type: String, default: 'Unknown' },
  city: { type: String, default: 'Unknown' },
  deviceType: { type: String, default: 'Unknown' },
  browser: { type: String, default: 'Unknown' },
  visitedPage: { type: String, default: '/' },
  timestamp: { type: Date, default: Date.now, index: true },
  read: { type: Boolean, default: false, index: true }
}, {
  timestamps: true,
  collection: 'visitor_notifications'
});

module.exports = mongoose.model('VisitorNotification', visitorNotificationSchema);
