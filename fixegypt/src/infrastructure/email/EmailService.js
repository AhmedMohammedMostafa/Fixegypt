import nodemailer from 'nodemailer';
import config from '../../config.js';
import logger from '../web/middlewares/logger.js';

/**
 * Email Service for sending all application emails
 */
class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: config.email.host,
      port: config.email.port,
      secure: config.email.port === 465, // true for 465, false for other ports
      auth: {
        user: config.email.user,
        pass: config.email.pass
      }
    });
  }

  /**
   * Generate base email options
   * @param {string} to - Recipient email
   * @param {string} subject - Email subject
   * @returns {Object} Base email options
   */
  _getBaseEmailOptions(to, subject) {
    return {
      from: `"Egyptian City Report Platform" <${config.email.from}>`,
      to,
      subject
    };
  }

  /**
   * Send an email
   * @param {Object} options - Email options
   * @returns {Promise<boolean>} Success status
   */
  async sendEmail(options) {
    try {
      const info = await this.transporter.sendMail(options);
      logger.info(`Email sent: ${info.messageId}`);
      return true;
    } catch (error) {
      logger.error(`Error sending email: ${error.message}`);
      return false;
    }
  }

  /**
   * Send verification email to a new user
   * @param {User} user - User to verify
   * @param {string} verificationToken - Verification token
   * @returns {Promise<boolean>} Success status
   */
  async sendVerificationEmail(user, verificationToken) {
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://fixegypt.vercel.app'}/verify-email?token=${verificationToken}`;
    
    const options = this._getBaseEmailOptions(
      user.email,
      'Verify Your Email - Egyptian City Report Platform'
    );

    options.html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">Verify Your Email Address</h2>
        <p>Hello ${user.firstName},</p>
        <p>Thank you for registering with the Egyptian City Report Platform. To complete your registration, please verify your email address by clicking the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" style="background-color: #3498db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Verify Email Address</a>
        </div>
        <p>If the button doesn't work, you can also copy and paste the following link into your browser:</p>
        <p style="word-break: break-all; font-size: 14px;">${verificationUrl}</p>
        <p>This link will expire in 24 hours.</p>
        <p>If you didn't register for an account, please ignore this email.</p>
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #777;">
          <p>Egyptian City Report Platform</p>
          <p>This is an automated email, please do not reply.</p>
        </div>
      </div>
    `;

    return this.sendEmail(options);
  }

  /**
   * Send a notification when report status changes
   * @param {User} user - Report owner
   * @param {Report} report - The report
   * @param {string} newStatus - New report status
   * @param {string} note - Status change note
   * @returns {Promise<boolean>} Success status
   */
  async sendReportStatusUpdateEmail(user, report, newStatus, note = '') {
    const reportUrl = `${process.env.FRONTEND_URL || 'http://fixegypt.vercel.app'}/reports/${report.id}`;
    
    const statusMessages = {
      'pending': 'Your report has been received and is pending review.',
      'in-progress': 'Your report is now being processed by our team.',
      'resolved': 'Your report has been resolved. Thank you for your contribution!',
      'rejected': 'Your report has been reviewed and unfortunately has been rejected.'
    };

    const statusColors = {
      'pending': '#f39c12',
      'in-progress': '#3498db',
      'resolved': '#2ecc71',
      'rejected': '#e74c3c'
    };

    const options = this._getBaseEmailOptions(
      user.email,
      `Report Status Update: ${report.title}`
    );

    options.html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">Report Status Update</h2>
        <p>Hello ${user.firstName},</p>
        <p>There has been an update to your report:</p>
        
        <div style="border: 1px solid #eee; padding: 15px; margin: 20px 0; border-radius: 5px;">
          <h3 style="margin-top: 0;">${report.title}</h3>
          <p style="margin-bottom: 5px;"><strong>Category:</strong> ${report.category.replace('_', ' ')}</p>
          <p style="margin-bottom: 5px;"><strong>Location:</strong> ${report.location.address}, ${report.location.city}, ${report.location.governorate}</p>
          <p style="margin-bottom: 5px;"><strong>Submitted:</strong> ${new Date(report.createdAt).toLocaleDateString()}</p>
          <p style="margin-bottom: 5px;"><strong>Status:</strong> <span style="color: ${statusColors[newStatus]}; font-weight: bold;">${newStatus.toUpperCase()}</span></p>
        </div>
        
        <p><strong>Status Message:</strong> ${statusMessages[newStatus]}</p>
        
        ${note ? `<p><strong>Additional Note:</strong> ${note}</p>` : ''}
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${reportUrl}" style="background-color: #3498db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">View Report Details</a>
        </div>
        
        <p>Thank you for using the Egyptian City Report Platform to help improve our cities.</p>
        
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #777;">
          <p>Egyptian City Report Platform</p>
          <p>This is an automated email, please do not reply.</p>
        </div>
      </div>
    `;

    return this.sendEmail(options);
  }

  /**
   * Send a password reset email
   * @param {User} user - User requesting password reset
   * @param {string} resetToken - Reset token
   * @returns {Promise<boolean>} Success status
   */
  async sendPasswordResetEmail(user, resetToken) {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://fixegypt.vercel.app'}/reset-password?token=${resetToken}`;
    
    const options = this._getBaseEmailOptions(
      user.email,
      'Password Reset - Egyptian City Report Platform'
    );

    options.html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">Reset Your Password</h2>
        <p>Hello ${user.firstName},</p>
        <p>We received a request to reset your password. Click the button below to create a new password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #3498db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Reset Password</a>
        </div>
        <p>If the button doesn't work, you can also copy and paste the following link into your browser:</p>
        <p style="word-break: break-all; font-size: 14px;">${resetUrl}</p>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #777;">
          <p>Egyptian City Report Platform</p>
          <p>This is an automated email, please do not reply.</p>
        </div>
      </div>
    `;

    return this.sendEmail(options);
  }

  /**
   * Send a welcome email after verification
   * @param {User} user - Verified user
   * @returns {Promise<boolean>} Success status
   */
  async sendWelcomeEmail(user) {
    const loginUrl = `${process.env.FRONTEND_URL || 'http://fixegypt.vercel.app'}/login`;
    
    const options = this._getBaseEmailOptions(
      user.email,
      'Welcome to Egyptian City Report Platform'
    );

    options.html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">Welcome to Egyptian City Report Platform!</h2>
        <p>Hello ${user.firstName},</p>
        <p>Thank you for verifying your email address. Your account is now fully activated, and you can start using our platform to report issues in your city.</p>
        <h3>What You Can Do Now:</h3>
        <ul>
          <li>Report issues in your neighborhood</li>
          <li>Track the status of your reports</li>
          <li>See reports from your area</li>
          <li>Contribute to making your city better</li>
        </ul>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${loginUrl}" style="background-color: #3498db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Login to Your Account</a>
        </div>
        <p>We're excited to have you as part of our community working together to improve Egyptian cities.</p>
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #777;">
          <p>Egyptian City Report Platform</p>
          <p>This is an automated email, please do not reply.</p>
        </div>
      </div>
    `;

    return this.sendEmail(options);
  }
}

export default new EmailService(); 