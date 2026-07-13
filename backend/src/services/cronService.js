const cron = require('node-cron');
const whatsappService = require('./whatsappCloudService');
const Project = require('../models/Project');
const ProjectDownloadLog = require('../models/ProjectDownloadLog');

/**
 * Hourly scan for employees who picked up projects but haven't downloaded files.
 */
const checkPendingDownloads = async () => {
  console.log('⏰ [Cron Service] Scanning for pending project downloads...');
  try {
    const reminderHours = parseInt(process.env.DOWNLOAD_REMINDER_HOURS) || 2;
    const cutOffTime = new Date(Date.now() - reminderHours * 60 * 60 * 1000);

    // Find projects in-progress (picked up) that were updated (picked up) more than X hours ago
    const projects = await Project.find({
      status: 'in-progress',
      assignedTo: { $ne: null },
      updatedAt: { $lt: cutOffTime }
    }).populate('assignedTo');

    for (const project of projects) {
      // Check if employee has downloaded the files
      const hasDownloaded = await ProjectDownloadLog.exists({
        project: project._id,
        employee: project.assignedTo._id
      });

      if (!hasDownloaded) {
        console.log(`⚠️ Sending reminder to ${project.assignedTo.name} for project "${project.name}"`);
        const downloadLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/download-project/${project._id}`;
        
        const message = 
          `⚠️ *Reminder*\n\n` +
          `You have not downloaded your assigned project files yet.\n\n` +
          `Project:\n${project.name}\n\n` +
          `Download:\n${downloadLink}`;

        // Send direct WhatsApp to employee
        await whatsappService.sendAndLogMessage({
          recipient: project.assignedTo.mobile || 'whatsapp:+14155238886',
          message,
          senderId: null,
          project,
          type: 'reminder'
        });
      }
    }
  } catch (error) {
    console.error('❌ [Cron Service] Error checking pending downloads:', error.message);
  }
};

/**
 * Initializes scheduled cron jobs for the application.
 */
function initCron() {
  console.log('⏰ [Cron Service] Initializing scheduled tasks...');

  // Schedule daily summary at 8:00 PM (20:00) every day
  cron.schedule('0 20 * * *', async () => {
    console.log('⏰ [Cron Service] Running scheduled 8:00 PM Daily WhatsApp Summary...');
    try {
      const result = await whatsappService.sendDailySummary();
      if (result.success) {
        console.log('⏰ [Cron Service] Daily WhatsApp Summary sent successfully.');
      } else {
        console.error('⏰ [Cron Service] Daily WhatsApp Summary failed:', result.error);
      }
    } catch (error) {
      console.error('⏰ [Cron Service] Error running Daily WhatsApp Summary job:', error);
    }
  });

  // Schedule pending download reminder checks every hour
  cron.schedule('0 * * * *', async () => {
    await checkPendingDownloads();
  });

  console.log('⏰ [Cron Service] Scheduled 8:00 PM Daily Summary job.');
  console.log('⏰ [Cron Service] Scheduled hourly pending downloads check.');
}

module.exports = {
  initCron,
  checkPendingDownloads
};
