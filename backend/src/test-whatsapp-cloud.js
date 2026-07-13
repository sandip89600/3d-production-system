require('dotenv').config();
const mongoose = require('mongoose');
const crypto = require('crypto');
const User = require('./models/User');
const Project = require('./models/Project');
const Department = require('./models/Department');
const WhatsAppGroup = require('./models/WhatsAppGroup');
const MessageLog = require('./models/MessageLog');
const NotificationLog = require('./models/NotificationLog');
const whatsappCloudService = require('./services/whatsappCloudService');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/3d-production';

const whatsappRoutes = require('./routes/whatsapp');
const verifyMetaSignature = whatsappRoutes.verifyMetaSignature;

async function runTest() {
  console.log('🧪 Starting Meta WhatsApp Cloud API Migration Integration Test...\n');

  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Fetch users for logging check
    const superAdmin = await User.findOne({ role: 'superadmin' });
    const employee = await User.findOne({ role: 'employee' });

    if (!superAdmin || !employee) {
      throw new Error('Test users not found. Run "npm run seed" first.');
    }

    const arcDept = await Department.findOne({ code: 'ARC' });
    const mdlDept = await Department.findOne({ code: 'MDL' });

    if (!arcDept || !mdlDept) {
      throw new Error('Test departments not found. Run "npm run seed" first.');
    }

    // Clean logs
    await MessageLog.deleteMany({});
    await NotificationLog.deleteMany({});
    console.log('🧹 Cleaned database message and notification logs.');

    // --- TEST 1: Phone Number Cleaning ---
    console.log('\n--- Test 1: Phone Number Cleaning ---');
    const dirtyNumber = 'whatsapp:+1 (415) 523-8886';
    const cleanNumber = whatsappCloudService.cleanPhoneNumber(dirtyNumber);
    console.log(`🧹 Cleaned: "${dirtyNumber}" -> "${cleanNumber}"`);
    if (cleanNumber !== '14155238886') throw new Error('Phone number cleaning failed');

    // --- TEST 2: Category Detection ---
    console.log('\n--- Test 2: Category Detection ---');
    const p1 = new Project({
      name: 'Modern Penthouse Elevation Walkthrough',
      type: '3D architecture',
      department: arcDept._id,
      uploadedBy: superAdmin._id,
      deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
    });
    const p2 = new Project({
      name: 'Futuristic Sci-Fi Character Texture Design',
      type: 'Modeling',
      department: mdlDept._id,
      uploadedBy: superAdmin._id,
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });

    const cat1 = whatsappCloudService.detectCategory(p1);
    const cat2 = whatsappCloudService.detectCategory(p2);
    console.log(`🔍 P1: "${p1.name}" detected as: ${cat1} (Expected: architecture)`);
    console.log(`🔍 P2: "${p2.name}" detected as: ${cat2} (Expected: modeling_rendering)`);

    if (cat1 !== 'architecture' || cat2 !== 'modeling_rendering') {
      throw new Error('Category detection keyword check failed');
    }

    // --- TEST 3: Mock API Fetch and Retry Logic (429 Backoff) ---
    console.log('\n--- Test 3: API Retry Logic (429 Failure & Subsequent Success) ---');
    
    // Save original fetch
    const originalFetch = global.fetch;
    
    let fetchCallCount = 0;
    const testMetaMsgId = 'wamid.HBgLOTE5ODc2NTQzMjEwFQIAERgSQjE4MkFDOTAzNzg0M0REOUE3AA==';
    
    // Override global fetch to simulate Rate Limit (429) then success
    global.fetch = async (url, options) => {
      fetchCallCount++;
      console.log(`   [Mock Fetch] API Call Attempt #${fetchCallCount} to URL: ${url}`);
      
      if (fetchCallCount < 3) {
        return {
          ok: false,
          status: 429,
          json: async () => ({ error: { message: 'Rate limit hit (429)' } })
        };
      }
      
      return {
        ok: true,
        status: 200,
        json: async () => ({
          messaging_product: 'whatsapp',
          messages: [{ id: testMetaMsgId }]
        })
      };
    };

    // Enable WhatsApp temporary to trigger real send code path
    whatsappCloudService.enabled = true;
    whatsappCloudService.accessToken = 'mock_access_token';
    whatsappCloudService.phoneNumberId = 'mock_phone_number_id';

    const sendResult = await whatsappCloudService.sendWhatsAppMessage('whatsapp:+919876543210', 'Test Retry Message');
    
    // Restore fetch
    global.fetch = originalFetch;

    console.log(`   API Result:`, sendResult);
    console.log(`   Total Fetch Calls Made: ${fetchCallCount} (Expected: 3 due to rate limit retries)`);

    if (!sendResult.success || sendResult.messageId !== testMetaMsgId || fetchCallCount !== 3) {
      throw new Error('API retry logic failed or did not attempt exactly 3 calls');
    }

    // Disable real API calls, switch back to simulation mode for DB flow verification
    whatsappCloudService.enabled = false;

    // --- TEST 4: Full Life Cycle Notification Simulation ---
    console.log('\n--- Test 4: End-to-End Workflow Logging ---');
    
    // 1. Upload Notification
    const uploadRes = await whatsappCloudService.notifyNewProject(p1, superAdmin);
    if (!uploadRes.success) throw new Error('Upload notification failed');
    console.log('📤 Upload notification logged');

    // Save project for subsequent refs
    await p1.save();

    // 2. Pickup Notification
    const pickupRes = await whatsappCloudService.notifyProjectPicked(p1, employee);
    if (!pickupRes.success) throw new Error('Pickup notification failed');
    console.log('📌 Pickup notification logged');

    // 3. Progress Notification
    const progressRes = await whatsappCloudService.notifyProgressUpdated(p1, employee, 60);
    if (!progressRes.success) throw new Error('Progress notification failed');
    console.log('📊 Progress notification logged');

    // 4. Completion Notification
    const completeRes = await whatsappCloudService.notifyProjectCompleted(p1, employee);
    if (!completeRes.success) throw new Error('Completion notification failed');
    console.log('✅ Completion notification logged');

    // 5. Daily Summary
    const summaryRes = await whatsappCloudService.sendDailySummary();
    if (!summaryRes.success) throw new Error('Daily summary failed');
    console.log('📈 Daily summary logged');

    // Validate Database counts (Upload=1, Pickup=1, Progress=1, Complete=1, Summary=2 (goes to both groups) = 6 total logs)
    const messageLogsCount = await MessageLog.countDocuments();
    const notificationLogsCount = await NotificationLog.countDocuments();
    console.log(`📊 MessageLogs in DB: ${messageLogsCount} (Expected: 6)`);
    console.log(`📊 NotificationLogs in DB: ${notificationLogsCount} (Expected: 6)`);

    if (messageLogsCount !== 6 || notificationLogsCount !== 6) {
      throw new Error('Database log validation count mismatch');
    }

    // Check formatting
    const loggedMessage = await MessageLog.findOne({ recipient: 'whatsapp:3d-architecture-team' }).populate('group');
    console.log('🔍 Verified Message Details:');
    console.log(`   - Recipient: ${loggedMessage.recipient}`);
    console.log(`   - Status: ${loggedMessage.status} (Expected: simulated)`);
    console.log(`   - Group: ${loggedMessage.group ? loggedMessage.group.name : 'N/A'}`);

    // --- TEST 5: Webhook Signature Verification ---
    console.log('\n--- Test 5: Webhook Signature Validation ---');
    const testSecret = 'meta_test_app_secret_key_12345';
    process.env.META_APP_SECRET = testSecret;

    const payload = JSON.stringify({ object: 'whatsapp_business_account', entry: [] });
    const rawBody = Buffer.from(payload);

    // Calculate correct signature
    const hmac = crypto.createHmac('sha256', testSecret);
    hmac.update(rawBody);
    const validSignature = `sha256=${hmac.digest('hex')}`;

    // Test Valid Signature
    let middlewarePassed = false;
    const reqValid = {
      headers: { 'x-hub-signature-256': validSignature },
      rawBody: rawBody
    };
    const resValid = {
      status: (code) => ({ json: (data) => { throw new Error(`Should not fail with valid signature: ${data.message}`) } })
    };

    verifyMetaSignature(reqValid, resValid, () => {
      middlewarePassed = true;
    });

    console.log(`🔐 Valid Signature check: ${middlewarePassed ? 'PASSED' : 'FAILED'}`);
    if (!middlewarePassed) throw new Error('Signature validation blocked a valid signature');

    // Test Invalid Signature
    let middlewareBlocked = false;
    const reqInvalid = {
      headers: { 'x-hub-signature-256': 'sha256=invalid_signature_hex_value' },
      rawBody: rawBody
    };
    const resInvalid = {
      status: (code) => {
        if (code === 401) middlewareBlocked = true;
        return { json: (data) => {} };
      }
    };

    verifyMetaSignature(reqInvalid, resInvalid, () => {
      throw new Error('Middleware should not call next() on invalid signature');
    });

    console.log(`🔒 Invalid Signature check: ${middlewareBlocked ? 'PASSED' : 'FAILED'}`);
    if (!middlewareBlocked) throw new Error('Signature validation allowed an invalid signature');

    console.log('\n🎉 ALL INTEGRATION TESTS PASSED SUCCESSFULLY!');
  } catch (error) {
    console.error('\n❌ Integration test failed:', error.message);
    process.exit(1);
  } finally {
    // Cleanup created test project
    await Project.deleteOne({ name: 'Modern Penthouse Elevation Walkthrough' });
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB.');
    process.exit(0);
  }
}

runTest();
