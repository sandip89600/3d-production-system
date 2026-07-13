require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Project = require('./models/Project');
const Department = require('./models/Department');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/3d-production';

async function runTest() {
  console.log('🧪 Starting Project ID Auto-Generation Test...\n');

  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // 1. Fetch Admin Users
    const labAdmin = await User.findOne({ adminCode: 'LAB' });
    const rohAdmin = await User.findOne({ adminCode: 'ROH' });
    const superAdmin = await User.findOne({ role: 'superadmin' });

    if (!labAdmin || !rohAdmin || !superAdmin) {
      throw new Error('Required test users (LAB, ROH, superadmin) not found in DB. Run seed first.');
    }

    console.log(`👤 Found Admin LAB: ${labAdmin.name}`);
    console.log(`👤 Found Admin ROH: ${rohAdmin.name}`);
    console.log(`👑 Found Super Admin: ${superAdmin.name}`);

    const dept = await Department.findOne();
    if (!dept) throw new Error('No departments found. Seed database first.');

    // Clear existing projects to test clean sequence starting at 001
    await Project.deleteMany({});
    console.log('🧹 Cleaned existing projects for clean sequence testing.');

    // --- TEST 1: LAB Admin Uploads ---
    console.log('\n--- Test 1: LAB Admin Project Sequence Generation ---');
    
    const labProj1 = await Project.create({
      name: 'Villa Architectural Plan',
      type: '3D architecture',
      department: dept._id,
      deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      uploadedBy: labAdmin._id,
    });
    console.log(`   Saved: "${labProj1.name}" -> Project ID: ${labProj1.projectId}`);
    
    const labProj2 = await Project.create({
      name: 'Luxury Villa Exterior',
      type: '3D architecture',
      department: dept._id,
      deadline: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
      uploadedBy: labAdmin._id,
    });
    console.log(`   Saved: "${labProj2.name}" -> Project ID: ${labProj2.projectId}`);

    const labProj3 = await Project.create({
      name: 'Villa Penthouse Render',
      type: 'rendering',
      department: dept._id,
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      uploadedBy: labAdmin._id,
    });
    console.log(`   Saved: "${labProj3.name}" -> Project ID: ${labProj3.projectId}`);

    const year = new Date().getFullYear();
    if (labProj1.projectId !== `LAB-${year}-001`) throw new Error(`Expected LAB-${year}-001, got ${labProj1.projectId}`);
    if (labProj2.projectId !== `LAB-${year}-002`) throw new Error(`Expected LAB-${year}-002, got ${labProj2.projectId}`);
    if (labProj3.projectId !== `LAB-${year}-003`) throw new Error(`Expected LAB-${year}-003, got ${labProj3.projectId}`);
    console.log('✅ LAB Admin sequence successfully generated: 001 -> 002 -> 003.');

    // --- TEST 2: ROH Admin Uploads (Sequence Isolation) ---
    console.log('\n--- Test 2: ROH Admin Sequence Isolation ---');

    const rohProj1 = await Project.create({
      name: 'Sofa Model Mesh',
      type: 'Modeling',
      department: dept._id,
      deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      uploadedBy: rohAdmin._id,
    });
    console.log(`   Saved: "${rohProj1.name}" -> Project ID: ${rohProj1.projectId}`);

    const rohProj2 = await Project.create({
      name: 'Futuristic Sofa Rendering',
      type: 'rendering',
      department: dept._id,
      deadline: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
      uploadedBy: rohAdmin._id,
    });
    console.log(`   Saved: "${rohProj2.name}" -> Project ID: ${rohProj2.projectId}`);

    if (rohProj1.projectId !== `ROH-${year}-001`) throw new Error(`Expected ROH-${year}-001, got ${rohProj1.projectId}`);
    if (rohProj2.projectId !== `ROH-${year}-002`) throw new Error(`Expected ROH-${year}-002, got ${rohProj2.projectId}`);
    console.log('✅ ROH Admin sequence successfully generated: 001 -> 002.');

    // --- TEST 3: Super Admin Upload Fallback ---
    console.log('\n--- Test 3: Super Admin Project ID (SUP Fallback) ---');
    const supProj1 = await Project.create({
      name: 'General Showroom walkthrough',
      type: '3D architecture',
      department: dept._id,
      deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      uploadedBy: superAdmin._id,
    });
    console.log(`   Saved: "${supProj1.name}" -> Project ID: ${supProj1.projectId}`);
    if (supProj1.projectId !== `SUP-${year}-001`) throw new Error(`Expected SUP-${year}-001, got ${supProj1.projectId}`);
    console.log('✅ Super Admin fallback successfully generated: SUP-2026-001.');

    // --- TEST 4: Unique Constraints Enforcement ---
    console.log('\n--- Test 4: Uniqueness Validation ---');
    // Try to force-save a project with a duplicate projectId
    const duplicateProj = new Project({
      name: 'Duplicate ID Project',
      type: '3D architecture',
      department: dept._id,
      uploadedBy: labAdmin._id,
      deadline: new Date(),
      projectId: `LAB-${year}-001` // Force duplicate of labProj1
    });

    let duplicateSaved = false;
    try {
      await duplicateProj.save();
      duplicateSaved = true;
    } catch (err) {
      console.log(`   Expected save failure occurred (collides with existing index): ${err.message}`);
    }

    if (duplicateSaved) {
      throw new Error('Mongoose successfully saved a duplicate projectId! Unique constraint failed.');
    }
    console.log('✅ Duplicate project IDs blocked correctly.');

    console.log('\n🎉 ALL PROJECT ID AUTO-GENERATION TESTS PASSED!');
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  } finally {
    // Re-seed the database to restore seeded demo projects and assignments
    console.log('\n🔄 Restoring demo database state via seeder...');
    const { execSync } = require('child_process');
    try {
      execSync('npm run seed', { stdio: 'inherit' });
      console.log('✅ Demo database restored successfully.');
    } catch (seederErr) {
      console.error('❌ Failed to re-seed database after testing:', seederErr.message);
    }
    
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB.');
    process.exit(0);
  }
}

runTest();
