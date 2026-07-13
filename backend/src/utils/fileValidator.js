const path = require('path');
const { v4: uuidv4 } = require('uuid');

/**
 * Centralized file validation and naming utilities.
 * Used by all upload middleware and services.
 */

// ─── MIME Type Whitelists ─────────────────────────────────────────

const ALLOWED_MIMES = {
  projects: [
    'application/zip',
    'application/x-zip-compressed',
    'application/x-rar-compressed',
    'application/octet-stream', // .blend, .max, .fbx, .rar fallback
    'application/x-blender',
    'model/fbx',
  ],
  deliverables: [
    'application/zip',
    'application/x-zip-compressed',
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'video/mp4',
    'video/x-msvideo',
    'application/octet-stream',
  ],
  profiles: [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/jpg',
  ],
  documents: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'image/jpeg',
    'image/png',
  ],
  general: [
    'application/zip',
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/octet-stream',
  ],
};

// ─── Allowed Extensions ───────────────────────────────────────────

const ALLOWED_EXTENSIONS = {
  projects: ['.zip', '.rar', '.blend', '.max', '.fbx', '.obj', '.stl'],
  deliverables: ['.zip', '.rar', '.pdf', '.jpg', '.jpeg', '.png', '.webp', '.mp4', '.avi'],
  profiles: ['.jpg', '.jpeg', '.png', '.webp'],
  documents: ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt', '.jpg', '.jpeg', '.png'],
  general: ['.zip', '.pdf', '.jpg', '.jpeg', '.png', '.webp'],
};

// ─── Dangerous Extensions Blocklist ──────────────────────────────

const BLOCKED_EXTENSIONS = [
  '.exe', '.bat', '.cmd', '.sh', '.bash', '.zsh',
  '.php', '.py', '.js', '.ts', '.rb', '.pl',
  '.vbs', '.wsf', '.ps1', '.jar', '.com', '.msi',
  '.dll', '.so', '.scr', '.hta',
];

// ─── Max Sizes ────────────────────────────────────────────────────

const MAX_SIZES = {
  profiles:     parseInt(process.env.MAX_PROFILE_SIZE) || 5 * 1024 * 1024,       //   5 MB
  projects:     parseInt(process.env.MAX_PROJECT_SIZE) || 500 * 1024 * 1024,     // 500 MB
  deliverables: parseInt(process.env.MAX_PROJECT_SIZE) || 500 * 1024 * 1024,     // 500 MB
  documents:    parseInt(process.env.MAX_DOCUMENT_SIZE) || 50 * 1024 * 1024,     //  50 MB
  general:      parseInt(process.env.MAX_FILE_SIZE) || 100 * 1024 * 1024,        // 100 MB
};

// ─── Validation ───────────────────────────────────────────────────

/**
 * Validate a file against a specific category.
 * Returns { valid: true } or { valid: false, reason: string }
 */
const validateFile = (file, category = 'general') => {
  const ext = path.extname(file.originalname).toLowerCase();
  const mime = file.mimetype;
  const size = file.size;

  // Block dangerous extensions unconditionally
  if (BLOCKED_EXTENSIONS.includes(ext)) {
    return { valid: false, reason: `File extension "${ext}" is not allowed for security reasons.` };
  }

  const allowedExts = ALLOWED_EXTENSIONS[category] || ALLOWED_EXTENSIONS.general;
  if (!allowedExts.includes(ext)) {
    return {
      valid: false,
      reason: `Extension "${ext}" is not allowed in category "${category}". Allowed: ${allowedExts.join(', ')}`,
    };
  }

  const allowedMimes = ALLOWED_MIMES[category] || ALLOWED_MIMES.general;
  // application/octet-stream is a broad fallback — allow if extension passes
  if (!allowedMimes.includes(mime) && mime !== 'application/octet-stream') {
    return {
      valid: false,
      reason: `MIME type "${mime}" is not allowed in category "${category}".`,
    };
  }

  const maxSize = MAX_SIZES[category] || MAX_SIZES.general;
  if (size > maxSize) {
    return {
      valid: false,
      reason: `File size ${(size / 1024 / 1024).toFixed(2)} MB exceeds the ${(maxSize / 1024 / 1024).toFixed(0)} MB limit for category "${category}".`,
    };
  }

  return { valid: true };
};

// ─── Filename Generator ───────────────────────────────────────────

/**
 * Generate a unique, sanitized filename.
 * Format: <uuid>-<timestamp><ext>
 */
const generateFileName = (originalName) => {
  const ext = path.extname(originalName).toLowerCase();
  const ts = Date.now();
  return `${uuidv4()}-${ts}${ext}`;
};

/**
 * Sanitize original filename for safe storage key usage.
 */
const sanitizeName = (name) =>
  name
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_+/g, '_')
    .toLowerCase();

module.exports = {
  validateFile,
  generateFileName,
  sanitizeName,
  ALLOWED_MIMES,
  ALLOWED_EXTENSIONS,
  MAX_SIZES,
};
