/**
 * Validators for the Dashboard Analytics Module
 */

const validateDashboardQueries = (req, res, next) => {
  const { page, limit } = req.query;

  if (page !== undefined) {
    const parsedPage = parseInt(page);
    if (isNaN(parsedPage) || parsedPage <= 0) {
      return res.status(400).json({ success: false, message: 'Page must be a positive integer' });
    }
  }

  if (limit !== undefined) {
    const parsedLimit = parseInt(limit);
    if (isNaN(parsedLimit) || parsedLimit <= 0 || parsedLimit > 100) {
      return res.status(400).json({ success: false, message: 'Limit must be a positive integer (max 100)' });
    }
  }

  next();
};

module.exports = {
  validateDashboardQueries,
};
