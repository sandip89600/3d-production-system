const multer = require('multer');
const { validateFile, MAX_SIZES, ALLOWED_EXTENSIONS } = require('../utils/fileValidator');
const path = require('path');

/**
 * Reusable upload middleware factory.
 * All variants use memoryStorage — files are streamed to cloud, never written to disk.
 */

// ─── Generic category-aware file filter ──────────────────────────

const makeCategoryFilter = (category) => (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const allowed = ALLOWED_EXTENSIONS[category] || ALLOWED_EXTENSIONS.general;
  if (allowed.includes(ext)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Extension "${ext}" not allowed for category "${category}". Allowed: ${allowed.join(', ')}`
      ),
      false
    );
  }
};

// ─── Factory: single upload ───────────────────────────────────────

/**
 * Single file upload for a given field name and category.
 * @param {string} fieldName - multipart field name
 * @param {string} [category] - "projects"|"profiles"|"documents"|"deliverables"|"general"
 */
const uploadSingle = (fieldName, category = 'general') =>
  multer({
    storage: multer.memoryStorage(),
    fileFilter: makeCategoryFilter(category),
    limits: { fileSize: MAX_SIZES[category] || MAX_SIZES.general },
  }).single(fieldName);

// ─── Factory: multiple upload ─────────────────────────────────────

/**
 * Multiple file upload for a given field name and category.
 * @param {string} fieldName - multipart field name
 * @param {number} maxCount - max number of files
 * @param {string} [category]
 */
const uploadMultiple = (fieldName, maxCount = 10, category = 'general') =>
  multer({
    storage: multer.memoryStorage(),
    fileFilter: makeCategoryFilter(category),
    limits: { fileSize: MAX_SIZES[category] || MAX_SIZES.general },
  }).array(fieldName, maxCount);

// ─── Pre-configured variants ──────────────────────────────────────

/** Profile photo upload — image only, 5MB */
const uploadProfile = () => uploadSingle('photo', 'profiles');

/** Project file upload — 3D formats + archives, 500MB */
const uploadProjectFile = () => uploadSingle('file', 'projects');

/** Deliverable upload — archives, images, video, PDF, 500MB */
const uploadDeliverable = () => uploadMultiple('files', 10, 'deliverables');

/** Document upload — PDFs, office docs, 50MB */
const uploadDocument = () => uploadSingle('document', 'documents');

module.exports = {
  uploadSingle,
  uploadMultiple,
  uploadProfile,
  uploadProjectFile,
  uploadDeliverable,
  uploadDocument,
};
