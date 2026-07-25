const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.host = process.env.SMTP_HOST;
    this.port = parseInt(process.env.SMTP_PORT) || 587;
    this.user = process.env.SMTP_USER;
    this.pass = process.env.SMTP_PASS;
    this.from = process.env.SMTP_FROM || 'no-reply@all3dstudio.com';

    this.configured = !!(this.host && this.user && this.pass);

    if (this.configured) {
      this.transporter = nodemailer.createTransport({
        host: this.host,
        port: this.port,
        secure: this.port === 465, // true for 465, false for other ports
        auth: {
          user: this.user,
          pass: this.pass,
        },
      });
    }
  }

  async sendMailWrapper(email, subject, textContent, htmlContent) {
    if (this.configured) {
      try {
        await this.transporter.sendMail({
          from: this.from,
          to: email,
          subject,
          text: textContent,
          html: htmlContent,
        });
        console.log(`📧 Email sent to ${email} (Subject: "${subject}")`);
      } catch (err) {
        console.error(`Nodemailer failed to send email to ${email}:`, err.message);
        this.logSimulation(email, subject, textContent);
      }
    } else {
      this.logSimulation(email, subject, textContent);
    }
  }

  // Maintains backwards compatibility for original OTP resets
  async sendOTP(email, otp) {
    const subject = 'All 3D Studio - OTP for Password Reset';
    const textContent = `Your OTP for resetting your password is: ${otp}. It is valid for 5 minutes. If you did not request this, please ignore this email.`;
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <h2 style="color: #3b82f6; text-align: center;">All 3D Studio</h2>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="font-size: 16px; color: #334155;">Hello,</p>
        <p style="font-size: 16px; color: #334155;">You requested a password reset. Please use the following One-Time Password (OTP) to complete the verification process:</p>
        <div style="text-align: center; margin: 30px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #1e293b; background-color: #f1f5f9; padding: 12px 24px; border-radius: 8px; border: 1px dashed #cbd5e1;">${otp}</span>
        </div>
        <p style="font-size: 14px; color: #64748b; text-align: center;">This OTP is valid for <strong>5 minutes</strong> and can only be used once.</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="font-size: 12px; color: #94a3b8; text-align: center;">If you did not request this password reset, you can safely ignore this email.</p>
      </div>
    `;
    await this.sendMailWrapper(email, subject, textContent, htmlContent);
  }

  async sendVerificationEmail(email, name, token) {
    const subject = 'Verify Your Email Address - All 3D Studio';
    const verifyLink = `${process.env.FRONTEND_URL || 'https://all3dstudio.deepitlabs.in'}/verify-email?token=${token}`;
    const textContent = `Hello ${name},\n\nWelcome to All 3D Studio. Please verify your email by clicking the link below:\n${verifyLink}\n\nThis verification link is valid for 24 hours.`;
    const htmlContent = `
      <div style="font-family: 'Inter', system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; border-radius: 16px; background-color: #0b1329; color: #f8fafc; border: 1px solid #1e293b;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #f59e0b; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">All 3D Studio</h1>
          <p style="color: #94a3b8; font-size: 14px; margin-top: 5px;">Premium 3D Visualizations & Renders</p>
        </div>
        <hr style="border: 0; border-top: 1px solid #1e293b; margin: 24px 0;" />
        <h2 style="font-size: 20px; font-weight: 700; color: #f8fafc; margin-top: 0;">Hello ${name},</h2>
        <p style="font-size: 16px; line-height: 1.6; color: #cbd5e1;">Welcome to All 3D Studio. We are thrilled to have you join our platform. Please verify your email address to activate your account and start managing your workspace tools.</p>
        
        <div style="text-align: center; margin: 35px 0;">
          <a href="${verifyLink}" style="display: inline-block; padding: 14px 30px; font-size: 16px; font-weight: 600; color: #020617; background-color: #f59e0b; text-decoration: none; border-radius: 8px; box-shadow: 0 4px 12px rgba(245, 158, 11, 0.25); transition: background-color 0.2s;">Verify Email Address</a>
        </div>
        
        <p style="font-size: 14px; color: #94a3b8; text-align: center;">This link is valid for <strong>24 hours</strong>. If the button above does not work, copy and paste the following URL into your browser:</p>
        <p style="font-size: 13px; color: #f59e0b; word-break: break-all; text-align: center; background-color: #0f172a; padding: 12px; border-radius: 6px; border: 1px solid #1e293b;">${verifyLink}</p>
        
        <hr style="border: 0; border-top: 1px solid #1e293b; margin: 24px 0;" />
        <p style="font-size: 12px; color: #64748b; text-align: center; margin-bottom: 0;">If you did not request this email, you can safely ignore it. For support, contact us at <a href="mailto:support@all3dstudio.deepitlabs.in" style="color: #f59e0b; text-decoration: none;">support@all3dstudio.deepitlabs.in</a>.</p>
      </div>
    `;
    await this.sendMailWrapper(email, subject, textContent, htmlContent);
  }

  async sendWelcomeEmail(email, name, companyName) {
    const subject = 'Welcome to All 3D Studio!';
    const dashboardLink = `${process.env.FRONTEND_URL || 'https://all3dstudio.deepitlabs.in'}/login`;
    const textContent = `Hello ${name},\n\nWelcome to All 3D Studio! Your account is active. Company: ${companyName || 'Personal'}.\nAccess Dashboard: ${dashboardLink}`;
    const htmlContent = `
      <div style="font-family: 'Inter', system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; border-radius: 16px; background-color: #0b1329; color: #f8fafc; border: 1px solid #1e293b;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #f59e0b; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">All 3D Studio</h1>
          <p style="color: #94a3b8; font-size: 14px; margin-top: 5px;">Your account is officially active</p>
        </div>
        <hr style="border: 0; border-top: 1px solid #1e293b; margin: 24px 0;" />
        <h2 style="font-size: 20px; font-weight: 700; color: #f8fafc; margin-top: 0;">Hello ${name},</h2>
        <p style="font-size: 16px; line-height: 1.6; color: #cbd5e1;">Welcome to the All 3D Studio workspace! Your email has been successfully verified, and your account is ready for use.</p>
        
        <table style="width: 100%; border-collapse: collapse; margin: 25px 0; font-size: 14px; background-color: #0f172a; border-radius: 8px; border: 1px solid #1e293b;">
          <tr>
            <td style="padding: 12px 16px; color: #94a3b8; border-bottom: 1px solid #1e293b;">Client Name:</td>
            <td style="padding: 12px 16px; color: #f8fafc; font-weight: 600; border-bottom: 1px solid #1e293b;">${name}</td>
          </tr>
          ${companyName ? `
          <tr>
            <td style="padding: 12px 16px; color: #94a3b8; border-bottom: 1px solid #1e293b;">Company Name:</td>
            <td style="padding: 12px 16px; color: #f8fafc; font-weight: 600; border-bottom: 1px solid #1e293b;">${companyName}</td>
          </tr>
          ` : ''}
          <tr>
            <td style="padding: 12px 16px; color: #94a3b8;">Support Email:</td>
            <td style="padding: 12px 16px; color: #f59e0b; font-weight: 600;">support@all3dstudio.deepitlabs.in</td>
          </tr>
        </table>
        
        <div style="text-align: center; margin: 35px 0;">
          <a href="${dashboardLink}" style="display: inline-block; padding: 14px 30px; font-size: 16px; font-weight: 600; color: #020617; background-color: #f59e0b; text-decoration: none; border-radius: 8px; box-shadow: 0 4px 12px rgba(245, 158, 11, 0.25);">Go to Dashboard</a>
        </div>
        
        <hr style="border: 0; border-top: 1px solid #1e293b; margin: 24px 0;" />
        <p style="font-size: 12px; color: #64748b; text-align: center; margin-bottom: 0;">This is a system generated welcome email. Thank you for choosing All 3D Studio.</p>
      </div>
    `;
    await this.sendMailWrapper(email, subject, textContent, htmlContent);
  }

  async sendLoginAlertEmail(email, name, details) {
    const subject = 'Security Alert: New Login Detected';
    const textContent = `Hello ${name},\n\nWe detected a new successful login to your account.\nDate: ${details.date}\nDevice: ${details.device}\nBrowser: ${details.browser}\nOS: ${details.os}\nIP Address: ${details.ip}\nLocation: ${details.location}\n\nIf this was not you, please change your password immediately.`;
    const htmlContent = `
      <div style="font-family: 'Inter', system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; border-radius: 16px; background-color: #0b1329; color: #f8fafc; border: 1px solid #dc2626;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #dc2626; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">🔑 Security Alert</h1>
          <p style="color: #94a3b8; font-size: 14px; margin-top: 5px;">New Login Detected</p>
        </div>
        <hr style="border: 0; border-top: 1px solid #1e293b; margin: 24px 0;" />
        <h2 style="font-size: 18px; font-weight: 700; color: #f8fafc; margin-top: 0;">Hello ${name},</h2>
        <p style="font-size: 15px; line-height: 1.5; color: #cbd5e1;">A new login was successfully recorded for your user profile. Please review the details below:</p>
        
        <table style="width: 100%; border-collapse: collapse; margin: 25px 0; font-size: 13px; background-color: #0f172a; border-radius: 8px; border: 1px solid #1e293b;">
          <tr>
            <td style="padding: 10px 14px; color: #94a3b8; border-bottom: 1px solid #1e293b;">Role / Authority:</td>
            <td style="padding: 10px 14px; color: #f8fafc; font-weight: 600; border-bottom: 1px solid #1e293b; text-transform: uppercase;">${details.role}</td>
          </tr>
          <tr>
            <td style="padding: 10px 14px; color: #94a3b8; border-bottom: 1px solid #1e293b;">Date & Time:</td>
            <td style="padding: 10px 14px; color: #f8fafc; font-weight: 600; border-bottom: 1px solid #1e293b;">${details.date}</td>
          </tr>
          <tr>
            <td style="padding: 10px 14px; color: #94a3b8; border-bottom: 1px solid #1e293b;">IP Address:</td>
            <td style="padding: 10px 14px; color: #cbd5e1; border-bottom: 1px solid #1e293b;">${details.ip}</td>
          </tr>
          <tr>
            <td style="padding: 10px 14px; color: #94a3b8; border-bottom: 1px solid #1e293b;">Device / OS:</td>
            <td style="padding: 10px 14px; color: #cbd5e1; border-bottom: 1px solid #1e293b;">${details.device} (${details.os})</td>
          </tr>
          <tr>
            <td style="padding: 10px 14px; color: #94a3b8; border-bottom: 1px solid #1e293b;">Browser:</td>
            <td style="padding: 10px 14px; color: #cbd5e1; border-bottom: 1px solid #1e293b;">${details.browser}</td>
          </tr>
          <tr>
            <td style="padding: 10px 14px; color: #94a3b8;">Location Estimate:</td>
            <td style="padding: 10px 14px; color: #f59e0b; font-weight: 600;">${details.location}</td>
          </tr>
        </table>
        
        <div style="background-color: rgba(220, 38, 38, 0.1); border-left: 4px solid #dc2626; padding: 15px; margin: 25px 0; border-radius: 4px;">
          <p style="margin: 0; font-size: 14px; color: #fca5a5; line-height: 1.5;"><strong>Warning:</strong> If you do not recognize this login attempt, someone may have compromised your access token. Please change your password immediately to secure your projects.</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL || 'https://all3dstudio.deepitlabs.in'}/forgot-password" style="display: inline-block; padding: 12px 24px; font-size: 15px; font-weight: 600; color: #ffffff; background-color: #dc2626; text-decoration: none; border-radius: 6px;">Reset Password Immediately</a>
        </div>
        
        <hr style="border: 0; border-top: 1px solid #1e293b; margin: 24px 0;" />
        <p style="font-size: 11px; color: #64748b; text-align: center; margin-bottom: 0;">This email is sent automatically on login events to secure your data. Do not reply directly.</p>
      </div>
    `;
    await this.sendMailWrapper(email, details.name || email, textContent, htmlContent);
  }

  async sendForgotPasswordEmail(email, name, token) {
    const subject = 'Secure Password Reset Code - All 3D Studio';
    const resetLink = `${process.env.FRONTEND_URL || 'https://all3dstudio.deepitlabs.in'}/reset-password?token=${token}`;
    const textContent = `Hello ${name},\n\nYou requested a password reset. Click the link below to enter your new password:\n${resetLink}\n\nThis code is valid for 1 hour.`;
    const htmlContent = `
      <div style="font-family: 'Inter', system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; border-radius: 16px; background-color: #0b1329; color: #f8fafc; border: 1px solid #1e293b;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #f59e0b; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">All 3D Studio</h1>
          <p style="color: #94a3b8; font-size: 14px; margin-top: 5px;">Password Recovery Request</p>
        </div>
        <hr style="border: 0; border-top: 1px solid #1e293b; margin: 24px 0;" />
        <h2 style="font-size: 18px; font-weight: 700; color: #f8fafc; margin-top: 0;">Hello ${name},</h2>
        <p style="font-size: 16px; line-height: 1.6; color: #cbd5e1;">A request was made to reset the password for your All 3D Studio user profile. Click the link below to securely set your new password:</p>
        
        <div style="text-align: center; margin: 35px 0;">
          <a href="${resetLink}" style="display: inline-block; padding: 14px 30px; font-size: 16px; font-weight: 600; color: #020617; background-color: #f59e0b; text-decoration: none; border-radius: 8px; box-shadow: 0 4px 12px rgba(245, 158, 11, 0.25);">Reset Password</a>
        </div>
        
        <p style="font-size: 13px; color: #94a3b8; text-align: center;">This recovery link is valid for <strong>1 hour</strong>. If you did not trigger this request, you can safely ignore this warning. Your current password remains active.</p>
        
        <hr style="border: 0; border-top: 1px solid #1e293b; margin: 24px 0;" />
        <p style="font-size: 12px; color: #64748b; text-align: center; margin-bottom: 0;">For assistance, please email <a href="mailto:support@all3dstudio.deepitlabs.in" style="color: #f59e0b; text-decoration: none;">support@all3dstudio.deepitlabs.in</a>.</p>
      </div>
    `;
    await this.sendMailWrapper(email, subject, textContent, htmlContent);
  }

  async sendPasswordChangedEmail(email, name) {
    const subject = 'Confirmation: Password Changed successfully';
    const textContent = `Hello ${name},\n\nThis is a notification that the password for your All 3D Studio account was successfully updated.\n\nIf you did not perform this change, please contact support immediately.`;
    const htmlContent = `
      <div style="font-family: 'Inter', system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; border-radius: 16px; background-color: #0b1329; color: #f8fafc; border: 1px solid #1e293b;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #10b981; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">✓ Password Updated</h1>
          <p style="color: #94a3b8; font-size: 14px; margin-top: 5px;">Security Confirmation</p>
        </div>
        <hr style="border: 0; border-top: 1px solid #1e293b; margin: 24px 0;" />
        <h2 style="font-size: 18px; font-weight: 700; color: #f8fafc; margin-top: 0;">Hello ${name},</h2>
        <p style="font-size: 15px; line-height: 1.5; color: #cbd5e1;">The password for your account has been changed successfully. You can now use your new credentials to log into your workspace.</p>
        
        <div style="background-color: rgba(16, 185, 129, 0.1); border-left: 4px solid #10b981; padding: 15px; margin: 25px 0; border-radius: 4px;">
          <p style="margin: 0; font-size: 14px; color: #a7f3d0; line-height: 1.5;"><strong>Important:</strong> If you did not update your password, your credentials may have been stolen. Please contact support immediately at support@all3dstudio.deepitlabs.in.</p>
        </div>
        
        <hr style="border: 0; border-top: 1px solid #1e293b; margin: 24px 0;" />
        <p style="font-size: 11px; color: #64748b; text-align: center; margin-bottom: 0;">This is an automated security notice. Do not reply to this email.</p>
      </div>
    `;
    await this.sendMailWrapper(email, subject, textContent, htmlContent);
  }

  logSimulation(email, subject, content) {
    console.log('\n✉️ [Email Simulator - Verification/Alert]');
    console.log('─'.repeat(60));
    console.log(`To:      ${email}`);
    console.log(`Subject: ${subject}`);
    console.log(`Content: ${content}`);
    console.log('─'.repeat(60));
  }
}

module.exports = new EmailService();
