const express = require('express');
const router = express.Router();
const {
  getProjectsReport,
  getEmployeesReport,
  getAdminsReport,
  getDepartmentsReport,
  getDailyReport,
  getWeeklyReport,
  getMonthlyReport,
  exportPDF,
  exportExcel,
} = require('../controllers/reportController');
const { authenticateJWT, requireRole } = require('../middleware/auth');
const {
  validateReportFilters,
  validateExportType,
} = require('../validators/reportValidator');

// Protect all routes under /api/reports with JWT
router.use(authenticateJWT);

// Restrict access: Employees are NOT allowed to access reports
router.use(requireRole('superadmin', 'admin'));

// Middleware to restrict Admins to only see reports from their own department
const enforceAdminDepartmentFilter = (req, res, next) => {
  if (req.user.role === 'admin') {
    if (req.user.department) {
      req.query.department = req.user.department.toString();
    } else {
      // If admin has no department assigned, force a non-matching ID to return empty results
      const mongoose = require('mongoose');
      req.query.department = new mongoose.Types.ObjectId().toString();
    }
  }
  next();
};

// Report JSON API Endpoints
router.get('/projects', validateReportFilters, enforceAdminDepartmentFilter, getProjectsReport);
router.get('/employees', validateReportFilters, enforceAdminDepartmentFilter, getEmployeesReport);
router.get('/admins', validateReportFilters, enforceAdminDepartmentFilter, getAdminsReport);
router.get('/departments', validateReportFilters, enforceAdminDepartmentFilter, getDepartmentsReport);

// Daily/Weekly/Monthly Summary Reports
router.get('/daily', getDailyReport);
router.get('/weekly', getWeeklyReport);
router.get('/monthly', getMonthlyReport);

// Document Exports
router.get('/export/pdf', validateExportType, validateReportFilters, enforceAdminDepartmentFilter, exportPDF);
router.get('/export/excel', validateExportType, validateReportFilters, enforceAdminDepartmentFilter, exportExcel);

module.exports = router;
