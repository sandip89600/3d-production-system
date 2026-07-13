require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('./models/User');
const Department = require('./models/Department');
const Project = require('./models/Project');
const ProjectAssignment = require('./models/ProjectAssignment');
const ProgressLog = require('./models/ProgressLog');
const WhatsAppGroup = require('./models/WhatsAppGroup');
const MessageLog = require('./models/MessageLog');
const NotificationLog = require('./models/NotificationLog');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/3d-production';

const departments = [
  { name: '3D architecture', code: 'ARC', description: 'Architectural visualization and design', color: '#3B82F6', icon: '🏢', whatsappGroupName: '3D Architecture Team' },
  { name: 'Modeling', code: 'MDL', description: '3D Modeling and asset creation', color: '#8B5CF6', icon: '🧊', whatsappGroupName: 'Modeling Team' },
  { name: 'rendering', code: 'RND', description: 'Rendering and photorealistic visualization', color: '#10B981', icon: '🎨', whatsappGroupName: 'Rendering Team' },
];

const adminData = [
  { name: 'Lekhraj Pandit', email: 'lekhraj@all3dstudio.com', password: 'Admin@123', adminCode: 'LAB', deptIndex: 0, mobile: '+919876543211' },
  { name: 'Shubham Thakre', email: 'shubham@all3dstudio.com', password: 'Admin@123', adminCode: 'SHU', deptIndex: 1, mobile: '+919876543212' },
  { name: 'Rohit Tidke', email: 'rohit@all3dstudio.com', password: 'Admin@123', adminCode: 'ROH', deptIndex: 2, mobile: '+919876543213' },
  { name: 'Sandeep Pandit', email: 'sandeep@all3dstudio.com', password: 'Admin@123', adminCode: 'DEV', deptIndex: 0, mobile: '+919876543214' },
];

const employeeData = [
  { name: 'Aakash Sharma', email: 'aakash@all3dstudio.com', password: 'Emp@123', deptIndex: 0, mobile: '+919876543215' },
  { name: 'Priya Patel', email: 'priya@all3dstudio.com', password: 'Emp@123', deptIndex: 0, mobile: '+919876543216' },
  { name: 'Vikram Singh', email: 'vikram@all3dstudio.com', password: 'Emp@123', deptIndex: 1, mobile: '+919876543217' },
  { name: 'Neha Gupta', email: 'neha@all3dstudio.com', password: 'Emp@123', deptIndex: 2, mobile: '+919876543218' },
  { name: 'Raj Kumar', email: 'raj@all3dstudio.com', password: 'Emp@123', deptIndex: 2, mobile: '+919876543219' },
  { name: 'Anjali Verma', email: 'anjali@all3dstudio.com', password: 'Emp@123', deptIndex: 0, mobile: '+919876543220' },
  { name: 'Suresh Nair', email: 'suresh@all3dstudio.com', password: 'Emp@123', deptIndex: 1, mobile: '+919876543221' },
];

