const express = require('express');
const crypto = require('crypto');
const MessageLog = require('../models/MessageLog');
const NotificationLog = require('../models/NotificationLog');

const router = express.Router();

/**
 * Middleware to verify Meta App Signature (X-Hub-Signature-256)
 * to ensure request came from official Meta Webhooks.
 */
function verifyMetaSignature(req, res, next) {
  // Allow bypassing signature check in development if META_APP_SECRET is not set
  const appSecret = process.env.META_APP_SECRET;
  if (!appSecret) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️ [Webhook Signature] META_APP_SECRET is not configured. Bypassing signature verification in development.');
      return next();
    }
    return res.status(500).json({ success: false, message: 'Meta app secret is not configured' });
  }

  const signatureHeader = req.headers['x-hub-signature-256'];
  if (!signatureHeader) {
    console.warn('🔒 [Webhook Signature Warning] Missing X-Hub-Signature-256 header.');
    return res.status(401).json({ success: false, message: 'Missing signature header' });
  }

  const parts = signatureHeader.split('=');
  if (parts.length !== 2 || parts[0] !== 'sha256') {
    return res.status(401).json({ success: false, message: 'Invalid signature format' });
  }

  const expectedSignature = parts[1];
  const rawBody = req.rawBody;
  if (!rawBody) {
    return res.status(400).json({ success: false, message: 'Raw body is required for signature verification' });
  }

  const hmac = crypto.createHmac('sha256', appSecret);
  hmac.update(rawBody);
  const computedSignature = hmac.digest('hex');

  try {
    const isAuthentic = crypto.timingSafeEqual(
      Buffer.from(computedSignature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
    if (!isAuthentic) {
      console.warn('🔒 [Webhook Signature Block] Signature mismatch. Request blocked.');
      return res.status(401).json({ success: false, message: 'Invalid signature' });
    }
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Signature verification error' });
  }

  next();
}

/**
 * GET /api/whatsapp/webhook
 * Handles Meta Webhook verification handshake.
 */
router.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token) {
    if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
      console.log('✅ [Webhook Verification] Webhook verified successfully by Meta.');
      return res.status(200).send(challenge);
    } else {
      console.warn('🔒 [Webhook Verification Warning] Token mismatch.');
      return res.sendStatus(403);
    }
  }
  return res.sendStatus(400);
});

/**
 * POST /api/whatsapp/webhook
 * Handles Meta message delivery status updates and logs failures.
 */
router.post('/webhook', verifyMetaSignature, async (req, res) => {
  try {
    const { body } = req;
    
    if (body.object === 'whatsapp_business_account' && body.entry) {
      for (const entry of body.entry) {
        if (entry.changes) {
          for (const change of entry.changes) {
            if (change.field === 'messages' && change.value) {
              const value = change.value;

              // Handle message status updates (sent, delivered, read, failed)
              if (value.statuses) {
                for (const statusUpdate of value.statuses) {
                  const metaMsgId = statusUpdate.id;
                  const status = statusUpdate.status; // 'sent' | 'delivered' | 'read' | 'failed'
                  
                  console.log(`📱 [Webhook Status Callback] Message ID: ${metaMsgId} status: ${status}`);

                  let mappedStatus = 'sent';
                  if (status === 'failed') {
                    mappedStatus = 'failed';
                  } else if (status === 'delivered') {
                    mappedStatus = 'delivered';
                  } else if (status === 'read') {
                    mappedStatus = 'read';
                  }

                  // Find the MessageLog and update status
                  const messageLog = await MessageLog.findOneAndUpdate(
                    { sid: metaMsgId },
                    { status: mappedStatus },
                    { new: true }
                  );

                  if (messageLog) {
                    // Update the delivery status in NotificationLog
                    await NotificationLog.updateOne(
                      { messageLog: messageLog._id },
                      { sentSuccessfully: mappedStatus !== 'failed' }
                    );

                    if (mappedStatus === 'failed') {
                      console.warn(`❌ [Webhook Alert] Delivery failed for message ${metaMsgId}. Error logged.`);
                    }
                  }
                }
              }
            }
          }
        }
      }
    }

    // Always respond with 200 OK to acknowledge receipt
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('❌ [Webhook Error] Error handling Meta event:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.verifyMetaSignature = verifyMetaSignature;

module.exports = router;
