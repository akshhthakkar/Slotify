const nodemailer = require("nodemailer");

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Verify transporter configuration
transporter.verify((error, success) => {
  if (error) {
    console.error("❌ Email transporter error:", error);
  } else {
    console.log("✅ Email server is ready to send messages");
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
    subject: "Verify Your Email - Slotify",
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
    `,
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
    subject: "Reset Your Password - Slotify",
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
    `,
  };

  return await transporter.sendMail(mailOptions);
};

/**
 * Send appointment confirmation email
 */
const sendAppointmentConfirmation = async (email, appointmentDetails) => {
  const { customerName, businessName, serviceName, date, time, staffName } =
    appointmentDetails;

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
    `,
  };

  return await transporter.sendMail(mailOptions);
};

/**
 * Send appointment reminder email
 */
const sendAppointmentReminder = async (
  email,
  appointmentDetails,
  hoursUntil
) => {
  const { customerName, businessName, serviceName, date, time, staffName } =
    appointmentDetails;

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
    `,
  };

  return await transporter.sendMail(mailOptions);
};

/**
 * Send cancellation confirmation email
 */
const sendCancellationEmail = async (email, appointmentDetails) => {
  const { customerName, businessName, serviceName, date, time } =
    appointmentDetails;

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
    `,
  };

  return await transporter.sendMail(mailOptions);
};

/**
 * Send rescheduling confirmation email
 */
const sendRescheduleEmail = async (email, appointmentDetails) => {
  const {
    customerName,
    businessName,
    serviceName,
    oldDate,
    oldTime,
    newDate,
    newTime,
    staffName,
  } = appointmentDetails;

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
    `,
  };

  return await transporter.sendMail(mailOptions);
};

/**
 * Send booking confirmation email to CUSTOMER
 * Friendly tone with all booking details and cancellation policy
 */
