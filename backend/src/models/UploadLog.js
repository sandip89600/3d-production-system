const mongoose = require('mongoose');

const uploadLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', index: true },
  fileId: { type: mongoose.Schema.Types.ObjectId, ref: 'File', required: true, index: true },
  uploadedAt: { type: Date, default: Date.now },
  ipAddress: { type: String, default: null },
  userAgent: { type: String, default: null },
  uploadSource: { type: String, enum: ['web', 'mobile', 'api'], default: 'web' },
}, {
  timestamps: true,
});

uploadLogSchema.index({ uploadedAt: -1 });

module.exports = mongoose.model('UploadLog', uploadLogSchema);
