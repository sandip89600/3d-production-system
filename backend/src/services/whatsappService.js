const twilio = require('twilio');
const WhatsAppGroup = require('../models/WhatsAppGroup');
const MessageLog = require('../models/MessageLog');
const NotificationLog = require('../models/NotificationLog');
const Project = require('../models/Project');
const { getDownloadLink } = require('../utils/downloadToken');

class WhatsAppService {
  constructor() {
    this.enabled = process.env.WHATSAPP_ENABLED === 'true';
    this.accountSid = process.env.TWILIO_ACCOUNT_SID;
    this.authToken = process.env.TWILIO_AUTH_TOKEN;
    this.from = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886';

    if (this.enabled && this.accountSid && this.authToken) {
      try {
        this.client = twilio(this.accountSid, this.authToken);
      } catch (err) {
        console.error('Failed to initialize Twilio client in WhatsAppService:', err.message);
      }
    }
  }

  /**
   * Automatically detects if a project belongs to 'architecture' or 'modeling_rendering'
   * based on project type, name, or description keywords.
   */
  detectCategory(project) {
    const text = `${project.name} ${project.type || ''} ${project.description || ''}`.toLowerCase();
    
    // Group 1 keywords: Architectural Projects, Exterior Design, Interior Design, Floor Plans, Architectural Visualization, Walkthrough Projects
    const archKeywords = [
      'architecture', 'exterior', 'interior', 'floor plan', 'walkthrough', 
      'villa', 'house', 'building', 'elevation', 'apartment', 'home', 'architectural'
    ];
    
    // Group 2 keywords: 3D Modeling, Product Modeling, Furniture Modeling, Character Modeling, Rendering, Texturing, Lighting, 3D Assets
    const modelingKeywords = [
      'modeling', 'rendering', 'render', 'texture', 'texturing', 'lighting', 
      'product', 'furniture', 'character', 'asset', 'rigging', 'animation'
    ];

    let archScore = 0;
    let modelScore = 0;

    archKeywords.forEach(k => {
      const matches = text.match(new RegExp(k, 'g'));
      if (matches) archScore += matches.length;
    });

    modelingKeywords.forEach(k => {
      const matches = text.match(new RegExp(k, 'g'));
      if (matches) modelScore += matches.length;
    });

    if (archScore > modelScore) {
      return 'architecture';
    } else if (modelScore > archScore) {
      return 'modeling_rendering';
    }

    // Fallback detection using project.type specifically
    const typeText = (project.type || '').toLowerCase();
    if (typeText.includes('modeling') || typeText.includes('rendering') || typeText.includes('texture') || typeText.includes('lighting')) {
      return 'modeling_rendering';
    }
    if (typeText.includes('architecture') || typeText.includes('walkthrough') || typeText.includes('plan')) {
      return 'architecture';
    }

    return 'modeling_rendering'; // Default fallback
  }

  /**
   * Helper to fetch WhatsApp group by category
   */
  async getGroupByCategory(category) {
    let group = await WhatsAppGroup.findOne({ category });
    if (!group) {
      // Fallback fallback if seeder didn't run
      const name = category === 'architecture' ? '3D Architecture Team' : 'Modeling & Rendering Team';
      const groupId = category === 'architecture' ? 'whatsapp:3d-architecture-team' : 'whatsapp:modeling-rendering-team';
      group = await WhatsAppGroup.create({ name, groupId, category });
    }
    return group;
  }

  /**
   * Send WhatsApp message to a group/number and log it in the database.
   */
  async sendAndLogMessage({ group, recipient, message, senderId, project, type }) {
    let status = 'simulated';
    let sid = null;

    let targetRecipient = recipient || (group ? group.groupId : 'whatsapp:+14155238886');
    if (!targetRecipient.startsWith('whatsapp:')) {
      targetRecipient = `whatsapp:${targetRecipient}`;
    }

    // Call Twilio if enabled
    if (this.enabled && this.client) {
      try {
        const response = await this.client.messages.create({
          body: message,
          from: this.from,
          to: targetRecipient,
        });
        status = 'sent';
        sid = response.sid;
        console.log(`📱 [Twilio WhatsApp] Message sent to ${targetRecipient}. SID: ${sid}`);
      } catch (error) {
        console.error(`📱 [Twilio WhatsApp Error] Failed to send message: ${error.message}`);
        status = 'failed';
      }
    } else {
      // Simulation mode logging
      console.log('\n📱 [WhatsApp Simulator]');
      console.log('─'.repeat(60));
      console.log(`To Group:  ${group ? group.name : targetRecipient}`);
      console.log(`To Number: ${targetRecipient}`);
      console.log(`Message:\n${message}`);
      console.log('─'.repeat(60));
    }

    try {
      // Save MessageLog
      const messageLog = await MessageLog.create({
        group: group ? group._id : undefined,
        recipient: targetRecipient,
        message,
        sender: senderId,
        status,
        sid
      });

      // Save NotificationLog
      await NotificationLog.create({
        project: project ? project._id : undefined,
        type,
        whatsappGroup: group ? group._id : undefined,
        messageLog: messageLog._id,
        sentSuccessfully: status !== 'failed'
      });

      return { success: status !== 'failed', messageLog };
    } catch (err) {
      console.error('Failed to log WhatsApp notification in DB:', err.message);
      return { success: status !== 'failed' };
    }
  }

