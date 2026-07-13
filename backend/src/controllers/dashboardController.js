const dashboardService = require('../services/dashboardService');
const notificationService = require('../services/notificationService');
const { logActivity } = require('../middleware/auth');

/**
 * Controller for Dashboard Analytics Module
 */

// GET /api/dashboard/superadmin
const getSuperAdminDashboard = async (req, res) => {
  try {
    const data = await dashboardService.getSuperAdminDashboardData();

    await logActivity(req, 'dashboard_view', 'Viewed Super Admin Dashboard analytics');

    res.json({
      success: true,
      ...data,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/dashboard/admin
const getAdminDashboard = async (req, res) => {
  try {
    const data = await dashboardService.getAdminDashboardData(req.user._id);

    await logActivity(req, 'dashboard_view', 'Viewed Admin Dashboard analytics');

    res.json({
      success: true,
      ...data,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/dashboard/employee
const getEmployeeDashboard = async (req, res) => {
  try {
    // If employee is not in any department, departmentId is null.
    // Ensure we handle it gracefully
    const departmentId = req.user.department ? req.user.department._id : null;
    const data = await dashboardService.getEmployeeDashboardData(req.user._id, departmentId);

    await logActivity(req, 'dashboard_view', 'Viewed Employee Dashboard analytics');

    res.json({
      success: true,
      ...data,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/dashboard/project-status
const getProjectStatusStats = async (req, res) => {
  try {
    const data = await dashboardService.getProjectStatusChartData();
    res.json({ success: true, projectStatus: data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/dashboard/monthly
const getMonthlyTrend = async (req, res) => {
  try {
    const data = await dashboardService.getMonthlyAnalyticsChartData();
    res.json({ success: true, monthlyTrend: data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/dashboard/department
const getDepartmentStats = async (req, res) => {
  try {
    const data = await dashboardService.getDepartmentChartData();
    res.json({ success: true, departmentStats: data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/dashboard/employees
const getEmployeesPerformance = async (req, res) => {
  try {
    const data = await dashboardService.getEmployeePerformanceChartData();
    res.json({ success: true, employeePerformance: data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/dashboard/recent-activities
const getRecentActivities = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const data = await dashboardService.getRecentActivities(limit);
    res.json({ success: true, recentActivities: data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/dashboard/notifications
const getDashboardNotifications = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const data = await notificationService.getUserNotifications(req.user._id, page, limit);

    // Format output as requested: type, message, created time, read status
    const formattedNotifications = data.notifications.map((n) => ({
      id: n._id,
      type: n.type,
      message: n.message,
      createdTime: n.createdAt,
      status: n.read ? 'read' : 'unread',
    }));

    res.json({
      success: true,
      notifications: formattedNotifications,
      page: data.page,
      totalPages: data.totalPages,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getSuperAdminDashboard,
  getAdminDashboard,
  getEmployeeDashboard,
  getProjectStatusStats,
  getMonthlyTrend,
  getDepartmentStats,
  getEmployeesPerformance,
  getRecentActivities,
  getDashboardNotifications,
};
