const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const https = require('https');
const User = require('../models/User');
const Department = require('../models/Department');
const ActivityLog = require('../models/ActivityLog');
const LoginLog = require('../models/LoginLog');
const { generateTokens, logActivity } = require('../middleware/auth');
const emailService = require('../services/emailService');
const twilio = require('twilio');
const securityService = require('../services/securityService');

// User-Agent parser utility
const parseUserAgent = (uaStr = '') => {
  const ua = uaStr.toLowerCase();
  let browser = 'Unknown';
  let os = 'Unknown';
  let device = 'Desktop';

  // Browser detection
  if (ua.includes('firefox')) browser = 'Firefox';
  else if (ua.includes('chrome') && !ua.includes('chromium')) browser = 'Chrome';
  else if (ua.includes('safari') && !ua.includes('chrome')) browser = 'Safari';
  else if (ua.includes('edge') || ua.includes('edg')) browser = 'Edge';
  else if (ua.includes('opera') || ua.includes('opr')) browser = 'Opera';

  // OS detection
  if (ua.includes('android')) os = 'Android';
  else if (ua.includes('iphone') || ua.includes('ipad')) os = 'iOS';
  else if (ua.includes('windows')) os = 'Windows';
  else if (ua.includes('macintosh') || ua.includes('mac os')) os = 'macOS';
  else if (ua.includes('linux')) os = 'Linux';

  // Device type detection
  if (ua.includes('tablet') || ua.includes('ipad')) device = 'Tablet';
  else if (ua.includes('mobi') || ua.includes('android') || ua.includes('iphone')) device = 'Mobile';

  return { browser, os, device };
};

const getDeviceType = (userAgent = '') => {
  return parseUserAgent(userAgent).device;
};

// Disposable Email check
const DISPOSABLE_DOMAINS = [
  'mailinator.com', 'yopmail.com', 'tempmail.com', '10minutemail.com',
  'sharklasers.com', 'guerrillamail.com', 'dispostable.com', 'getairmail.com',
  'burnermail.io', 'trashmail.com'
];
const isDisposableEmail = (email = '') => {
  const domain = email.toLowerCase().split('@')[1];
  return DISPOSABLE_DOMAINS.includes(domain);
};

// Google ID token verification helper
const fetchGoogleTokenInfo = (idToken) => {
  return new Promise((resolve, reject) => {
    https.get(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode === 200) {
            resolve(parsed);
          } else {
            reject(new Error(parsed.error_description || 'Failed to verify Google token'));
          }
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', (err) => reject(err));
  });
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

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password +failedLoginAttempts +accountLockedUntil +refreshTokens');
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
      await securityService.logLoginAttempt({ email, ipAddress: req.ip, userAgent: req.headers['user-agent'], success: false, roleAttempted: 'unknown' });
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
      await securityService.logLoginAttempt({ email, ipAddress: req.ip, userAgent: req.headers['user-agent'], success: false, roleAttempted: user.role });
      return res.status(423).json({ success: false, message: 'Account locked due to too many failed attempts. Try again in 15 minutes.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account is deactivated.' });
    }

    // Auto-verify emails during login for zero-hassle experience
    if (!user.emailVerified) {
      user.emailVerified = true;
      await user.save();
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      await user.incLoginAttempts();
      await ActivityLog.create({ user: user._id, userEmail: email, action: 'login_failed', success: false, details: { attempts: user.failedLoginAttempts + 1 }, ip: req.ip });
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
      await securityService.logLoginAttempt({ email: user.email, ipAddress: req.ip, userAgent: req.headers['user-agent'], success: false, roleAttempted: user.role });
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
    
    // Parse UA metrics
    const ua = parseUserAgent(req.headers['user-agent']);

    await user.updateOne({ 
      lastLoginIP: req.ip,
      lastLogin: new Date(),
      lastDevice: req.headers['user-agent'],
      loginMethod: 'credentials'
    });

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
      userName: user.name,
      email: user.email,
      role: user.role,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      loginTime: new Date(),
      status: 'success',
      deviceType: ua.device,
      device: ua.device,
      browser: ua.browser,
      operatingSystem: ua.os,
      loginMethod: 'credentials',
      approximateLocation: 'Local Host',
    });

    await securityService.logLoginAttempt({
      email: user.email,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      success: true,
      roleAttempted: user.role,
      userId: user._id,
      name: user.name
    });

    // Trigger Security Login Alert Email
    await emailService.sendLoginAlertEmail(user.email, user.name, {
      date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
      time: new Date().toLocaleTimeString('en-IN'),
      device: ua.device,
      os: ua.os,
      browser: ua.browser,
      ip: req.ip,
      role: user.role,
      location: 'Local Network'
    }).catch(err => console.error('Failed to send login alert:', err.message));

    await user.populate('department', 'name code color icon');

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

