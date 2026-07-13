const mongoose = require('mongoose');
const Project = require('../models/Project');
const User = require('../models/User');
const Department = require('../models/Department');
const ActivityLog = require('../models/ActivityLog');
const ProjectAssignment = require('../models/ProjectAssignment');
const ProgressLog = require('../models/ProgressLog');
const LoginLog = require('../models/LoginLog');
const UploadLog = require('../models/UploadLog');

class DashboardService {
  /**
   * Super Admin Dashboard Analytics
   */
  async getSuperAdminDashboardData() {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [overallStats] = await Project.aggregate([
      {
        $facet: {
          total: [{ $count: 'count' }],
          completed: [{ $match: { status: 'completed' } }, { $count: 'count' }],
          delayed: [{ $match: { status: 'delayed' } }, { $count: 'count' }],
          review: [{ $match: { status: 'review' } }, { $count: 'count' }],
          active: [{ $match: { status: { $in: ['in-progress', 'review'] } } }, { $count: 'count' }],
          uploadedToday: [{ $match: { createdAt: { $gte: todayStart } } }, { $count: 'count' }],
        },
      },
      {
        $project: {
          totalProjects: { $ifNull: [{ $arrayElemAt: ['$total.count', 0] }, 0] },
          completedProjects: { $ifNull: [{ $arrayElemAt: ['$completed.count', 0] }, 0] },
          delayedProjects: { $ifNull: [{ $arrayElemAt: ['$delayed.count', 0] }, 0] },
          reviewProjects: { $ifNull: [{ $arrayElemAt: ['$review.count', 0] }, 0] },
          activeProjects: { $ifNull: [{ $arrayElemAt: ['$active.count', 0] }, 0] },
          uploadedToday: { $ifNull: [{ $arrayElemAt: ['$uploadedToday.count', 0] }, 0] },
        },
      },
    ]);

    // Employee Stats
    const totalEmployees = await User.countDocuments({ role: 'employee' });
    const activeEmployees = await User.countDocuments({ role: 'employee', isActive: true });

    // Employees working today: count distinct users who made progress logs today
    const logsToday = await ProgressLog.distinct('employee', { date: { $gte: todayStart } });
    const workingToday = logsToday.length;

    // Top & Bottom performers (using employee performance score calculation: completed projects)
    const employeePerfRaw = await Project.aggregate([
      { $match: { status: 'completed', assignedTo: { $ne: null } } },
      { $group: { _id: '$assignedTo', completedCount: { $sum: 1 } } },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
      { $project: { name: '$user.name', completedCount: 1 } },
      { $sort: { completedCount: -1 } },
    ]);

    const topEmployees = employeePerfRaw.slice(0, 5);
    const bottomEmployees = [...employeePerfRaw].reverse().slice(0, 5);

    // Admin stats
    const totalAdmins = await User.countDocuments({ role: 'admin' });

    // Projects uploaded by each admin
    const adminUploads = await Project.aggregate([
      { $group: { _id: '$uploadedBy', count: { $sum: 1 } } },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'admin' } },
      { $unwind: '$admin' },
      { $project: { name: '$admin.name', adminCode: '$admin.adminCode', count: 1 } },
      { $sort: { count: -1 } },
    ]);

    // Monthly upload count
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const monthlyUploads = await Project.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    // Department Stats
    const totalDepartments = await Department.countDocuments({});
    const deptStats = await Project.aggregate([
      {
        $group: {
          _id: '$department',
          total: { $sum: 1 },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          delayed: { $sum: { $cond: [{ $eq: ['$status', 'delayed'] }, 1, 0] } },
        },
      },
      { $lookup: { from: 'departments', localField: '_id', foreignField: '_id', as: 'dept' } },
      { $unwind: '$dept' },
      {
        $project: {
          departmentName: '$dept.name',
          code: '$dept.code',
          totalProjects: '$total',
          completedProjects: '$completed',
          delayedProjects: '$delayed',
        },
      },
    ]);

    // New Log Stats
    const totalRegisteredUsers = await User.countDocuments({});
    const activeUsers = await User.countDocuments({ isActive: true });
    const onlineUsers = await User.countDocuments({ lastLogin: { $gte: new Date(Date.now() - 15 * 60 * 1000) } });
    const loginsToday = await LoginLog.countDocuments({ loginTime: { $gte: todayStart } });
    const newUsersThisMonth = await User.countDocuments({ createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } });

    const recentLogins = await LoginLog.find().sort({ loginTime: -1 }).limit(5).populate('userId', 'name');
    const failedLogins = await LoginLog.find({ status: 'failed' }).sort({ loginTime: -1 }).limit(5);
    const recentUploads = await UploadLog.find().sort({ uploadedAt: -1 }).limit(5).populate('userId', 'name').populate('projectId', 'name');

    return {
      cards: {
        totalProjects: overallStats.totalProjects,
        completedProjects: overallStats.completedProjects,
        delayedProjects: overallStats.delayedProjects,
        activeProjects: overallStats.activeProjects,
        reviewProjects: overallStats.reviewProjects,
        projectsUploadedToday: overallStats.uploadedToday,
        employeesWorkingToday: workingToday,
      },
      employeePerformance: {
        top: topEmployees,
        bottom: bottomEmployees,
      },
      adminUploads,
      monthlyUploads: monthlyUploads.map(m => ({
        month: `${m._id.year}-${String(m._id.month).padStart(2, '0')}`,
        count: m.count,
      })),
      departmentStats: deptStats,
      userStats: {
        totalRegisteredUsers,
        activeUsers,
        onlineUsers,
        loginsToday,
        newUsersThisMonth,
      },
      recentLogins,
      failedLogins,
      recentUploads,
    };
  }

  /**
   * Admin Dashboard Analytics
   */
  async getAdminDashboardData(adminId) {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [myStats] = await Project.aggregate([
      { $match: { uploadedBy: new mongoose.Types.ObjectId(adminId) } },
      {
        $facet: {
          total: [{ $count: 'count' }],
          inProgress: [{ $match: { status: 'in-progress' } }, { $count: 'count' }],
          review: [{ $match: { status: 'review' } }, { $count: 'count' }],
          completed: [{ $match: { status: 'completed' } }, { $count: 'count' }],
          delayed: [{ $match: { status: 'delayed' } }, { $count: 'count' }],
          uploadedToday: [{ $match: { createdAt: { $gte: todayStart } } }, { $count: 'count' }],
        },
      },
      {
        $project: {
          totalUploaded: { $ifNull: [{ $arrayElemAt: ['$total.count', 0] }, 0] },
          inProgress: { $ifNull: [{ $arrayElemAt: ['$inProgress.count', 0] }, 0] },
          review: { $ifNull: [{ $arrayElemAt: ['$review.count', 0] }, 0] },
          completed: { $ifNull: [{ $arrayElemAt: ['$completed.count', 0] }, 0] },
          delayed: { $ifNull: [{ $arrayElemAt: ['$delayed.count', 0] }, 0] },
          uploadedToday: { $ifNull: [{ $arrayElemAt: ['$uploadedToday.count', 0] }, 0] },
        },
      },
    ]);

    // Assigned employees count
    const assignedEmployees = await Project.distinct('assignedTo', {
      uploadedBy: new mongoose.Types.ObjectId(adminId),
      assignedTo: { $ne: null },
    });

    // Weekly stats (last 7 days uploads & completions)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const weeklyStats = await Project.aggregate([
      {
        $match: {
          uploadedBy: new mongoose.Types.ObjectId(adminId),
          createdAt: { $gte: sevenDaysAgo },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          uploads: { $sum: 1 },
          completions: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Monthly trend stats
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const monthlyStats = await Project.aggregate([
      {
        $match: {
          uploadedBy: new mongoose.Types.ObjectId(adminId),
          createdAt: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          uploads: { $sum: 1 },
          completions: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    // Admin user details for department scope
    const adminUser = await User.findById(adminId);
    const deptId = adminUser ? adminUser.department : null;

    let totalClients = 0;
    let activeClients = 0;
    let clientUploadCount = 0;
    let clientProjectCount = 0;
    let clientActivity = [];

    if (deptId) {
      const clientIds = await User.find({ role: 'client' }).distinct('_id');
      totalClients = clientIds.length;
      activeClients = await User.countDocuments({ role: 'client', isActive: true });
      
      clientProjectCount = await Project.countDocuments({
        department: deptId,
        uploadedBy: { $in: clientIds }
      });

      const FileModel = require('../models/File');
      clientUploadCount = await FileModel.countDocuments({
        projectId: { $in: await Project.find({ department: deptId }).distinct('_id') },
        uploadedBy: { $in: clientIds }
      });

      clientActivity = await UploadLog.find({
        projectId: { $in: await Project.find({ department: deptId }).distinct('_id') },
        userId: { $in: clientIds }
      })
      .populate('userId', 'name email companyName')
      .populate('projectId', 'name projectId')
      .populate('fileId', 'originalName fileSize')
      .sort({ uploadedAt: -1 })
      .limit(10);
    }

    return {
      cards: {
        myUploadedProjects: myStats.totalUploaded,
        projectsInProgress: myStats.inProgress,
        pendingReview: myStats.review,
        completedProjects: myStats.completed,
        delayedProjects: myStats.delayed,
        assignedEmployeesCount: assignedEmployees.length,
        todayUploadCount: myStats.uploadedToday,
      },
      weeklyStatistics: weeklyStats,
      monthlyStatistics: monthlyStats,
      clientStats: {
        totalClients,
        activeClients,
        clientUploadCount,
        clientProjectCount,
      },
      clientActivity,
    };
  }

  /**
   * Employee Dashboard Analytics
   */
  async getEmployeeDashboardData(employeeId, departmentId) {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [projectStats] = await Project.aggregate([
      {
        $facet: {
          assigned: [{ $match: { assignedTo: new mongoose.Types.ObjectId(employeeId) } }, { $count: 'count' }],
          inProgress: [{ $match: { assignedTo: new mongoose.Types.ObjectId(employeeId), status: 'in-progress' } }, { $count: 'count' }],
          completed: [{ $match: { assignedTo: new mongoose.Types.ObjectId(employeeId), status: 'completed' } }, { $count: 'count' }],
          delayed: [{ $match: { assignedTo: new mongoose.Types.ObjectId(employeeId), status: 'delayed' } }, { $count: 'count' }],
          available: [
            {
              $match: {
                status: 'available',
                department: new mongoose.Types.ObjectId(departmentId),
              },
            },
            { $count: 'count' },
          ],
        },
      },
      {
        $project: {
          assignedCount: { $ifNull: [{ $arrayElemAt: ['$assigned.count', 0] }, 0] },
          inProgressCount: { $ifNull: [{ $arrayElemAt: ['$inProgress.count', 0] }, 0] },
          completedCount: { $ifNull: [{ $arrayElemAt: ['$completed.count', 0] }, 0] },
          delayedCount: { $ifNull: [{ $arrayElemAt: ['$delayed.count', 0] }, 0] },
          availableCount: { $ifNull: [{ $arrayElemAt: ['$available.count', 0] }, 0] },
        },
      },
    ]);

    // Today's tasks (Active assignments details)
    const activeAssignments = await ProjectAssignment.find({
      employee: employeeId,
      status: { $in: ['active', 'review'] },
    }).populate({
      path: 'project',
      populate: { path: 'department', select: 'name code' },
    });

    // Current average progress
    const [progressStats] = await Project.aggregate([
      { $match: { assignedTo: new mongoose.Types.ObjectId(employeeId), status: 'in-progress' } },
      { $group: { _id: null, avgProgress: { $avg: '$progress' } } },
    ]);
    const avgProgress = progressStats ? Math.round(progressStats.avgProgress || 0) : 0;

    // Total working days: distinct days logged in progress log
    const workingDays = await ProgressLog.distinct('date', { employee: employeeId });
    const distinctDays = new Set(workingDays.map((d) => d.toISOString().split('T')[0])).size;

    // Performance score calculation: completions percentage
    const totalAssigned = projectStats.assignedCount;
    const completedProjects = projectStats.completedCount;
    const performanceScore = totalAssigned > 0 ? Math.round((completedProjects / totalAssigned) * 100) : 100;

    return {
      cards: {
        assignedProjects: totalAssigned,
        availableProjects: projectStats.availableCount,
        inProgressProjects: projectStats.inProgressCount,
        completedProjects: completedProjects,
        delayedProjects: projectStats.delayedCount,
        currentProgress: avgProgress,
        performanceScore,
        totalWorkingDays: distinctDays,
      },
      todaysTasks: activeAssignments,
    };
  }

  /**
   * Project status breakdown chart data
   */
  async getProjectStatusChartData() {
    const breakdown = await Project.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    // Format response cleanly
    const statuses = ['pending', 'available', 'in-progress', 'review', 'completed', 'delayed'];
    const result = {};
    statuses.forEach((s) => (result[s] = 0));
    breakdown.forEach((b) => {
      if (statuses.includes(b._id)) {
        result[b._id] = b.count;
      }
    });
    return result;
  }

  /**
   * Monthly trend analytics
   */
  async getMonthlyAnalyticsChartData() {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const trend = await Project.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          uploads: { $sum: 1 },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          delayed: { $sum: { $cond: [{ $eq: ['$status', 'delayed'] }, 1, 0] } },
          picked: { $sum: { $cond: [{ $ne: ['$assignedTo', null] }, 1, 0] } },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    return trend;
  }

  /**
   * Department project counts
   */
  async getDepartmentChartData() {
    const deptStats = await Project.aggregate([
      { $group: { _id: '$department', count: { $sum: 1 } } },
      { $lookup: { from: 'departments', localField: '_id', foreignField: '_id', as: 'dept' } },
      { $unwind: '$dept' },
      { $project: { name: '$dept.name', count: 1 } },
    ]);

    return deptStats;
  }

  /**
   * Employee Performance metrics for chart
   */
  async getEmployeePerformanceChartData() {
    const stats = await Project.aggregate([
      { $match: { assignedTo: { $ne: null } } },
      {
        $group: {
          _id: '$assignedTo',
          completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          delayed: { $sum: { $cond: [{ $eq: ['$status', 'delayed'] }, 1, 0] } },
          total: { $sum: 1 },
        },
      },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
      // Lookup project assignments to calculate average completion days
      {
        $lookup: {
          from: 'projectassignments',
          let: { empId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$employee', '$$empId'] },
                    { $eq: ['$status', 'completed'] },
                  ],
                },
              },
            },
            {
              $project: {
                durationDays: {
                  $divide: [
                    { $subtract: ['$completedDate', '$pickupDate'] },
                    1000 * 60 * 60 * 24,
                  ],
                },
              },
            },
            { $group: { _id: null, avgDays: { $avg: '$durationDays' } } },
          ],
          as: 'assignmentStats',
        },
      },
      {
        $project: {
          employeeName: '$user.name',
          completedProjects: '$completed',
          delayedProjects: '$delayed',
          performanceScore: {
            $cond: [
              { $gt: ['$total', 0] },
              { $round: [{ $multiply: [{ $divide: ['$completed', '$total'] }, 100] }] },
              100,
            ],
          },
          avgCompletionDays: {
            $round: [{ $ifNull: [{ $arrayElemAt: ['$assignmentStats.avgDays', 0] }, 0] }, 1],
          },
        },
      },
      { $sort: { performanceScore: -1 } },
    ]);

    return stats;
  }

  /**
   * Recent Activity Log (latest 20 logs filtered by key categories)
   */
  async getRecentActivities(limit = 20) {
    const targetActions = [
      'project_upload',
      'project_pickup',
      'progress_update',
      'project_complete',
      'login',
    ];

    const logs = await ActivityLog.find({ action: { $in: targetActions } })
      .populate('user', 'name role')
      .sort({ createdAt: -1 })
      .limit(limit);

    return logs;
  }

  /**
   * Client (User) Dashboard Analytics
   */
  async getClientDashboardData(clientId) {
    const cid = new mongoose.Types.ObjectId(clientId);
    
    // Scoped projects
    const totalProjects = await Project.countDocuments({ uploadedBy: cid });
    const completedProjects = await Project.countDocuments({ uploadedBy: cid, status: 'completed' });
    const pendingProjects = await Project.countDocuments({ uploadedBy: cid, status: { $ne: 'completed' } });
    const delayedProjects = await Project.countDocuments({ uploadedBy: cid, status: 'delayed' });
    
    const recentProjects = await Project.find({ uploadedBy: cid })
      .populate('department', 'name code color icon')
      .populate('assignedTo', 'name email designation')
      .sort({ createdAt: -1 })
      .limit(10);
      
    // Uploaded files
    const FileModel = require('../models/File');
    const uploadedFiles = await FileModel.find({ uploadedBy: cid, isDeleted: false })
      .sort({ createdAt: -1 })
      .limit(15);
      
    // Notifications
    const Notification = require('../models/Notification');
    const recentNotifications = await Notification.find({ recipient: cid })
      .sort({ createdAt: -1 })
      .limit(10);
      
    return {
      stats: {
        totalProjects,
        completedProjects,
        pendingProjects,
        delayedProjects,
        uploadedFilesCount: uploadedFiles.length,
      },
      recentProjects,
      uploadedFiles,
      recentNotifications,
    };
  }
}

module.exports = new DashboardService();
