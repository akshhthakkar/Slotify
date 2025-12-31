const nodemailer = require('nodemailer');

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Verify transporter configuration
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Email transporter error:', error);
  } else {
    console.log('✅ Email server is ready to send messages');
  }
});

/**
 * Send email verification
 */
const sendVerificationEmail = async (email, name, token) => {
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${token}`;
  
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Verify Your Email - Slotify',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to Slotify! 🎉</h1>
          </div>
          <div class="content">
            <p>Hi ${name},</p>
            <p>Thank you for registering with Slotify! We're excited to have you on board.</p>
            <p>To complete your registration, please verify your email address by clicking the button below:</p>
            <div style="text-align: center;">
              <a href="${verificationUrl}" class="button">Verify Email Address</a>
            </div>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #667eea;">${verificationUrl}</p>
            <p><strong>This link will expire in 24 hours.</strong></p>
            <p>If you didn't create an account with Slotify, please ignore this email.</p>
            <p>Best regards,<br>The Slotify Team</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Slotify. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  return await transporter.sendMail(mailOptions);
};

/**
 * Send password reset email
 */
const sendPasswordResetEmail = async (email, name, token) => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${token}`;
  
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Reset Your Password - Slotify',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #667eea; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset Request</h1>
          </div>
          <div class="content">
            <p>Hi ${name},</p>
            <p>We received a request to reset your password for your Slotify account.</p>
            <p>Click the button below to reset your password:</p>
            <div style="text-align: center;">
              <a href="${resetUrl}" class="button">Reset Password</a>
            </div>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #667eea;">${resetUrl}</p>
            <div class="warning">
              <strong>⚠️ Security Notice:</strong>
              <ul>
                <li>This link will expire in 1 hour</li>
                <li>If you didn't request this, please ignore this email</li>
                <li>Your password won't change until you access the link above and create a new one</li>
              </ul>
            </div>
            <p>Best regards,<br>The Slotify Team</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  return await transporter.sendMail(mailOptions);
};

/**
 * Send appointment confirmation email
 */
const sendAppointmentConfirmation = async (email, appointmentDetails) => {
  const { customerName, businessName, serviceName, date, time, staffName } = appointmentDetails;
  
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: `Appointment Confirmed - ${businessName}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #10b981; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .appointment-details { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
          .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e5e5; }
          .label { font-weight: bold; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Appointment Confirmed!</h1>
          </div>
          <div class="content">
            <p>Hi ${customerName},</p>
            <p>Your appointment has been confirmed. Here are the details:</p>
            <div class="appointment-details">
              <div class="detail-row">
                <span class="label">Business:</span>
                <span>${businessName}</span>
              </div>
              <div class="detail-row">
                <span class="label">Service:</span>
                <span>${serviceName}</span>
              </div>
              <div class="detail-row">
                <span class="label">Date:</span>
                <span>${date}</span>
              </div>
              <div class="detail-row">
                <span class="label">Time:</span>
                <span>${time}</span>
              </div>
              <div class="detail-row">
                <span class="label">Staff:</span>
                <span>${staffName}</span>
              </div>
            </div>
            <p>We look forward to seeing you!</p>
            <p>If you need to cancel or reschedule, please do so at least 24 hours in advance.</p>
            <p>Best regards,<br>${businessName}</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  return await transporter.sendMail(mailOptions);
};

/**
 * Send appointment reminder email
 */
const sendAppointmentReminder = async (email, appointmentDetails, hoursUntil) => {
  const { customerName, businessName, serviceName, date, time, staffName } = appointmentDetails;
  
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: `Reminder: Appointment in ${hoursUntil} hours - ${businessName}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f59e0b; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .appointment-details { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⏰ Appointment Reminder</h1>
          </div>
          <div class="content">
            <p>Hi ${customerName},</p>
            <p>This is a friendly reminder that you have an appointment coming up in <strong>${hoursUntil} hours</strong>.</p>
            <div class="appointment-details">
              <p><strong>Business:</strong> ${businessName}</p>
              <p><strong>Service:</strong> ${serviceName}</p>
              <p><strong>Date:</strong> ${date}</p>
              <p><strong>Time:</strong> ${time}</p>
              <p><strong>Staff:</strong> ${staffName}</p>
            </div>
            <p>We look forward to seeing you soon!</p>
            <p>Best regards,<br>${businessName}</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  return await transporter.sendMail(mailOptions);
};

/**
 * Send cancellation confirmation email
 */
const sendCancellationEmail = async (email, appointmentDetails) => {
  const { customerName, businessName, serviceName, date, time } = appointmentDetails;
  
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: `Appointment Cancelled - ${businessName}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #ef4444; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Appointment Cancelled</h1>
          </div>
          <div class="content">
            <p>Hi ${customerName},</p>
            <p>Your appointment has been cancelled:</p>
            <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0;">
              <p><strong>Business:</strong> ${businessName}</p>
              <p><strong>Service:</strong> ${serviceName}</p>
              <p><strong>Date:</strong> ${date}</p>
              <p><strong>Time:</strong> ${time}</p>
            </div>
            <p>If you'd like to book another appointment, please visit our website.</p>
            <p>Best regards,<br>${businessName}</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  return await transporter.sendMail(mailOptions);
};

/**
 * Send rescheduling confirmation email
 */
const sendRescheduleEmail = async (email, appointmentDetails) => {
  const { customerName, businessName, serviceName, oldDate, oldTime, newDate, newTime, staffName } = appointmentDetails;
  
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: `Appointment Rescheduled - ${businessName}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #3b82f6; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .time-change { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
          .old-time { text-decoration: line-through; color: #999; }
          .new-time { color: #10b981; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📅 Appointment Rescheduled</h1>
          </div>
          <div class="content">
            <p>Hi ${customerName},</p>
            <p>Your appointment has been successfully rescheduled.</p>
            <div class="time-change">
              <p><strong>Business:</strong> ${businessName}</p>
              <p><strong>Service:</strong> ${serviceName}</p>
              <p><strong>Staff:</strong> ${staffName}</p>
              <hr>
              <p class="old-time">Previous: ${oldDate} at ${oldTime}</p>
              <p class="new-time">New: ${newDate} at ${newTime}</p>
            </div>
            <p>We look forward to seeing you at the new time!</p>
            <p>Best regards,<br>${businessName}</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  return await transporter.sendMail(mailOptions);
};

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendAppointmentConfirmation,
  sendAppointmentReminder,
  sendCancellationEmail,
  sendRescheduleEmail
};