require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Project = require('./models/Project');
const Department = require('./models/Department');
const WhatsAppGroup = require('./models/WhatsAppGroup');
const MessageLog = require('./models/MessageLog');
const NotificationLog = require('./models/NotificationLog');
const whatsappService = require('./services/whatsappService');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/3d-production';

async function runTest() {
  console.log('🧪 Starting WhatsApp Automation System Integration Test...\n');

  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // 1. Fetch Users
    const superAdmin = await User.findOne({ role: 'superadmin' });
    const employee = await User.findOne({ role: 'employee' });

    if (!superAdmin || !employee) {
      throw new Error('Required test users (superadmin and employee) not found in the DB. Please seed the DB first.');
    }

    console.log(`👤 Using Super Admin: ${superAdmin.name} (${superAdmin.email})`);
    console.log(`👤 Using Employee: ${employee.name} (${employee.email})`);

    // 2. Fetch or verify groups
    const archGroup = await WhatsAppGroup.findOne({ category: 'architecture' });
    const modelGroup = await WhatsAppGroup.findOne({ category: 'modeling_rendering' });
    
    if (!archGroup || !modelGroup) {
      throw new Error('WhatsApp Groups not seeded in DB.');
    }
    console.log(`📱 Architecture Group: ${archGroup.name} (${archGroup.groupId})`);
    console.log(`📱 Modeling Group: ${modelGroup.name} (${modelGroup.groupId})`);

    // Fetch Departments for projects
    const arcDept = await Department.findOne({ code: 'ARC' });
    const mdlDept = await Department.findOne({ code: 'MDL' });
    if (!arcDept || !mdlDept) {
      throw new Error('Required departments (ARC and MDL) not found in the DB. Please seed the DB first.');
    }

    // Clear previous logs to have a clean slate for validation
    await MessageLog.deleteMany({});
    await NotificationLog.deleteMany({});
    console.log('🧹 Cleaned test MessageLog and NotificationLog records.');

    // 3. Test Category Detection & Project Upload Alert (Super Admin / Admin)
    console.log('\n--- Test 1: Project Uploads (Automatic Category Detection) ---');
    
    const archProject = new Project({
      name: 'Modern Luxury Villa Architectural Walkthrough',
      type: '3D architecture',
      department: arcDept._id,
      description: 'Exterior and interior walkthrough of modern villa',
      deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      uploadedBy: superAdmin._id,
      status: 'available',
    });

    const detectedArchCategory = whatsappService.detectCategory(archProject);
    console.log(`🔍 Detected category for "${archProject.name}": ${detectedArchCategory} (Expected: architecture)`);
    if (detectedArchCategory !== 'architecture') throw new Error('Category detection failed for Architecture project');

    console.log('🚀 Triggering WhatsApp Project Upload Alert...');
    const uploadRes1 = await whatsappService.notifyNewProject(archProject, superAdmin);
    if (!uploadRes1.success) throw new Error('Failed to notify project upload');

    // Modeling Project
    const modelProject = new Project({
      name: 'Sleek Futuristic Sofa Assets',
      type: 'Modeling',
      department: mdlDept._id,
      description: 'Futuristic sofa modeling and rendering',
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      uploadedBy: superAdmin._id,
      status: 'available',
    });

    const detectedModelCategory = whatsappService.detectCategory(modelProject);
    console.log(`🔍 Detected category for "${modelProject.name}": ${detectedModelCategory} (Expected: modeling_rendering)`);
    if (detectedModelCategory !== 'modeling_rendering') throw new Error('Category detection failed for Modeling project');

    const uploadRes2 = await whatsappService.notifyNewProject(modelProject, superAdmin);
    if (!uploadRes2.success) throw new Error('Failed to notify modeling project upload');

    // 4. Test Security Restriction (Employee cannot trigger upload alerts)
    console.log('\n--- Test 2: Security Restriction ---');
    const unauthorizedRes = await whatsappService.notifyNewProject(archProject, employee);
    console.log(`🔒 Security block result success: ${unauthorizedRes.success} (Expected: false)`);
    if (unauthorizedRes.success) throw new Error('Employee was unauthorizedly allowed to send project upload alert!');

    // Save projects to DB for subsequent tests
    await archProject.save();
    await modelProject.save();
    console.log('💾 Saved test projects to MongoDB.');

    // 5. Test Employee Project Pickup Alert
    console.log('\n--- Test 3: Employee Pickup Notification ---');
    const pickupRes = await whatsappService.notifyProjectPicked(archProject, employee);
    if (!pickupRes.success) throw new Error('Failed to notify project pickup');
    console.log(`✅ Project pickup logged in DB: ${pickupRes.messageLog._id}`);

    // 6. Test Employee Progress Update Alert
    console.log('\n--- Test 4: Progress Update Notification ---');
    const progressRes = await whatsappService.notifyProgressUpdated(archProject, employee, 45);
    if (!progressRes.success) throw new Error('Failed to notify progress update');
    console.log(`✅ Progress update logged in DB: ${progressRes.messageLog._id}`);

    // 7. Test Project Completion Alert
    console.log('\n--- Test 5: Project Completion Notification ---');
    const completeRes = await whatsappService.notifyProjectCompleted(archProject, employee);
    if (!completeRes.success) throw new Error('Failed to notify project completion');
    console.log(`✅ Project completion logged in DB: ${completeRes.messageLog._id}`);

    // 8. Test Daily Summary Notification
    console.log('\n--- Test 6: Daily Summary Compilation & Notification ---');
    // Change status of one project to in-progress for variety in statistics
    await Project.updateOne({ _id: modelProject._id }, { status: 'in-progress' });
    
    const summaryRes = await whatsappService.sendDailySummary();
    if (!summaryRes.success) throw new Error('Failed to send daily summary');
    console.log('📈 Daily Summary Statistics Compiled:', {
      uploadedToday: summaryRes.uploadedToday,
      inProgress: summaryRes.inProgress,
      completedToday: summaryRes.completedToday,
      delayed: summaryRes.delayed
    });

    // 9. Database Assertions
    console.log('\n--- Test 7: MongoDB Log Assertions ---');
    const messageLogsCount = await MessageLog.countDocuments();
    const notificationLogsCount = await NotificationLog.countDocuments();

    console.log(`📊 MessageLog Records: ${messageLogsCount} (Expected: 7)`);
    console.log(`📊 NotificationLog Records: ${notificationLogsCount} (Expected: 7)`);

    if (messageLogsCount !== 7 || notificationLogsCount !== 7) {
      throw new Error(`Assertion failed! Expected exactly 7 logs, but found MessageLog: ${messageLogsCount}, NotificationLog: ${notificationLogsCount}`);
    }

    // Verify relations and fields
    const latestLog = await MessageLog.findOne().populate('group sender');
    console.log('🔍 Verified Latest Log Entry Details:');
    console.log(`   - ID: ${latestLog._id}`);
    console.log(`   - Status: ${latestLog.status}`);
    console.log(`   - Group: ${latestLog.group ? latestLog.group.name : 'N/A'}`);
    console.log(`   - Recipient: ${latestLog.recipient}`);
    console.log(`   - Sender: ${latestLog.sender ? latestLog.sender.name : 'System (Automated Cron)'}`);

    console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY! WhatsApp Automation System is functional.');
  } catch (error) {
    console.error('\n❌ Test execution failed:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB.');
    process.exit(0);
  }
}

runTest();
