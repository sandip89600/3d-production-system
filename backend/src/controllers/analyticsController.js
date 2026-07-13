const Project = require('../models/Project');
const ProjectAssignment = require('../models/ProjectAssignment');
const User = require('../models/User');
const Department = require('../models/Department');
const ActivityLog = require('../models/ActivityLog');

// GET /api/analytics/overview — Super Admin
const getOverview = async (req, res) => {
  try {
    const [
      totalProjects, activeProjects, completedProjects, delayedProjects,
      totalUsers, totalEmployees, totalAdmins, totalDepartments,
    ] = await Promise.all([
      Project.countDocuments(),
      Project.countDocuments({ status: { $in: ['available', 'in-progress'] } }),
      Project.countDocuments({ status: 'completed' }),
      Project.countDocuments({ status: 'delayed' }),
      User.countDocuments({ isActive: true }),
      User.countDocuments({ role: 'employee', isActive: true }),
      User.countDocuments({ role: 'admin', isActive: true }),
      Department.countDocuments({ isActive: true }),
    ]);

    // Project status breakdown
    const statusBreakdown = await Project.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // Department-wise project count
    const deptStats = await Project.aggregate([
      { $group: { _id: '$department', count: { $sum: 1 }, completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } } } },
      { $lookup: { from: 'departments', localField: '_id', foreignField: '_id', as: 'department' } },
      { $unwind: '$department' },
      { $project: { name: '$department.name', code: '$department.code', color: '$department.color', count: 1, completed: 1 } },
    ]);

    // Recent activity — last 7 days projects
    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 7);
    const recentProjects = await Project.find({ createdAt: { $gte: last7Days } })
      .populate('uploadedBy', 'name adminCode')
      .populate('department', 'name')
      .sort({ createdAt: -1 })
      .limit(10);

    // Monthly trend (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const monthlyTrend = await Project.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      { $group: {
        _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
        uploaded: { $sum: 1 },
        completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
      }},
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    res.json({
      success: true,
      overview: { totalProjects, activeProjects, completedProjects, delayedProjects, totalUsers, totalEmployees, totalAdmins, totalDepartments },
      statusBreakdown,
      deptStats,
      recentProjects,
      monthlyTrend,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/analytics/admin-performance
const getAdminPerformance = async (req, res) => {
  try {
    const adminStats = await Project.aggregate([
      { $group: {
        _id: '$uploadedBy',
        totalUploaded: { $sum: 1 },
        completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
        active: { $sum: { $cond: [{ $in: ['$status', ['available', 'in-progress']] }, 1, 0] } },
        delayed: { $sum: { $cond: [{ $eq: ['$status', 'delayed'] }, 1, 0] } },
      }},
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'admin' } },
      { $unwind: '$admin' },
      { $match: { 'admin.role': 'admin' } },
      { $project: {
        name: '$admin.name',
        adminCode: '$admin.adminCode',
        email: '$admin.email',
        totalUploaded: 1, completed: 1, active: 1, delayed: 1,
        completionRate: { $multiply: [{ $divide: ['$completed', { $max: ['$totalUploaded', 1] }] }, 100] },
      }},
      { $sort: { totalUploaded: -1 } },
    ]);

    res.json({ success: true, adminStats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/analytics/employee-performance
const getEmployeePerformance = async (req, res) => {
  try {
    const employeeStats = await ProjectAssignment.aggregate([
      { $group: {
        _id: '$employee',
        totalProjects: { $sum: 1 },
        completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
        active: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
        avgDaysWorked: { $avg: '$totalDaysWorked' },
        avgProgress: { $avg: '$progress' },
      }},
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'employee' } },
      { $unwind: '$employee' },
      { $project: {
        name: '$employee.name',
        email: '$employee.email',
        totalProjects: 1, completed: 1, active: 1,
        avgDaysWorked: { $round: ['$avgDaysWorked', 1] },
        avgProgress: { $round: ['$avgProgress', 1] },
        completionRate: { $multiply: [{ $divide: ['$completed', { $max: ['$totalProjects', 1] }] }, 100] },
      }},
      { $sort: { completed: -1 } },
    ]);

    res.json({ success: true, employeeStats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/analytics/department-performance
const getDepartmentPerformance = async (req, res) => {
  try {
    const deptPerf = await Project.aggregate([
      { $group: {
        _id: '$department',
        total: { $sum: 1 },
        completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
        active: { $sum: { $cond: [{ $in: ['$status', ['available', 'in-progress']] }, 1, 0] } },
        delayed: { $sum: { $cond: [{ $eq: ['$status', 'delayed'] }, 1, 0] } },
        avgProgress: { $avg: '$progress' },
      }},
      { $lookup: { from: 'departments', localField: '_id', foreignField: '_id', as: 'dept' } },
      { $unwind: '$dept' },
      { $project: {
        name: '$dept.name',
        code: '$dept.code',
        color: '$dept.color',
        icon: '$dept.icon',
        total: 1, completed: 1, active: 1, delayed: 1,
        avgProgress: { $round: ['$avgProgress', 1] },
        completionRate: { $round: [{ $multiply: [{ $divide: ['$completed', { $max: ['$total', 1] }] }, 100] }, 1] },
        productivityScore: { $round: [{ $subtract: [{ $multiply: [{ $divide: ['$completed', { $max: ['$total', 1] }] }, 100] }, { $multiply: [{ $divide: ['$delayed', { $max: ['$total', 1] }] }, 20] }] }, 1] },
      }},
      { $sort: { productivityScore: -1 } },
    ]);

    res.json({ success: true, deptPerf });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/analytics/activity-logs
const getActivityLogs = async (req, res) => {
  try {
    const { page = 1, limit = 50, action, userId } = req.query;
    const filter = {};
    if (action) filter.action = action;
    if (userId) filter.user = userId;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [logs, total] = await Promise.all([
      ActivityLog.find(filter)
        .populate('user', 'name email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      ActivityLog.countDocuments(filter),
    ]);

    res.json({ success: true, logs, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/analytics/admin-dashboard — For admin's own stats
const getAdminDashboard = async (req, res) => {
  try {
    const adminId = req.user._id;
    const [uploaded, completed, active, inReview, delayed] = await Promise.all([
      Project.countDocuments({ uploadedBy: adminId }),
      Project.countDocuments({ uploadedBy: adminId, status: 'completed' }),
      Project.countDocuments({ uploadedBy: adminId, status: { $in: ['available', 'in-progress'] } }),
      Project.countDocuments({ uploadedBy: adminId, status: 'review' }),
      Project.countDocuments({ uploadedBy: adminId, status: 'delayed' }),
    ]);

    const recentProjects = await Project.find({ uploadedBy: adminId })
      .populate('department', 'name code color')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 })
      .limit(10);

    const pendingReviews = await Project.find({ uploadedBy: adminId, status: 'review' })
      .populate('assignedTo', 'name email')
      .populate('department', 'name')
      .sort({ updatedAt: -1 });

    res.json({ success: true, stats: { uploaded, completed, active, inReview, delayed }, recentProjects, pendingReviews });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/analytics/employee-dashboard
const getEmployeeDashboard = async (req, res) => {
  try {
    const empId = req.user._id;
    const assignments = await ProjectAssignment.find({ employee: empId })
      .populate({ path: 'project', populate: [{ path: 'department', select: 'name code color icon' }, { path: 'uploadedBy', select: 'name adminCode' }] })
      .sort({ createdAt: -1 });

    const stats = {
      total: assignments.length,
      active: assignments.filter(a => a.status === 'active').length,
      completed: assignments.filter(a => a.status === 'completed').length,
      inReview: assignments.filter(a => a.status === 'review').length,
    };

    res.json({ success: true, stats, assignments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getOverview, getAdminPerformance, getEmployeePerformance, getDepartmentPerformance,
  getActivityLogs, getAdminDashboard, getEmployeeDashboard,
};
