const mongoose = require('mongoose');

const visitorStatisticSchema = new mongoose.Schema({
  date: { type: String, required: true, unique: true, index: true }, // Format: YYYY-MM-DD
  totalSessions: { type: Number, default: 0 },
  uniqueVisitors: { type: Number, default: 0 },
  totalPageViews: { type: Number, default: 0 },
  deviceBreakdown: { type: mongoose.Schema.Types.Mixed, default: {} },
  browserBreakdown: { type: mongoose.Schema.Types.Mixed, default: {} },
  countryBreakdown: { type: mongoose.Schema.Types.Mixed, default: {} },
  cityBreakdown: { type: mongoose.Schema.Types.Mixed, default: {} },
  referralBreakdown: { type: mongoose.Schema.Types.Mixed, default: {} }
}, {
  timestamps: true,
  collection: 'visitor_statistics'
});

module.exports = mongoose.model('VisitorStatistic', visitorStatisticSchema);
