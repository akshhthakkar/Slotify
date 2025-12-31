const cron = require('node-cron');
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const Business = require('../models/Business');
const Service = require('../models/Service');
const { sendAppointmentReminder } = require('./emailService');
const { createNotification } = require('../controllers/notificationController');
const { format } = require('date-fns');

/**
 * Send 24-hour appointment reminders
 * Runs every hour
 */
const send24HourReminders = async () => {
  try {
    console.log('🔔 Running 24-hour reminder job...');

    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // Find appointments 24 hours from now that haven't received day reminder
    const appointments = await Appointment.find({
      status: 'scheduled',
      'reminderSent.day': false,
      appointmentDate: {
        $gte: new Date(tomorrow.setHours(0, 0, 0, 0)),
        $lte: new Date(tomorrow.setHours(23, 59, 59, 999))
      }
    })
      .populate('customerId', 'name email notificationPreferences')
      .populate('businessId', 'name')
      .populate('serviceId', 'name')
      .populate('staffId', 'name');

    console.log(`Found ${appointments.length} appointments for 24-hour reminders`);

    for (const appointment of appointments) {
      try {
        // Check if customer wants email notifications
        if (appointment.customerId.notificationPreferences.email) {
          await sendAppointmentReminder(appointment.customerId.email, {
            customerName: appointment.customerId.name,
            businessName: appointment.businessId.name,
            serviceName: appointment.serviceId.name,
            date: format(new Date(appointment.appointmentDate), 'EEEE, MMMM d, yyyy'),
            time: appointment.startTime,
            staffName: appointment.staffId.name
          }, 24);
        }

        // Create in-app notification
        if (appointment.customerId.notificationPreferences.inApp) {
          await createNotification(
            appointment.customerId._id,
            'appointment_reminder',
            'Appointment Reminder',
            `Reminder: You have an appointment tomorrow at ${appointment.startTime} with ${appointment.businessId.name}`,
            appointment._id
          );
        }

        // Mark reminder as sent
        appointment.reminderSent.day = true;
        await appointment.save();

        console.log(`✅ Sent 24-hour reminder for appointment ${appointment._id}`);
      } catch (error) {
        console.error(`❌ Error sending reminder for appointment ${appointment._id}:`, error);
      }
    }

    console.log('✅ 24-hour reminder job completed');
  } catch (error) {
    console.error('❌ Error in 24-hour reminder job:', error);
  }
};

/**
 * Send 2-hour appointment reminders
 * Runs every 15 minutes
 */
const send2HourReminders = async () => {
  try {
    console.log('🔔 Running 2-hour reminder job...');

    const now = new Date();
    const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);

    // Find appointments in next 2-2.25 hours that haven't received hour reminder
    const appointments = await Appointment.find({
      status: 'scheduled',
      'reminderSent.hours': false,
      appointmentDate: {
        $gte: new Date(now.setHours(0, 0, 0, 0)),
        $lte: new Date(now.setHours(23, 59, 59, 999))
      }
    })
      .populate('customerId', 'name email notificationPreferences')
      .populate('businessId', 'name')
      .populate('serviceId', 'name')
      .populate('staffId', 'name');

    // Filter appointments that are approximately 2 hours away
    const upcomingAppointments = appointments.filter(apt => {
      const aptDateTime = new Date(apt.appointmentDate);
      const [hours, minutes] = apt.startTime.split(':').map(Number);
      aptDateTime.setHours(hours, minutes, 0, 0);

      const timeDiff = aptDateTime - now;
      const hoursDiff = timeDiff / (1000 * 60 * 60);

      // Send reminder between 1.75 and 2.5 hours before
      return hoursDiff >= 1.75 && hoursDiff <= 2.5;
    });

    console.log(`Found ${upcomingAppointments.length} appointments for 2-hour reminders`);

    for (const appointment of upcomingAppointments) {
      try {
        // Check if customer wants email notifications
        if (appointment.customerId.notificationPreferences.email) {
          await sendAppointmentReminder(appointment.customerId.email, {
            customerName: appointment.customerId.name,
            businessName: appointment.businessId.name,
            serviceName: appointment.serviceId.name,
            date: format(new Date(appointment.appointmentDate), 'EEEE, MMMM d, yyyy'),
            time: appointment.startTime,
            staffName: appointment.staffId.name
          }, 2);
        }

        // Create in-app notification
        if (appointment.customerId.notificationPreferences.inApp) {
          await createNotification(
            appointment.customerId._id,
            'appointment_reminder',
            'Appointment Soon!',
            `Your appointment is in 2 hours at ${appointment.startTime} with ${appointment.businessId.name}`,
            appointment._id
          );
        }

        // Mark reminder as sent
        appointment.reminderSent.hours = true;
        await appointment.save();

        console.log(`✅ Sent 2-hour reminder for appointment ${appointment._id}`);
      } catch (error) {
        console.error(`❌ Error sending reminder for appointment ${appointment._id}:`, error);
      }
    }

    console.log('✅ 2-hour reminder job completed');
  } catch (error) {
    console.error('❌ Error in 2-hour reminder job:', error);
  }
};

/**
 * Start all cron jobs
 */
const start = () => {
  console.log('🚀 Starting reminder scheduler...');

  // 24-hour reminders - Run every hour
  cron.schedule('0 * * * *', send24HourReminders);
  console.log('✅ 24-hour reminder job scheduled (runs every hour)');

  // 2-hour reminders - Run every 15 minutes
  cron.schedule('*/15 * * * *', send2HourReminders);
  console.log('✅ 2-hour reminder job scheduled (runs every 15 minutes)');

  console.log('✅ Reminder scheduler started successfully');
};

module.exports = {
  start,
  send24HourReminders,
  send2HourReminders
};