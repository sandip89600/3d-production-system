const searchService = require('../services/searchService');
const { logActivity } = require('../middleware/auth');

/**
 * Controller for Global Search & Advanced Filtering Module
 */

// GET /api/search?q=...
const globalSearch = async (req, res) => {
  try {
    const { q, page, limit } = req.query;
    const results = await searchService.globalSearch(
      q,
      req.user,
      parseInt(page) || 1,
      parseInt(limit) || 5
    );

    // Save to history if there was a query
    if (q && q.trim()) {
      searchService.saveSearchQuery(req.user._id, q).catch(() => {});
    }

    res.json({ success: true, query: q, results });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/search/projects
const searchProjects = async (req, res) => {
  try {
    const { q, page, limit, ...filters } = req.query;
    const result = await searchService.searchProjects(
      q,
      filters,
      req.user,
      parseInt(page) || 1,
      parseInt(limit) || 10
    );

    if (q && q.trim()) {
      searchService.saveSearchQuery(req.user._id, q).catch(() => {});
    }

    res.json({ success: true, query: q, ...result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/search/employees
const searchEmployees = async (req, res) => {
  try {
    const { q, page, limit, ...filters } = req.query;
    const result = await searchService.searchEmployees(
      q,
      filters,
      req.user,
      parseInt(page) || 1,
      parseInt(limit) || 10
    );

    if (q && q.trim()) {
      searchService.saveSearchQuery(req.user._id, q).catch(() => {});
    }

    res.json({ success: true, query: q, ...result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/search/departments
const searchDepartments = async (req, res) => {
  try {
    const { q, page, limit } = req.query;
    const result = await searchService.searchDepartments(
      q,
      parseInt(page) || 1,
      parseInt(limit) || 10
    );

    res.json({ success: true, query: q, ...result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/search/notifications
const searchNotifications = async (req, res) => {
  try {
    const { q, page, limit, ...filters } = req.query;
    const result = await searchService.searchNotifications(
      q,
      filters,
      req.user,
      parseInt(page) || 1,
      parseInt(limit) || 10
    );

    res.json({ success: true, query: q, ...result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/search/activity
const searchActivity = async (req, res) => {
  try {
    const { q, page, limit, ...filters } = req.query;
    const result = await searchService.searchActivity(
      q,
      filters,
      req.user,
      parseInt(page) || 1,
      parseInt(limit) || 10
    );

    res.json({ success: true, query: q, ...result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/search/suggestions?q=...
const getSuggestions = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 2) {
      return res.json({ success: true, suggestions: [] });
    }

    const suggestions = await searchService.getSuggestions(q, req.user);
    res.json({ success: true, query: q, suggestions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/search/history
const getSearchHistory = async (req, res) => {
  try {
    const history = await searchService.getSearchHistory(req.user._id);
    res.json({ success: true, history });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/search/history
const clearSearchHistory = async (req, res) => {
  try {
    await searchService.clearSearchHistory(req.user._id);
    res.json({ success: true, message: 'Search history cleared successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  globalSearch,
  searchProjects,
  searchEmployees,
  searchDepartments,
  searchNotifications,
  searchActivity,
  getSuggestions,
  getSearchHistory,
  clearSearchHistory,
};
