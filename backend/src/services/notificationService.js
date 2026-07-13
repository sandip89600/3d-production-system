const Notification = require('../models/Notification');
const User = require('../models/User');

class NotificationService {
  constructor(io) {
    this.io = io;
  }

  setIO(io) {
    this.io = io;
  }

  // ─────────────────────────────────────────────────────────────────
  // CORE — Create & Emit
  // ─────────────────────────────────────────────────────────────────

  /**
   * Create a notification and emit via Socket.IO
   */
  async create({
    recipient,
    sender,
    type,
    title,
    message,
    data,
    link,
    category = 'info',
    priority = 'low',
    project,
    icon,
  }) {
    try {
      const notification = await Notification.create({
        recipient,
        sender,
        type,
        title,
        message,
        data,
        link,
        category,
        priority,
        project,
        icon,
      });

      // Real-time delivery via Socket.IO
      if (this.io) {
        this.io.to(`user_${recipient}`).emit('notification', notification.toObject());
      }

      return notification;
    } catch (error) {
      console.error('[NotificationService] create error:', error.message);
      throw error;
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // READ
  // ─────────────────────────────────────────────────────────────────

  /**
   * Get paginated notifications for a user (with filters)
   */
  async getUserNotifications(userId, page = 1, limit = 20, filters = {}) {
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const match = { recipient: userId, isArchived: false };

    if (filters.category) match.category = filters.category;
    if (filters.priority) match.priority = filters.priority;
    if (filters.type) match.type = filters.type;
    if (filters.read !== undefined) match.read = filters.read === 'true';
    if (filters.startDate || filters.endDate) {
      match.createdAt = {};
      if (filters.startDate) match.createdAt.$gte = new Date(filters.startDate);
      if (filters.endDate) match.createdAt.$lte = new Date(filters.endDate);
    }

    const [notifications, total] = await Promise.all([
      Notification.find(match)
        .populate('sender', 'name email role')
        .populate('project', 'name projectId')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Notification.countDocuments(match),
    ]);

    return {
      notifications,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
    };
  }

  /**
   * Get unread notifications only
   */
  async getUnreadNotifications(userId, page = 1, limit = 20) {
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const match = { recipient: userId, read: false, isArchived: false };

    const [notifications, total] = await Promise.all([
      Notification.find(match)
        .populate('sender', 'name email role')
        .populate('project', 'name projectId')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Notification.countDocuments(match),
    ]);

    return {
      notifications,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
    };
  }

  /**
   * Get a single notification securely
   */
  async getNotificationById(id, userId) {
    return Notification.findOne({ _id: id, recipient: userId })
      .populate('sender', 'name email role')
      .populate('project', 'name projectId');
  }

  /**
   * Get count stats: total, unread, archived
   */
  async getNotificationCount(userId) {
    const [total, unread, archived] = await Promise.all([
      Notification.countDocuments({ recipient: userId, isArchived: false }),
      Notification.countDocuments({ recipient: userId, read: false, isArchived: false }),
      Notification.countDocuments({ recipient: userId, isArchived: true }),
    ]);
    return { total, unread, archived };
  }

  /**
   * Existing method — kept for backward compatibility
   */
  async getUnreadCount(userId) {
    return Notification.countDocuments({ recipient: userId, read: false, isArchived: false });
  }

  // ─────────────────────────────────────────────────────────────────
  // MARK READ
  // ─────────────────────────────────────────────────────────────────

  async markRead(notificationId, userId) {
    return Notification.findOneAndUpdate(
      { _id: notificationId, recipient: userId },
      { read: true, readAt: new Date() },
      { new: true }
    );
  }

  async markAllRead(userId) {
    return Notification.updateMany(
      { recipient: userId, read: false, isArchived: false },
      { read: true, readAt: new Date() }
    );
  }

  // ─────────────────────────────────────────────────────────────────
  // ARCHIVE / RESTORE / DELETE
  // ─────────────────────────────────────────────────────────────────

  async archiveNotification(id, userId) {
    return Notification.findOneAndUpdate(
      { _id: id, recipient: userId },
      { isArchived: true, archivedAt: new Date() },
      { new: true }
    );
  }

  async restoreNotification(id, userId) {
    return Notification.findOneAndUpdate(
      { _id: id, recipient: userId },
      { isArchived: false, archivedAt: null },
      { new: true }
    );
  }

  async deleteNotification(id, userId) {
    return Notification.findOneAndDelete({ _id: id, recipient: userId });
  }

  // ─────────────────────────────────────────────────────────────────
  // SEARCH
  // ─────────────────────────────────────────────────────────────────

  async searchNotifications(userId, q, filters = {}, page = 1, limit = 20) {
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const match = { recipient: userId };

    if (q && q.trim()) {
      const regex = new RegExp(q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      match.$or = [{ title: regex }, { message: regex }];
    }

    if (filters.category) match.category = filters.category;
    if (filters.priority) match.priority = filters.priority;
    if (filters.isArchived !== undefined) match.isArchived = filters.isArchived === 'true';
    if (filters.read !== undefined) match.read = filters.read === 'true';
    if (filters.startDate || filters.endDate) {
      match.createdAt = {};
      if (filters.startDate) match.createdAt.$gte = new Date(filters.startDate);
      if (filters.endDate) match.createdAt.$lte = new Date(filters.endDate);
    }

    const [notifications, total] = await Promise.all([
      Notification.find(match)
        .populate('sender', 'name email role')
        .populate('project', 'name projectId')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Notification.countDocuments(match),
    ]);

    return {
      notifications,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
    };
  }

  // ─────────────────────────────────────────────────────────────────
  // BULK HELPERS
  // ─────────────────────────────────────────────────────────────────

  /**
   * Notify all employees in a department — kept from original
   */
  async notifyDepartmentEmployees(employees, notificationData) {
    const promises = employees.map((empId) =>
      this.create({ ...notificationData, recipient: empId })
    );
    return Promise.all(promises);
  }

  /**
   * Broadcast a system announcement to ALL active users
   */
  async broadcastAnnouncement(senderId, { title, message, priority = 'medium' }) {
    try {
      const users = await User.find({ isActive: true }).select('_id').lean();
      const promises = users.map((u) =>
        this.create({
          recipient: u._id,
          sender: senderId,
          type: 'announcement',
          title,
          message,
          category: 'announcement',
          priority,
          icon: 'megaphone',
        })
      );
      await Promise.all(promises);
      return { sent: users.length };
    } catch (error) {
      console.error('[NotificationService] broadcastAnnouncement error:', error.message);
      throw error;
    }
  }

  /**
   * Notify assigned employee + uploading admin of approaching deadline
   */
  async notifyDeadlineApproaching(project, daysLeft) {
    try {
      const { _id: projectId, name: projectName, assignedTo, uploadedBy, deadline } = project;

      const notifType = daysLeft <= 0 ? 'deadline_missed' : daysLeft === 1 ? 'deadline_1day' : 'deadline_3days';
      const category = daysLeft <= 0 ? 'error' : daysLeft === 1 ? 'warning' : 'warning';
      const priority = daysLeft <= 0 ? 'critical' : 'high';
      const title =
        daysLeft <= 0
          ? `Deadline Missed — ${projectName}`
          : `Deadline in ${daysLeft} Day${daysLeft > 1 ? 's' : ''} — ${projectName}`;
      const message =
        daysLeft <= 0
          ? `The project "${projectName}" has missed its deadline (${new Date(deadline).toDateString()}).`
          : `The project "${projectName}" deadline is in ${daysLeft} day${daysLeft > 1 ? 's' : ''} on ${new Date(deadline).toDateString()}.`;

      const targets = [];
      if (assignedTo) targets.push(String(assignedTo));
      if (uploadedBy && String(uploadedBy) !== String(assignedTo)) targets.push(String(uploadedBy));

      await Promise.all(
        targets.map((recipientId) =>
          this.create({
            recipient: recipientId,
            type: notifType,
            title,
            message,
            category,
            priority,
            project: projectId,
            icon: daysLeft <= 0 ? 'alert-circle' : 'clock',
          })
        )
      );
    } catch (error) {
      console.error('[NotificationService] notifyDeadlineApproaching error:', error.message);
    }
  }
}

module.exports = new NotificationService();