  /**
   * Send Project Upload Notification (Triggered ONLY by Admins/Superadmins)
   */
  async notifyNewProject(project, uploader) {
    // Security Rule Check: Only Admins can trigger project upload notifications
    if (uploader.role !== 'admin' && uploader.role !== 'superadmin') {
      console.warn(`🔒 [Security Block] User ${uploader.name} (${uploader.role}) attempted to trigger project upload WhatsApp notification.`);
      return { success: false, error: 'Unauthorized: Only admins can send upload notifications' };
    }

    const category = this.detectCategory(project);
    const group = await this.getGroupByCategory(category);

    const deadlineStr = new Date(project.deadline).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'long'
    });

    const categoryLabel = category === 'architecture' ? 'Architecture' : 'Modeling & Rendering';

    const downloadLink = getDownloadLink(project, project.assignedTo || uploader._id);

    const message = 
      `🚀 *New Project Uploaded*\n\n` +
      `Project: ${project.name}\n` +
      `Department: ${categoryLabel}\n` +
      `Uploaded By: ${uploader.name}\n\n` +
      `📥 *Download Project Files*:\n` +
      `${downloadLink}\n\n` +
      `Please download the files and start work.\n\n` +
      `Deadline:\n` +
      `${deadlineStr}`;

    return this.sendAndLogMessage({
      group,
      message,
      senderId: uploader._id,
      project,
      type: 'upload'
    });
  }

  /**
   * Send Project Pickup Notification
   */
  async notifyProjectPicked(project, employee) {
    const category = this.detectCategory(project);
    const group = await this.getGroupByCategory(category);

    const deptLabel = category === 'architecture' ? 'Architecture' : 'Modeling & Rendering';

    const message = 
      `📌 *Project Picked*\n\n` +
      `Project: ${project.name}\n` +
      `Employee: ${employee.name}\n` +
      `Department: ${deptLabel}\n` +
      `Status: In Progress`;

    return this.sendAndLogMessage({
      group,
      message,
      senderId: employee._id,
      project,
      type: 'pickup'
    });
  }

  /**
   * Send Progress Update Notification
   */
  async notifyProgressUpdated(project, employee, progressPercentage) {
    const category = this.detectCategory(project);
    const group = await this.getGroupByCategory(category);

    const message = 
      `📊 *Progress Updated*\n\n` +
      `Project: ${project.name}\n` +
      `Employee: ${employee.name}\n` +
      `Progress: ${progressPercentage}%`;

    return this.sendAndLogMessage({
      group,
      message,
      senderId: employee._id,
      project,
      type: 'progress'
    });
  }

  /**
   * Send Project Completion Notification (Submit for review)
   */
  async notifyProjectCompleted(project, employee) {
    const category = this.detectCategory(project);
    const group = await this.getGroupByCategory(category);

    const message = 
      `✅ *Project Completed*\n\n` +
      `Project: ${project.name}\n` +
      `Employee: ${employee.name}\n` +
      `Status: Ready For Review`;

    return this.sendAndLogMessage({
      group,
      message,
      senderId: employee._id,
      project,
      type: 'complete'
    });
  }

  /**
   * Send Daily Admin Summary
   */
  async sendDailySummary() {
    try {
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);

      const [uploadedToday, inProgress, completedToday, delayed] = await Promise.all([
        Project.countDocuments({ createdAt: { $gte: startOfToday } }),
        Project.countDocuments({ status: 'in-progress' }),
        Project.countDocuments({ status: 'completed', completedAt: { $gte: startOfToday } }),
        Project.countDocuments({ status: 'delayed' })
      ]);

      const message = 
        `📈 *Daily Summary*\n\n` +
        `Projects Uploaded: ${uploadedToday}\n` +
        `Projects In Progress: ${inProgress}\n` +
        `Projects Completed: ${completedToday}\n` +
        `Delayed Projects: ${delayed}`;

      // Send to both groups so both departments get the daily digest
      const group1 = await this.getGroupByCategory('architecture');
      const group2 = await this.getGroupByCategory('modeling_rendering');

      await this.sendAndLogMessage({
        group: group1,
        message,
        type: 'summary'
      });

      await this.sendAndLogMessage({
        group: group2,
        message,
        type: 'summary'
      });

      return { success: true, uploadedToday, inProgress, completedToday, delayed };
    } catch (error) {
      console.error('Failed to compile daily summary:', error.message);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new WhatsAppService();
