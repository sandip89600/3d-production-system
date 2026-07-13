const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../models/User');
const Department = require('../models/Department');
const ActivityLog = require('../models/ActivityLog');
const LoginLog = require('../models/LoginLog');
const { generateTokens, logActivity } = require('../middleware/auth');
const emailService = require('../services/emailService');
const twilio = require('twilio');

const getDeviceType = (userAgent = '') => {
  const ua = userAgent.toLowerCase();
  if (ua.includes('tablet') || ua.includes('ipad')) return 'tablet';
  if (ua.includes('mobi') || ua.includes('android') || ua.includes('iphone') || ua.includes('ipod')) return 'mobile';
  return 'desktop';
};

const sendSMS = async (to, content) => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_SMS_FROM || '+14155238886';
  
  if (accountSid && authToken) {
    try {
      const client = twilio(accountSid, authToken);
      await client.messages.create({
        body: content,
        from: from,
        to: to
      });
      console.log(`📱 Real SMS OTP sent to ${to}`);
      return;
    } catch (err) {
      console.error('Twilio failed to send SMS:', err.message);
    }
  }
  
  // Fallback simulator
  console.log('\n📱 [SMS Simulator - OTP Verification]');
  console.log('─'.repeat(60));
  console.log(`To:      ${to}`);
  console.log(`Content: ${content}`);
  console.log('─'.repeat(60));
};

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password, twoFactorToken } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password required' });
    }

    const user = await User.findOne({ email }).select('+password +twoFactorSecret +loginAttempts +lockUntil +refreshTokens');
    if (!user) {
      await ActivityLog.create({ userEmail: email, action: 'login_failed', success: false, details: { reason: 'User not found' }, ip: req.ip });
      await LoginLog.create({
        email,
        role: 'unknown',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        loginTime: new Date(),
        status: 'failed',
        deviceType: getDeviceType(req.headers['user-agent']),
      });
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (user.isLocked) {
      await ActivityLog.create({ user: user._id, userEmail: email, action: 'login_locked', success: false, ip: req.ip });
      await LoginLog.create({
        userId: user._id,
        email: user.email,
        role: user.role,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        loginTime: new Date(),
        status: 'failed',
        deviceType: getDeviceType(req.headers['user-agent']),
      });
      return res.status(423).json({ success: false, message: 'Account locked due to too many failed attempts. Try again in 15 minutes.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account is deactivated.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      await user.incLoginAttempts();
      await ActivityLog.create({ user: user._id, userEmail: email, action: 'login_failed', success: false, details: { attempts: user.loginAttempts + 1 }, ip: req.ip });
      await LoginLog.create({
        userId: user._id,
        email: user.email,
        role: user.role,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        loginTime: new Date(),
        status: 'failed',
        deviceType: getDeviceType(req.headers['user-agent']),
      });
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // 2FA check
    if (user.twoFactorEnabled) {
      if (!twoFactorToken) {
        return res.status(200).json({ success: true, requires2FA: true, message: '2FA token required' });
      }
      const verified = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: 'base32',
        token: twoFactorToken,
        window: 2,
      });
      if (!verified) {
        return res.status(401).json({ success: false, message: 'Invalid 2FA token' });
      }
    }

    await user.resetLoginAttempts();
    await user.updateOne({ lastLoginIP: req.ip });

    const { accessToken, refreshToken } = generateTokens(user._id, user.role);

    // Store refresh token
    await User.findByIdAndUpdate(user._id, {
      $push: { refreshTokens: { $each: [refreshToken], $slice: -5 } },
    });

    await ActivityLog.create({
      user: user._id, userEmail: user.email, userRole: user.role,
      action: 'login', success: true, ip: req.ip, userAgent: req.headers['user-agent'],
    });

    await LoginLog.create({
      userId: user._id,
      email: user.email,
      role: user.role,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      loginTime: new Date(),
      status: 'success',
      deviceType: getDeviceType(req.headers['user-agent']),
    });

    const userObj = user.toJSON();
    res.json({
      success: true,
      message: 'Login successful',
      accessToken,
      refreshToken,
      user: userObj,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/auth/refresh
const refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(401).json({ success: false, message: 'Refresh token required' });

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id).select('+refreshTokens');
    if (!user || !user.refreshTokens.includes(refreshToken)) {
      return res.status(401).json({ success: false, message: 'Invalid refresh token' });
    }

    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user._id, user.role);
    user.refreshTokens = user.refreshTokens.filter(t => t !== refreshToken);
    user.refreshTokens.push(newRefreshToken);
    if (user.refreshTokens.length > 5) {
      user.refreshTokens = user.refreshTokens.slice(-5);
    }
    await user.save();

    res.json({ success: true, accessToken, refreshToken: newRefreshToken });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(401).json({ success: false, message: 'Invalid refresh token' });
  }
};

