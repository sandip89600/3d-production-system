const jwt = require('jsonwebtoken');

/**
 * Generate a secure 24-hour download token for a project
 * @param {string} projectIdCode - e.g. "ARC-2026-001"
 * @param {string} userId - ID of the user downloading (employee or admin)
 * @returns {string} JWT Token
 */
const generateDownloadToken = (projectIdCode, userId) => {
  return jwt.sign(
    { projectIdCode, userId, purpose: 'project-download' },
    process.env.JWT_SECRET || '3dproduction_super_secret_jwt_key_2024_enterprise',
    { expiresIn: '24h' }
  );
};

/**
 * Generate the direct download link with token parameter
 * @param {Object} project - Project mongoose document
 * @param {string} [userId] - User ID of recipient (e.g. employee user ID)
 * @returns {string} Download URL
 */
const getDownloadLink = (project, userId = null) => {
  const recipientId = userId || project.assignedTo || project.uploadedBy;
  const token = generateDownloadToken(project.projectId, recipientId);
  const baseUrl = process.env.DOWNLOAD_BASE_URL || 'https://download.all3dstudio.com';
  
  // Format: https://download.all3dstudio.com/project/ARC-2026-001?token=abc123
  return `${baseUrl}/project/${project.projectId}?token=${token}`;
};

module.exports = {
  generateDownloadToken,
  getDownloadLink,
};
