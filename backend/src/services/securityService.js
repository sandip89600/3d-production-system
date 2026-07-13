const LoginAttempt = require('../models/LoginAttempt');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const Project = require('../models/Project');
const Notification = require('../models/Notification');
const emailService = require('./emailService');
const whatsappService = require('./whatsappService');

class SecurityService {
  constructor() {
    this.io = null;
  }

  setIO(io) {
    this.io = io;
  }

  getBrowser(userAgent = '') {
    const ua = userAgent.toLowerCase();
    if (ua.includes('firefox')) return 'Firefox';
    if (ua.includes('chrome') && !ua.includes('chromium')) return 'Chrome';
    if (ua.includes('safari') && !ua.includes('chrome')) return 'Safari';
    if (ua.includes('edge') || ua.includes('edg')) return 'Edge';
    if (ua.includes('opera') || ua.includes('opr')) return 'Opera';
    return 'Browser';
  }

  getDeviceType(userAgent = '') {
    const ua = userAgent.toLowerCase();
    if (ua.includes('tablet') || ua.includes('ipad')) return 'Tablet';
    if (ua.includes('mobi') || ua.includes('android') || ua.includes('iphone') || ua.includes('ipod')) return 'Mobile';
    return 'Desktop';
  }

  async logLoginAttempt({ email, ipAddress, userAgent, success, roleAttempted, userId, name }) {
    const browser = this.getBrowser(userAgent);
    const deviceType = this.getDeviceType(userAgent);
    const location = 'Nashik'; // Simulated geo IP lookups

    try {
      let severity = 'INFO';
      let failedCount = 0;

      // 1. If failed attempt, check brute force threshold
      if (!success) {
        const timeLimit = new Date(Date.now() - 10 * 60 * 1000);
        failedCount = await LoginAttempt.countDocuments({
          email,
          success: false,
          isRouteAccess: false,
          timestamp: { $gte: timeLimit }
        }) + 1;

        if (failedCount >= 5) {
          severity = 'SECURITY';
        } else {
          severity = 'INFO'; // Wrong password once is classified as INFO
        }
      }

      // Log attempt in DB
      await LoginAttempt.create({
        email,
        ipAddress,
        userAgent,
        location,
        success,
        roleAttempted,
        browser,
        severity
      });

      // 2. Alert Level 2: Failed Login Alert (Locked at 5 attempts)
      if (!success && failedCount >= 5) {
        await this.triggerFailedLoginAlert({ email, ipAddress, location, timestamp: new Date() });
      }

      // 3. Alert Level 4: New Device Login Alert (Classified as INFO / Login Notification)
      if (success && (roleAttempted === 'admin' || roleAttempted === 'superadmin')) {
        const prevSuccessCount = await LoginAttempt.countDocuments({
          email,
          success: true,
          browser,
          roleAttempted,
        });

        // First success login on this device configuration
        if (prevSuccessCount === 1) {
          await this.triggerNewDeviceAlert({
            name: name || email,
            device: `${deviceType} ${browser}`,
            ipAddress,
            location,
            timestamp: new Date()
          });
        }
      }

    } catch (err) {
      console.error('[SecurityService] logLoginAttempt error:', err.message);
    }
  }

  // 4. Alert Level 3: Unauthorized Access Alert (Classified as SECURITY)
  async logUnauthorizedAccess({ route, ipAddress, userAgent }) {
    const browser = this.getBrowser(userAgent);
    const location = 'Mumbai, India';

    try {
      await LoginAttempt.create({
        ipAddress,
        userAgent,
        location,
        success: false,
        isRouteAccess: true,
        route,
        browser,
        severity: 'SECURITY'
      });

      const timeLimit = new Date(Date.now() - 10 * 60 * 1000);
      const unauthorizedCount = await LoginAttempt.countDocuments({
        ipAddress,
        isRouteAccess: true,
        timestamp: { $gte: timeLimit }
      });

      // Alert if 5 unauthorized page loads occur from same IP within 10 mins
      if (unauthorizedCount >= 5) {
        await this.triggerUnauthorizedAlert({ ipAddress, route, location, count: unauthorizedCount });
      }
    } catch (err) {
      console.error('[SecurityService] logUnauthorizedAccess error:', err.message);
    }
  }

