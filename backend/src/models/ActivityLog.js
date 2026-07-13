const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  userEmail: { type: String },
  userRole: { type: String },
  action: {
    type: String,
    enum: [
      'login', 'logout', 'login_failed', 'login_locked', 'register',
      'project_upload', 'project_update', 'project_delete',
      'project_assign', 'project_pickup', 'project_drop',
      'progress_update', 'file_upload', 'file_delete',
      'review_submit', 'review_approve', 'review_reject',
      'project_complete',
      'user_create', 'user_update', 'user_delete', 'user_deactivate',
      'department_create', 'department_update',
      'password_change', '2fa_setup', '2fa_verify',
      'profile_update', 'profile_view', 'forgot_password_request', 'password_reset',
      'forgot_password_email_otp', 'forgot_password_mobile_otp', 'otp_verification_success',
      'notification_read',
      'api_access',
    ],
    required: true,
  },
  target: { type: String }, // e.g. "Project: Car Exterior"
  targetId: { type: mongoose.Schema.Types.ObjectId },
  targetModel: { type: String },
  details: { type: mongoose.Schema.Types.Mixed },
  ip: { type: String },
  userAgent: { type: String },
  success: { type: Boolean, default: true },
  errorMessage: { type: String },
}, {
  timestamps: true,
});

activityLogSchema.index({ user: 1 });
activityLogSchema.index({ action: 1 });
activityLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
