const mongoose = require('mongoose');
const Project = require('../models/Project');
const User = require('../models/User');
const Department = require('../models/Department');
const ProjectAssignment = require('../models/ProjectAssignment');
const ProgressLog = require('../models/ProgressLog');
const ActivityLog = require('../models/ActivityLog');

class ReportService {
  /**
   * Helper to build project match query from filters
   */
  buildProjectMatchQuery(filters = {}) {
    const { startDate, endDate, department, employee, admin, status, priority, type, search } = filters;
    const match = {};

    // Date range query (createdAt)
    if (startDate || endDate) {
      match.createdAt = {};
      if (startDate) match.createdAt.$gte = new Date(startDate);
      if (endDate) match.createdAt.$lte = new Date(endDate);
    }

    // Exact matches
    if (department) {
      match.department = new mongoose.Types.ObjectId(department);
    }
    if (employee) {
      match.assignedTo = new mongoose.Types.ObjectId(employee);
    }
    if (admin) {
      match.uploadedBy = new mongoose.Types.ObjectId(admin);
    }
    if (status) {
      match.status = status;
    }
    if (priority) {
      match.priority = priority;
    }
    if (type) {
      match.type = type;
    }

    // Search query matches Project Name or Project ID
    if (search) {
      match.$or = [
        { name: { $regex: search, $options: 'i' } },
        { projectId: { $regex: search, $options: 'i' } },
      ];
    }

    return match;
  }

