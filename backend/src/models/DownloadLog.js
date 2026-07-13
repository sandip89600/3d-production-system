const mongoose = require('mongoose');

const downloadLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', index: true },
  fileId: { type: mongoose.Schema.Types.ObjectId, ref: 'File', required: true, index: true },
  downloadedAt: { type: Date, default: Date.now },
  ipAddress: { type: String, default: null },
  userAgent: { type: String, default: null },
  deviceType: { type: String, default: 'desktop' },
}, {
  timestamps: true,
});

downloadLogSchema.index({ downloadedAt: -1 });

module.exports = mongoose.model('DownloadLog', downloadLogSchema);