const sendCustomerBookingConfirmationEmail = async (email, details) => {
  const {
    customerName,
    businessName,
    serviceName,
    date,
    startTime,
    endTime,
    duration,
    staffName,
    bookingId,
    businessAddress,
    cancellationPolicy,
  } = details;

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: "Your appointment is confirmed 🎉",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 40px 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .header h1 { margin: 0; font-size: 28px; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .booking-card { background: white; padding: 25px; border-radius: 10px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .detail-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e5e7eb; }
          .detail-row:last-child { border-bottom: none; }
          .label { font-weight: 600; color: #6b7280; }
          .value { color: #111827; font-weight: 500; }
          .booking-id { background: #f0fdf4; border: 1px solid #86efac; padding: 10px 15px; border-radius: 6px; text-align: center; margin-top: 15px; }
          .policy-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 0 6px 6px 0; }
          .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Appointment Confirmed!</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">We can't wait to see you</p>
          </div>
          <div class="content">
            <p>Hi <strong>${customerName}</strong>,</p>
            <p>Great news! Your appointment has been confirmed. Here are your booking details:</p>
            
            <div class="booking-card">
              <div class="detail-row">
                <span class="label">📍 Business: </span>
                <span class="value">${businessName}</span>
              </div>
              <div class="detail-row">
                <span class="label">💇 Service: </span>
                <span class="value">${serviceName}</span>
              </div>
              <div class="detail-row">
                <span class="label">📅 Date: </span>
                <span class="value">${date}</span>
              </div>
              <div class="detail-row">
                <span class="label">⏰ Time: </span>
                <span class="value">${startTime} – ${endTime}</span>
              </div>
              <div class="detail-row">
                <span class="label">⏱️ Duration: </span>
                <span class="value">${duration} minutes</span>
              </div>
              ${
                staffName
                  ? `
              <div class="detail-row">
                <span class="label">👤 Staff: </span>
                <span class="value">${staffName}</span>
              </div>
              `
                  : ""
              }
              ${
                businessAddress
                  ? `
              <div class="detail-row">
                <span class="label">🏠 Location: </span>
                <span class="value">${businessAddress}</span>
              </div>
              `
                  : ""
              }
              <div class="booking-id">
                <strong>Booking ID:</strong> ${bookingId}
              </div>
            </div>

            <div class="policy-box">
              <strong>📋 Important: </strong><br>
              ${
                cancellationPolicy ||
                "If you need to cancel or reschedule, please do so at least 24 hours in advance."
              }
            </div>

            <p>We look forward to seeing you!</p>
            <p>Best regards,<br><strong>${businessName}</strong></p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} ${businessName}. Powered by Slotify.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  return await transporter.sendMail(mailOptions);
};

/**
 * Send booking notification email to PROVIDER/BUSINESS
 * Professional tone with customer and booking details
 */
const sendProviderBookingNotificationEmail = async (email, details) => {
  const {
    customerName,
    customerEmail,
    customerPhone,
    businessName,
    serviceName,
    date,
    startTime,
    endTime,
    duration,
    staffName,
    bookingId,
    customerNotes,
  } = details;

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: `📅 New Booking: ${serviceName} with ${customerName}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; padding: 35px 30px; text-align: center; border-radius: 12px 12px 0 0; }
          .header h1 { margin: 0; font-size: 26px; font-weight: 600; }
          .header p { margin: 8px 0 0 0; opacity: 0.9; font-size: 15px; }
          .content { background: #ffffff; padding: 35px; border-radius: 0 0 12px 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
          .section { background: #f8fafc; padding: 22px; border-radius: 10px; margin: 20px 0; border: 1px solid #e2e8f0; }
          .section-title { font-size: 13px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 16px; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; display: flex; align-items: center; gap: 8px; }
          .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
          .detail-row:last-child { border-bottom: none; }
          .label { color: #64748b; font-size: 14px; }
          .value { font-weight: 600; color: #1e293b; font-size: 14px; text-align: right; }
          .booking-id { background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border: 1px solid #93c5fd; padding: 14px 18px; border-radius: 8px; text-align: center; margin-top: 18px; }
          .booking-id strong { color: #1e40af; }
          .notes-section { background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-left: 4px solid #f59e0b; padding: 18px 20px; border-radius: 0 10px 10px 0; margin: 20px 0; }
          .notes-section .notes-title { font-weight: 700; color: #92400e; margin-bottom: 10px; display: flex; align-items: center; gap: 8px; font-size: 14px; }
          .notes-section .notes-content { color: #78350f; font-style: italic; line-height: 1.7; }
          .cta-section { text-align: center; margin: 25px 0; }
          .cta-button { display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; }
          .footer { text-align: center; margin-top: 25px; color: #94a3b8; font-size: 13px; }
          .footer p { margin: 5px 0; }
          .divider { height: 1px; background: linear-gradient(90deg, transparent, #e2e8f0, transparent); margin: 25px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📅 New Appointment Booked</h1>
            <p>A customer has just booked an appointment!</p>
          </div>
          <div class="content">
            <p style="font-size: 16px; color: #475569; margin-bottom: 25px;">Hello <strong>${businessName}</strong> team,</p>
            <p style="color: #64748b;">A new appointment has been scheduled. Here are the complete details:</p>
            
            <div class="section">
              <div class="section-title">👤 Customer Information</div>
              <div class="detail-row">
                <span class="label">Name</span>
                <span class="value">${customerName}</span>
              </div>
              <div class="detail-row">
                <span class="label">Email</span>
                <span class="value">${customerEmail}</span>
              </div>
              ${
                customerPhone
                  ? `
              <div class="detail-row">
                <span class="label">Phone</span>
                <span class="value">${customerPhone}</span>
              </div>
              `
                  : ""
              }
            </div>

            <div class="section">
              <div class="section-title">📋 Appointment Details</div>
              <div class="detail-row">
                <span class="label">Service</span>
                <span class="value">${serviceName}</span>
              </div>
              <div class="detail-row">
                <span class="label">Date</span>
                <span class="value">${date}</span>
              </div>
              <div class="detail-row">
                <span class="label">Time</span>
                <span class="value">${startTime} – ${endTime}</span>
              </div>
              <div class="detail-row">
                <span class="label">Duration</span>
                <span class="value">${duration} minutes</span>
              </div>
              ${
                staffName
                  ? `
              <div class="detail-row">
                <span class="label">Assigned Staff</span>
                <span class="value">${staffName}</span>
              </div>
              `
                  : ""
              }
              <div class="booking-id">
                <strong>Booking ID:</strong> ${bookingId}
              </div>
            </div>

            ${
              customerNotes
                ? `
            <div class="notes-section">
              <div class="notes-title">📝 Customer Notes / Special Instructions</div>
              <div class="notes-content">"${customerNotes}"</div>
            </div>
            `
                : ""
            }

            <div class="divider"></div>

            <p style="color: #64748b; font-size: 14px; text-align: center;">Log in to your dashboard to view more details, manage this booking, or contact the customer.</p>
          </div>
          <div class="footer">
            <p>This is an automated notification from Slotify.</p>
            <p>© ${new Date().getFullYear()} Slotify. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  return await transporter.sendMail(mailOptions);
};

/**
 * Send cancellation notification email to PROVIDER/BUSINESS
 * Professional tone notifying about cancelled appointment
 */
const sendProviderCancellationEmail = async (email, details) => {
  const {
    customerName,
    customerEmail,
    businessName,
    serviceName,
    date,
    time,
    staffName,
    bookingId,
    cancellationReason,
    cancelledBy,
  } = details;

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: `❌ Appointment Cancelled: ${serviceName} with ${customerName}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 35px 30px; text-align: center; border-radius: 12px 12px 0 0; }
          .header h1 { margin: 0; font-size: 26px; font-weight: 600; }
          .header p { margin: 8px 0 0 0; opacity: 0.9; font-size: 15px; }
          .content { background: #ffffff; padding: 35px; border-radius: 0 0 12px 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
          .section { background: #f8fafc; padding: 22px; border-radius: 10px; margin: 20px 0; border: 1px solid #e2e8f0; }
          .section-title { font-size: 13px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 16px; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; }
          .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
          .detail-row:last-child { border-bottom: none; }
          .label { color: #64748b; font-size: 14px; }
          .value { font-weight: 600; color: #1e293b; font-size: 14px; text-align: right; }
          .booking-id { background: #fef2f2; border: 1px solid #fecaca; padding: 14px 18px; border-radius: 8px; text-align: center; margin-top: 18px; }
          .booking-id strong { color: #991b1b; }
          .reason-section { background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%); border-left: 4px solid #ef4444; padding: 18px 20px; border-radius: 0 10px 10px 0; margin: 20px 0; }
          .reason-section .reason-title { font-weight: 700; color: #991b1b; margin-bottom: 10px; font-size: 14px; }
          .reason-section .reason-content { color: #7f1d1d; line-height: 1.7; }
          .footer { text-align: center; margin-top: 25px; color: #94a3b8; font-size: 13px; }
          .footer p { margin: 5px 0; }
          .cancelled-by { background: #fef3c7; border: 1px solid #fcd34d; padding: 10px 15px; border-radius: 6px; text-align: center; margin: 15px 0; color: #92400e; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>❌ Appointment Cancelled</h1>
            <p>An appointment has been cancelled</p>
          </div>
          <div class="content">
            <p style="font-size: 16px; color: #475569; margin-bottom: 25px;">Hello <strong>${businessName}</strong> team,</p>
            <p style="color: #64748b;">The following appointment has been cancelled:</p>
            
            <div class="cancelled-by">
              Cancelled by: <strong>${cancelledBy || "Customer"}</strong>
            </div>

            <div class="section">
              <div class="section-title">👤 Customer Information</div>
              <div class="detail-row">
                <span class="label">Name</span>
                <span class="value">${customerName}</span>
              </div>
              <div class="detail-row">
                <span class="label">Email</span>
                <span class="value">${customerEmail}</span>
              </div>
            </div>

            <div class="section">
              <div class="section-title">📋 Cancelled Appointment Details</div>
              <div class="detail-row">
                <span class="label">Service</span>
                <span class="value">${serviceName}</span>
              </div>
              <div class="detail-row">
                <span class="label">Date</span>
                <span class="value">${date}</span>
              </div>
              <div class="detail-row">
                <span class="label">Time</span>
                <span class="value">${time}</span>
              </div>
              ${
                staffName
                  ? `
              <div class="detail-row">
                <span class="label">Assigned Staff</span>
                <span class="value">${staffName}</span>
              </div>
              `
                  : ""
              }
              <div class="booking-id">
                <strong>Booking ID:</strong> ${bookingId}
              </div>
            </div>

            ${
              cancellationReason
                ? `
            <div class="reason-section">
              <div class="reason-title">📝 Cancellation Reason</div>
              <div class="reason-content">"${cancellationReason}"</div>
            </div>
            `
                : ""
            }

            <p style="color: #64748b; font-size: 14px; text-align: center; margin-top: 25px;">This time slot is now available for new bookings.</p>
          </div>
          <div class="footer">
            <p>This is an automated notification from Slotify.</p>
            <p>© ${new Date().getFullYear()} Slotify. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  return await transporter.sendMail(mailOptions);
};

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendAppointmentConfirmation,
  sendAppointmentReminder,
  sendCancellationEmail,
  sendRescheduleEmail,
  sendCustomerBookingConfirmationEmail,
  sendProviderBookingNotificationEmail,
  sendProviderCancellationEmail,
};
