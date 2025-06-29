import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import handlebars from 'handlebars';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import AppError from './error.js';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create reusable transporter object using SMTP transport
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_PORT === '465', // true for 465 (SSL), false for other ports
  requireTLS: process.env.SMTP_PORT === '587', // Enable TLS for port 587
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASSWORD,
  },
  tls: {
    // Do not fail on invalid certs (helpful for development)
    rejectUnauthorized: false
  }
});

// Verify connection configuration
transporter.verify((error) => {
  if (error) {
    console.error('SMTP Connection Error:', error);
  } else {
    console.log('SMTP server is ready to send emails');
  }
});

/**
 * Send email using template
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} templateName - Name of template file (without extension)
 * @param {Object} context - Data to inject into template
 * @returns {Promise}
 */
const sendEmail = async (to, subject, templateName, context = {}) => {
  try {
    // Construct path to email template
    const templatePath = path.join(
      __dirname,
      '..', // Go up to backend root
      'emails',
      `${templateName}.hbs`
    );
    
    // Check if template exists
    if (!fs.existsSync(templatePath)) {
      throw new AppError(`Email template not found: ${templateName}`, 500);
    }
    
    // Read and compile template
    const source = fs.readFileSync(templatePath, 'utf8');
    const template = handlebars.compile(source);
    const html = template({
      ...context,
      appName: process.env.APP_NAME || 'Task Manager',
      supportEmail: process.env.SUPPORT_EMAIL || process.env.FROM_EMAIL,
      currentYear: new Date().getFullYear()
    });

    // Send mail with defined transport object
    await transporter.sendMail({
      from: `"${process.env.FROM_NAME}" <${process.env.FROM_EMAIL}>`,
      to,
      subject,
      html,
    });
    
    console.log(`Email sent to ${to}`);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    throw new AppError('Failed to send email', 500);
  }
};

/**
 * Send verification email
 * @param {string} email - Recipient email
 * @param {string} name - User name
 * @param {string} token - Verification token
 * @returns {Promise}
 */
export const sendVerificationEmail = async (email, name, token) => {
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
  
  await sendEmail(
    email,
    'Verify Your Email - Task Manager',
    'verification',
    {
      name,
      verificationUrl,
      expiryHours: 1 // Matches token expiration
    }
  );
};

/**
 * Send password reset email
 * @param {string} email - Recipient email
 * @param {string} name - User name
 * @param {string} token - Reset token
 * @returns {Promise}
 */
export const sendPasswordResetEmail = async (email, name, token) => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
  
  await sendEmail(
    email,
    'Password Reset Request - Task Manager',
    'passwordReset',
    {
      name,
      resetUrl,
      expiryMinutes: 10 // Matches token expiration
    }
  );
};

export default transporter;