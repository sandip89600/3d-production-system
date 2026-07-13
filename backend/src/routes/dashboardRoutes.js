const express = require('express');
const router = express.Router();
const {
  getSuperAdminDashboard,
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
router.get('/superadmin', requireRole('superadmin', 'admin'), getSuperAdminDashboard);
router.get('/admin', requireRole('admin', 'superadmin'), getAdminDashboard);
router.get('/employee', requireRole('employee'), getEmployeeDashboard);
router.get('/client', requireRole('client'), getClientDashboard);

// Common Chart & Analytics APIs
router.get('/project-status', getProjectStatusStats);
router.get('/monthly', getMonthlyTrend);
router.get('/department', getDepartmentStats);
router.get('/employees', requireRole('superadmin', 'admin'), getEmployeesPerformance);
router.get('/recent-activities', requireRole('superadmin', 'admin'), validateDashboardQueries, getRecentActivities);
router.get('/notifications', validateDashboardQueries, getDashboardNotifications);

module.exports = router;
