const mongoose = require('mongoose');

const notificationLogSchema = new mongoose.Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  type: { type: String, enum: ['upload', 'pickup', 'progress', 'complete', 'summary'], required: true },
  whatsappGroup: { type: mongoose.Schema.Types.ObjectId, ref: 'WhatsAppGroup' },
  messageLog: { type: mongoose.Schema.Types.ObjectId, ref: 'MessageLog' },
  sentSuccessfully: { type: Boolean, default: true },
  timestamp: { type: Date, default: Date.now }
}, {
  timestamps: true
});

module.exports = mongoose.model('NotificationLog', notificationLogSchema);
