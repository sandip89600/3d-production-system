const express = require('express');
const router = express.Router();
const {
  getProfile,
  updateProfile,
  changePassword,
  uploadPhoto,
  removePhoto,
  updateSettings,
  updatePrivacy,
  getActivity,
  logoutAllDevices,
} = require('../controllers/profileController');
const { authenticateJWT } = require('../middleware/auth');
const profileUpload = require('../middleware/profileUpload');
const {
  validateProfileUpdate,
  validatePasswordChange,
  validateSettingsUpdate,
  validatePrivacyUpdate,
} = require('../validators/profileValidator');

// GET /api/profile
router.get('/', authenticateJWT, getProfile);

// PUT /api/profile
router.put('/', authenticateJWT, validateProfileUpdate, updateProfile);
router.put('/update', authenticateJWT, validateProfileUpdate, updateProfile);

// PUT /api/profile/change-password
router.put('/change-password', authenticateJWT, validatePasswordChange, changePassword);

// POST /api/profile/upload-photo
router.post('/upload-photo', authenticateJWT, profileUpload.single('photo'), uploadPhoto);

// DELETE /api/profile/remove-photo
router.delete('/remove-photo', authenticateJWT, removePhoto);

// PUT /api/profile/settings
router.put('/settings', authenticateJWT, validateSettingsUpdate, updateSettings);

// PUT /api/profile/privacy
router.put('/privacy', authenticateJWT, validatePrivacyUpdate, updatePrivacy);

// GET /api/profile/activity
router.get('/activity', authenticateJWT, getActivity);

// POST /api/profile/logout-all
router.post('/logout-all', authenticateJWT, logoutAllDevices);

module.exports = router;