  // 5. Alert Level 5: Payment Alert
  async logPayment({ transactionId, clientEmail, amount, projectName }) {
    try {
      const client = await User.findOne({ email: clientEmail });
      const project = await Project.findOne({ name: projectName });

      if (!client || !project) {
        console.warn('[SecurityService] Client or Project not found for payment alert.');
        return;
      }

      // Create Transaction entry
      await Transaction.create({
        transactionId,
        client: client._id,
        amount,
        project: project._id,
        status: 'success'
      });

      await this.triggerPaymentAlert({
        transactionId,
        clientName: client.name,
        companyName: client.companyName || 'Client Company',
        amount,
        projectName
      });

    } catch (err) {
      console.error('[SecurityService] logPayment error:', err.message);
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // ALERT DISPATCHERS
  // ─────────────────────────────────────────────────────────────────

  async triggerFailedLoginAlert({ email, ipAddress, location, timestamp }) {
    console.log(`🚨 [Security Alarm] Brute Force Attack detected on ${email} (Account Locked)`);
    const superAdmins = await User.find({ role: 'superadmin', isActive: true });

    // Format matches request specification
    const message = 
      `⚠ *Security Alert*\n\n` +
      `Multiple failed login attempts detected.\n\n` +
      `Email:\n${email}\n\n` +
      `IP:\n${ipAddress}\n\n` +
      `Location:\n${location}\n\n` +
      `Time:\n${timestamp.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} ${timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;

    await whatsappService.sendAndLogMessage({
      message,
      type: 'security'
    });

    for (const admin of superAdmins) {
      await Notification.create({
        recipient: admin._id,
        type: 'security',
        title: 'Multiple Failed Logins Detected (Security)',
        message: `Account temporarily locked. IP: ${ipAddress}`,
        category: 'error',
        priority: 'high'
      });

      if (this.io) {
        this.io.to(`user_${admin._id}`).emit('notification', {
          title: '🚨 Security Alert',
          message: `Brute force protection triggered for ${email}`
        });
      }

      await emailService.sendSecurityAlert(admin.email, '⚠ Failed Login Attempts Security Alert', {
        email,
        ipAddress,
        location,
        time: timestamp.toLocaleString()
      });
    }
  }

  async triggerNewDeviceAlert({ name, device, ipAddress, location, timestamp }) {
    console.log(`✅ [Login Notification] New device login detected for: ${name}`);

    // Format matches request specification exactly
    const message = 
      `New Login Detected\n\n` +
      `User: ${name}\n` +
      `Device: ${device}\n` +
      `Location: ${location}\n` +
      `Time: ${timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}\n\n` +
      `If this was you, no action required.`;

    await whatsappService.sendAndLogMessage({
      message,
      type: 'security'
    });

    const superAdmins = await User.find({ role: 'superadmin', isActive: true });
    for (const admin of superAdmins) {
      await Notification.create({
        recipient: admin._id,
        type: 'security',
        title: 'New Device Login Detected',
        message: `User ${name} logged in from device ${device}`,
        category: 'info',
        priority: 'medium'
      });

      if (this.io) {
        this.io.to(`user_${admin._id}`).emit('notification', {
          title: 'Login Alert',
          message: `New login for ${name}.`
        });
      }
    }
  }

  async triggerUnauthorizedAlert({ ipAddress, route, location, count }) {
    console.log(`🚨 [Security Alarm] Direct Unauthorized Access scans detected from: ${ipAddress}`);

    const message = 
      `⚠ *Security Alert*\n\n` +
      `Unauthorized Access Attempts detected.\n\n` +
      `IP:\n${ipAddress}\n\n` +
      `Route:\n${route}\n\n` +
      `Location:\n${location}\n\n` +
      `Attempts:\n${count} in 10 minutes`;

    await whatsappService.sendAndLogMessage({
      message,
      type: 'security'
    });

    const superAdmins = await User.find({ role: 'superadmin', isActive: true });
    for (const admin of superAdmins) {
      await Notification.create({
        recipient: admin._id,
        type: 'security',
        title: 'Direct Unauthorized Access Scan (Security)',
        message: `IP ${ipAddress} logged ${count} unauthorized direct hits under route ${route}`,
        category: 'error',
        priority: 'high'
      });

      await emailService.sendSecurityAlert(admin.email, '⚠ Direct Unauthorized Access Scans Alert', {
        ipAddress,
        route,
        location,
        attempts: count
      });
    }
  }

  async triggerPaymentAlert({ transactionId, clientName, companyName, amount, projectName }) {
    console.log(`💰 [Finance Alert] Payment of ₹${amount} received from ${clientName}`);

    // Format matches request specification exactly
    const message = 
      `💰 *Payment Received*\n\n` +
      `Client:\n${clientName}\n\n` +
      `Amount:\n₹${amount.toLocaleString('en-IN')}\n\n` +
      `Project:\n${projectName}\n\n` +
      `Transaction ID:\n${transactionId}`;

    await whatsappService.sendAndLogMessage({
      message,
      type: 'payment'
    });

    const staff = await User.find({ role: { $in: ['admin', 'superadmin'] }, isActive: true });
    for (const user of staff) {
      await Notification.create({
        recipient: user._id,
        type: 'payment',
        title: 'Payment Transaction Success',
        message: `Received ₹${amount} from ${clientName} for project "${projectName}"`,
        category: 'success',
        priority: 'medium'
      });

      if (this.io) {
        this.io.to(`user_${user._id}`).emit('notification', {
          title: '💰 Payment Received',
          message: `₹${amount} received for project: ${projectName}`
        });
      }

      await emailService.sendSecurityAlert(user.email, '💰 Payment Transaction Success Alert', {
        client: clientName,
        company: companyName,
        amount: `₹${amount}`,
        project: projectName,
        txnId: transactionId
      });
    }
  }
}

module.exports = new SecurityService();