// POST /api/auth/logout
const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await User.findByIdAndUpdate(req.user._id, { $pull: { refreshTokens: refreshToken } });
    }
    
    // Log session duration inside LoginLog
    if (req.user && req.user._id) {
      const latestLog = await LoginLog.findOne({ userId: req.user._id, status: 'success', logoutTime: null }).sort({ loginTime: -1 });
      if (latestLog) {
        const logoutTime = new Date();
        const sessionDuration = Math.round((logoutTime - latestLog.loginTime) / 1000);
        await LoginLog.findByIdAndUpdate(latestLog._id, {
          logoutTime,
          sessionDuration,
        });
      }
    }

    await logActivity(req, 'logout');
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/auth/me
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('department', 'name code color icon');
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/auth/2fa/setup
const setup2FA = async (req, res) => {
  try {
    const secret = speakeasy.generateSecret({
      name: `All3DStudio (${req.user.email})`,
      length: 20,
    });

    await User.findByIdAndUpdate(req.user._id, {
      twoFactorSecret: secret.base32,
      twoFactorEnabled: false,
    });

    const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url);
    await logActivity(req, '2fa_setup');

    res.json({
      success: true,
      secret: secret.base32,
      qrCode: qrCodeUrl,
      message: 'Scan QR code with Google Authenticator',
    });
  } catch (error) {
    console.error('2FA setup error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/auth/2fa/verify
const verify2FA = async (req, res) => {
  try {
    const { token } = req.body;
    const user = await User.findById(req.user._id).select('+twoFactorSecret');

    if (!user.twoFactorSecret) {
      return res.status(400).json({ success: false, message: 'Please setup 2FA first' });
    }

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token,
      window: 2,
    });

    if (!verified) {
      return res.status(400).json({ success: false, message: 'Invalid 2FA token' });
    }

    await User.findByIdAndUpdate(req.user._id, { twoFactorEnabled: true });
    await logActivity(req, '2fa_verify');

    res.json({ success: true, message: '2FA enabled successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/auth/2fa/disable
const disable2FA = async (req, res) => {
  try {
    const { token } = req.body;
    const user = await User.findById(req.user._id).select('+twoFactorSecret');

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token,
      window: 2,
    });

    if (!verified) {
      return res.status(400).json({ success: false, message: 'Invalid 2FA token' });
    }

    await User.findByIdAndUpdate(req.user._id, { twoFactorEnabled: false, twoFactorSecret: null });
    res.json({ success: true, message: '2FA disabled' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/auth/change-password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password incorrect' });
    }

    user.password = newPassword;
    await user.save();
    await logActivity(req, 'password_change');

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/auth/register
const register = async (req, res) => {
  try {
    const { name, email, password, role, department, adminCode, companyName, mobile } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ success: false, message: 'All fields (name, email, password, role) are required' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email is already registered' });
    }

    // Determine createdBy, defaults to self (or null), isActive defaults to true, etc.
    const user = new User({
      name,
      email,
      password,
      role,
      department: role === 'employee' ? department : undefined,
      adminCode: role === 'admin' ? adminCode?.toUpperCase() : undefined,
      companyName: role === 'client' ? companyName : undefined,
      mobile: mobile || undefined,
      isActive: true
    });

    await user.save();

    // If employee, also update the Department to include this employee
    if (role === 'employee' && department) {
      await Department.findByIdAndUpdate(department, {
        $addToSet: { employees: user._id }
      });
    }

    // Generate tokens and log in the user immediately
    const { accessToken, refreshToken } = generateTokens(user._id, user.role);

    // Store refresh token
    await User.findByIdAndUpdate(user._id, {
      $push: { refreshTokens: { $each: [refreshToken], $slice: -5 } },
    });

    await ActivityLog.create({
      user: user._id, userEmail: user.email, userRole: user.role,
      action: 'register', success: true, ip: req.ip, userAgent: req.headers['user-agent'],
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      accessToken,
      refreshToken,
      user
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body;
    if (!name || !email) {
      return res.status(400).json({ success: false, message: 'Name and email are required' });
    }

    const existing = await User.findOne({ email: email.toLowerCase(), _id: { $ne: req.user._id } });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email is already in use' });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, email: email.toLowerCase() },
      { new: true, runValidators: true }
    ).populate('department', 'name code');

    await logActivity(req, 'profile_update', `Updated own profile: ${user.name}`);
    res.json({ success: true, message: 'Profile updated successfully', user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const forgotPasswordEmail = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(400).json({ success: false, message: 'Email address not registered.' });
    }

    const otpVal = crypto.randomInt(100000, 999999).toString();
    const hashedOtp = await bcrypt.hash(otpVal, 10);

    user.otp = hashedOtp;
    user.otpExpiry = Date.now() + 5 * 60 * 1000; // 5 minutes
    user.otpAttempts = 0;
    await user.save();

    await emailService.sendOTP(user.email, otpVal);

    await ActivityLog.create({
      user: user._id, userEmail: user.email, userRole: user.role,
      action: 'forgot_password_email_otp', success: true, ip: req.ip,
    });

    res.json({ success: true, message: 'OTP has been sent to your email.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const forgotPasswordMobile = async (req, res) => {
  try {
    const { mobile } = req.body;
    if (!mobile) {
      return res.status(400).json({ success: false, message: 'Mobile number is required' });
    }

    const trimmedMobile = mobile.trim();
    const user = await User.findOne({ mobile: trimmedMobile });
    if (!user) {
      return res.status(400).json({ success: false, message: 'Mobile number not registered.' });
    }

    const otpVal = crypto.randomInt(100000, 999999).toString();
    const hashedOtp = await bcrypt.hash(otpVal, 10);

    user.otp = hashedOtp;
    user.otpExpiry = Date.now() + 5 * 60 * 1000; // 5 minutes
    user.otpAttempts = 0;
    await user.save();

    const smsContent = `Your All 3D Studio verification OTP is ${otpVal}. It is valid for 5 minutes.`;
    await sendSMS(user.mobile, smsContent);

    await ActivityLog.create({
      user: user._id, userEmail: user.email, userRole: user.role,
      action: 'forgot_password_mobile_otp', success: true, ip: req.ip,
    });

    res.json({ success: true, message: 'OTP has been sent to your mobile number.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const verifyOTP = async (req, res) => {
  try {
    const { emailOrMobile, otp } = req.body;
    if (!emailOrMobile || !otp) {
      return res.status(400).json({ success: false, message: 'Email/Mobile and OTP are required' });
    }

    const input = emailOrMobile.trim();
    const user = await User.findOne({
      $or: [
        { email: input.toLowerCase() },
        { mobile: input }
      ]
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'User not found.' });
    }

    if (!user.otp) {
      return res.status(400).json({ success: false, message: 'No OTP requested for this user.' });
    }

    if (user.otpExpiry < Date.now()) {
      return res.status(400).json({ success: false, message: 'OTP has expired.' });
    }

    if (user.otpAttempts >= 5) {
      return res.status(400).json({ success: false, message: 'Too many incorrect OTP attempts. Please request a new OTP.' });
    }

    const isMatch = await bcrypt.compare(otp, user.otp);
    if (!isMatch) {
      user.otpAttempts += 1;
      await user.save();
      return res.status(400).json({ success: false, message: `Invalid OTP. ${5 - user.otpAttempts} attempts remaining.` });
    }

    // OTP is correct - generate a short-lived password reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Clear OTP
    user.otp = null;
    user.otpExpiry = null;
    user.otpAttempts = 0;
    await user.save();

    await ActivityLog.create({
      user: user._id, userEmail: user.email, userRole: user.role,
      action: 'otp_verification_success', success: true, ip: req.ip,
    });

    res.json({ success: true, resetToken });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ success: false, message: 'Token and new password are required' });
    }

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Password reset token is invalid or has expired.' });
    }

    // Strong password validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#.\-_])[A-Za-z\d@$!%*?&#.\-_]{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&#.-_).'
      });
    }

    user.password = password;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    user.refreshTokens = []; // Clear refresh tokens to force re-login on all devices
    
    await user.save();

    await ActivityLog.create({
      user: user._id, userEmail: user.email, userRole: user.role,
      action: 'password_reset', success: true, ip: req.ip,
    });

    res.json({ success: true, message: 'Password reset successful. You can now log in with your new password.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  login, register, refresh, logout, getMe,
  setup2FA, verify2FA, disable2FA,
  changePassword, updateProfile,
  forgotPasswordEmail, forgotPasswordMobile, verifyOTP, resetPassword
};
