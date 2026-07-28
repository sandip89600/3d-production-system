const mongoose = require('mongoose');

const visitorWebhookSchema = new mongoose.Schema({
  url: { type: String, required: true },
  isEnabled: { type: Boolean, default: true },
  secret: { type: String, default: '' },
  lastTriggered: { type: Date, default: null },
  lastStatus: { type: String, default: null }, // 'success' | 'error'
  lastResponse: { type: String, default: '' },
}, {
  timestamps: true,
  collection: 'visitor_webhooks'
});

module.exports = mongoose.model('VisitorWebhook', visitorWebhookSchema);