  /**
   * 1. Project Reports
   */
  async getProjectReport(filters = {}, page = 1, limit = 10) {
    const matchQuery = this.buildProjectMatchQuery(filters);
    const skip = (page - 1) * limit;

    const pipeline = [
      { $match: matchQuery },
      { $lookup: { from: 'departments', localField: 'department', foreignField: '_id', as: 'deptInfo' } },
      { $unwind: { path: '$deptInfo', preserveNullAndEmptyArrays: true } },
      { $lookup: { from: 'users', localField: 'uploadedBy', foreignField: '_id', as: 'adminInfo' } },
      { $unwind: { path: '$adminInfo', preserveNullAndEmptyArrays: true } },
      { $lookup: { from: 'users', localField: 'assignedTo', foreignField: '_id', as: 'empInfo' } },
      { $unwind: { path: '$empInfo', preserveNullAndEmptyArrays: true } },
      // Lookup assignment totalDaysWorked
      {
        $lookup: {
          from: 'projectassignments',
          let: { projId: '$_id', empId: '$assignedTo' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$project', '$$projId'] },
                    { $eq: ['$employee', '$$empId'] },
                  ],
                },
              },
            },
          ],
          as: 'assignment',
        },
      },
      { $unwind: { path: '$assignment', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          projectId: 1,
          projectName: '$name',
          departmentName: '$deptInfo.name',
          uploadedBy: '$adminInfo.name',
          assignedEmployee: '$empInfo.name',
          priority: 1,
          deadline: 1,
          progress: 1,
          status: 1,
          createdAt: 1,
          completedAt: 1,
          totalWorkingDays: { $ifNull: ['$assignment.totalDaysWorked', 0] },
        },
      },
      { $sort: { createdAt: -1 } },
    ];

    const dataPipeline = [...pipeline, { $skip: skip }, { $limit: limit }];
    const countPipeline = [...pipeline, { $count: 'total' }];

    const [data, totalData] = await Promise.all([
      Project.aggregate(dataPipeline),
      Project.aggregate(countPipeline),
    ]);

    const total = totalData[0] ? totalData[0].total : 0;

    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * 2. Employee Reports
   */
  async getEmployeeReport(filters = {}, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const matchUser = { role: 'employee' };

    // Apply department filters if present
    if (filters.department) {
      matchUser.department = new mongoose.Types.ObjectId(filters.department);
    }
    if (filters.employee) {
      matchUser._id = new mongoose.Types.ObjectId(filters.employee);
    }

    const pipeline = [
      { $match: matchUser },
      { $lookup: { from: 'departments', localField: 'department', foreignField: '_id', as: 'dept' } },
      { $unwind: { path: '$dept', preserveNullAndEmptyArrays: true } },
      // Lookup projects assigned to employee
      {
        $lookup: {
          from: 'projects',
          localField: '_id',
          foreignField: 'assignedTo',
          as: 'projects',
        },
      },
      // Lookup assignments for average completions
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
          ],
          as: 'assignments',
        },
      },
      {
        $project: {
          employeeName: '$name',
          departmentName: '$dept.name',
          assignedProjects: { $size: '$projects' },
          completedProjects: {
            $size: {
              $filter: {
                input: '$projects',
                as: 'p',
                cond: { $eq: ['$$p.status', 'completed'] },
              },
            },
          },
          activeProjects: {
            $size: {
              $filter: {
                input: '$projects',
                as: 'p',
                cond: { $in: ['$$p.status', ['in-progress', 'review']] },
              },
            },
          },
          delayedProjects: {
            $size: {
              $filter: {
                input: '$projects',
                as: 'p',
                cond: { $eq: ['$$p.status', 'delayed'] },
              },
            },
          },
          avgCompletionTime: {
            $round: [{ $ifNull: [{ $avg: '$assignments.totalDaysWorked' }, 0] }, 1],
          },
          performanceScore: {
            $cond: [
              { $gt: [{ $size: '$projects' }, 0] },
              {
                $round: [
                  {
                    $multiply: [
                      {
                        $divide: [
                          {
                            $size: {
                              $filter: {
                                input: '$projects',
                                as: 'p',
                                cond: { $eq: ['$$p.status', 'completed'] },
                              },
                            },
                          },
                          { $size: '$projects' },
                        ],
                      },
                      100,
                    ],
                  },
                ],
              },
              100,
            ],
          },
        },
      },
      { $sort: { performanceScore: -1 } },
    ];

    const dataPipeline = [...pipeline, { $skip: skip }, { $limit: limit }];
    const countPipeline = [...pipeline, { $count: 'total' }];

    const [data, totalData] = await Promise.all([
      User.aggregate(dataPipeline),
      User.aggregate(countPipeline),
    ]);

    const total = totalData[0] ? totalData[0].total : 0;

    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * 3. Admin Reports
   */
  async getAdminReport(filters = {}, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const matchUser = { role: 'admin' };

    if (filters.admin) {
      matchUser._id = new mongoose.Types.ObjectId(filters.admin);
    }

    const pipeline = [
      { $match: matchUser },
      // Lookup projects uploaded by this admin
      {
        $lookup: {
          from: 'projects',
          localField: '_id',
          foreignField: 'uploadedBy',
          as: 'projects',
        },
      },
      {
        $project: {
          adminName: '$name',
          adminCode: 1,
          projectsUploaded: { $size: '$projects' },
          activeProjects: {
            $size: {
              $filter: {
                input: '$projects',
                as: 'p',
                cond: { $in: ['$$p.status', ['in-progress', 'available']] },
              },
            },
          },
          completedProjects: {
            $size: {
              $filter: {
                input: '$projects',
                as: 'p',
                cond: { $eq: ['$$p.status', 'completed'] },
              },
            },
          },
          pendingReviews: {
            $size: {
              $filter: {
                input: '$projects',
                as: 'p',
                cond: { $eq: ['$$p.status', 'review'] },
              },
            },
          },
        },
      },
      { $sort: { projectsUploaded: -1 } },
    ];

    const dataPipeline = [...pipeline, { $skip: skip }, { $limit: limit }];
    const countPipeline = [...pipeline, { $count: 'total' }];

    const [data, totalData] = await Promise.all([
      User.aggregate(dataPipeline),
      User.aggregate(countPipeline),
    ]);

    const total = totalData[0] ? totalData[0].total : 0;

    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * 4. Department Reports
   */
  async getDepartmentReport(filters = {}, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const matchDept = { isActive: true };

    if (filters.department) {
      matchDept._id = new mongoose.Types.ObjectId(filters.department);
    }

    const pipeline = [
      { $match: matchDept },
      // Lookup projects in department
      {
        $lookup: {
          from: 'projects',
          localField: '_id',
          foreignField: 'department',
          as: 'projects',
        },
      },
      // Lookup completed project assignments for completion times
      {
        $lookup: {
          from: 'projectassignments',
          let: { deptId: '$_id' },
          pipeline: [
            { $lookup: { from: 'projects', localField: 'project', foreignField: '_id', as: 'p' } },
            { $unwind: '$p' },
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$p.department', '$$deptId'] },
                    { $eq: ['$status', 'completed'] },
                  ],
                },
              },
            },
          ],
          as: 'assignments',
        },
      },
      {
        $project: {
          departmentName: '$name',
          code: 1,
          totalProjects: { $size: '$projects' },
          activeProjects: {
            $size: {
              $filter: {
                input: '$projects',
                as: 'p',
                cond: { $in: ['$$p.status', ['in-progress', 'review']] },
              },
            },
          },
          completedProjects: {
            $size: {
              $filter: {
                input: '$projects',
                as: 'p',
                cond: { $eq: ['$$p.status', 'completed'] },
              },
            },
          },
          delayedProjects: {
            $size: {
              $filter: {
                input: '$projects',
                as: 'p',
                cond: { $eq: ['$$p.status', 'delayed'] },
              },
            },
          },
          avgCompletionTime: {
            $round: [{ $ifNull: [{ $avg: '$assignments.totalDaysWorked' }, 0] }, 1],
          },
          productivityScore: {
            $cond: [
              { $gt: [{ $size: '$projects' }, 0] },
              {
                $round: [
                  {
                    $multiply: [
                      {
                        $divide: [
                          {
                            $size: {
                              $filter: {
                                input: '$projects',
                                as: 'p',
                                cond: { $eq: ['$$p.status', 'completed'] },
                              },
                            },
                          },
                          { $size: '$projects' },
                        ],
                      },
                      100,
                    ],
                  },
                ],
              },
              100,
            ],
          },
        },
      },
      { $sort: { totalProjects: -1 } },
    ];

    const dataPipeline = [...pipeline, { $skip: skip }, { $limit: limit }];
    const countPipeline = [...pipeline, { $count: 'total' }];

    const [data, totalData] = await Promise.all([
      Department.aggregate(dataPipeline),
      Department.aggregate(countPipeline),
    ]);

    const total = totalData[0] ? totalData[0].total : 0;

    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * 5. Daily Report
   */
  async getDailyReport() {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [uploads, pickups, progress, completions, delayed] = await Promise.all([
      Project.find({ createdAt: { $gte: todayStart } })
        .populate('department', 'name code')
        .populate('uploadedBy', 'name'),
      ProjectAssignment.find({ pickupDate: { $gte: todayStart } })
        .populate('project', 'name projectId')
        .populate('employee', 'name'),
      ProgressLog.find({ date: { $gte: todayStart } })
        .populate('project', 'name projectId')
        .populate('employee', 'name'),
      Project.find({ status: 'completed', completedAt: { $gte: todayStart } })
        .populate('department', 'name code')
        .populate('assignedTo', 'name'),
      Project.countDocuments({ status: 'delayed' }),
    ]);

    return {
      uploads,
      pickups,
      progressUpdates: progress,
      completions,
      delayedProjectsCount: delayed,
    };
  }

  /**
   * 6. Weekly Report
   */
  async getWeeklyReport() {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);
    weekStart.setHours(0, 0, 0, 0);

    const uploads = await Project.find({ createdAt: { $gte: weekStart } })
      .populate('department', 'name')
      .populate('uploadedBy', 'name');

    const completions = await Project.find({ status: 'completed', completedAt: { $gte: weekStart } })
      .populate('department', 'name')
      .populate('assignedTo', 'name');

    const empPerformance = await ProjectAssignment.aggregate([
      { $match: { status: 'completed', completedDate: { $gte: weekStart } } },
      { $group: { _id: '$employee', count: { $sum: 1 }, avgDays: { $avg: '$totalDaysWorked' } } },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
      { $project: { employeeName: '$user.name', completedCount: '$count', avgCompletionDays: { $round: ['$avgDays', 1] } } },
    ]);

    const deptPerformance = await Project.aggregate([
      { $match: { createdAt: { $gte: weekStart } } },
      {
        $group: {
          _id: '$department',
          uploaded: { $sum: 1 },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
        },
      },
      { $lookup: { from: 'departments', localField: '_id', foreignField: '_id', as: 'dept' } },
      { $unwind: '$dept' },
      { $project: { departmentName: '$dept.name', uploadedCount: '$uploaded', completedCount: '$completed' } },
    ]);

    return {
      weeklyUploads: uploads,
      weeklyCompletions: completions,
      employeePerformance: empPerformance,
      departmentPerformance: deptPerformance,
    };
  }

  /**
   * 7. Monthly Report
   */
  async getMonthlyReport() {
    const monthStart = new Date();
    monthStart.setMonth(monthStart.getMonth() - 1);
    monthStart.setHours(0, 0, 0, 0);

    // Monthly uploads & completions stats
    const uploadsCount = await Project.countDocuments({ createdAt: { $gte: monthStart } });
    const completionsCount = await Project.countDocuments({ status: 'completed', completedAt: { $gte: monthStart } });

    // Admin performance (projects uploaded this month)
    const adminPerf = await Project.aggregate([
      { $match: { createdAt: { $gte: monthStart } } },
      { $group: { _id: '$uploadedBy', count: { $sum: 1 } } },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
      { $project: { adminName: '$user.name', adminCode: '$user.adminCode', uploadsCount: '$count' } },
    ]);

    // Employee performance (projects completed this month)
    const empPerf = await Project.aggregate([
      { $match: { status: 'completed', completedAt: { $gte: monthStart } } },
      { $group: { _id: '$assignedTo', count: { $sum: 1 } } },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
      { $project: { employeeName: '$user.name', completedCount: '$count' } },
    ]);

    // Department Performance
    const deptPerf = await Project.aggregate([
      { $match: { createdAt: { $gte: monthStart } } },
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
          totalProjects: '$total',
          completedProjects: '$completed',
          delayedProjects: '$delayed',
        },
      },
    ]);

    return {
      monthlyUploadStatistics: uploadsCount,
      monthlyCompletionStatistics: completionsCount,
      adminPerformance: adminPerf,
      employeePerformance: empPerf,
      departmentAnalytics: deptPerf,
    };
  }
}

module.exports = new ReportService();
