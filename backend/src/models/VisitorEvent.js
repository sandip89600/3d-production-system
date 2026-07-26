const mongoose = require('mongoose');

const visitorEventSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, index: true },
  type: { 
    type: String, 
    enum: ['page_view', 'click', 'scroll', 'exit'], 
    required: true, 
    index: true 
  },
  page: { type: String, required: true, index: true },
  meta: { type: mongoose.Schema.Types.Mixed, default: {} },
  timestamp: { type: Date, default: Date.now, index: true }
}, {
  timestamps: false,
  collection: 'visitor_events'
});

// Compound index for analyzing user flow chronologically
visitorEventSchema.index({ sessionId: 1, timestamp: 1 });

module.exports = mongoose.model('VisitorEvent', visitorEventSchema);
