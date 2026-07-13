const mongoose = require('mongoose');

/**
 * Validators for Reports & Export Module
 */

const validateReportFilters = (req, res, next) => {
  const { startDate, endDate, department, employee, admin, status, priority, type, page, limit } = req.query;

  // Date validations
  if (startDate) {
    const start = new Date(startDate);
    if (isNaN(start.getTime())) {
      return res.status(400).json({ success: false, message: 'Invalid startDate format' });
    }
  }

  if (endDate) {
    const end = new Date(endDate);
    if (isNaN(end.getTime())) {
      return res.status(400).json({ success: false, message: 'Invalid endDate format' });
    }
  }

  // ObjectId validations
  if (department && !mongoose.Types.ObjectId.isValid(department)) {
    return res.status(400).json({ success: false, message: 'Invalid department ID' });
  }

  if (employee && !mongoose.Types.ObjectId.isValid(employee)) {
    return res.status(400).json({ success: false, message: 'Invalid employee ID' });
  }

  if (admin && !mongoose.Types.ObjectId.isValid(admin)) {
    return res.status(400).json({ success: false, message: 'Invalid admin ID' });
  }

  // Enum validations
  if (status) {
    const allowedStatuses = ['pending', 'available', 'in-progress', 'review', 'completed', 'delayed'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: `Status must be one of: ${allowedStatuses.join(', ')}` });
    }
  }

  if (priority) {
    const allowedPriorities = ['low', 'medium', 'high', 'critical'];
    if (!allowedPriorities.includes(priority)) {
      return res.status(400).json({ success: false, message: `Priority must be one of: ${allowedPriorities.join(', ')}` });
    }
  }

  if (type) {
    const allowedTypes = ['3D architecture', 'Modeling', 'rendering', 'VFX', 'Other'];
    if (!allowedTypes.includes(type)) {
      return res.status(400).json({ success: false, message: `Project type must be one of: ${allowedTypes.join(', ')}` });
    }
  }

  // Pagination validations
  if (page) {
    const parsedPage = parseInt(page);
    if (isNaN(parsedPage) || parsedPage <= 0) {
      return res.status(400).json({ success: false, message: 'Page must be a positive integer' });
    }
  }

  if (limit) {
    const parsedLimit = parseInt(limit);
    if (isNaN(parsedLimit) || parsedLimit <= 0 || parsedLimit > 100) {
      return res.status(400).json({ success: false, message: 'Limit must be a positive integer (max 100)' });
    }
  }

  next();
};

const validateExportType = (req, res, next) => {
  const { type } = req.query;
  const allowedTypes = ['projects', 'employees', 'admins', 'departments'];

  if (!type || !allowedTypes.includes(type)) {
    return res.status(400).json({
      success: false,
      message: `Export type is required and must be one of: ${allowedTypes.join(', ')}`,
    });
  }

  next();
};

module.exports = {
  validateReportFilters,
  validateExportType,
};
