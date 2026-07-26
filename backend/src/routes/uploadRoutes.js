const express = require('express');
const router = express.Router();
const {
  uploadProjectFile,
  uploadProfilePhoto,
  uploadDocument,
  getFileById,
  deleteFile,
  getSignedUrl,
  downloadFile,
} = require('../controllers/uploadController');
const { authenticateJWT, requireRole } = require('../middleware/auth');
const {
  uploadProjectFile: multerProject,
  uploadProfile: multerProfile,
  uploadDocument: multerDoc,
} = require('../middleware/uploadMiddleware');
const { uploadLimiter } = require('../middleware/rateLimiter');

// All routes require JWT
router.use(authenticateJWT);

// POST /api/upload/project  — Admin / Developer upload 3D project files
router.post(
  '/project',
  requireRole('admin', 'developer'),
  uploadLimiter,
  multerProject(),
  uploadProjectFile
);

// POST /api/upload/profile  — Any authenticated user uploads own profile photo
router.post('/profile', uploadLimiter, multerProfile(), uploadProfilePhoto);

// POST /api/upload/document  — Admin / Developer upload documents
router.post(
  '/document',
  requireRole('admin', 'developer'),
  uploadLimiter,
  multerDoc(),
  uploadDocument
);

// GET /api/upload/:id  — Get file metadata + access URL
router.get('/:id', getFileById);

// GET /api/upload/:id/download  — Stream and force download a file directly
router.get('/:id/download', downloadFile);

// GET /api/upload/:id/signed-url  — Generate time-limited signed URL (S3 private)
router.get('/:id/signed-url', getSignedUrl);

// DELETE /api/upload/:id  — Delete file (owner or developer)
router.delete('/:id', deleteFile);

module.exports = router;
