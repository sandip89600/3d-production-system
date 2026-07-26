const mongoose = require('mongoose');

const visitorSessionSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true, index: true },
  visitorId: { type: String, required: true, index: true },
  ipAddress: { type: String, required: true },
  country: { type: String, default: 'Unknown', index: true },
  state: { type: String, default: 'Unknown' },
  city: { type: String, default: 'Unknown', index: true },
  timezone: { type: String, default: 'UTC' },
  latitude: { type: Number, default: null },
  longitude: { type: Number, default: null },
  isp: { type: String, default: 'Unknown' },
  browser: { type: String, default: 'Unknown', index: true },
  browserVersion: { type: String, default: 'Unknown' },
  os: { type: String, default: 'Unknown', index: true },
  deviceType: { 
    type: String, 
    enum: ['Desktop', 'Mobile', 'Tablet', 'Unknown'], 
    default: 'Unknown', 
    index: true 
  },
  screenResolution: { type: String, default: '' },
  language: { type: String, default: 'en' },
  userAgent: { type: String, default: '' },
  referralSource: { type: String, default: 'Direct', index: true },
  landingPage: { type: String, default: '/' },
  visitStart: { type: Date, default: Date.now, index: true },
  visitEnd: { type: Date, default: Date.now, index: true },
  duration: { type: Number, default: 0 }, // in seconds
  exitPage: { type: String, default: null },
  status: { 
    type: String, 
    enum: ['online', 'offline'], 
    default: 'online', 
    index: true 
  },
  isNewVisitor: { type: Boolean, default: true }
}, {
  timestamps: true,
  collection: 'visitor_sessions'
});

// Compound indexes for optimal aggregation
visitorSessionSchema.index({ country: 1, city: 1 });
visitorSessionSchema.index({ visitStart: -1, status: 1 });

module.exports = mongoose.model('VisitorSession', visitorSessionSchema);
