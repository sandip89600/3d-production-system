const express = require('express');
const router = express.Router();
const {
  listNotifications,
  listUnread,
  getCount,
  searchNotifications,
  getOne,
  markRead,
  markAllRead,
  archiveOne,
  restoreOne,
  deleteOne,
  broadcastAnnouncement,
} = require('../controllers/notificationController');
const { authenticateJWT, requireRole } = require('../middleware/auth');
const {
  validateNotificationFilters,
  validateBroadcast,
} = require('../validators/notificationValidator');

// All notification routes require JWT
router.use(authenticateJWT);

// ── Static routes BEFORE parameterized /:id ───────────────────────

// GET /api/notifications
router.get('/', validateNotificationFilters, listNotifications);

// GET /api/notifications/unread
router.get('/unread', listUnread);

// GET /api/notifications/count
router.get('/count', getCount);

// GET /api/notifications/search
router.get('/search', validateNotificationFilters, searchNotifications);

// PUT /api/notifications/read-all
router.put('/read-all', markAllRead);

// POST /api/notifications/broadcast — Super Admin only
router.post('/broadcast', requireRole('superadmin', 'admin'), validateBroadcast, broadcastAnnouncement);

// ── Parameterized routes ──────────────────────────────────────────

// GET /api/notifications/:id
router.get('/:id', getOne);

// PUT /api/notifications/read/:id
router.put('/read/:id', markRead);

// PUT /api/notifications/archive/:id
router.put('/archive/:id', archiveOne);

// PUT /api/notifications/restore/:id
router.put('/restore/:id', restoreOne);

// DELETE /api/notifications/:id
router.delete('/:id', deleteOne);

module.exports = router;
