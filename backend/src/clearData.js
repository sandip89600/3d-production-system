require('dotenv').config();
const mongoose = require('mongoose');

const User = require('./models/User');
const Department = require('./models/Department');
const Project = require('./models/Project');
const ProjectAssignment = require('./models/ProjectAssignment');
const ProgressLog = require('./models/ProgressLog');
const WhatsAppGroup = require('./models/WhatsAppGroup');
const MessageLog = require('./models/MessageLog');
const NotificationLog = require('./models/NotificationLog');
const FileModel = require('./models/File');
const UploadLog = require('./models/UploadLog');
const DownloadLog = require('./models/DownloadLog');
const ProjectDownloadLog = require('./models/ProjectDownloadLog');
const ActivityLog = require('./models/ActivityLog');
const Notification = require('./models/Notification');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/3d-production';

async function clearData() {
  console.log('🧹 Starting Database Cleanup...');
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // 1. Delete all projects, assignments, logs, files, and histories
    const deleteCollections = [
      Project.deleteMany({}),
      ProjectAssignment.deleteMany({}),
      ProgressLog.deleteMany({}),
      MessageLog.deleteMany({}),
      NotificationLog.deleteMany({}),
      FileModel.deleteMany({}),
      UploadLog.deleteMany({}),
      DownloadLog.deleteMany({}),
      ProjectDownloadLog.deleteMany({}),
      ActivityLog.deleteMany({}),
      Notification.deleteMany({}),
    ];
    await Promise.all(deleteCollections);
    console.log('🗑️ Projects, logs, and files deleted.');

    // 2. Delete all users EXCEPT the Developer
    // First, let's find the developer user to ensure they exist
    let superAdmin = await User.findOne({ role: 'developer' });
    if (!superAdmin) {
      // If developer doesn't exist, recreate it
      superAdmin = await User.create({
        name: 'System Owner',
        email: 'developer@all3dstudio.com',
        password: 'Developer@123',
        role: 'developer',
        isActive: true,
        mobile: '+919876543210',
      });
      console.log('👑 Developer recreated:', superAdmin.email);
    }

    // Delete all other users
    const deleteResult = await User.deleteMany({ _id: { $ne: superAdmin._id } });
    console.log(`👤 Deleted ${deleteResult.deletedCount} dummy users (Admins, Employees, Clients).`);
    console.log(`👑 Kept Developer user: ${superAdmin.email}`);

    // 3. Clear admin and employee links in Departments
    await Department.updateMany({}, {
      $set: {
        admin: null,
        employees: []
      }
    });
    console.log('🏢 Reset all Department members (admins/employees arrays cleared).');

    console.log('✨ Database cleanup finished successfully!');
  } catch (error) {
    console.error('❌ Error cleaning database:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

clearData();
