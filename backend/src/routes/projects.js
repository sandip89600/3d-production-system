const express = require('express');
const router = express.Router();
const {
  getProjects, getProjectById, createProject, updateProject, deleteProject,
  pickupProject, updateProgress, submitForReview, approveProject, rejectProject, getProgressLogs,
  getSecureDownloadUrl, getProjectDownloadLogs,
} = require('../controllers/projectController');
const { authenticateJWT, requireRole } = require('../middleware/auth');
const upload = require('../config/multer');
const { uploadLimiter } = require('../middleware/rateLimiter');

router.use(authenticateJWT);
router.get('/', getProjects);
router.get('/:id/download-secure', getSecureDownloadUrl);
router.get('/:id/download-logs', requireRole('developer', 'admin'), getProjectDownloadLogs);
router.get('/:id', getProjectById);
router.get('/:id/progress-logs', getProgressLogs);
router.post('/', requireRole('admin', 'developer'), uploadLimiter, upload.single('file'), createProject);
router.put('/:id', requireRole('admin', 'developer'), updateProject);
router.delete('/:id', requireRole('developer', 'admin'), deleteProject);
router.post('/:id/pickup', requireRole('employee'), pickupProject);
router.post('/:id/progress', requireRole('employee'), upload.array('files', 5), updateProgress);
router.post('/:id/submit-review', requireRole('employee'), submitForReview);
router.post('/:id/approve', requireRole('admin', 'developer'), approveProject);
router.post('/:id/reject', requireRole('admin', 'developer'), rejectProject);

module.exports = router;
