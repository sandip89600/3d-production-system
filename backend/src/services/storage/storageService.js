const s3Service = require('./s3Service');
const cloudinaryService = require('./cloudinaryService');
const localStorageService = require('./localStorageService');

const File = require('../../models/File');
const { generateFileName } = require('../../utils/fileValidator');

/**
 * Returns the storage provider based on STORAGE_PROVIDER env setting
 */
const getStorageProvider = () => {
  switch (process.env.STORAGE_PROVIDER) {
    case 's3':
      return s3Service;
    case 'cloudinary':
      return cloudinaryService;
    default:
      return localStorageService;
  }
};

const activeProvider = getStorageProvider();

/**
 * Resolves a provider instance by name (used for operations on specific file records)
 */
const getProviderByName = (name) => {
  switch (name) {
    case 's3':
      return s3Service;
    case 'cloudinary':
      return cloudinaryService;
    default:
      return localStorageService;
  }
};

/**
 * Upload a file to the active provider and persist metadata in MongoDB.
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
  const path = require('path');
  const ext = path.extname(originalName).toLowerCase();
  
  let finalBuffer = buffer;
  let finalMimeType = mimeType;
  let finalFileSize = fileSize;
  let finalOriginalName = originalName;
  let compressionStatus = 'none';
  let compressedName = null;
  let compressedSize = null;

  const MAX_LIMIT = 100 * 1024 * 1024; // 100 MB
  if (fileSize > MAX_LIMIT) {
    try {
      const AdmZip = require('adm-zip');
      const zip = new AdmZip();
      zip.addFile(originalName, buffer);
      
      finalBuffer = zip.toBuffer();
      finalMimeType = 'application/zip';
      finalFileSize = finalBuffer.length;
      
      const parsed = path.parse(originalName);
      finalOriginalName = parsed.ext.toLowerCase() === '.zip' ? originalName : `${parsed.name}.zip`;
      
      compressionStatus = 'compressed';
      compressedName = finalOriginalName;
      compressedSize = finalFileSize;
    } catch (err) {
      console.error('[StorageService] In-memory ZIP compression failed:', err);
      compressionStatus = 'failed';
    }
  }

  const fileName = generateFileName(finalOriginalName);
  
  // Delegate physical upload to the active provider
  const { url, storageKey } = await activeProvider.upload(
    finalBuffer,
    folder,
    fileName,
    finalMimeType,
    { uploadedBy, projectId }
  );

  // Persist metadata in MongoDB (project_files record)
  const fileRecord = await File.create({
    originalName,
    fileName,
    mimeType: finalMimeType,
    fileSize: finalFileSize,
    extension: path.extname(finalOriginalName).toLowerCase(),
    originalExtension: ext,
    compressedName,
    originalSize: fileSize,
    compressedSize,
    compressionStatus,
    provider: process.env.STORAGE_PROVIDER || 'local',
    url,
    storageKey,
    folder,
    uploadedBy,
    projectId: projectId || undefined,
  });

  // Create upload_logs record
  try {
    const UploadLog = require('../../models/UploadLog');
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
    const { logger } = require('../../utils/logger');
    logger.error('[StorageService] Failed to create upload log:', { error: err.message });
  }

  return { url, storageKey, fileRecord };
};

/**
 * Delete a file by its File document _id.
 */
const deleteFile = async (fileId) => {
  const record = await File.findById(fileId);
  if (!record) return false;

  const provider = getProviderByName(record.provider);
  await provider.delete(record.storageKey, record.mimeType);

  record.isDeleted = true;
  record.deletedAt = new Date();
  await record.save();
  return true;
};

/**
 * Delete a file by its storage key (URL for local, key for S3, publicId for Cloudinary).
 */
const deleteFileByKey = async (storageKey, providerName, mimeType = '') => {
  if (!storageKey) return;
  
  // Try to find the file record by either storageKey or URL
  const record = await File.findOne({
    $or: [{ storageKey }, { url: storageKey }],
    isDeleted: false,
  });

  if (record) {
    const provider = getProviderByName(record.provider);
    await provider.delete(record.storageKey, record.mimeType || mimeType);
    record.isDeleted = true;
    record.deletedAt = new Date();
    await record.save();
  } else {
    // Fallback: delete using the raw storageKey with active or specified provider
    const pName = providerName || process.env.STORAGE_PROVIDER || 'local';
    const provider = getProviderByName(pName);
    await provider.delete(storageKey, mimeType);
  }
};

/**
 * Get a time-limited signed URL for a private file.
 */
const getSignedUrl = async (fileId, expiresIn = 3600) => {
  const record = await File.findById(fileId);
  if (!record) throw new Error('File record not found');

  const provider = getProviderByName(record.provider);
  return provider.getSignedUrl(record.storageKey, expiresIn);
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
  PROVIDER: process.env.STORAGE_PROVIDER || 'local',
};