const projectTemplates = [
  { name: 'Car Exterior Model', type: 'Modeling', deptIndex: 1, priority: 'high', description: 'Detailed exterior modeling of a luxury sedan', estimatedDays: 10, clientName: 'AutoViz Ltd' },
  { name: 'Architecture Interior Render', type: 'rendering', deptIndex: 2, priority: 'medium', description: 'Photorealistic interior render for residential project', estimatedDays: 7, clientName: 'DesignHub' },
  { name: 'Villa Front Elevation', type: '3D architecture', deptIndex: 0, priority: 'high', description: '3D architectural model of villa front elevation', estimatedDays: 5, clientName: 'UrbanSim' },
  { name: 'Modern House Exterior', type: '3D architecture', deptIndex: 0, priority: 'low', description: '3D model of a modern double story house exterior', estimatedDays: 3, clientName: 'FurnitureCo' },
  { name: 'Sunset Studio Lighting', type: 'rendering', deptIndex: 2, priority: 'medium', description: 'Cinematic lighting setup for product showcase', estimatedDays: 4, clientName: 'BrandX' },
  { name: 'Robot Arm Rigging', type: 'Modeling', deptIndex: 1, priority: 'critical', description: 'Complex robot arm rig with IK constraints', estimatedDays: 8, clientName: 'TechViz' },
  { name: 'City Block Environment', type: 'Modeling', deptIndex: 1, priority: 'high', description: 'Detailed urban environment with LOD setup', estimatedDays: 15, clientName: 'UrbanSim' },
  { name: 'Product Render - Headphones', type: 'rendering', deptIndex: 2, priority: 'high', description: 'Commercial product render for marketing', estimatedDays: 3, clientName: 'SoundBrand' },
];

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Clean existing data
    await Promise.all([
      User.deleteMany({}),
      Department.deleteMany({}),
      Project.deleteMany({}),
      ProjectAssignment.deleteMany({}),
      ProgressLog.deleteMany({}),
      WhatsAppGroup.deleteMany({}),
      MessageLog.deleteMany({}),
      NotificationLog.deleteMany({}),
    ]);
    console.log('🧹 Cleaned existing data');

    // Create WhatsApp Groups
    const createdGroups = await WhatsAppGroup.insertMany([
      { name: '3D Architecture Team', groupId: 'whatsapp:3d-architecture-team', category: 'architecture' },
      { name: 'Modeling & Rendering Team', groupId: 'whatsapp:modeling-rendering-team', category: 'modeling_rendering' }
    ]);
    console.log('📱 WhatsApp Groups seeded:', createdGroups.length);

    // Create Super Admin
    const superAdmin = await User.create({
      name: 'System Owner',
      email: 'superadmin@all3dstudio.com',
      password: 'SuperAdmin@123',
      role: 'superadmin',
      isActive: true,
      mobile: '+919876543210',
    });
    console.log('👑 Super Admin created:', superAdmin.email);

    // Create departments first (without admin)
    const createdDepts = await Department.insertMany(departments.map(d => ({ ...d })));
    console.log('🏢 Departments created:', createdDepts.length);

    // Create admins and link to departments
    const createdAdmins = [];
    for (const a of adminData) {
      const admin = await User.create({
        name: a.name, email: a.email, password: a.password,
        role: 'admin', adminCode: a.adminCode,
        department: createdDepts[a.deptIndex]._id,
        createdBy: superAdmin._id, isActive: true,
        mobile: a.mobile,
      });
      await Department.findByIdAndUpdate(createdDepts[a.deptIndex]._id, { admin: admin._id });
      createdAdmins.push(admin);
      console.log(`👤 Admin created: ${a.name} (${a.adminCode})`);
    }

    // Create employees and link to departments
    const createdEmployees = [];
    for (const e of employeeData) {
      const emp = await User.create({
        name: e.name, email: e.email, password: e.password,
        role: 'employee',
        department: createdDepts[e.deptIndex]._id,
        createdBy: superAdmin._id, isActive: true,
        mobile: e.mobile,
      });
      await Department.findByIdAndUpdate(createdDepts[e.deptIndex]._id, { $addToSet: { employees: emp._id } });
      createdEmployees.push({ ...emp.toObject(), deptIndex: e.deptIndex });
      console.log(`👷 Employee created: ${e.name}`);
    }

    // Create projects with various statuses
    const statuses = ['completed', 'in-progress', 'available', 'review', 'completed', 'delayed', 'available', 'completed'];
    const createdProjects = [];
    for (let i = 0; i < projectTemplates.length; i++) {
      const pt = projectTemplates[i];
      const admin = createdAdmins[pt.deptIndex % createdAdmins.length];
      const deadline = new Date();
      deadline.setDate(deadline.getDate() + (i % 3 === 0 ? -5 : 10 + i * 3));

      const project = await Project.create({
        name: pt.name, type: pt.type,
        department: createdDepts[pt.deptIndex]._id,
        description: pt.description,
        priority: pt.priority,
        deadline,
        estimatedDays: pt.estimatedDays,
        clientName: pt.clientName,
        uploadedBy: admin._id,
        status: statuses[i] || 'available',
        progress: statuses[i] === 'completed' ? 100 : statuses[i] === 'in-progress' ? 60 : statuses[i] === 'review' ? 90 : 0,
        whatsappNotified: true,
        whatsappNotifiedAt: new Date(),
      });
      createdProjects.push(project);
    }
    console.log('📁 Projects created:', createdProjects.length);

    // Create project assignments for in-progress/review/completed projects
    let assignIdx = 0;
    for (let i = 0; i < createdProjects.length; i++) {
      const proj = createdProjects[i];
      if (['in-progress', 'review', 'completed'].includes(proj.status)) {
        const deptEmployees = createdEmployees.filter(e => e.deptIndex === projectTemplates[i].deptIndex);
        const emp = deptEmployees[0] || createdEmployees[assignIdx % createdEmployees.length];
        assignIdx++;

        const assignment = await ProjectAssignment.create({
          project: proj._id,
          employee: emp._id,
          status: proj.status === 'completed' ? 'completed' : proj.status === 'review' ? 'review' : 'active',
          progress: proj.progress,
          totalDaysWorked: proj.status === 'completed' ? 8 : proj.status === 'review' ? 6 : 4,
        });

        await Project.findByIdAndUpdate(proj._id, { assignedTo: emp._id });

        // Add progress logs
        const days = proj.status === 'completed' ? 5 : 3;
        for (let d = 1; d <= days; d++) {
          const pct = Math.min(proj.progress, Math.floor((d / days) * proj.progress));
          await ProgressLog.create({
            assignment: assignment._id,
            project: proj._id,
            employee: emp._id,
            day: d,
            date: new Date(Date.now() - (days - d) * 24 * 60 * 60 * 1000),
            progressPercentage: pct,
            notes: `Day ${d} update — completed main tasks for this phase.`,
          });
        }
      }
    }
    console.log('📊 Project assignments and progress logs created');

    console.log('\n' + '═'.repeat(60));
    console.log('🎉 DATABASE SEEDED SUCCESSFULLY');
    console.log('═'.repeat(60));
    console.log('\n📋 LOGIN CREDENTIALS:\n');
    console.log('👑 Super Admin:');
    console.log('   Email: superadmin@all3dstudio.com | Password: SuperAdmin@123\n');
    console.log('👤 Admins:');
    adminData.forEach(a => console.log(`   ${a.adminCode}: ${a.email} | Password: Admin@123`));
    console.log('\n👷 Employees:');
    employeeData.forEach(e => console.log(`   ${e.email} | Password: Emp@123`));
    console.log('\n' + '═'.repeat(60));

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
}

seed();
