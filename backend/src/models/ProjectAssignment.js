const mongoose = require('mongoose');

const projectAssignmentSchema = new mongoose.Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  pickupDate: { type: Date, default: Date.now },
  startDate: { type: Date, default: Date.now },
  completedDate: { type: Date },
  status: {
    type: String,
    enum: ['active', 'review', 'completed', 'dropped', 'delayed'],
    default: 'active',
  },
  progress: { type: Number, default: 0, min: 0, max: 100 },
  totalDaysWorked: { type: Number, default: 0 },
  delayDays: { type: Number, default: 0 },
  employeeNotes: { type: String },
  adminReviewNotes: { type: String },
  reviewRequestedAt: { type: Date },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, {
  timestamps: true,
});

projectAssignmentSchema.index({ project: 1, employee: 1 }, { unique: true });
projectAssignmentSchema.index({ employee: 1 });
projectAssignmentSchema.index({ status: 1 });

module.exports = mongoose.model('ProjectAssignment', projectAssignmentSchema);
