const mongoose = require('mongoose');
const Project = require('../models/Project');
const User = require('../models/User');
const Department = require('../models/Department');
const Notification = require('../models/Notification');
const ActivityLog = require('../models/ActivityLog');
const SearchHistory = require('../models/SearchHistory');
const { buildRegex, buildDateRange, getSortOrder, buildPagination } = require('../utils/searchHelpers');

class SearchService {
  /**
   * Build role-aware project match query
   */
  _projectAccessFilter(user) {
    if (user.role === 'superadmin') return {};
    if (user.role === 'admin') return { uploadedBy: new mongoose.Types.ObjectId(user._id) };
    // Employee: only their assigned projects
    return { assignedTo: new mongoose.Types.ObjectId(user._id) };
  }

  /**
   * Build role-aware user (employee) match query
   */
  _employeeAccessFilter(user) {
    if (user.role === 'superadmin') return { role: 'employee' };
    if (user.role === 'admin') {
      // Admin sees employees in their department
      return {
        role: 'employee',
        ...(user.department ? { department: new mongoose.Types.ObjectId(user.department) } : {}),
      };
    }
    // Employee can only find themselves
    return { role: 'employee', _id: new mongoose.Types.ObjectId(user._id) };
  }

  /**
   * 1. Global Search — searches across all collections in parallel
   */
  async globalSearch(q, user, page = 1, limit = 5) {
    if (!q || q.trim() === '') {
      return { projects: [], employees: [], departments: [], notifications: [], activityLogs: [] };
    }

    const regex = buildRegex(q);
    const skip = (page - 1) * limit;

    const projectFilter = this._projectAccessFilter(user);
    const employeeFilter = this._employeeAccessFilter(user);

    const [projects, employees, departments, notifications, activityLogs] = await Promise.all([
      Project.find({
        ...projectFilter,
        $or: [
          { name: regex },
          { projectId: regex },
          { status: regex },
          { priority: regex },
        ],
      })
        .populate('department', 'name code')
        .populate('uploadedBy', 'name')
        .populate('assignedTo', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      User.find({
        ...employeeFilter,
        $or: [
          { name: regex },
          { email: regex },
          { mobile: regex },
          { employeeId: regex },
        ],
      })
        .populate('department', 'name code')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('-password -refreshTokens -otp -otpExpiry')
        .lean(),

      Department.find({
        $or: [{ name: regex }, { code: regex }],
      })
        .sort({ name: 1 })
        .limit(limit)
        .lean(),

      Notification.find({
        recipient: user._id,
        $or: [{ title: regex }, { message: regex }, { type: regex }],
      })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      user.role !== 'employee'
        ? ActivityLog.find({
            $or: [{ action: regex }, { target: regex }, { ip: regex }],
          })
            .populate('user', 'name role')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean()
        : Promise.resolve([]),
    ]);

    return { projects, employees, departments, notifications, activityLogs };
  }

  /**
   * 2. Project Search with full advanced filters
   */
  async searchProjects(q, filters = {}, user, page = 1, limit = 10) {
    const {
      sort, status, priority, department, employee,
      startDate, endDate, deadlineStart, deadlineEnd,
      minProgress, maxProgress, type,
    } = filters;

    const baseFilter = this._projectAccessFilter(user);
    const match = { ...baseFilter };

    // Text search
    if (q && q.trim()) {
      const regex = buildRegex(q);
      match.$or = [
        { name: regex },
        { projectId: regex },
        { status: regex },
        { priority: regex },
      ];
    }

    // Exact filters
    if (status) match.status = status;
    if (priority) match.priority = priority;
    if (type) match.type = type;
    if (department) match.department = new mongoose.Types.ObjectId(department);
    if (employee) match.assignedTo = new mongoose.Types.ObjectId(employee);

    // Date range filters
    const createdRange = buildDateRange(startDate, endDate);
    if (createdRange) match.createdAt = createdRange;

    const deadlineRange = buildDateRange(deadlineStart, deadlineEnd);
    if (deadlineRange) match.deadline = deadlineRange;

    // Progress range filter
    if (minProgress !== undefined || maxProgress !== undefined) {
      match.progress = {};
      if (minProgress !== undefined) match.progress.$gte = parseFloat(minProgress);
      if (maxProgress !== undefined) match.progress.$lte = parseFloat(maxProgress);
    }

    const sortOrder = getSortOrder(sort);
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      Project.find(match)
        .populate('department', 'name code color')
        .populate('uploadedBy', 'name adminCode')
        .populate('assignedTo', 'name employeeId')
        .sort(sortOrder)
        .skip(skip)
        .limit(limit)
        .lean(),
      Project.countDocuments(match),
    ]);

