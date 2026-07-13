const mongoose = require('mongoose');

const whatsappGroupSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  groupId: { type: String, required: true },
  category: { type: String, enum: ['architecture', 'modeling_rendering'], required: true },
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

module.exports = mongoose.model('WhatsAppGroup', whatsappGroupSchema);
