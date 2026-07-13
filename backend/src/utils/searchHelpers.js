/**
 * Search Helper Utilities
 * Provides reusable functions for sort order, regex building, and pagination
 */

/**
 * Convert sort string param to MongoDB sort object
 */
const getSortOrder = (sort) => {
  switch (sort) {
    case 'oldest':
      return { createdAt: 1 };
    case 'a-z':
      return { name: 1 };
    case 'z-a':
      return { name: -1 };
    case 'progress-high':
      return { progress: -1 };
    case 'progress-low':
      return { progress: 1 };
    case 'deadline-asc':
      return { deadline: 1 };
    case 'deadline-desc':
      return { deadline: -1 };
    case 'newest':
    default:
      return { createdAt: -1 };
  }
};

/**
 * Build a case-insensitive regex for text searches.
 * Escapes special regex characters for safety.
 */
const buildRegex = (q) => {
  if (!q || q.trim() === '') return null;
  const escaped = q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(escaped, 'i');
};

/**
 * Build a date range query object
 */
const buildDateRange = (startDate, endDate) => {
  const range = {};
  if (startDate) range.$gte = new Date(startDate);
  if (endDate) range.$lte = new Date(endDate);
  return Object.keys(range).length > 0 ? range : null;
};

/**
 * Build pagination metadata
 */
const buildPagination = (total, page, limit) => ({
  total,
  page,
  limit,
  totalPages: Math.ceil(total / limit),
  hasNextPage: page < Math.ceil(total / limit),
  hasPrevPage: page > 1,
});

module.exports = {
  getSortOrder,
  buildRegex,
  buildDateRange,
  buildPagination,
};
