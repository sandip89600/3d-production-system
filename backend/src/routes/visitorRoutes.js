const express = require('express');
const router = express.Router();
const {
  trackSessionStart,
  trackHeartbeat,
  trackEvent,
  getLiveAnalytics,
  getLiveVisitorsList,
  getHistoricalCharts,
  exportAnalyticsReport
} = require('../controllers/visitorController');
const { authenticateJWT, requireRole } = require('../middleware/auth');

// Public visitor tracking routes (unauthenticated)
router.post('/track/start', trackSessionStart);
router.post('/track/heartbeat', trackHeartbeat);
router.post('/track/event', trackEvent);

// Secured developer/admin routes (authenticated)
router.get('/admin/stats', authenticateJWT, requireRole('developer', 'admin'), getLiveAnalytics);
router.get('/admin/live', authenticateJWT, requireRole('developer', 'admin'), getLiveVisitorsList);
router.get('/admin/charts', authenticateJWT, requireRole('developer', 'admin'), getHistoricalCharts);
router.get('/admin/export', authenticateJWT, requireRole('developer', 'admin'), exportAnalyticsReport);

module.exports = router;
