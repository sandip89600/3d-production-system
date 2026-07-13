const VALID_CATEGORIES = ['info', 'success', 'warning', 'error', 'announcement'];
const VALID_PRIORITIES = ['low', 'medium', 'high', 'critical'];

/**
 * Validate query filters for listing/searching notifications
 */
const validateNotificationFilters = (req, res, next) => {
  const { category, priority, page, limit, startDate, endDate } = req.query;

  if (category && !VALID_CATEGORIES.includes(category)) {
    return res.status(400).json({
      success: false,
      message: `Category must be one of: ${VALID_CATEGORIES.join(', ')}`,
    });
  }

  if (priority && !VALID_PRIORITIES.includes(priority)) {
    return res.status(400).json({
      success: false,
      message: `Priority must be one of: ${VALID_PRIORITIES.join(', ')}`,
    });
  }

  if (startDate && isNaN(new Date(startDate).getTime())) {
    return res.status(400).json({ success: false, message: 'Invalid startDate format' });
  }
  if (endDate && isNaN(new Date(endDate).getTime())) {
    return res.status(400).json({ success: false, message: 'Invalid endDate format' });
  }

  if (page !== undefined) {
    const p = parseInt(page);
    if (isNaN(p) || p <= 0) {
      return res.status(400).json({ success: false, message: 'Page must be a positive integer' });
    }
  }
  if (limit !== undefined) {
    const l = parseInt(limit);
    if (isNaN(l) || l <= 0 || l > 100) {
      return res.status(400).json({ success: false, message: 'Limit must be between 1 and 100' });
    }
  }

  next();
};

/**
 * Validate broadcast announcement body (Super Admin only)
 */
const validateBroadcast = (req, res, next) => {
  const { title, message, priority } = req.body;

  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    return res.status(400).json({ success: false, message: 'Broadcast title is required' });
  }
  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return res.status(400).json({ success: false, message: 'Broadcast message is required' });
  }
  if (priority && !VALID_PRIORITIES.includes(priority)) {
    return res.status(400).json({
      success: false,
      message: `Priority must be one of: ${VALID_PRIORITIES.join(', ')}`,
    });
  }

  next();
};

module.exports = {
  validateNotificationFilters,
  validateBroadcast,
};
