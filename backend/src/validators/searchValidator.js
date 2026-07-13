const mongoose = require('mongoose');

/**
 * Validators for the Global Search Module
 */

const VALID_SORTS = [
  'newest', 'oldest', 'a-z', 'z-a',
  'progress-high', 'progress-low',
  'deadline-asc', 'deadline-desc',
];

const VALID_STATUSES = ['pending', 'available', 'in-progress', 'review', 'completed', 'delayed'];
const VALID_PRIORITIES = ['low', 'medium', 'high', 'critical'];

const validateSearchQuery = (req, res, next) => {
  const { q, sort, status, priority, department, employee, page, limit, startDate, endDate, minProgress, maxProgress } = req.query;

  if (q !== undefined && typeof q !== 'string') {
    return res.status(400).json({ success: false, message: 'Query (q) must be a string' });
  }

  if (sort && !VALID_SORTS.includes(sort)) {
    return res.status(400).json({ success: false, message: `Sort must be one of: ${VALID_SORTS.join(', ')}` });
  }

  if (status && !VALID_STATUSES.includes(status)) {
    return res.status(400).json({ success: false, message: `Status must be one of: ${VALID_STATUSES.join(', ')}` });
  }

  if (priority && !VALID_PRIORITIES.includes(priority)) {
    return res.status(400).json({ success: false, message: `Priority must be one of: ${VALID_PRIORITIES.join(', ')}` });
  }

  if (department && !mongoose.Types.ObjectId.isValid(department)) {
    return res.status(400).json({ success: false, message: 'Invalid department ID' });
  }

  if (employee && !mongoose.Types.ObjectId.isValid(employee)) {
    return res.status(400).json({ success: false, message: 'Invalid employee ID' });
  }

  if (startDate && isNaN(new Date(startDate).getTime())) {
    return res.status(400).json({ success: false, message: 'Invalid startDate format' });
  }

  if (endDate && isNaN(new Date(endDate).getTime())) {
    return res.status(400).json({ success: false, message: 'Invalid endDate format' });
  }

  if (minProgress !== undefined) {
    const val = parseFloat(minProgress);
    if (isNaN(val) || val < 0 || val > 100) {
      return res.status(400).json({ success: false, message: 'minProgress must be a number between 0 and 100' });
    }
  }

  if (maxProgress !== undefined) {
    const val = parseFloat(maxProgress);
    if (isNaN(val) || val < 0 || val > 100) {
      return res.status(400).json({ success: false, message: 'maxProgress must be a number between 0 and 100' });
    }
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

module.exports = { validateSearchQuery };
