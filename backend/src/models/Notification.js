const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    // ─── Recipients & Senders ───────────────────────────────
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },

    // ─── Content ────────────────────────────────────────────
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    icon: { type: String, default: 'bell' }, // icon name hint for frontend

    // ─── Classification ─────────────────────────────────────
    type: {
      type: String,
      enum: [
        // Authentication
        'login_success',
        'login_failed',
        'password_changed',
        'password_reset',
        'two_factor_enabled',
        // Project lifecycle
        'project_upload',
        'project_assigned',
        'project_picked',
        'project_started',
        'progress_update',
        'project_submitted',
        'project_approved',
        'project_rejected',
        'project_completed',
        'project_cancelled',
        // Employee events
        'employee_added',
        'employee_updated',
        'employee_deactivated',
        'employee_reactivated',
        // Department events
        'department_created',
        'department_updated',
        'department_deleted',
        // Deadline events
        'deadline_3days',
        'deadline_1day',
        'deadline_missed',
        // Review (legacy compat)
        'review_request',
        'review_approved',
        'review_rejected',
        // System
        'system',
        'whatsapp_sent',
        'announcement',
        'security_alert',
        'maintenance',
        'feature_release',
        // Deadline legacy
        'deadline_alert',
      ],
      required: true,
    },
    category: {
      type: String,
      enum: ['info', 'success', 'warning', 'error', 'announcement'],
      default: 'info',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'low',
    },

    // ─── References ─────────────────────────────────────────
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
    },
    data: { type: mongoose.Schema.Types.Mixed }, // extra context
    link: { type: String },

    // ─── Status ─────────────────────────────────────────────
    read: { type: Boolean, default: false },
    readAt: { type: Date },
    isArchived: { type: Boolean, default: false },
    archivedAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

// ─── Indexes for Performance ──────────────────────────────────
notificationSchema.index({ recipient: 1, read: 1 });
notificationSchema.index({ recipient: 1, isArchived: 1 });
notificationSchema.index({ recipient: 1, category: 1 });
notificationSchema.index({ recipient: 1, priority: 1 });
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
