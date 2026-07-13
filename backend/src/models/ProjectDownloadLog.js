const mongoose = require('mongoose');

const projectDownloadLogSchema = new mongoose.Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  fileName: { type: String, required: true },
  downloadedAt: { type: Date, default: Date.now },
  ipAddress: { type: String },
  userAgent: { type: String },
}, {
  timestamps: true,
});

module.exports = mongoose.model('ProjectDownloadLog', projectDownloadLogSchema);