    return { data, ...buildPagination(total, page, limit) };
  }

  /**
   * 3. Employee Search
   */
  async searchEmployees(q, filters = {}, user, page = 1, limit = 10) {
    const { department, status, sort } = filters;

    const baseFilter = this._employeeAccessFilter(user);
    const match = { ...baseFilter };

    if (q && q.trim()) {
      const regex = buildRegex(q);
      match.$or = [
        { name: regex },
        { email: regex },
        { mobile: regex },
        { employeeId: regex },
        { skills: regex },
      ];
    }

    if (department) match.department = new mongoose.Types.ObjectId(department);
    if (status === 'active') match.isActive = true;
    if (status === 'inactive') match.isActive = false;

    const sortOrder = sort === 'a-z' ? { name: 1 } : sort === 'z-a' ? { name: -1 } : { createdAt: -1 };
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      User.find(match)
        .populate('department', 'name code')
        .sort(sortOrder)
        .skip(skip)
        .limit(limit)
        .select('-password -refreshTokens -otp -otpExpiry')
        .lean(),
      User.countDocuments(match),
    ]);

    return { data, ...buildPagination(total, page, limit) };
  }

  /**
   * 4. Department Search
   */
  async searchDepartments(q, page = 1, limit = 10) {
    const match = {};

    if (q && q.trim()) {
      const regex = buildRegex(q);
      match.$or = [{ name: regex }, { code: regex }];
    }

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      Department.find(match).sort({ name: 1 }).skip(skip).limit(limit).lean(),
      Department.countDocuments(match),
    ]);

    return { data, ...buildPagination(total, page, limit) };
  }

  /**
   * 5. Notification Search
   */
  async searchNotifications(q, filters = {}, user, page = 1, limit = 10) {
    const { type, startDate, endDate, status } = filters;

    const match = { recipient: new mongoose.Types.ObjectId(user._id) };

    if (q && q.trim()) {
      const regex = buildRegex(q);
      match.$or = [{ title: regex }, { message: regex }, { type: regex }];
    }

    if (type) match.type = type;
    if (status === 'read') match.read = true;
    if (status === 'unread') match.read = false;

    const dateRange = buildDateRange(startDate, endDate);
    if (dateRange) match.createdAt = dateRange;

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      Notification.find(match).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Notification.countDocuments(match),
    ]);

    return { data, ...buildPagination(total, page, limit) };
  }

  /**
   * 6. Activity Log Search
   */
  async searchActivity(q, filters = {}, user, page = 1, limit = 10) {
    const { startDate, endDate, action, module: mod } = filters;

    // Only super admin and admin can view activity logs
    const match = {};

    // Admins and employees can only see their own logs
    if (user.role !== 'superadmin') {
      match.user = new mongoose.Types.ObjectId(user._id);
    }

    if (q && q.trim()) {
      const regex = buildRegex(q);
      match.$or = [{ action: regex }, { target: regex }, { ip: regex }];
    }

    if (action) match.action = buildRegex(action);
    if (mod) match.target = buildRegex(mod);

    const dateRange = buildDateRange(startDate, endDate);
    if (dateRange) match.createdAt = dateRange;

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      ActivityLog.find(match)
        .populate('user', 'name role email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ActivityLog.countDocuments(match),
    ]);

    return { data, ...buildPagination(total, page, limit) };
  }

  /**
   * 7. Search Suggestions — autocomplete from project names, department names, skills
   */
  async getSuggestions(prefix, user) {
    if (!prefix || prefix.trim().length < 2) return [];

    const regex = buildRegex(prefix);
    const projectFilter = this._projectAccessFilter(user);

    const [projectNames, deptNames, skills] = await Promise.all([
      Project.distinct('name', { ...projectFilter, name: regex }),
      Department.distinct('name', { name: regex }),
      User.distinct('skills', { skills: regex }),
    ]);

    // Merge, deduplicate, and flatten suggestions
    const merged = [
      ...projectNames.map((n) => ({ text: n, type: 'project' })),
      ...deptNames.map((n) => ({ text: n, type: 'department' })),
      ...skills.map((s) => ({ text: s, type: 'skill' })),
    ];

    // Deduplicate by text value, return max 10
    const seen = new Set();
    return merged.filter((item) => {
      if (seen.has(item.text.toLowerCase())) return false;
      seen.add(item.text.toLowerCase());
      return true;
    }).slice(0, 10);
  }

  /**
   * 8. Save Search Query to History (max 10 per user)
   */
  async saveSearchQuery(userId, query) {
    if (!query || query.trim() === '') return;

    const cleanQuery = query.trim().toLowerCase();

    // Remove existing duplicate
    await SearchHistory.deleteOne({ user: userId, query: cleanQuery });

    // Insert fresh
    await SearchHistory.create({ user: userId, query: cleanQuery });

    // Keep only the latest 10 — delete all beyond that
    const all = await SearchHistory.find({ user: userId })
      .sort({ createdAt: -1 })
      .select('_id')
      .lean();

    if (all.length > 10) {
      const toDelete = all.slice(10).map((r) => r._id);
      await SearchHistory.deleteMany({ _id: { $in: toDelete } });
    }
  }

  /**
   * 9. Get Search History for user
   */
  async getSearchHistory(userId) {
    return SearchHistory.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();
  }

  /**
   * 10. Clear Search History for user
   */
  async clearSearchHistory(userId) {
    await SearchHistory.deleteMany({ user: userId });
  }
}

module.exports = new SearchService();
