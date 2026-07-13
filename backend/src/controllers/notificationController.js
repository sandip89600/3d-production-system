const notificationService = require('../services/notificationService');

/**
 * Controller for Notification Center Module
 */

// GET /api/notifications
const listNotifications = async (req, res) => {
  try {
    const { page, limit, ...filters } = req.query;
    const result = await notificationService.getUserNotifications(
      req.user._id,
      parseInt(page) || 1,
      parseInt(limit) || 20,
      filters
    );
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/notifications/unread
const listUnread = async (req, res) => {
  try {
    const { page, limit } = req.query;
    const result = await notificationService.getUnreadNotifications(
      req.user._id,
      parseInt(page) || 1,
      parseInt(limit) || 20
    );
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/notifications/count
const getCount = async (req, res) => {
  try {
    const counts = await notificationService.getNotificationCount(req.user._id);
    res.json({ success: true, ...counts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/notifications/search
const searchNotifications = async (req, res) => {
  try {
    const { q, page, limit, ...filters } = req.query;
    const result = await notificationService.searchNotifications(
      req.user._id,
      q,
      filters,
      parseInt(page) || 1,
      parseInt(limit) || 20
    );
    res.json({ success: true, query: q, ...result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/notifications/:id
const getOne = async (req, res) => {
  try {
    const notification = await notificationService.getNotificationById(req.params.id, req.user._id);
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    res.json({ success: true, notification });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/notifications/read/:id
const markRead = async (req, res) => {
  try {
    const notification = await notificationService.markRead(req.params.id, req.user._id);
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    res.json({ success: true, message: 'Marked as read', notification });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/notifications/read-all
const markAllRead = async (req, res) => {
  try {
    const result = await notificationService.markAllRead(req.user._id);
    res.json({ success: true, message: 'All notifications marked as read', modifiedCount: result.modifiedCount });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/notifications/archive/:id
const archiveOne = async (req, res) => {
  try {
    const notification = await notificationService.archiveNotification(req.params.id, req.user._id);
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    res.json({ success: true, message: 'Notification archived', notification });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/notifications/restore/:id
const restoreOne = async (req, res) => {
  try {
    const notification = await notificationService.restoreNotification(req.params.id, req.user._id);
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    res.json({ success: true, message: 'Notification restored', notification });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/notifications/:id
const deleteOne = async (req, res) => {
  try {
    const deleted = await notificationService.deleteNotification(req.params.id, req.user._id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    res.json({ success: true, message: 'Notification deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/notifications/broadcast  (Super Admin only)
const broadcastAnnouncement = async (req, res) => {
  try {
    const result = await notificationService.broadcastAnnouncement(req.user._id, req.body);
    res.json({
      success: true,
      message: `Announcement broadcast to ${result.sent} user(s)`,
      ...result,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  listNotifications,
  listUnread,
  getCount,
  searchNotifications,
  getOne,
  markRead,
  markAllRead,
  archiveOne,
  restoreOne,
  deleteOne,
  broadcastAnnouncement,
};
