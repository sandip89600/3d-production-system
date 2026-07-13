const mongoose = require('mongoose');

/**
 * File Model
 * Stores metadata for every file uploaded to cloud storage.
 * Provider-agnostic: works with local disk, AWS S3, or Cloudinary.
 */
const fileSchema = new mongoose.Schema(
  {
    // ─── Identity ─────────────────────────────────────────────
    originalName: { type: String, required: true, trim: true },
    fileName: { type: String, required: true },       // sanitized unique name
    mimeType: { type: String, required: true },
    fileSize: { type: Number, required: true },       // bytes
    extension: { type: String },

    // ─── Storage ──────────────────────────────────────────────
    provider: {
      type: String,
      enum: ['local', 's3', 'cloudinary'],
      required: true,
    },
    url: { type: String, required: true },            // public/CDN URL
    storageKey: { type: String, required: true },     // S3 key / Cloudinary public_id / local path
    folder: {
      type: String,
      enum: ['projects', 'deliverables', 'profiles', 'documents', 'general'],
      default: 'general',
    },

    // ─── Ownership ────────────────────────────────────────────
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
    },

    // ─── Lifecycle ────────────────────────────────────────────
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

// ─── Indexes ──────────────────────────────────────────────────────
fileSchema.index({ uploadedBy: 1, createdAt: -1 });
fileSchema.index({ projectId: 1 });
fileSchema.index({ folder: 1 });
fileSchema.index({ storageKey: 1 }, { unique: true });

module.exports = mongoose.model('File', fileSchema);
