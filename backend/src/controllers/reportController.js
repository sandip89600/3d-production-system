const reportService = require('../services/reportService');
const { logActivity } = require('../middleware/auth');
const { generatePDFReport } = require('../utils/pdfGenerator');
const { generateExcelReport } = require('../utils/excelGenerator');

/**
 * Helper to format date cleanly
 */
const formatDate = (dateVal) => {
  if (!dateVal) return '-';
  const d = new Date(dateVal);
  return isNaN(d.getTime()) ? '-' : d.toISOString().split('T')[0];
};

// GET /api/reports/projects
const getProjectsReport = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const result = await reportService.getProjectReport(req.query, page, limit);

    await logActivity(req, 'report_generate', 'Generated Projects report JSON data');

    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/reports/employees
const getEmployeesReport = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const result = await reportService.getEmployeeReport(req.query, page, limit);

    await logActivity(req, 'report_generate', 'Generated Employees report JSON data');

    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/reports/admins
const getAdminsReport = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const result = await reportService.getAdminReport(req.query, page, limit);

    await logActivity(req, 'report_generate', 'Generated Admins report JSON data');

    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/reports/departments
const getDepartmentsReport = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const result = await reportService.getDepartmentReport(req.query, page, limit);

    await logActivity(req, 'report_generate', 'Generated Departments report JSON data');

    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/reports/daily
