const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const File = require('../models/File');
const { generateFileName } = require('../utils/fileValidator');

/**
 * Storage Service — Provider Abstraction Layer
 *
 * Routes file operations to the active provider:
 *   - "local"      → disk at ./uploads (default for development)
 *   - "s3"         → AWS S3
 *   - "cloudinary" → Cloudinary
 *
 * Controlled via STORAGE_PROVIDER env variable.
 */

const PROVIDER = process.env.STORAGE_PROVIDER || 'local';

// ─── Local Disk Helpers ───────────────────────────────────────────

const getLocalUploadDir = (folder) => {
  const base = process.env.UPLOAD_PATH || path.join(__dirname, '../../uploads');
  const dir = path.join(base, folder);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
};

const saveLocally = (buffer, folder, fileName) => {
  const dir = getLocalUploadDir(folder);
  const filePath = path.join(dir, fileName);
  fs.writeFileSync(filePath, buffer);
  // Build a URL path relative to the backend root
  const url = `/uploads/${folder}/${fileName}`;
  return { url, storageKey: url };
};

const deleteLocally = (storageKey) => {
  // storageKey for local = "/uploads/profiles/uuid.webp"
  const relPath = storageKey.startsWith('/') ? storageKey.slice(1) : storageKey;
  const fullPath = path.join(__dirname, '../..', relPath);
  if (fs.existsSync(fullPath)) {
    try {
      fs.unlinkSync(fullPath);
    } catch (err) {
      console.warn('[StorageService] Could not delete local file:', err.message);
    }
  }
};

const getS3Key = async (folder, fileName, uploadedBy, projectId) => {
  const cleanFileName = fileName;
  
  if (folder === 'profiles') {
    return `users/${uploadedBy}/profile/${cleanFileName}`;
  }
  
  if (projectId) {
    try {
      const Project = require('../models/Project');
      const projectDoc = await Project.findById(projectId);
      const projectIdCode = projectDoc ? projectDoc.projectId : projectId;
      
      if (folder === 'projects') {
        return `projects/${projectIdCode}/source/${cleanFileName}`;
      }
      if (folder === 'deliverables') {
        return `deliverables/${projectIdCode}/final/${cleanFileName}`;
      }
      if (folder === 'previews') {
        return `previews/${projectIdCode}/images/${cleanFileName}`;
      }
    } catch (err) {
      console.error('[StorageService] Error getting project code for S3 key:', err.message);
    }
  }

  // Fallbacks
  if (folder === 'projects') return `projects/${projectId || 'general'}/source/${cleanFileName}`;
  if (folder === 'deliverables') return `deliverables/${projectId || 'general'}/final/${cleanFileName}`;
  if (folder === 'previews') return `previews/${projectId || 'general'}/images/${cleanFileName}`;
  if (folder === 'profiles') return `users/${uploadedBy || 'general'}/profile/${cleanFileName}`;
  
  return `${folder}/${cleanFileName}`;
};

// ─── Core: Upload ─────────────────────────────────────────────────

/**
 * Upload a file to the active provider and persist metadata in MongoDB.
 *
 * @param {Object} opts
 * @param {Buffer}              opts.buffer       - Raw file buffer (from multer memoryStorage)
 * @param {string}              opts.originalName - Original filename from client
 * @param {string}              opts.mimeType     - MIME type
 * @param {number}              opts.fileSize     - Size in bytes
 * @param {string}              [opts.folder]     - "projects"|"profiles"|"documents"|"deliverables"|"general"
 * @param {ObjectId|string}     opts.uploadedBy   - User _id
 * @param {ObjectId|string}     [opts.projectId]  - Project _id (optional)
 * @param {string}              [opts.ipAddress]  - Client IP
 * @param {string}              [opts.userAgent]  - User Agent
 * @returns {Promise<{ url, storageKey, fileRecord }>}
 */
