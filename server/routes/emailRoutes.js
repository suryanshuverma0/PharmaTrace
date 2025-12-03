const express = require('express');
const router = express.Router();
const { sendEmail, emailTemplates } = require('../utils/sendEmail');
const authMiddleware = require('../middleware/auth');

// Test email sending route
router.post('/send-test-email', authMiddleware(['pharmacist', 'manufacturer', 'distributor']), async (req, res) => {
  try {
    const { to, subject, text, type = 'custom' } = req.body;

    if (!to || !subject || !text) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: to, subject, text'
      });
    }

    let emailData;
    if (type === 'custom') {
      emailData = { subject, text, html: `<p>${text}</p>` };
    } else if (type === 'issue_report') {
      emailData = emailTemplates.pharmacyIssueReport(
        req.body.pharmacyName || 'Test Pharmacy',
        req.body.batchId || 'TEST-001',
        req.body.productName || 'Test Product',
        text
      );
    } else if (type === 'receipt_confirmation') {
      emailData = emailTemplates.receiptConfirmation(
        req.body.pharmacyName || 'Test Pharmacy',
        req.body.batchId || 'TEST-001',
        req.body.productName || 'Test Product',
        req.body.quantity || 100
      );
    }

    const result = await sendEmail(to, emailData.subject, emailData.text, emailData.html);

    res.json({
      success: result.success,
      message: result.message,
      ...(result.error && { error: result.error })
    });

  } catch (error) {
    console.error('Error in test email route:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Get email templates for testing
router.get('/email-templates', authMiddleware(['pharmacist', 'manufacturer', 'distributor']), (req, res) => {
  res.json({
    success: true,
    templates: {
      pharmacy_issue_report: {
        description: 'Template for reporting issues from pharmacy to distributor',
        required_fields: ['pharmacyName', 'batchId', 'productName', 'issueDetails']
      },
      receipt_confirmation: {
        description: 'Template for confirming receipt of batches',
        required_fields: ['pharmacyName', 'batchId', 'productName', 'quantity']
      }
    }
  });
});

module.exports = router;