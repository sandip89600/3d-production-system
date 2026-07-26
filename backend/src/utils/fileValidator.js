const path = require('path');
const { v4: uuidv4 } = require('uuid');

/**
 * Centralized file validation and naming utilities.
 * Used by all upload middleware and services.
 */

// ─── MIME Type Whitelists ─────────────────────────────────────────

// ─── MIME Type Whitelists ─────────────────────────────────────────

const ALLOWED_MIMES = {
  projects: [
    'application/zip',
    'application/x-zip-compressed',
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/jpg',
    'image/vnd.dwg', 'image/x-dwg', 'application/acad', 'application/autocad_dwg', 'application/dwg', 'application/x-dwg', 'application/x-autocad', 'image/x-auto-cad',
    'image/vnd.dxf', 'image/x-dxf', 'application/dxf', 'application/x-dxf',
    'application/vnd.sketchup.skp',
    'model/vnd.collada+xml',
    'image/x-3ds', 'application/x-3ds',
    'image/vnd.adobe.photoshop', 'application/x-photoshop', 'image/psd',
    'image/x-cdr', 'application/cdr', 'application/coreldraw', 'application/x-coreldraw', 'image/cdr',
    'application/octet-stream',
  ],
  deliverables: [
    'application/zip',
    'application/x-zip-compressed',
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/jpg',
    'image/vnd.dwg', 'image/x-dwg', 'application/acad', 'application/autocad_dwg', 'application/dwg', 'application/x-dwg', 'application/x-autocad', 'image/x-auto-cad',
    'image/vnd.dxf', 'image/x-dxf', 'application/dxf', 'application/x-dxf',
    'application/vnd.sketchup.skp',
    'model/vnd.collada+xml',
    'image/x-3ds', 'application/x-3ds',
    'image/vnd.adobe.photoshop', 'application/x-photoshop', 'image/psd',
    'image/x-cdr', 'application/cdr', 'application/coreldraw', 'application/x-coreldraw', 'image/cdr',
    'application/octet-stream',
  ],
  profiles: [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/jpg',
  ],
  documents: [
    'application/zip',
    'application/x-zip-compressed',
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/jpg',
    'image/vnd.dwg', 'image/x-dwg', 'application/acad', 'application/autocad_dwg', 'application/dwg', 'application/x-dwg', 'application/x-autocad', 'image/x-auto-cad',
    'image/vnd.dxf', 'image/x-dxf', 'application/dxf', 'application/x-dxf',
    'application/vnd.sketchup.skp',
    'model/vnd.collada+xml',
    'image/x-3ds', 'application/x-3ds',
    'image/vnd.adobe.photoshop', 'application/x-photoshop', 'image/psd',
    'image/x-cdr', 'application/cdr', 'application/coreldraw', 'application/x-coreldraw', 'image/cdr',
    'application/octet-stream',
  ],
  general: [
    'application/zip',
    'application/x-zip-compressed',
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/jpg',
    'image/vnd.dwg', 'image/x-dwg', 'application/acad', 'application/autocad_dwg', 'application/dwg', 'application/x-dwg', 'application/x-autocad', 'image/x-auto-cad',
    'image/vnd.dxf', 'image/x-dxf', 'application/dxf', 'application/x-dxf',
    'application/vnd.sketchup.skp',
    'model/vnd.collada+xml',
    'image/x-3ds', 'application/x-3ds',
    'image/vnd.adobe.photoshop', 'application/x-photoshop', 'image/psd',
    'image/x-cdr', 'application/cdr', 'application/coreldraw', 'application/x-coreldraw', 'image/cdr',
    'application/octet-stream',
  ],
};

// ─── Allowed Extensions ───────────────────────────────────────────

const ALLOWED_EXTENSIONS = {
  projects: ['.jpg', '.jpeg', '.png', '.webp', '.dwg', '.dxf', '.skp', '.dae', '.3ds', '.max', '.psd', '.cdr', '.zip'],
  deliverables: ['.jpg', '.jpeg', '.png', '.webp', '.dwg', '.dxf', '.skp', '.dae', '.3ds', '.max', '.psd', '.cdr', '.zip'],
  profiles: ['.jpg', '.jpeg', '.png', '.webp'],
  documents: ['.jpg', '.jpeg', '.png', '.webp', '.dwg', '.dxf', '.skp', '.dae', '.3ds', '.max', '.psd', '.cdr', '.zip'],
  general: ['.jpg', '.jpeg', '.png', '.webp', '.dwg', '.dxf', '.skp', '.dae', '.3ds', '.max', '.psd', '.cdr', '.zip'],
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
  documents:    parseInt(process.env.MAX_DOCUMENT_SIZE) || 500 * 1024 * 1024,    // 500 MB
  general:      parseInt(process.env.MAX_FILE_SIZE) || 500 * 1024 * 1024,        // 500 MB
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

  // 1. Scan filename for path traversals
  const hasPathTraversal = /[\/\\]|^\.+$/.test(file.originalname);
  if (hasPathTraversal) {
    return { valid: false, reason: 'Security alert: Filename cannot contain path traversal characters.' };
  }

  // 2. Prevent executable uploads and scan double extensions
  const lowerName = file.originalname.toLowerCase();
  for (const blocked of BLOCKED_EXTENSIONS) {
    if (lowerName.includes(blocked)) {
      return { valid: false, reason: `Security alert: Executable or scripted files matching "${blocked}" are strictly blocked.` };
    }
  }

  // 3. Validate file extension
  const allowedExts = ALLOWED_EXTENSIONS[category] || ALLOWED_EXTENSIONS.general;
  if (!allowedExts.includes(ext)) {
    return {
      valid: false,
      reason: `File type "${ext}" is not allowed. Supported formats: ${allowedExts.map(e => e.slice(1)).join(', ')}`,
    };
  }

  // 4. Validate MIME type
  const allowedMimes = ALLOWED_MIMES[category] || ALLOWED_MIMES.general;
  // application/octet-stream is a broad fallback — allow if extension passes
  if (!allowedMimes.includes(mime) && mime !== 'application/octet-stream') {
    return {
      valid: false,
      reason: `MIME type "${mime}" is not allowed for category "${category}".`,
    };
  }

  // 5. Size validation
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
