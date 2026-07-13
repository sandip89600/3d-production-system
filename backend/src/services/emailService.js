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

    if (this.configured) {
      try {
        await this.transporter.sendMail({
          from: this.from,
          to: email,
          subject,
          text: textContent,
          html: htmlContent,
        });
        console.log(`📧 Real Email OTP sent to ${email}`);
      } catch (err) {
        console.error('Nodemailer failed to send email:', err.message);
        this.logSimulation(email, subject, textContent);
      }
    } else {
      this.logSimulation(email, subject, textContent);
    }
  }

  logSimulation(email, subject, content) {
    console.log('\n✉️ [Email Simulator - OTP Verification]');
    console.log('─'.repeat(60));
    console.log(`To:      ${email}`);
    console.log(`Subject: ${subject}`);
    console.log(`Content: ${content}`);
    console.log('─'.repeat(60));
  }
}

module.exports = new EmailService();
