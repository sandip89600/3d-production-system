const express = require('express');
const router = express.Router();
const {
  getOverview, getAdminPerformance, getEmployeePerformance, getDepartmentPerformance,
  getActivityLogs, getAdminDashboard, getEmployeeDashboard,
} = require('../controllers/analyticsController');
const { authenticateJWT, requireRole } = require('../middleware/auth');
const notificationService = require('../services/notificationService');
const Notification = require('../models/Notification');

router.use(authenticateJWT);

// Analytics
router.get('/overview', requireRole('superadmin', 'admin'), getOverview);
router.get('/admin-performance', requireRole('superadmin', 'admin'), getAdminPerformance);
router.get('/employee-performance', requireRole('superadmin', 'admin'), getEmployeePerformance);
router.get('/department-performance', requireRole('superadmin', 'admin'), getDepartmentPerformance);
router.get('/activity-logs', requireRole('superadmin', 'admin'), getActivityLogs);
router.get('/admin-dashboard', requireRole('admin', 'superadmin'), getAdminDashboard);
router.get('/employee-dashboard', requireRole('employee'), getEmployeeDashboard);

// Notifications
router.get('/notifications', async (req, res) => {
  try {
    const { page, limit } = req.query;
    const data = await notificationService.getUserNotifications(req.user._id, page, limit);
    const unreadCount = await notificationService.getUnreadCount(req.user._id);
    res.json({ success: true, ...data, unreadCount });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.put('/notifications/:id/read', async (req, res) => {
  try {
    await notificationService.markRead(req.params.id, req.user._id);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

router.put('/notifications/read-all', async (req, res) => {
  try {
    await notificationService.markAllRead(req.user._id);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

// WhatsApp database log
router.get('/whatsapp-log', requireRole('superadmin', 'admin'), async (req, res) => {
  try {
    const MessageLog = require('../models/MessageLog');
    const logs = await MessageLog.find()
      .populate('group', 'name category groupId')
      .populate('sender', 'name email role adminCode')
      .sort({ timestamp: -1 })
      .limit(100);
    res.json({ success: true, log: logs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
