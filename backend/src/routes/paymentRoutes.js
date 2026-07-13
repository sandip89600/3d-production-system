const express = require('express');
const router = express.Router();
const securityService = require('../services/securityService');
const { authenticateJWT, requireRole } = require('../middleware/auth');

// POST /api/payments/simulate
router.post('/simulate', authenticateJWT, requireRole('client'), async (req, res) => {
  try {
    const { amount, projectName, transactionId } = req.body;
    if (!amount || !projectName) {
      return res.status(400).json({ success: false, message: 'Amount and Project Name are required' });
    }

    const txnId = transactionId || `TXN${Math.floor(100000 + Math.random() * 900000)}`;

    // Log payment in securityService
    await securityService.logPayment({
      transactionId: txnId,
      clientEmail: req.user.email,
      amount: parseFloat(amount),
      projectName
    });

    res.json({
      success: true,
      message: 'Payment simulated successfully. All alerts and notifications dispatched.',
      transactionId: txnId
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