const uploadFile = async ({
  buffer,
  originalName,
  mimeType,
  fileSize,
  folder = 'general',
  uploadedBy,
  projectId,
  ipAddress = null,
  userAgent = null,
}) => {
  const fileName = generateFileName(originalName);
  const ext = path.extname(originalName).toLowerCase();
  let url, storageKey;

  if (PROVIDER === 's3') {
    const { uploadToS3 } = require('./awsS3Service');
    const key = await getS3Key(folder, fileName, uploadedBy, projectId);
    ({ url, storageKey } = await uploadToS3(buffer, key, mimeType));
  } else if (PROVIDER === 'cloudinary') {
    const { uploadToCloudinary } = require('./cloudinaryService');
    const publicId = `${folder}/${path.basename(fileName, ext)}`;
    const resourceType = mimeType.startsWith('image/') ? 'image' : mimeType.startsWith('video/') ? 'video' : 'raw';
    ({ url, storageKey } = await uploadToCloudinary(buffer, folder, publicId, resourceType));
  } else {
    // Default: local disk
    ({ url, storageKey } = saveLocally(buffer, folder, fileName));
  }

  // Persist metadata in MongoDB (project_files record)
  const fileRecord = await File.create({
    originalName,
    fileName,
    mimeType,
    fileSize,
    extension: ext,
    provider: PROVIDER,
    url,
    storageKey,
    folder,
    uploadedBy,
    projectId: projectId || undefined,
  });

  // Create upload_logs record
  try {
    const UploadLog = require('../models/UploadLog');
    await UploadLog.create({
      userId: uploadedBy,
      projectId: projectId || undefined,
      fileId: fileRecord._id,
      uploadedAt: new Date(),
      ipAddress,
      userAgent,
      uploadSource: 'web',
    });
  } catch (err) {
    console.error('[StorageService] Failed to create upload log:', err.message);
  }

  return { url, storageKey, fileRecord };
};

// ─── Core: Delete ─────────────────────────────────────────────────

/**
 * Delete a file by its File document _id.
 * Removes from cloud/disk AND soft-marks the DB record.
 *
 * @param {string} fileId - MongoDB _id of the File document
 * @returns {Promise<boolean>}
 */
const deleteFile = async (fileId) => {
  const record = await File.findById(fileId);
  if (!record) return false;

  await _deleteByKey(record.storageKey, record.provider, record.mimeType);

  record.isDeleted = true;
  record.deletedAt = new Date();
  await record.save();
  return true;
};

/**
 * Delete a file by its storage key (URL for local, key for S3, publicId for Cloudinary).
 * Used internally when we know the key but not the File _id (e.g., old profile photos).
 *
 * @param {string} storageKey
 * @param {string} [provider] - defaults to current PROVIDER
 * @param {string} [mimeType]
 */
const deleteFileByKey = async (storageKey, provider, mimeType = '') => {
  if (!storageKey) return;
  
  // Try to find the file record by either storageKey or URL
  const record = await File.findOne({
    $or: [{ storageKey }, { url: storageKey }],
    isDeleted: false,
  });

  if (record) {
    await _deleteByKey(record.storageKey, record.provider, record.mimeType || mimeType);
    record.isDeleted = true;
    record.deletedAt = new Date();
    await record.save();
  } else {
    // Fallback: delete using the raw storageKey (e.g. legacy files or path)
    const p = provider || PROVIDER;
    await _deleteByKey(storageKey, p, mimeType);
  }
};

const _deleteByKey = async (storageKey, provider, mimeType = '') => {
  if (provider === 's3') {
    const { deleteFromS3 } = require('./awsS3Service');
    await deleteFromS3(storageKey);
  } else if (provider === 'cloudinary') {
    const { deleteFromCloudinary } = require('./cloudinaryService');
    const resourceType = mimeType.startsWith('image/') ? 'image' : mimeType.startsWith('video/') ? 'video' : 'raw';
    await deleteFromCloudinary(storageKey, resourceType);
  } else {
    deleteLocally(storageKey);
  }
};

// ─── Core: Signed URL ─────────────────────────────────────────────

/**
 * Get a time-limited signed URL for a private file.
 * Only meaningful for S3 (Cloudinary public URLs are always accessible).
 *
 * @param {string} fileId - MongoDB _id of File document
 * @param {number} expiresIn - Seconds (default 3600)
 * @returns {Promise<string>} URL
 */
const getSignedUrl = async (fileId, expiresIn = 3600) => {
  const record = await File.findById(fileId);
  if (!record) throw new Error('File record not found');

  if (record.provider === 's3') {
    const { getS3SignedUrl } = require('./awsS3Service');
    return getS3SignedUrl(record.storageKey, expiresIn);
  }

  // For cloudinary and local — the stored URL is directly accessible
  return record.url;
};

// ─── Query Helpers ────────────────────────────────────────────────

const getFileById = (fileId) => File.findById(fileId).populate('uploadedBy', 'name email');

const getFilesByProject = (projectId) =>
  File.find({ projectId, isDeleted: false })
    .populate('uploadedBy', 'name email')
    .sort({ createdAt: -1 });

const getFilesByUser = (userId, folder) => {
  const query = { uploadedBy: userId, isDeleted: false };
  if (folder) query.folder = folder;
  return File.find(query).sort({ createdAt: -1 });
};

module.exports = {
  uploadFile,
  deleteFile,
  deleteFileByKey,
  getSignedUrl,
  getFileById,
  getFilesByProject,
  getFilesByUser,
  PROVIDER,
};
