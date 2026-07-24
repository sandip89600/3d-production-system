const mongoose = require('mongoose');

const messageLogSchema = new mongoose.Schema({
  group: { type: mongoose.Schema.Types.ObjectId, ref: 'WhatsAppGroup' },
  recipient: { type: String, required: true },
  message: { type: String, required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Null for system crons
  status: { type: String, enum: ['sent', 'delivered', 'read', 'failed', 'simulated'], required: true },
  sid: { type: String },
  timestamp: { type: Date, default: Date.now }
}, {
  timestamps: true
});

module.exports = mongoose.model('MessageLog', messageLogSchema);
