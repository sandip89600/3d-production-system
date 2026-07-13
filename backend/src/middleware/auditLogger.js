const ActivityLog = require('../models/ActivityLog');

const auditLogger = (action) => async (req, res, next) => {
  const originalJson = res.json.bind(res);
  res.json = async (body) => {
    try {
      await ActivityLog.create({
        user: req.user?._id,
        userEmail: req.user?.email,
        userRole: req.user?.role,
        action,
        target: req.params?.id || '',
        details: { method: req.method, path: req.path },
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        success: body?.success !== false,
      });
    } catch (e) {
      // Silent fail on audit log
    }
    return originalJson(body);
  };
  next();
};

module.exports = { auditLogger };
