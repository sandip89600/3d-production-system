const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const storageService = require('./storageService');

/**
 * Service class for Profile Module
 */
class ProfileService {
  /**
   * Update profile data
   */
  async updateProfileData(userId, updateFields) {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    const allowedUpdates = [
      'fullName',
      'name', // maps to name in DB, alias 'fullName'
      'mobile',
      'address',
      'city',
      'state',
      'country',
      'postalCode',
      'emergencyContact',
      'skills',
      'dateOfBirth',
      'gender',
      'username',
      'designation',
      'experience',
    ];

    allowedUpdates.forEach((field) => {
      if (updateFields[field] !== undefined) {
        if (field === 'fullName') {
          user.name = updateFields[field]; // Set name since fullName is alias
        } else {
          user[field] = updateFields[field];
        }
      }
    });

    await user.save();
    return user;
  }

  /**
   * Change user password and invalidate refresh tokens
   */
  async changeUserPassword(userId, newPassword) {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    // Hash is handled in Mongoose pre-save hook, but let's make sure it triggers save
    user.password = newPassword;
    user.lastPasswordChange = new Date();
    user.refreshTokens = []; // Log out other devices

    await user.save();
    return user;
  }

  /**
   * Remove user profile photo from cloud storage and clear the DB field
   */
  async removeUserProfilePhoto(userId) {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    if (user.profilePhoto) {
      // Delete from cloud storage (or local fallback)
      try {
        await storageService.deleteFileByKey(user.profilePhoto);
      } catch (err) {
        console.warn('[ProfileService] Could not delete profile photo from storage:', err.message);
      }
      user.profilePhoto = null;
      await user.save();
    }
    return user;
  }

  /**
   * Update account/app settings
   */
  async updateUserSettings(userId, { notificationSettings, language, timezone, darkMode }) {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    if (notificationSettings) {
      user.notificationSettings = {
        ...user.notificationSettings,
        ...notificationSettings,
      };
    }
    if (language !== undefined) user.language = language;
    if (timezone !== undefined) user.timezone = timezone;
    if (darkMode !== undefined) user.darkMode = darkMode;

    await user.save();
    return user;
  }

  /**
   * Update privacy settings
   */
  async updateUserPrivacy(userId, privacySettings) {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    if (privacySettings) {
      user.privacySettings = {
        ...user.privacySettings,
        ...privacySettings,
      };
    }

    await user.save();
    return user;
  }

  /**
   * Get user activity logs
   */
  async getUserActivityLogs(userId, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [activities, total] = await Promise.all([
      ActivityLog.find({ user: userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      ActivityLog.countDocuments({ user: userId }),
    ]);

    return {
      activities,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }
}

module.exports = new ProfileService();