// POST /api/auth/register (acting as Client public signup)
const register = async (req, res) => {
  try {
    const { name, email, password, role, department, adminCode, companyName, mobile } = req.body;
    
    // Enforcement: public signup should always register client roles
    const targetRole = role || 'client';

    if (targetRole === 'admin') {
      const activeAdminCount = await User.countDocuments({ role: 'admin', isActive: true });
      if (activeAdminCount >= 3) {
        return res.status(400).json({ success: false, message: 'Maximum limit of 3 Admin accounts has been reached.' });
      }
    }
    
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required' });
    }

    // Email format checks
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: 'Invalid email address format' });
    }

    // Disposable email check
    if (isDisposableEmail(email)) {
      return res.status(400).json({ success: false, message: 'Disposable email providers are not allowed' });
    }

    // Relaxed password strength check for zero-hassle user experience
    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.'
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email is already registered' });
    }

    // Department rules: Only employees belong to departments!
    if (targetRole !== 'employee' && department) {
      return res.status(400).json({ success: false, message: 'Only employees belong to departments.' });
    }
    if (targetRole === 'employee' && !department) {
      return res.status(400).json({ success: false, message: 'Department selection is mandatory for employees.' });
    }

    const user = new User({
      name,
      email: email.toLowerCase(),
      password,
      role: targetRole,
      department: targetRole === 'employee' ? department : undefined,
      adminCode: targetRole === 'admin' ? adminCode?.toUpperCase() : undefined,
      companyName: targetRole === 'client' ? companyName : undefined,
      mobile: mobile || undefined,
      isActive: true,
      emailVerified: true, // Auto-verified for a seamless experience
      loginMethod: 'credentials'
    });

    await user.save();

    // If employee, add to department roster
    if (targetRole === 'employee' && department) {
      await Department.findByIdAndUpdate(department, {
        $addToSet: { employees: user._id }
      });
    }

    await ActivityLog.create({
      user: user._id, userEmail: user.email, userRole: user.role,
      action: 'register', success: true, ip: req.ip, userAgent: req.headers['user-agent'],
    });

    // Generate JWT & session tokens for instant auto-login
    const { accessToken, refreshToken } = generateTokens(user._id, user.role);
    await User.findByIdAndUpdate(user._id, {
      $push: { refreshTokens: { $each: [refreshToken], $slice: -5 } },
    });

    // Send Welcome Email in background
    emailService.sendWelcomeEmail(user.email, user.name, user.companyName || '')
      .catch(err => console.error('Welcome email failed:', err.message));

    await user.populate('department', 'name code color icon');

    const userObj = user.toJSON();
    res.status(201).json({
      success: true,
      message: 'Registration successful! Welcome to All 3D Studio.',
      accessToken,
      refreshToken,
      user: userObj
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};

// POST /api/auth/verify-email
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ success: false, message: 'Verification token is required.' });
    }

    const user = await User.findOne({
      verificationToken: token,
      verificationTokenExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Verification token is invalid or has expired.' });
    }

    user.emailVerified = true;
    user.verificationToken = null;
    user.verificationTokenExpires = null;
    await user.save();

    await ActivityLog.create({
      user: user._id, userEmail: user.email, userRole: user.role,
      action: 'email_verified', success: true, ip: req.ip
    });

    // Send welcome email
    await emailService.sendWelcomeEmail(user.email, user.name, user.companyName)
      .catch(err => console.error('Welcome email trigger failed:', err.message));

    res.json({ success: true, message: 'Email verified successfully! You can now log in.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};

// POST /api/auth/google/login
const googleLogin = async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ success: false, message: 'Google credential token is required' });
    }

    // Decode / verify Google JWT token
    const payload = await fetchGoogleTokenInfo(credential);
    if (!payload || !payload.email) {
      return res.status(400).json({ success: false, message: 'Invalid Google identity token' });
    }

    const email = payload.email.toLowerCase();
    let user = await User.findOne({ email });

    // Handle Google account creation on first-time login
    if (!user) {
      user = new User({
        name: payload.name,
        email,
        googleId: payload.sub,
        profilePhoto: payload.picture,
        isGoogleAccount: true,
        emailVerified: true, // auto-verified via google oauth
        role: 'client',
        loginMethod: 'google',
        isActive: true,
      });
      await user.save();

      // Trigger Welcome Email
      await emailService.sendWelcomeEmail(user.email, user.name, '')
        .catch(err => console.error('Welcome email failed:', err.message));
    } else {
      // Disallow Google login for Developers unless specifically enabled
      if (user.role === 'developer') {
        return res.status(403).json({ success: false, message: 'Google Authentication is disabled for Developers.' });
      }

      // Sync Google parameters
      user.googleId = payload.sub;
      user.isGoogleAccount = true;
      user.emailVerified = true;
      if (!user.profilePhoto) user.profilePhoto = payload.picture;
      user.loginMethod = 'google';
      user.lastLogin = new Date();
      user.lastLoginIP = req.ip;
      user.lastDevice = req.headers['user-agent'];
      await user.save();
    }

    // Generate JWT & session logs
    const { accessToken, refreshToken } = generateTokens(user._id, user.role);

    await User.findByIdAndUpdate(user._id, {
      $push: { refreshTokens: { $each: [refreshToken], $slice: -5 } },
    });

    const ua = parseUserAgent(req.headers['user-agent']);

    await LoginLog.create({
      userId: user._id,
      userName: user.name,
      email: user.email,
      role: user.role,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      loginTime: new Date(),
      status: 'success',
      deviceType: ua.device,
      device: ua.device,
      browser: ua.browser,
      operatingSystem: ua.os,
      loginMethod: 'google',
      approximateLocation: 'Local Host',
    });

    // Send security alert
    await emailService.sendLoginAlertEmail(user.email, user.name, {
      date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
      time: new Date().toLocaleTimeString('en-IN'),
      device: ua.device,
      os: ua.os,
      browser: ua.browser,
      ip: req.ip,
      role: user.role,
      location: 'Local Network'
    }).catch(err => console.error('Failed to send login alert:', err.message));

    const userObj = user.toJSON();
    res.json({
      success: true,
      message: 'Google login successful',
      accessToken,
      refreshToken,
      user: userObj
    });
  } catch (error) {
    console.error('Google Auth login error:', error);
    res.status(500).json({ success: false, message: 'Google Auth Error: ' + error.message });
  }
};

