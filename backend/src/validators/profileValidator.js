/**
 * Validators for the Profile Management Module
 */

const validateProfileUpdate = (req, res, next) => {
  const {
    fullName,
    mobile,
    address,
    city,
    state,
    country,
    postalCode,
    emergencyContact,
    skills,
    dateOfBirth,
    gender,
    username,
  } = req.body;

  // Filter out any restricted fields to prevent users from bypassing restrictions
  const restrictedFields = ['role', 'employeeId', 'department', 'accountStatus', 'joiningDate', 'emailVerified', 'mobileVerified'];
  for (const field of restrictedFields) {
    if (req.body[field] !== undefined) {
      return res.status(400).json({
        success: false,
        message: `Field '${field}' is restricted and cannot be updated via profile update.`,
      });
    }
  }

  // Type & format validations
  if (fullName !== undefined) {
    if (typeof fullName !== 'string' || fullName.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Full name must be a non-empty string' });
    }
  }

  if (username !== undefined) {
    if (typeof username !== 'string' || username.trim().length < 3) {
      return res.status(400).json({ success: false, message: 'Username must be at least 3 characters long' });
    }
  }

  if (mobile !== undefined && mobile !== null && mobile !== '') {
    // Regex for basic international phone number format: e.g. +1234567890 or 1234567890
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    if (!phoneRegex.test(mobile.replace(/[\s-()]/g, ''))) {
      return res.status(400).json({ success: false, message: 'Invalid mobile number format' });
    }
  }

  if (gender !== undefined && gender !== null && gender !== '') {
    if (!['male', 'female', 'other'].includes(gender)) {
      return res.status(400).json({ success: false, message: 'Gender must be male, female, or other' });
    }
  }

  if (dateOfBirth !== undefined && dateOfBirth !== null && dateOfBirth !== '') {
    const dob = new Date(dateOfBirth);
    if (isNaN(dob.getTime())) {
      return res.status(400).json({ success: false, message: 'Invalid date of birth format' });
    }
  }

  if (skills !== undefined) {
    if (!Array.isArray(skills)) {
      return res.status(400).json({ success: false, message: 'Skills must be an array of strings' });
    }
    for (const skill of skills) {
      if (typeof skill !== 'string') {
        return res.status(400).json({ success: false, message: 'Every skill item must be a string' });
      }
    }
  }

  if (emergencyContact !== undefined && emergencyContact !== null) {
    if (typeof emergencyContact !== 'object') {
      return res.status(400).json({ success: false, message: 'Emergency contact must be an object' });
    }
    const { name, mobile: contactMobile, relation } = emergencyContact;
    if (name !== undefined && typeof name !== 'string') {
      return res.status(400).json({ success: false, message: 'Emergency contact name must be a string' });
    }
    if (relation !== undefined && typeof relation !== 'string') {
      return res.status(400).json({ success: false, message: 'Emergency contact relation must be a string' });
    }
    if (contactMobile !== undefined && contactMobile !== null && contactMobile !== '') {
      const phoneRegex = /^\+?[1-9]\d{1,14}$/;
      if (!phoneRegex.test(contactMobile.replace(/[\s-()]/g, ''))) {
        return res.status(400).json({ success: false, message: 'Invalid emergency contact mobile number format' });
      }
    }
  }

  next();
};

const validatePasswordChange = (req, res, next) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      success: false,
      message: 'Current password and new password are required',
    });
  }

  if (confirmPassword !== undefined && newPassword !== confirmPassword) {
    return res.status(400).json({
      success: false,
      message: 'New password and confirm password do not match',
    });
  }

  // Strong password regex: min 8 chars, 1 uppercase, 1 lowercase, 1 digit, 1 special char
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#.\-_])[A-Za-z\d@$!%*?&#.\-_]{8,}$/;
  if (!passwordRegex.test(newPassword)) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&#.-_).',
    });
  }

  next();
};

const validateSettingsUpdate = (req, res, next) => {
  const { notificationSettings, language, timezone, darkMode } = req.body;

  if (notificationSettings !== undefined && notificationSettings !== null) {
    if (typeof notificationSettings !== 'object') {
      return res.status(400).json({ success: false, message: 'Notification settings must be an object' });
    }
    const { email, whatsapp, system, deadlineAlerts } = notificationSettings;
    if (email !== undefined && typeof email !== 'boolean') {
      return res.status(400).json({ success: false, message: 'Email notification setting must be a boolean' });
    }
    if (whatsapp !== undefined && typeof whatsapp !== 'boolean') {
      return res.status(400).json({ success: false, message: 'WhatsApp notification setting must be a boolean' });
    }
    if (system !== undefined && typeof system !== 'boolean') {
      return res.status(400).json({ success: false, message: 'System/In-App notification setting must be a boolean' });
    }
    if (deadlineAlerts !== undefined && typeof deadlineAlerts !== 'boolean') {
      return res.status(400).json({ success: false, message: 'Deadline alerts notification setting must be a boolean' });
    }
  }

  if (language !== undefined && language !== null) {
    if (typeof language !== 'string' || language.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Language must be a non-empty string' });
    }
  }

  if (timezone !== undefined && timezone !== null) {
    if (typeof timezone !== 'string' || timezone.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Timezone must be a non-empty string' });
    }
  }

  if (darkMode !== undefined && darkMode !== null) {
    if (typeof darkMode !== 'boolean') {
      return res.status(400).json({ success: false, message: 'DarkMode must be a boolean' });
    }
  }

  next();
};

const validatePrivacyUpdate = (req, res, next) => {
  const { privacySettings } = req.body;

  if (!privacySettings || typeof privacySettings !== 'object') {
    return res.status(400).json({
      success: false,
      message: 'Privacy settings object is required',
    });
  }

  const { profileVisibility, emailVisibility, mobileVisibility } = privacySettings;
  const allowedVisibilities = ['public', 'team', 'private'];

  if (profileVisibility !== undefined) {
    if (!allowedVisibilities.includes(profileVisibility)) {
      return res.status(400).json({ success: false, message: 'Profile visibility must be public, team, or private' });
    }
  }

  if (emailVisibility !== undefined) {
    if (!allowedVisibilities.includes(emailVisibility)) {
      return res.status(400).json({ success: false, message: 'Email visibility must be public, team, or private' });
    }
  }

  if (mobileVisibility !== undefined) {
    if (!allowedVisibilities.includes(mobileVisibility)) {
      return res.status(400).json({ success: false, message: 'Mobile visibility must be public, team, or private' });
    }
  }

  next();
};

module.exports = {
  validateProfileUpdate,
  validatePasswordChange,
  validateSettingsUpdate,
  validatePrivacyUpdate,
};
