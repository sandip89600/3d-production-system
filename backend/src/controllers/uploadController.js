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

    const File = require('../models/File');
    const duplicate = await File.findOne({
      originalName: req.file.originalname,
      isDeleted: false
    });
    if (duplicate) {
      return res.status(400).json({ success: false, message: `Security alert: A file named "${req.file.originalname}" already exists in the system. Please rename the file before uploading.` });
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

    const File = require('../models/File');
    const duplicate = await File.findOne({
      originalName: req.file.originalname,
      isDeleted: false
    });
    if (duplicate) {
      return res.status(400).json({ success: false, message: `Security alert: A file named "${req.file.originalname}" already exists in the system. Please rename the file before uploading.` });
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

    // Only uploader or admin/developer can view file details
    const isOwner = String(fileRecord.uploadedBy._id) === String(req.user._id);
    const isAdmin = ['admin', 'developer'].includes(req.user.role);
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

    // Only uploader or developer can delete
    const isOwner = String(fileRecord.uploadedBy._id) === String(req.user._id);
    const isDeveloper = req.user.role === 'developer';
    if (!isOwner && !isDeveloper) {
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

// GET /api/upload/:id/download  — Stream/Download file directly
const downloadFile = async (req, res) => {
  try {
    const fileRecord = await storageService.getFileById(req.params.id);
    if (!fileRecord) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }

    // Only owner or admin/developer/employee can download
    const isOwner = String(fileRecord.uploadedBy._id) === String(req.user._id);
    const hasAccess = ['admin', 'developer', 'employee', 'client'].includes(req.user.role);
    if (!isOwner && !hasAccess) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Log the download request to unified DownloadLog
    const DownloadLog = require('../models/DownloadLog');
    const ua = req.headers['user-agent'] || '';
    const isMobile = /mobile/i.test(ua);
    const deviceType = isMobile ? 'mobile' : 'desktop';
    
    await DownloadLog.create({
      userId: req.user._id,
      projectId: fileRecord.projectId || undefined,
      fileId: fileRecord._id,
      downloadedAt: new Date(),
      ipAddress: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress,
      userAgent: ua,
      deviceType,
    });

    // Log download in ProjectDownloadLog if it has a projectId
    if (fileRecord.projectId) {
      try {
        const ProjectDownloadLog = require('../models/ProjectDownloadLog');
        await ProjectDownloadLog.create({
          project: fileRecord.projectId,
          employee: req.user._id,
          fileName: fileRecord.originalName,
          ipAddress: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress,
          userAgent: ua,
        });
      } catch (logErr) {
        console.error('Failed to log in ProjectDownloadLog:', logErr.message);
      }
    }

    // Also log in unified ActivityLog
    await logActivity(req, 'file_download', `Downloaded file: ${fileRecord.originalName}`, { fileId: fileRecord._id });

    const dlName = fileRecord.compressionStatus === 'compressed' ? fileRecord.compressedName : fileRecord.originalName;

    if (fileRecord.provider === 'local') {
      const path = require('path');
      const fs = require('fs');
      const relPath = fileRecord.storageKey.startsWith('/') ? fileRecord.storageKey.slice(1) : fileRecord.storageKey;
      const fullPath = path.join(__dirname, '../../../', relPath);

      if (!fs.existsSync(fullPath)) {
        return res.status(404).json({ success: false, message: 'File not found on local disk' });
      }
      return res.download(fullPath, dlName);
    } else {
      if (fileRecord.provider === 's3') {
        try {
          const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
          const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
          
          const s3Client = new S3Client({
            region: process.env.AWS_REGION || 'ap-south-1',
            credentials: {
              accessKeyId: process.env.AWS_ACCESS_KEY_ID,
              secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            },
          });
          const command = new GetObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: fileRecord.storageKey,
            ResponseContentDisposition: `attachment; filename="${dlName}"`
          });
          const downloadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
          return res.redirect(downloadUrl);
        } catch (s3Err) {
          console.error('[Download] Presigned S3 URL failed, falling back to fetch stream:', s3Err);
        }
      }
      
      // Fallback: Stream directly from URL using fetch
      const response = await fetch(fileRecord.url);
      if (!response.ok) {
        return res.status(response.status).json({ success: false, message: 'Failed to stream file from cloud' });
      }
      res.setHeader('Content-Type', fileRecord.mimeType || 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="${dlName}"`);
      const { Readable } = require('stream');
      const reader = response.body.getReader();
      const nodeStream = new Readable({
        async read() {
          const { done, value } = await reader.read();
          if (done) {
            this.push(null);
          } else {
            this.push(Buffer.from(value));
          }
        }
      });
      nodeStream.pipe(res);
    }
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
  downloadFile,
};
