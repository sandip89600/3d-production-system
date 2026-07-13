const express = require('express');
const router = express.Router();
const {
  globalSearch,
  searchProjects,
  searchEmployees,
  searchDepartments,
  searchNotifications,
  searchActivity,
  getSuggestions,
  getSearchHistory,
  clearSearchHistory,
} = require('../controllers/searchController');
const { authenticateJWT, requireRole } = require('../middleware/auth');
const { validateSearchQuery } = require('../validators/searchValidator');

// All search routes require authentication
router.use(authenticateJWT);

// Global search — all roles
router.get('/', validateSearchQuery, globalSearch);

// Specific collection searches
router.get('/projects', validateSearchQuery, searchProjects);
router.get('/employees', validateSearchQuery, searchEmployees);
router.get('/departments', validateSearchQuery, searchDepartments);
router.get('/notifications', validateSearchQuery, searchNotifications);

// Activity log search — superadmin and admin only
router.get('/activity', requireRole('superadmin', 'admin'), validateSearchQuery, searchActivity);

// Suggestions — all roles
router.get('/suggestions', getSuggestions);

// History — all roles
router.get('/history', getSearchHistory);
router.delete('/history', clearSearchHistory);

module.exports = router;
