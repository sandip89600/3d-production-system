const express = require('express');
const router = express.Router();
const {
  getDeveloperDashboard,
  getAdminDashboard,
  getEmployeeDashboard,
  getProjectStatusStats,
  getMonthlyTrend,
  getDepartmentStats,
  getEmployeesPerformance,
  getRecentActivities,
  getDashboardNotifications,
  getClientDashboard,
} = require('../controllers/dashboardController');
const { authenticateJWT, requireRole } = require('../middleware/auth');
const { validateDashboardQueries } = require('../validators/dashboardValidator');

// Protect all routes under /api/dashboard with JWT
router.use(authenticateJWT);

// Role-specific Dashboards
router.get('/developer', requireRole('developer', 'admin'), getDeveloperDashboard);
router.get('/admin', requireRole('admin', 'developer'), getAdminDashboard);
router.get('/employee', requireRole('employee'), getEmployeeDashboard);
router.get('/client', requireRole('client'), getClientDashboard);

// Common Chart & Analytics APIs
router.get('/project-status', getProjectStatusStats);
router.get('/monthly', getMonthlyTrend);
router.get('/department', getDepartmentStats);
router.get('/employees', requireRole('developer', 'admin'), getEmployeesPerformance);
router.get('/recent-activities', requireRole('developer', 'admin'), validateDashboardQueries, getRecentActivities);
router.get('/notifications', validateDashboardQueries, getDashboardNotifications);

module.exports = router;