const getDailyReport = async (req, res) => {
  try {
    const result = await reportService.getDailyReport();

    await logActivity(req, 'report_generate', "Generated Today's Daily report");

    res.json({ success: true, dailyReport: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/reports/weekly
const getWeeklyReport = async (req, res) => {
  try {
    const result = await reportService.getWeeklyReport();

    await logActivity(req, 'report_generate', 'Generated Weekly performance report');

    res.json({ success: true, weeklyReport: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/reports/monthly
const getMonthlyReport = async (req, res) => {
  try {
    const result = await reportService.getMonthlyReport();

    await logActivity(req, 'report_generate', 'Generated Monthly performance report');

    res.json({ success: true, monthlyReport: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/reports/export/pdf
const exportPDF = async (req, res) => {
  try {
    const { type } = req.query;
    let title = '';
    let headers = [];
    let rows = [];

    // Query all records for export (limit high)
    const exportLimit = 10000;

    if (type === 'projects') {
      title = 'Projects Performance Report';
      headers = ['Proj ID', 'Project Name', 'Department', 'Uploaded By', 'Assigned To', 'Priority', 'Deadline', 'Progress', 'Status', 'Days Worked'];
      const report = await reportService.getProjectReport(req.query, 1, exportLimit);
      rows = report.data.map((p) => [
        p.projectId,
        p.projectName,
        p.departmentName,
        p.uploadedBy,
        p.assignedEmployee,
        p.priority,
        formatDate(p.deadline),
        `${p.progress}%`,
        p.status,
        p.totalWorkingDays,
      ]);
    } else if (type === 'employees') {
      title = 'Employees Performance Report';
      headers = ['Employee Name', 'Department', 'Assigned Projs', 'Completed Projs', 'Active Projs', 'Delayed Projs', 'Avg Days/Proj', 'Score'];
      const report = await reportService.getEmployeeReport(req.query, 1, exportLimit);
      rows = report.data.map((e) => [
        e.employeeName,
        e.departmentName,
        e.assignedProjects,
        e.completedProjects,
        e.activeProjects,
        e.delayedProjects,
        e.avgCompletionTime,
        `${e.performanceScore}%`,
      ]);
    } else if (type === 'admins') {
      title = 'Admins Performance Report';
      headers = ['Admin Name', 'Code', 'Uploaded Projs', 'Active Projs', 'Completed Projs', 'Pending Reviews'];
      const report = await reportService.getAdminReport(req.query, 1, exportLimit);
      rows = report.data.map((a) => [
        a.adminName,
        a.adminCode,
        a.projectsUploaded,
        a.activeProjects,
        a.completedProjects,
        a.pendingReviews,
      ]);
    } else if (type === 'departments') {
      title = 'Departments Performance Report';
      headers = ['Department Name', 'Code', 'Total Projs', 'Active Projs', 'Completed Projs', 'Delayed Projs', 'Avg Days/Proj', 'Productivity'];
      const report = await reportService.getDepartmentReport(req.query, 1, exportLimit);
      rows = report.data.map((d) => [
        d.departmentName,
        d.code,
        d.totalProjects,
        d.activeProjects,
        d.completedProjects,
        d.delayedProjects,
        d.avgCompletionTime,
        `${d.productivityScore}%`,
      ]);
    }

    // Set PDF content headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=report-${type}-${Date.now()}.pdf`);

    generatePDFReport(res, title, headers, rows, req.user.name);
    await logActivity(req, 'report_export', `Exported ${type} report to PDF`);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/reports/export/excel
const exportExcel = async (req, res) => {
  try {
    const { type } = req.query;
    let title = '';
    let columns = [];
    let rows = [];

    // Query all records for export (limit high)
    const exportLimit = 10000;

    if (type === 'projects') {
      title = 'Projects Performance Report';
      columns = [
        { header: 'Project ID', key: 'projectId', width: 15 },
        { header: 'Project Name', key: 'projectName', width: 25 },
        { header: 'Department', key: 'departmentName', width: 20 },
        { header: 'Uploaded By', key: 'uploadedBy', width: 20 },
        { header: 'Assigned Employee', key: 'assignedEmployee', width: 20 },
        { header: 'Priority', key: 'priority', width: 12 },
        { header: 'Deadline', key: 'deadline', width: 15 },
        { header: 'Progress', key: 'progress', width: 12 },
        { header: 'Status', key: 'status', width: 12 },
        { header: 'Days Worked', key: 'totalWorkingDays', width: 12 },
      ];
      const report = await reportService.getProjectReport(req.query, 1, exportLimit);
      rows = report.data.map((p) => ({
        projectId: p.projectId,
        projectName: p.projectName,
        departmentName: p.departmentName,
        uploadedBy: p.uploadedBy,
        assignedEmployee: p.assignedEmployee,
        priority: p.priority,
        deadline: formatDate(p.deadline),
        progress: `${p.progress}%`,
        status: p.status,
        totalWorkingDays: p.totalWorkingDays,
      }));
    } else if (type === 'employees') {
      title = 'Employees Performance Report';
      columns = [
        { header: 'Employee Name', key: 'employeeName', width: 25 },
        { header: 'Department', key: 'departmentName', width: 20 },
        { header: 'Assigned Projects', key: 'assignedProjects', width: 15 },
        { header: 'Completed Projects', key: 'completedProjects', width: 15 },
        { header: 'Active Projects', key: 'activeProjects', width: 15 },
        { header: 'Delayed Projects', key: 'delayedProjects', width: 15 },
        { header: 'Avg Days/Project', key: 'avgCompletionTime', width: 15 },
        { header: 'Performance Score', key: 'performanceScore', width: 15 },
      ];
      const report = await reportService.getEmployeeReport(req.query, 1, exportLimit);
      rows = report.data.map((e) => ({
        employeeName: e.employeeName,
        departmentName: e.departmentName,
        assignedProjects: e.assignedProjects,
        completedProjects: e.completedProjects,
        activeProjects: e.activeProjects,
        delayedProjects: e.delayedProjects,
        avgCompletionTime: e.avgCompletionTime,
        performanceScore: `${e.performanceScore}%`,
      }));
    } else if (type === 'admins') {
      title = 'Admins Performance Report';
      columns = [
        { header: 'Admin Name', key: 'adminName', width: 25 },
        { header: 'Admin Code', key: 'adminCode', width: 15 },
        { header: 'Projects Uploaded', key: 'projectsUploaded', width: 18 },
        { header: 'Active Projects', key: 'activeProjects', width: 15 },
        { header: 'Completed Projects', key: 'completedProjects', width: 15 },
        { header: 'Pending Reviews', key: 'pendingReviews', width: 15 },
      ];
      const report = await reportService.getAdminReport(req.query, 1, exportLimit);
      rows = report.data.map((a) => ({
        adminName: a.adminName,
        adminCode: a.adminCode,
        projectsUploaded: a.projectsUploaded,
        activeProjects: a.activeProjects,
        completedProjects: a.completedProjects,
        pendingReviews: a.pendingReviews,
      }));
    } else if (type === 'departments') {
      title = 'Departments Performance Report';
      columns = [
        { header: 'Department Name', key: 'departmentName', width: 25 },
        { header: 'Department Code', key: 'code', width: 15 },
        { header: 'Total Projects', key: 'totalProjects', width: 15 },
        { header: 'Active Projects', key: 'activeProjects', width: 15 },
        { header: 'Completed Projects', key: 'completedProjects', width: 15 },
        { header: 'Delayed Projects', key: 'delayedProjects', width: 15 },
        { header: 'Avg Days/Project', key: 'avgCompletionTime', width: 15 },
        { header: 'Productivity Score', key: 'productivityScore', width: 15 },
      ];
      const report = await reportService.getDepartmentReport(req.query, 1, exportLimit);
      rows = report.data.map((d) => ({
        departmentName: d.departmentName,
        code: d.code,
        totalProjects: d.totalProjects,
        activeProjects: d.activeProjects,
        completedProjects: d.completedProjects,
        delayedProjects: d.delayedProjects,
        avgCompletionTime: d.avgCompletionTime,
        productivityScore: `${d.productivityScore}%`,
      }));
    }

    // Set Excel content headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=report-${type}-${Date.now()}.xlsx`);

    await generateExcelReport(res, title, columns, rows, req.user.name);
    await logActivity(req, 'report_export', `Exported ${type} report to Excel`);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getProjectsReport,
  getEmployeesReport,
  getAdminsReport,
  getDepartmentsReport,
  getDailyReport,
  getWeeklyReport,
  getMonthlyReport,
  exportPDF,
  exportExcel,
};
