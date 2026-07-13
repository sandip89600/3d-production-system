const fs = require('fs');
const path = require('path');
const User = require('../models/User');
const Project = require('../models/Project');
const Department = require('../models/Department');
const ActivityLog = require('../models/ActivityLog');
const { logActivity } = require('../middleware/auth');
const profileService = require('../services/profileService');
const storageService = require('../services/storageService');

/**
 * Controller for Profile Module
 */

// GET /api/profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('department', 'name code color icon');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Role-based statistics calculation
    let statistics = {};
    if (user.role === 'superadmin') {
      const [totalUsers, totalDepartments, totalProjects, systemActivityCount, securityLogsCount] = await Promise.all([
        User.countDocuments({}),
        Department.countDocuments({}),
        Project.countDocuments({}),
        ActivityLog.countDocuments({}),
        ActivityLog.countDocuments({
          action: { $in: ['login_failed', 'login_locked', 'password_reset', 'otp_verification_success'] },
        }),
      ]);
      statistics = {
        totalUsers,
        totalDepartments,
        totalProjects,
        systemActivityCount,
        securityLogsCount,
      };
    } else if (user.role === 'admin') {
      const [totalUploadedProjects, activeProjects, completedProjects, reviewProjects] = await Promise.all([
        Project.countDocuments({ uploadedBy: user._id }),
        Project.countDocuments({ uploadedBy: user._id, status: 'in-progress' }),
        Project.countDocuments({ uploadedBy: user._id, status: 'completed' }),
        Project.countDocuments({ uploadedBy: user._id, status: 'review' }),
      ]);
      statistics = {
        totalUploadedProjects,
        activeProjects,
        completedProjects,
        reviewProjects,
        employeePerformanceSummary: {
          onTimeCompletionRate: 88,
          averageRating: 4.6,
          activeArtists: 7,
        },
      };
    } else if (user.role === 'employee') {
      const [totalAssigned, activeProjects, completedProjects, delayedProjects] = await Promise.all([
        Project.countDocuments({ assignedTo: user._id }),
        Project.countDocuments({ assignedTo: user._id, status: 'in-progress' }),
        Project.countDocuments({ assignedTo: user._id, status: 'completed' }),
        Project.countDocuments({ assignedTo: user._id, status: 'delayed' }),
      ]);
      statistics = {
        totalAssigned,
        activeProjects,
        completedProjects,
        delayedProjects,
        performanceScore: totalAssigned > 0 ? Math.round((completedProjects / totalAssigned) * 100) : 100,
      };
    }

    // Fetch recent 10 activities of this user
    const recentActivities = await ActivityLog.find({ user: user._id })
      .sort({ createdAt: -1 })
      .limit(10);

    // Log view profile activity
    await logActivity(req, 'profile_view', `Viewed profile details`);

    res.json({
      success: true,
      user,
      statistics,
      recentActivities,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/profile
const updateProfile = async (req, res) => {
  try {
    const updatedUser = await profileService.updateProfileData(req.user._id, req.body);

    await logActivity(req, 'profile_update', `Updated profile information`);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/profile/change-password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Incorrect current password' });
    }

    await profileService.changeUserPassword(req.user._id, newPassword);

    await logActivity(req, 'password_change', 'Updated account password');

    res.json({
      success: true,
      message: 'Password updated successfully. Other active sessions have been invalidated.',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/profile/upload-photo
const uploadPhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Delete old profile photo from cloud storage if it exists
    if (user.profilePhoto) {
      try {
        await storageService.deleteFileByKey(user.profilePhoto);
      } catch (err) {
        console.warn('[ProfileController] Could not delete old photo:', err.message);
      }
    }

    // Upload new photo to cloud storage
    const { url } = await storageService.uploadFile({
      buffer: req.file.buffer,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      fileSize: req.file.size,
      folder: 'profiles',
      uploadedBy: req.user._id,
    });

    user.profilePhoto = url;
    await user.save();

    await logActivity(req, 'profile_update', 'Uploaded new profile photo');

    res.json({
      success: true,
      message: 'Profile photo uploaded successfully',
      profilePhoto: url,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/profile/remove-photo
const removePhoto = async (req, res) => {
  try {
    await profileService.removeUserProfilePhoto(req.user._id);

    await logActivity(req, 'profile_update', 'Removed profile photo');

    res.json({
      success: true,
      message: 'Profile photo removed successfully',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/profile/settings
const updateSettings = async (req, res) => {
  try {
    const updatedUser = await profileService.updateUserSettings(req.user._id, req.body);

    await logActivity(req, 'profile_update', 'Updated settings preferences');

    res.json({
      success: true,
      message: 'Account settings updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/profile/privacy
const updatePrivacy = async (req, res) => {
  try {
    const updatedUser = await profileService.updateUserPrivacy(req.user._id, req.body);

    await logActivity(req, 'profile_update', 'Updated privacy configurations');

    res.json({
      success: true,
      message: 'Privacy settings updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/profile/activity
const getActivity = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const activityData = await profileService.getUserActivityLogs(req.user._id, page, limit);

    res.json({
      success: true,
      ...activityData,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/profile/logout-all
const logoutAllDevices = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.refreshTokens = [];
    await user.save();

    await logActivity(req, 'logout', 'Logged out from all other devices');

    res.json({
      success: true,
      message: 'Successfully logged out from all other devices.',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
  uploadPhoto,
  removePhoto,
  updateSettings,
  updatePrivacy,
  getActivity,
  logoutAllDevices,
};
