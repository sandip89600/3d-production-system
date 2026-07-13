const mongoose = require('mongoose');

const progressLogSchema = new mongoose.Schema({
  assignment: { type: mongoose.Schema.Types.ObjectId, ref: 'ProjectAssignment', required: true },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  day: { type: Number, required: true }, // Day number (1, 2, 3...)
  date: { type: Date, default: Date.now },
  progressPercentage: { type: Number, required: true, min: 0, max: 100 },
  notes: { type: String, trim: true },
  uploadedFiles: [{
    fileName: String,
    fileUrl: String,
    fileSize: Number,
    fileType: String,
    uploadedAt: { type: Date, default: Date.now },
  }],
  blockers: { type: String, trim: true },
  timeSpent: { type: Number }, // Hours (optional)
}, {
  timestamps: true,
});

progressLogSchema.index({ assignment: 1, day: 1 }, { unique: true });
progressLogSchema.index({ employee: 1 });
progressLogSchema.index({ project: 1 });
progressLogSchema.index({ date: 1 });

module.exports = mongoose.model('ProgressLog', progressLogSchema);
