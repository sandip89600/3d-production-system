const WhatsAppGroup = require('../models/WhatsAppGroup');
const MessageLog = require('../models/MessageLog');
const NotificationLog = require('../models/NotificationLog');
const Project = require('../models/Project');
const { getDownloadLink } = require('../utils/downloadToken');

class WhatsAppCloudService {
  constructor() {
    this.enabled = process.env.WHATSAPP_ENABLED === 'true';
    this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    this.businessAccountId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;

    // Check if configuration is complete if enabled
    if (this.enabled) {
      if (!this.accessToken || !this.phoneNumberId) {
        console.warn('⚠️ [WhatsApp Cloud Service] WhatsApp is enabled but WHATSAPP_ACCESS_TOKEN or WHATSAPP_PHONE_NUMBER_ID is missing. Falling back to Simulator Mode.');
        this.enabled = false;
      }
    }
  }

  /**
   * Helper to clean phone numbers to digits-only for Meta WhatsApp Cloud API
   * (e.g. "whatsapp:+919876543210" -> "919876543210")
   */
  cleanPhoneNumber(number) {
    if (!number) return '';
    return number.replace(/\D/g, '');
  }

  /**
   * Raw Meta WhatsApp Cloud API Text Message Dispatcher with Retry Mechanism
   */
  async sendWhatsAppMessage(phoneNumber, message) {
    const cleanNumber = this.cleanPhoneNumber(phoneNumber);
    if (!cleanNumber) {
      return { success: false, error: 'Invalid recipient phone number' };
    }

    const url = `https://graph.facebook.com/v23.0/${this.phoneNumberId}/messages`;
    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: cleanNumber,
      type: 'text',
      text: {
        preview_url: false,
        body: message
      }
    };

    let attempts = 0;
    const maxAttempts = 3;
    let delay = 500; // ms

    while (attempts < maxAttempts) {
      attempts++;
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (response.ok) {
          const messageId = data.messages?.[0]?.id;
          return { success: true, messageId };
        } else {
          console.error(`📱 [Meta WhatsApp API Error] Attempt ${attempts} failed (Status ${response.status}):`, data);
          
          // Retry on Rate Limiting (429) or Meta server errors (5xx)
          if (response.status === 429 || response.status >= 500) {
            if (attempts < maxAttempts) {
              console.log(`⏰ Retrying in ${delay}ms...`);
              await new Promise(resolve => setTimeout(resolve, delay));
              delay *= 2; // exponential backoff
              continue;
            }
          }
          return { success: false, error: data.error?.message || 'Meta API request failed' };
        }
      } catch (err) {
        console.error(`📱 [Meta WhatsApp Network Error] Attempt ${attempts} failed:`, err.message);
        if (attempts < maxAttempts) {
          console.log(`⏰ Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= 2;
          continue;
        }
        return { success: false, error: err.message };
      }
    }

    return { success: false, error: 'Max retry attempts reached' };
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

    let targetRecipient = recipient || (group ? group.groupId : '919876543210');

    if (this.enabled) {
      const apiRes = await this.sendWhatsAppMessage(targetRecipient, message);
      if (apiRes.success) {
        status = 'sent';
        sid = apiRes.messageId;
        console.log(`📱 [Meta WhatsApp] Message sent to ${targetRecipient}. Message ID: ${sid}`);
      } else {
        status = 'failed';
        console.error(`📱 [Meta WhatsApp] Failed to send message: ${apiRes.error}`);
      }
    } else {
      // Simulation mode logging
      console.log('\n📱 [Meta WhatsApp Cloud Simulator]');
      console.log('─'.repeat(60));
      console.log(`To Group:  ${group ? group.name : targetRecipient}`);
      console.log(`To Number: ${this.cleanPhoneNumber(targetRecipient)}`);
      console.log(`Message:\n${message}`);
      console.log('─'.repeat(60));
    }

    try {
      // Save MessageLog (Recipient, Message, Status, Meta Message ID, Timestamp)
      const messageLog = await MessageLog.create({
        group: group ? group._id : undefined,
        recipient: targetRecipient,
        message,
        sender: senderId,
        status,
        sid,
        timestamp: new Date()
      });

      // Save NotificationLog (Project, Notification Type, Delivery Status, messageLog linkage)
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
      `Project ID: ${project.projectId}\n` +
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
      `Project ID: ${project.projectId}\n` +
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
      `Project ID: ${project.projectId}\n` +
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

module.exports = new WhatsAppCloudService();