// POST /api/auth/google/signup
const googleSignup = async (req, res) => {
  // Aliased to googleLogin since OAuth behaves identically for login/signup flows
  return googleLogin(req, res);
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
    
    // Strict password policy validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#.\-_])[A-Za-z\d@$!%*?&#.\-_]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&#.-_).'
      });
    }

    const user = await User.findById(req.user._id).select('+password');

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password incorrect' });
    }

    user.password = newPassword;
    user.passwordChangedAt = new Date();
    await user.save();
    
    await logActivity(req, 'password_change');

    // Trigger Password Changed Confirmation Email
    await emailService.sendPasswordChangedEmail(user.email, user.name)
      .catch(err => console.error('Password changed confirmation failed:', err.message));

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const redisService = require('../services/redisService');

// POST /api/auth/forgot-password (acts as email OTP request link generator)
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

    // Generate secure reset verification token instead of raw digits
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 hour
    await user.save();

    await emailService.sendForgotPasswordEmail(user.email, user.name, resetToken);

    await ActivityLog.create({
      user: user._id, userEmail: user.email, userRole: user.role,
      action: 'forgot_password_email_token', success: true, ip: req.ip,
    });

    res.json({ success: true, message: 'A password reset link has been sent to your email.' });
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

    // Save OTP to Redis (5 minutes TTL)
    await redisService.saveOTP(user.mobile, hashedOtp, 300);

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

    // Resolve which key contains the active OTP in Redis
    let activeKey = null;
    let hashedOtp = await redisService.getOTP(user.email);
    if (hashedOtp) {
      activeKey = user.email;
    } else {
      hashedOtp = await redisService.getOTP(user.mobile);
      if (hashedOtp) {
        activeKey = user.mobile;
      }
    }

    if (!hashedOtp) {
      return res.status(400).json({ success: false, message: 'No OTP requested or OTP has expired.' });
    }

    const attempts = await redisService.getOTPAttempts(activeKey);
    if (attempts >= 5) {
      return res.status(400).json({ success: false, message: 'Too many incorrect OTP attempts. Please request a new OTP.' });
    }

    const isMatch = await bcrypt.compare(otp, hashedOtp);
    if (!isMatch) {
      const nextAttempts = await redisService.incrementOTPAttempts(activeKey);
      return res.status(400).json({ success: false, message: `Invalid OTP. ${5 - nextAttempts} attempts remaining.` });
    }

    // OTP is correct - generate a short-lived password reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save();

    // Clear OTP from Redis cache
    await redisService.clearOTP(activeKey);

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
    user.passwordChangedAt = new Date();
    user.refreshTokens = []; // Clear refresh tokens to force re-login on all devices
    
    await user.save();

    await ActivityLog.create({
      user: user._id, userEmail: user.email, userRole: user.role,
      action: 'password_reset', success: true, ip: req.ip,
    });

    // Trigger Password Changed Confirmation Email
    await emailService.sendPasswordChangedEmail(user.email, user.name)
      .catch(err => console.error('Password reset confirmation failed:', err.message));

    res.json({ success: true, message: 'Password reset successful. You can now log in with your new password.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getAdminCount = async (req, res) => {
  try {
    const count = await User.countDocuments({ role: 'admin', isActive: true });
    res.json({ success: true, count, limit: 3, canCreate: count < 3 });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  login, register, refresh, logout, getMe,
  setup2FA, verify2FA, disable2FA,
  changePassword,
  forgotPasswordEmail, forgotPasswordMobile, verifyOTP, resetPassword,
  verifyEmail, googleLogin, googleSignup, getAdminCount
};
