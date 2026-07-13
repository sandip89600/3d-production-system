const storageService = require('../services/storageService');
const { validateFile } = require('../utils/fileValidator');
const { logActivity } = require('../middleware/auth');

/**
 * Upload Controller
 * Handles all direct upload API endpoints.
 */

// POST /api/upload/project
const uploadProjectFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }

    const validation = validateFile(req.file, 'projects');
    if (!validation.valid) {
      return res.status(400).json({ success: false, message: validation.reason });
    }

    const { url, storageKey, fileRecord } = await storageService.uploadFile({
      buffer: req.file.buffer,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      fileSize: req.file.size,
      folder: 'projects',
      uploadedBy: req.user._id,
      projectId: req.body.projectId || undefined,
    });

    await logActivity(req, 'file_upload', `Project file uploaded: ${req.file.originalname}`, {
      fileId: fileRecord._id,
      provider: storageService.PROVIDER,
    });

    res.status(201).json({
      success: true,
      message: 'Project file uploaded successfully',
      file: {
        id: fileRecord._id,
        url,
        storageKey,
        originalName: fileRecord.originalName,
        fileName: fileRecord.fileName,
        fileSize: fileRecord.fileSize,
        mimeType: fileRecord.mimeType,
        folder: fileRecord.folder,
        provider: fileRecord.provider,
        uploadedAt: fileRecord.createdAt,
      },
    });
  } catch (error) {
    console.error('[UploadController] uploadProjectFile error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/upload/profile
const uploadProfilePhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No photo uploaded.' });
    }

    const validation = validateFile(req.file, 'profiles');
    if (!validation.valid) {
      return res.status(400).json({ success: false, message: validation.reason });
    }

    const { url, storageKey, fileRecord } = await storageService.uploadFile({
      buffer: req.file.buffer,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      fileSize: req.file.size,
      folder: 'profiles',
      uploadedBy: req.user._id,
    });

    await logActivity(req, 'profile_update', 'Profile photo uploaded via upload API', {
      fileId: fileRecord._id,
    });

    res.status(201).json({
      success: true,
      message: 'Profile photo uploaded successfully',
      file: {
        id: fileRecord._id,
        url,
        storageKey,
        originalName: fileRecord.originalName,
        fileSize: fileRecord.fileSize,
        provider: fileRecord.provider,
        uploadedAt: fileRecord.createdAt,
      },
    });
  } catch (error) {
    console.error('[UploadController] uploadProfilePhoto error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/upload/document
const uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No document uploaded.' });
    }

    const validation = validateFile(req.file, 'documents');
    if (!validation.valid) {
      return res.status(400).json({ success: false, message: validation.reason });
    }

    const { url, storageKey, fileRecord } = await storageService.uploadFile({
      buffer: req.file.buffer,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      fileSize: req.file.size,
      folder: 'documents',
      uploadedBy: req.user._id,
    });

    await logActivity(req, 'file_upload', `Document uploaded: ${req.file.originalname}`, {
      fileId: fileRecord._id,
    });

    res.status(201).json({
      success: true,
      message: 'Document uploaded successfully',
      file: {
        id: fileRecord._id,
        url,
        storageKey,
        originalName: fileRecord.originalName,
        fileSize: fileRecord.fileSize,
        mimeType: fileRecord.mimeType,
        provider: fileRecord.provider,
        uploadedAt: fileRecord.createdAt,
      },
    });
  } catch (error) {
    console.error('[UploadController] uploadDocument error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/upload/:id
const getFileById = async (req, res) => {
  try {
    const fileRecord = await storageService.getFileById(req.params.id);
    if (!fileRecord) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }

    // Only uploader or admin/superadmin can view file details
    const isOwner = String(fileRecord.uploadedBy._id) === String(req.user._id);
    const isAdmin = ['admin', 'superadmin'].includes(req.user.role);
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // For S3 private files, generate a signed URL
    let accessUrl = fileRecord.url;
    if (fileRecord.provider === 's3' && process.env.AWS_S3_ACL !== 'public-read') {
      accessUrl = await storageService.getSignedUrl(fileRecord._id);
    }

    res.json({ success: true, file: { ...fileRecord.toObject(), accessUrl } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/upload/:id
const deleteFile = async (req, res) => {
  try {
    const fileRecord = await storageService.getFileById(req.params.id);
    if (!fileRecord) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }

    // Only uploader or superadmin can delete
    const isOwner = String(fileRecord.uploadedBy._id) === String(req.user._id);
    const isSuperAdmin = req.user.role === 'superadmin';
    if (!isOwner && !isSuperAdmin) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    await storageService.deleteFile(req.params.id);

    await logActivity(req, 'file_delete', `File deleted: ${fileRecord.originalName}`, {
      fileId: fileRecord._id,
      provider: fileRecord.provider,
    });

    res.json({ success: true, message: 'File deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/upload/:id/signed-url
const getSignedUrl = async (req, res) => {
  try {
    const expiresIn = parseInt(req.query.expiresIn) || 3600;
    const url = await storageService.getSignedUrl(req.params.id, expiresIn);
    res.json({ success: true, url, expiresIn });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  uploadProjectFile,
  uploadProfilePhoto,
  uploadDocument,
  getFileById,
  deleteFile,
  getSignedUrl,
};
