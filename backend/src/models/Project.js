const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  projectId: { type: String, unique: true },
  name: { type: String, required: true, trim: true },
  type: {
    type: String,
    enum: ['3D architecture', 'Modeling', 'rendering', 'VFX', 'Other'],
    required: true,
  },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
  description: { type: String, trim: true },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium',
  },
  deadline: { type: Date, required: true },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: {
    type: String,
    enum: ['pending', 'available', 'in-progress', 'review', 'completed', 'delayed'],
    default: 'available',
  },
  progress: { type: Number, default: 0, min: 0, max: 100 },
  fileUrl: { type: String },
  fileName: { type: String },
  fileSize: { type: Number },
  fileType: { type: String },
  tags: [{ type: String, trim: true }],
  whatsappNotified: { type: Boolean, default: false },
  whatsappNotifiedAt: { type: Date },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  completedAt: { type: Date },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewNotes: { type: String },
  clientName: { type: String, trim: true },
  estimatedDays: { type: Number },
}, {
  timestamps: true,
});

// Pre-save hook to generate unique Project ID
projectSchema.pre('save', async function (next) {
  if (!this.projectId) {
    try {
      const User = mongoose.model('User');
      const uploader = await User.findById(this.uploadedBy);
      
      let adminCode = 'ADM';
      if (uploader) {
        if (uploader.role === 'superadmin') {
          adminCode = 'SUP';
        } else if (uploader.adminCode) {
          adminCode = uploader.adminCode.toUpperCase();
        }
      }

      const year = new Date().getFullYear();
      const startOfYear = new Date(year, 0, 1);
      const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999);

      // Find the latest project in the current year uploaded by this admin
      const latestProject = await mongoose.model('Project').findOne({
        uploadedBy: this.uploadedBy,
        createdAt: { $gte: startOfYear, $lte: endOfYear }
      }).sort({ createdAt: -1 });

      let sequence = 1;
      if (latestProject && latestProject.projectId) {
        const parts = latestProject.projectId.split('-');
        if (parts.length === 3) {
          const lastSeq = parseInt(parts[2], 10);
          if (!isNaN(lastSeq)) {
            sequence = lastSeq + 1;
          }
        }
      }

      const paddedSequence = String(sequence).padStart(3, '0');
      this.projectId = `${adminCode}-${year}-${paddedSequence}`;
    } catch (err) {
      return next(err);
    }
  }
  next();
});

// Auto-set delayed status
projectSchema.methods.checkDelay = function () {
  if (this.deadline < new Date() && !['completed'].includes(this.status)) {
    this.status = 'delayed';
  }
};

projectSchema.index({ department: 1 });
projectSchema.index({ status: 1 });
projectSchema.index({ uploadedBy: 1 });
projectSchema.index({ deadline: 1 });
projectSchema.index({ assignedTo: 1 });

module.exports = mongoose.model('Project', projectSchema);
